import { json } from "./_lib/chatbot";

export async function onRequestGet() {
  return json({ status: "ok", runtime: "cloudflare-pages-functions" });
}
