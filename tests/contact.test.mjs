import test from "node:test";
import assert from "node:assert/strict";
import { handleContact } from "../worker/contact.mjs";
import worker from "../worker/index.mjs";

const origin = "https://client.example";
function request(data = {}, headers = {}, multipart = false) {
  const values = {
    name: "Jane Smith",
    email: "jane@example.net",
    message: "Hello, I would like to discuss a project.",
    "cf-turnstile-response": "valid-token",
    ...data,
  };
  const body = multipart ? new FormData() : new URLSearchParams();
  for (const [key, value] of Object.entries(values)) body.append(key, value);
  return new Request(`${origin}/api/contact`, {
    method: "POST",
    body,
    headers: {
      Origin: origin,
      Accept: "application/json",
      "CF-Connecting-IP": "192.0.2.1",
      ...headers,
    },
  });
}
function fixture() {
  const sent = [],
    verifications = [],
    rates = [];
  const env = {
    CONTACT_ORIGIN: origin,
    CONTACT_FROM: "website@client.example",
    CONTACT_TO: "hello@client.example",
    TURNSTILE_SECRET_KEY: "secret",
    EMAIL: {
      send: async (message) => {
        sent.push(message);
        return { messageId: "test-id" };
      },
    },
    CONTACT_RATE_LIMIT: {
      limit: async (key) => {
        rates.push(key);
        return { success: true };
      },
    },
  };
  const verify = async (url, options) => {
    verifications.push({ url, options });
    return Response.json({
      success: true,
      hostname: "client.example",
      action: "contact",
    });
  };
  return { env, sent, verifications, rates, verify };
}

test("valid multipart and native forms send only to the configured recipient with a safe reply address", async () => {
  for (const multipart of [true, false]) {
    const f = fixture();
    const res = await handleContact(
      request(
        {
          to: "attacker@example.net",
          subject: "Ignore me",
          message: "<script>text only</script>",
        },
        {},
        multipart,
      ),
      f.env,
      f.verify,
    );
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    assert.equal(f.sent.length, 1);
    assert.equal(f.sent[0].to, f.env.CONTACT_TO);
    assert.equal(f.sent[0].from, f.env.CONTACT_FROM);
    assert.equal(f.sent[0].replyTo, "jane@example.net");
    assert.equal(f.sent[0].subject, "Website enquiry — client.example");
    assert.equal(f.sent[0].html, undefined);
    assert.match(f.sent[0].text, /<script>text only<\/script>/);
    assert.equal(f.verifications[0].options.body.get("secret"), "secret");
    assert.equal(f.verifications[0].options.body.get("remoteip"), "192.0.2.1");
    assert.deepEqual(f.rates[0], { key: "client.example:192.0.2.1" });
  }
});

test("unconfigured, cross-origin, wrong-host and unsupported requests never send", async () => {
  for (const key of [
    "CONTACT_ORIGIN",
    "CONTACT_FROM",
    "CONTACT_TO",
    "TURNSTILE_SECRET_KEY",
    "EMAIL",
    "CONTACT_RATE_LIMIT",
  ]) {
    const f = fixture();
    delete f.env[key];
    assert.equal(
      (await handleContact(request(), f.env, f.verify)).status,
      503,
      key,
    );
    assert.equal(f.sent.length, 0);
  }
  for (const supplied of ["https://attacker.example", "null", ""]) {
    const f = fixture();
    assert.equal(
      (await handleContact(request({}, { Origin: supplied }), f.env, f.verify))
        .status,
      403,
    );
    assert.equal(f.sent.length, 0);
  }
  const f = fixture();
  assert.equal(
    (
      await handleContact(
        new Request("https://other.example/api/contact", request()),
        f.env,
        f.verify,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleContact(new Request(`${origin}/api/contact`), f.env, f.verify))
      .status,
    405,
  );
  assert.equal(
    (
      await handleContact(
        new Request(`${origin}/api/contact`, {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: "{}",
        }),
        f.env,
        f.verify,
      )
    ).status,
    415,
  );
});

test("invalid fields, header injection, duplicates, uploads and oversized bodies never reach email", async () => {
  for (const data of [
    { name: "" },
    { email: "invalid" },
    { email: "jane@example.net\r\nBcc:x@example.net" },
    { name: "Jane\r\nInjected" },
    { name: "x".repeat(101) },
    { message: "" },
    { message: "x".repeat(5001) },
    { "cf-turnstile-response": "" },
    { "cf-turnstile-response": "x".repeat(2049) },
  ]) {
    const f = fixture();
    assert.equal(
      (await handleContact(request(data), f.env, f.verify)).status,
      400,
    );
    assert.equal(f.sent.length, 0);
    assert.equal(f.verifications.length, 0);
  }
  for (const upload of [false, true]) {
    const f = fixture();
    const req = request();
    const form = await req.formData();
    form.append(
      upload ? "attachment" : "email",
      upload ? new Blob(["file"]) : "second@example.net",
    );
    assert.equal(
      (
        await handleContact(
          new Request(req.url, {
            method: "POST",
            headers: { Origin: origin, Accept: "application/json" },
            body: form,
          }),
          f.env,
          f.verify,
        )
      ).status,
      400,
    );
    assert.equal(f.sent.length, 0);
  }
  const f = fixture();
  assert.equal(
    (
      await handleContact(
        request({ extra: "x".repeat(17000) }),
        f.env,
        f.verify,
      )
    ).status,
    413,
  );
  const streamed = new Request(`${origin}/api/contact`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(17000));
        controller.close();
      },
    }),
    duplex: "half",
  });
  assert.equal((await handleContact(streamed, f.env, f.verify)).status, 413);
  assert.equal(f.sent.length, 0);
});

test("spam trap silently discards submissions and rate limits fail closed", async () => {
  const f = fixture();
  assert.equal(
    (await handleContact(request({ website: "bot.example" }), f.env, f.verify))
      .status,
    200,
  );
  assert.equal(f.sent.length, 0);
  assert.equal(f.verifications.length, 0);
  f.env.CONTACT_RATE_LIMIT.limit = async () => ({ success: false });
  const rate = await handleContact(request(), f.env, f.verify);
  assert.equal(rate.status, 429);
  assert.equal(rate.headers.get("Retry-After"), "60");
  f.env.CONTACT_RATE_LIMIT.limit = async () => {
    throw new Error("unavailable");
  };
  assert.equal((await handleContact(request(), f.env, f.verify)).status, 503);
  assert.equal(f.sent.length, 0);
});

test("Turnstile rejects expired/replayed tokens, wrong host/action and outages before sending", async () => {
  for (const result of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "evil.example", action: "contact" },
    { success: true, hostname: "client.example", action: "login" },
  ]) {
    const f = fixture();
    assert.equal(
      (await handleContact(request(), f.env, async () => Response.json(result)))
        .status,
      400,
    );
    assert.equal(f.sent.length, 0);
  }
  for (const verify of [
    async () => {
      throw new Error("network");
    },
    async () => new Response("bad", { status: 502 }),
    async () => new Response("not JSON"),
  ]) {
    const f = fixture();
    assert.equal((await handleContact(request(), f.env, verify)).status, 503);
    assert.equal(f.sent.length, 0);
  }
});

test("email failure is not success and native responses contain no submitted data", async () => {
  const f = fixture();
  f.env.EMAIL.send = async () => {
    throw new Error("private provider failure");
  };
  const res = await handleContact(request(), f.env, f.verify);
  assert.equal(res.status, 502);
  assert.equal((await res.json()).ok, false);
  const html = await handleContact(
    request({}, { Accept: "text/html" }),
    fixture().env,
    f.verify,
  );
  assert.equal(html.status, 200);
  assert.match(html.headers.get("Content-Type"), /text\/html/);
  assert.doesNotMatch(await html.text(), /Jane|jane@example/);
});

test("Worker routes the API and preserves assets and unknown-page handling", async () => {
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 404 }) },
  };
  assert.equal(
    (await worker.fetch(new Request(`${origin}/api/contact`), env)).status,
    405,
  );
  const res = await worker.fetch(new Request(`${origin}/missing`), env);
  assert.equal(res.status, 404);
  assert.equal(await res.text(), "asset");
});
