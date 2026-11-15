import type Hls from "hls.js";
import type { Scope } from "@/lib/motion/scope";
import { observeMotion } from "@/lib/motion/policy";

export type BunnyRatio = "2-1" | "16-9" | "3-2" | "5-4" | "1-1" | "4-5" | "2-3";
export type BunnySizing =
  | {
      /** Aspect ratio. */
      variant?: BunnyRatio | "auto" | "cover";
      ratio?: never;
    }
  | {
      /** Aspect ratio. */
      variant: "custom";
      /** CSS `aspect-ratio` value. */
      ratio: string;
    };

let library: Promise<typeof import("hls.js")> | undefined;
const loadHls = () =>
  (library ??= import("hls.js").catch((error) => {
    library = undefined;
    throw error;
  }));

export function setupBunny(
  root: HTMLElement,
  scope: Scope,
  background = false,
) {
  const video = root.querySelector("video")!;
  const src = root.dataset.playerSrc!;
  const autoplay = root.dataset.playerAutoplay === "true";
  const lazy = root.dataset.playerLazy;
  let hls: Hls | undefined;
  let attachment: Promise<void> | undefined;
  let generation = 0;
  let allowed = false;
  let visible = false;
  let manualPause = false;
  let requestingPlay = false;
  let operation = 0;
  let hideTimer = 0;
  let lastActivity = 0;
  const options = { signal: scope.signal };
  const status = (value: string) => {
    root.dataset.playerStatus = value;
  };
  const wake = () => {
    root.dataset.playerHover = "active";
    lastActivity = performance.now();
    if (!hideTimer) hideTimer = scope.timeout(hide, 3000);
  };
  const hide = () => {
    hideTimer = 0;
    const remaining = 3000 - (performance.now() - lastActivity);
    if (remaining > 0) hideTimer = scope.timeout(hide, remaining);
    else root.dataset.playerHover = "idle";
  };
  const syncButtons = () => {
    root
      .querySelectorAll<HTMLButtonElement>('[data-player-control="playpause"]')
      .forEach((button) => {
        button.setAttribute(
          "aria-label",
          video.paused ? "Play video" : "Pause video",
        );
      });
    root.dataset.playerMuted = String(video.muted);
    root
      .querySelector('[data-player-control="mute"]')
      ?.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
  };
  const clearMedia = () => {
    generation++;
    hls?.destroy();
    hls = undefined;
    attachment = undefined;
    video.pause();
    video.removeAttribute("src");
    video.load();
  };
  const fail = () => {
    if (scope.signal.aborted) return;
    operation++;
    requestingPlay = false;
    clearMedia();
    root.dataset.playerActivated = "false";
    status("error");
  };
  async function attach() {
    if (attachment) return attachment;
    const current = generation;
    attachment = (async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (!scope.signal.aborted && current === generation) video.src = src;
        return;
      }
      const { default: Hls } = await loadHls();
      if (scope.signal.aborted || current !== generation) return;
      if (!Hls.isSupported()) throw new Error("HLS playback is unavailable");
      hls = new Hls({ maxBufferLength: 10 });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fail();
      });
      hls.attachMedia(video);
      hls.loadSource(src);
    })();
    return attachment;
  }
  async function play(manual = true) {
    if (scope.signal.aborted) return;
    if (root.dataset.playerStatus === "error") clearMedia();
    const current = ++operation;
    if (manual) manualPause = false;
    requestingPlay = true;
    status("loading");
    wake();
    try {
      await attach();
      if (scope.signal.aborted || current !== operation) return;
      await video.play();
    } catch (error) {
      if (scope.signal.aborted || current !== operation) return;
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "AbortError")
      ) {
        requestingPlay = false;
        status(video.currentTime ? "paused" : "ready");
        syncButtons();
      } else fail();
    }
  }
  function pause(manual = true) {
    operation++;
    requestingPlay = false;
    if (manual) manualPause = true;
    video.pause();
    if (root.dataset.playerStatus !== "error")
      status(video.currentTime ? "paused" : "ready");
    syncButtons();
  }
  function syncAuto() {
    if (!autoplay || root.dataset.playerStatus === "error") return;
    if (allowed && visible && !manualPause) {
      if (video.paused && !requestingPlay) void play(false);
    } else if (!video.paused || requestingPlay) pause(false);
  }
  video.autoplay = false;
  video.muted = autoplay || root.dataset.playerMuted === "true";
  video.loop = autoplay || background;
  video.preload = lazy === "false" ? "auto" : "none";
  root.dataset.playerActivated = "false";
  status("idle");
  syncButtons();
  root.dataset.playerEnhanced = "true";
  scope.defer(() => {
    operation++;
    clearMedia();
    delete root.dataset.playerEnhanced;
    root.dataset.playerActivated = "false";
    status("idle");
  });
  video.addEventListener(
    "playing",
    () => {
      requestingPlay = false;
      root.dataset.playerActivated = "true";
      status("playing");
      syncButtons();
    },
    options,
  );
  video.addEventListener(
    "pause",
    () => {
      if (root.dataset.playerStatus !== "error") status("paused");
      syncButtons();
    },
    options,
  );
  video.addEventListener(
    "waiting",
    () => {
      if (!video.paused) status("loading");
    },
    options,
  );
  video.addEventListener(
    "canplay",
    () => {
      if (
        !requestingPlay &&
        root.dataset.playerActivated !== "true" &&
        root.dataset.playerStatus !== "error"
      )
        status("ready");
    },
    options,
  );
  video.addEventListener(
    "ended",
    () => {
      root.dataset.playerActivated = "false";
      manualPause = true;
      status("paused");
      syncButtons();
    },
    options,
  );
  video.addEventListener("volumechange", syncButtons, options);
  video.addEventListener("error", fail, options);
  root.addEventListener(
    "click",
    (event) => {
      const button = (event.target as Element).closest<HTMLElement>(
        "[data-player-control]",
      );
      if (!button || !root.contains(button)) return;
      switch (button.dataset.playerControl) {
        case "play":
        case "retry":
          void play();
          break;
        case "pause":
          pause();
          break;
        case "playpause":
          if (video.paused && !requestingPlay) void play();
          else pause();
          break;
        case "mute":
          video.muted = !video.muted;
          break;
      }
      wake();
    },
    options,
  );
  root.addEventListener("pointermove", wake, options);
  root.addEventListener("pointerdown", wake, options);
  root.addEventListener("focusin", wake, options);
  scope
    .observe(
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          syncAuto();
        },
        { threshold: 0 },
      ),
    )
    .observe(root);
  observeMotion(scope, (value) => {
    allowed = value;
    if (background && !allowed) pause(false);
    if (background && autoplay && allowed && lazy === "false")
      void attach().catch(fail);
    if (
      document.hidden ||
      document.documentElement.dataset.studioEditing === "true"
    )
      pause(false);
    syncAuto();
  });
  if (lazy === "false" && (!background || !autoplay)) void attach().catch(fail);
  if (!background && lazy === "meta") {
    void (async () => {
      try {
        const response = await fetch(src, options);
        if (!response.ok) return;
        const text = await response.text();
        const variants = [
          ...text.matchAll(/#EXT-X-STREAM-INF:([^\n]+)\r?\n([^#\s][^\r\n]*)/g),
        ];
        const first = variants[0];
        let media = text;
        if (first) {
          const playlist = await fetch(
            new URL(first[2].trim(), response.url),
            options,
          );
          if (!playlist.ok) return;
          media = await playlist.text();
        }
        if (scope.signal.aborted) return;
        const duration = [...media.matchAll(/#EXTINF:([\d.]+)/g)].reduce(
          (sum, match) => sum + Number(match[1]),
          0,
        );
        if (media.includes("#EXT-X-ENDLIST") && duration) {
          root
            .querySelectorAll("[data-player-time-duration]")
            .forEach((node) => {
              node.textContent = formatTime(duration);
            });
        }
        const dimensions = /RESOLUTION=(\d+)x(\d+)/.exec(first?.[1] ?? "");
        if (root.dataset.playerUpdateSize === "true" && dimensions)
          root.style.aspectRatio = `${dimensions[1]} / ${dimensions[2]}`;
        if (root.dataset.playerStatus === "idle") status("ready");
      } catch {}
    })();
  }
  return { video, play, pause, wake };
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const value = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  return value >= 3600
    ? `${Math.floor(value / 3600)}:${pad(Math.floor(value / 60) % 60)}:${pad(value % 60)}`
    : `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}
