export type Cleanup = () => void;

/** Instance-owned resources. Disposal is idempotent and runs every cleanup. */
export class Scope {
  readonly controller = new AbortController();
  private cleanups: Cleanup[] = [];
  private disposed = false;
  private timers = new Set<number>();
  private frames = new Set<number>();
  get signal() {
    return this.controller.signal;
  }
  timeout(callback: () => void, delay = 0) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (!this.disposed) callback();
    }, delay);
    this.timers.add(id);
    return id;
  }
  frame(callback: FrameRequestCallback) {
    const id = requestAnimationFrame((time) => {
      this.frames.delete(id);
      if (!this.disposed) callback(time);
    });
    this.frames.add(id);
    return id;
  }
  observe<T extends { disconnect(): void }>(observer: T): T {
    this.defer(() => observer.disconnect());
    return observer;
  }
  defer(cleanup: Cleanup) {
    if (this.disposed) cleanup();
    else this.cleanups.push(cleanup);
    return cleanup;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
    this.timers.forEach((id) => clearTimeout(id));
    this.frames.forEach((id) => cancelAnimationFrame(id));
    this.timers.clear();
    this.frames.clear();
    for (const cleanup of this.cleanups.reverse()) {
      try {
        cleanup();
      } catch (error) {
        console.error("Resource cleanup failed", error);
      }
    }
    this.cleanups = [];
  }
}

/** Component-local setup, including live editor removal/reinsertion and BFCache. */
export function defineBehaviour(
  name: string,
  setup: (element: HTMLElement, scope: Scope) => void,
  options: { refreshOnContent?: boolean } = {},
) {
  if (customElements.get(name)) return;
  const refreshOnContent = options.refreshOnContent !== false;
  customElements.define(
    name,
    class extends HTMLElement {
      private connection?: AbortController;
      private scope?: Scope;
      private mount = () => {
        this.scope?.dispose();
        if (!this.isConnected) return;
        const scope = new Scope();
        this.scope = scope;
        try {
          setup(this, scope);
        } catch (error) {
          scope.dispose();
          console.error(
            `Failed to enhance ${name}; using static content`,
            error,
          );
        }
      };
      private unmount = () => {
        this.scope?.dispose();
        this.scope = undefined;
      };
      connectedCallback() {
        if (this.connection) return;
        this.connection = new AbortController();
        const options = { signal: this.connection.signal };
        if (refreshOnContent)
          document.addEventListener(
            "site:content-updated",
            this.mount,
            options,
          );
        document.addEventListener("astro:before-swap", this.unmount, options);
        document.addEventListener(
          "astro:page-load",
          () => {
            if (!this.scope) this.mount();
          },
          options,
        );
        window.addEventListener("pagehide", this.unmount, options);
        window.addEventListener("pageshow", this.mount, options);
        this.mount();
      }
      disconnectedCallback() {
        this.connection?.abort();
        this.connection = undefined;
        this.unmount();
      }
    },
  );
}
