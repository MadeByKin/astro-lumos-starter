import { Scope } from "./scope";
import { observeMotion } from "./policy";
import { onMotionFrame, observeViewport } from "./subscriptions";
import { scrollState } from "./scroll";

/** Local development only. This module is dynamically imported behind DEV. */
export function installDiagnostics(scope: Scope) {
  let panel: HTMLElement | undefined;
  let panelScope: Scope | undefined;
  const close = () => {
    panelScope?.dispose();
    panelScope = undefined;
    panel?.remove();
    panel = undefined;
  };
  scope.defer(close);
  const toggle = () => {
    if (panel) {
      close();
      return;
    }
    panelScope = new Scope();
    panel = document.createElement("aside");
    panel.dataset.motionDiagnostics = "";
    panel.setAttribute("aria-label", "Motion diagnostics");
    Object.assign(panel.style, {
      position: "fixed",
      insetInlineEnd: "1rem",
      insetBlockEnd: "1rem",
      zIndex: "2147483647",
      background: "#1f1d1e",
      color: "#c6fb50",
      padding: "1rem",
      border: "1px solid currentColor",
      font: "0.8rem/1.6 monospace",
      whiteSpace: "pre-line",
      pointerEvents: "none",
    });
    document.body.append(panel);
    let fps: number | undefined;
    let allowed = false;
    let viewport = { width: innerWidth, height: innerHeight };
    const render = () => {
      if (!panel) return;
      const state = scrollState();
      panel.textContent = `ASTRO LUMOS · DEVELOPMENT\nMotion ${allowed ? "on" : "paused"} · Lenis ${state.smooth ? "on" : "off"}\n${viewport.width} × ${viewport.height} · locks ${state.locks}\nGSAP clock ${fps === undefined ? "—" : Math.round(fps)} fps\nShift+F to close · not a Lighthouse score`;
    };
    observeMotion(panelScope, (value) => {
      allowed = value;
      if (!value) fps = undefined;
      render();
    });
    observeViewport(panelScope, (value) => {
      viewport = value;
      render();
    });
    let elapsed = 0;
    let count = 0;
    onMotionFrame(panelScope, ({ delta }) => {
      elapsed += delta;
      count++;
      if (elapsed < 0.5) return;
      fps = count / elapsed;
      count = 0;
      elapsed = 0;
      render();
    });
    render();
  };
  document.addEventListener(
    "keydown",
    (event) => {
      const target = event.target;
      if (
        !event.shiftKey ||
        event.code !== "KeyF" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat
      )
        return;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
        )
      )
        return;
      event.preventDefault();
      toggle();
    },
    { signal: scope.signal },
  );
}
