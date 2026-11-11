import { defineBehaviour, type Scope } from "@/lib/motion/scope";
import { lockScroll } from "@/lib/motion/scroll";

/** One controller registration and one document dispatcher; state stays per instance. */
export function installOverlays(lifetime: Scope) {
  const modals = new Map<
    HTMLDialogElement,
    { open(trigger?: HTMLElement): void }
  >();
  const dropdowns = new Map<
    HTMLDetailsElement,
    { summary: HTMLElement; scope: Scope }
  >();
  let backdrop: HTMLDialogElement | undefined;

  defineBehaviour("lumos-modal", (host, scope) => {
    const modal = host.querySelector<HTMLDialogElement>("[data-modal]");
    if (!modal) return;
    const scroll = modal.querySelector<HTMLElement>("[data-modal-scroll]");
    let unlock: (() => void) | undefined;
    let trigger: HTMLElement | undefined;
    const release = () => {
      unlock?.();
      unlock = undefined;
    };
    const open = (source?: HTMLElement) => {
      if (modal.open) return;
      trigger =
        source ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : undefined);
      if (scroll) scroll.scrollTop = 0;
      modal.showModal();
      unlock = lockScroll();
      modal.dispatchEvent(new CustomEvent("modal-open", { bubbles: true }));
    };
    modals.set(modal, { open });
    scope.defer(() => {
      modals.delete(modal);
      if (backdrop === modal) backdrop = undefined;
      modal.close();
      release();
    });
    modal.addEventListener(
      "close",
      () => {
        release();
        const anotherModalIsOpen = [...modals.keys()].some(
          (other) => other !== modal && other.open,
        );
        if (!anotherModalIsOpen && trigger?.isConnected) trigger.focus();
        modal.dispatchEvent(new CustomEvent("modal-close", { bubbles: true }));
      },
      { signal: scope.signal },
    );
    if (modal.open) unlock = lockScroll();
    const url = new URL(location.href);
    if (url.searchParams.get("modal") === modal.id) {
      open();
      url.searchParams.delete("modal");
      history.replaceState(history.state, "", url);
    }
  });

  defineBehaviour("lumos-dropdown", (host, scope) => {
    const dropdown = host.querySelector<HTMLDetailsElement>("[data-dropdown]");
    const summary = dropdown?.querySelector<HTMLElement>(
      "[data-dropdown-toggle]",
    );
    if (!dropdown || !summary) return;
    dropdowns.set(dropdown, { summary, scope });
    scope.defer(() => dropdowns.delete(dropdown));
  });

  document.addEventListener(
    "mousedown",
    (event) => {
      backdrop =
        event.target instanceof HTMLDialogElement && modals.has(event.target)
          ? event.target
          : undefined;
    },
    { signal: lifetime.signal },
  );

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      for (const dropdown of dropdowns.keys()) {
        if (dropdown.open && !dropdown.contains(target)) dropdown.open = false;
      }
      const owner = target.closest<HTMLDialogElement>("[data-modal]");
      if (owner && modals.has(owner)) {
        if (
          target.closest("[data-modal-close]") ||
          (backdrop === owner && target === owner)
        )
          owner.close();
      }
      backdrop = undefined;
      const opener = target.closest<HTMLElement>(
        "[data-modal-open], a[href^='#']",
      );
      if (!opener) return;
      let id = opener.dataset.modalOpen;
      if (!id && opener instanceof HTMLAnchorElement) {
        try {
          id = decodeURIComponent(opener.hash.slice(1));
        } catch {
          return;
        }
      }
      if (!id) return;
      const modal = document.getElementById(id);
      if (!(modal instanceof HTMLDialogElement)) return;
      const controller = modals.get(modal);
      if (!controller) return;
      event.preventDefault();
      controller.open(opener);
    },
    { signal: lifetime.signal },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const active = document.activeElement;
      const open = [...dropdowns.keys()].filter((dropdown) => dropdown.open);
      const dropdown =
        open.find((element) => element.contains(active)) ??
        (event.key === "Escape" ? open.at(-1) : undefined);
      if (!dropdown) return;
      if (event.key === "Escape") {
        event.preventDefault();
        dropdown.open = false;
        dropdowns.get(dropdown)?.summary.focus();
        return;
      }
      const forward = event.key === "ArrowDown";
      if (!forward && event.key !== "ArrowUp") return;
      const content = dropdown.querySelector("[data-dropdown-content]");
      const items = [
        ...(content?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ) ?? []),
      ];
      if (!items.length) return;
      event.preventDefault();
      const from = items.indexOf(active as HTMLElement);
      const next =
        from === -1
          ? forward
            ? 0
            : items.length - 1
          : (from + (forward ? 1 : -1) + items.length) % items.length;
      const controller = dropdowns.get(dropdown);
      // Native details content becomes focusable after its opening styles paint.
      // Both frames are owned by this instance and cancelled on removal/navigation.
      controller?.scope.frame(() =>
        controller.scope.frame(() => {
          if (dropdown.isConnected && dropdown.open) items[next].focus();
        }),
      );
    },
    { signal: lifetime.signal },
  );

  document.addEventListener(
    "astro:before-swap",
    () => {
      backdrop = undefined;
    },
    { signal: lifetime.signal },
  );
  lifetime.defer(() => {
    modals.clear();
    dropdowns.clear();
    backdrop = undefined;
  });
}
