const MAX_BODY = 16_384;
const EMAIL =
  /^[^\s<>(),;:"\\\[\]\x00-\x1f\x7f]+@[^\s<>(),;:"\\\[\]\x00-\x1f\x7f]+\.[^\s<>(),;:"\\\[\]\x00-\x1f\x7f]+$/;

function reply(request, status, message) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    Vary: "Accept",
    ...(status === 405 ? { Allow: "POST" } : {}),
    ...(status === 429 ? { "Retry-After": "60" } : {}),
  };
  if (request.headers.get("Accept")?.includes("application/json")) {
    return Response.json({ ok: status === 200, message }, { status, headers });
  }
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Contact form</title><body><main><h1>${status === 200 ? "Thank you" : "Message not sent"}</h1><p>${message}</p><p><a href="/">Return to the website</a></p></main></body></html>`,
    {
      status,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      },
    },
  );
}

async function readForm(request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BODY) {
    throw new RangeError();
  }
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY) throw new RangeError();
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  return new Response(new Blob(chunks), {
    headers: { "Content-Type": request.headers.get("Content-Type") },
  }).formData();
}

function field(form, key, max, required = true) {
  const values = form.getAll(key);
  if (!required && values.length === 0) return "";
  if (values.length !== 1 || typeof values[0] !== "string") throw new Error();
  const value = values[0].trim();
  if ((required && !value) || value.length > max || value.includes("\0")) {
    throw new Error();
  }
  return value;
}

export async function handleContact(request, env, verifyFetch = fetch) {
  if (request.method !== "POST")
    return reply(request, 405, "Please submit the contact form.");
  let origin;
  try {
    origin = new URL(env.CONTACT_ORIGIN);
    if (origin.protocol !== "https:" || origin.origin !== env.CONTACT_ORIGIN)
      throw new Error();
  } catch {
    return reply(
      request,
      503,
      "The contact form is temporarily unavailable. Please contact us another way.",
    );
  }
  if (
    request.headers.get("Origin") !== origin.origin ||
    new URL(request.url).origin !== origin.origin
  ) {
    return reply(request, 403, "Please submit the form from our website.");
  }
  if (
    !EMAIL.test(env.CONTACT_FROM || "") ||
    !EMAIL.test(env.CONTACT_TO || "") ||
    !env.TURNSTILE_SECRET_KEY ||
    typeof env.EMAIL?.send !== "function" ||
    typeof env.CONTACT_RATE_LIMIT?.limit !== "function"
  ) {
    return reply(
      request,
      503,
      "The contact form is temporarily unavailable. Please contact us another way.",
    );
  }
  const contentType = request.headers.get("Content-Type") || "";
  if (
    !/^(application\/x-www-form-urlencoded|multipart\/form-data)(;|$)/i.test(
      contentType,
    )
  ) {
    return reply(
      request,
      415,
      "Please use the contact form to send your message.",
    );
  }
  try {
    const rate = await env.CONTACT_RATE_LIMIT.limit({
      key: `${origin.host}:${request.headers.get("CF-Connecting-IP") || "unknown"}`,
    });
    if (!rate.success)
      return reply(request, 429, "Please wait a minute before trying again.");
  } catch {
    return reply(
      request,
      503,
      "The contact form is temporarily unavailable. Please try again later.",
    );
  }
  let form;
  try {
    form = await readForm(request);
  } catch (error) {
    return reply(
      request,
      error instanceof RangeError ? 413 : 400,
      "Please check your message and try again.",
    );
  }
  let name, email, message, token;
  try {
    if (field(form, "website", 200, false))
      return reply(request, 200, "Thank you for your message.");
    name = field(form, "name", 100);
    email = field(form, "email", 254);
    message = field(form, "message", 5000);
    token = field(form, "cf-turnstile-response", 2048);
    if (/[\r\n\x00-\x1f\x7f]/.test(name) || !EMAIL.test(email))
      throw new Error();
    for (const value of form.values()) {
      if (typeof value !== "string") throw new Error();
    }
  } catch {
    return reply(
      request,
      400,
      "Please check your name, email, message and spam check, then try again.",
    );
  }
  try {
    const verification = await verifyFetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          ...(request.headers.get("CF-Connecting-IP")
            ? { remoteip: request.headers.get("CF-Connecting-IP") }
            : {}),
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!verification.ok) throw new Error();
    const result = await verification.json();
    if (
      result.success !== true ||
      result.hostname !== origin.hostname ||
      result.action !== "contact"
    ) {
      return reply(
        request,
        400,
        "Please complete the spam check again and retry.",
      );
    }
  } catch {
    return reply(
      request,
      503,
      "The spam check is temporarily unavailable. Please try again later.",
    );
  }
  try {
    await env.EMAIL.send({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO,
      replyTo: email,
      subject: `Website enquiry — ${origin.hostname}`,
      text: `Name: ${name}\nEmail: ${email}\nWebsite: ${origin.origin}\n\n${message}`,
    });
  } catch {
    return reply(
      request,
      502,
      "Your message could not be sent. Please try again later or contact us another way.",
    );
  }
  return reply(request, 200, "Thank you for your message.");
}
