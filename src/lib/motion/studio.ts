import type { Scope } from "./scope";

// Survives this document's BFCache suspension; a new document gets fresh state.
let lastEditing: boolean | undefined;

/** Isolated adapter for signals observed in the local Stacki Studio source. */
export function connectStudio(scope: Scope) {
  const root = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="studio-parent-origin"]',
  );
  // An arbitrary iframe is not proof that this is a Stacki editor.
  if (window.parent === window || !meta?.content) return;
  let origin: string;
  try {
    origin = new URL(meta.content).origin;
  } catch {
    return;
  }
  const setEditing = (editing: boolean) => {
    lastEditing = editing;
    root.dataset.studioEditing = String(editing);
    document.dispatchEvent(new Event("site:motion-policy"));
  };
  const fromHash = () => setEditing(location.hash.includes("avb-design"));
  setEditing(lastEditing ?? location.hash.includes("avb-design"));
  window.addEventListener("hashchange", fromHash, { signal: scope.signal });
  window.addEventListener(
    "message",
    (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent || event.origin !== origin) return;
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      if (data.type === "avb:interaction" && "mode" in data) {
        if (data.mode === "select" || data.mode === "interact")
          setEditing(data.mode === "select");
      }
      if (
        data.type === "studio:interactive" &&
        "enabled" in data &&
        typeof data.enabled === "boolean"
      ) {
        setEditing(!data.enabled);
      }
    },
    { signal: scope.signal },
  );
  document.addEventListener(
    "avb:morphed",
    () => {
      document.dispatchEvent(new Event("site:content-updated"));
    },
    { signal: scope.signal },
  );
  scope.defer(() => {
    delete root.dataset.studioEditing;
  });
}
