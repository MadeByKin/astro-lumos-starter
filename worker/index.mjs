import { handleContact } from "./contact.mjs";

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === "/api/contact") {
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
