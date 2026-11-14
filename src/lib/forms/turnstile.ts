export interface Turnstile {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: () => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(id: string): void;
  remove(id: string): void;
}

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
  if (loading) return loading;
  loading = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(new Error("Spam check unavailable"));
    };
    script.addEventListener("error", fail, { once: true });
    script.addEventListener(
      "load",
      () => {
        clearTimeout(timeout);
        const api = (window as Window & { turnstile?: Turnstile }).turnstile;
        if (!api) return fail();
        resolve(api);
      },
      { once: true },
    );
    document.head.append(script);
  });
  return loading;
}
