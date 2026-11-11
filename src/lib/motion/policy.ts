import type { Scope } from "./scope";

export function motionAllowed() {
  return (
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.documentElement.dataset.motion !== "off" &&
    document.documentElement.dataset.studioEditing !== "true" &&
    !document.hidden
  );
}

export function observeMotion(
  scope: Scope,
  update: (allowed: boolean) => void,
) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => update(motionAllowed());
  media.addEventListener("change", sync, { signal: scope.signal });
  document.addEventListener("site:motion-policy", sync, {
    signal: scope.signal,
  });
  document.addEventListener("visibilitychange", sync, { signal: scope.signal });
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion", "data-studio-editing"],
  });
  scope.defer(() => observer.disconnect());
  sync();
}
