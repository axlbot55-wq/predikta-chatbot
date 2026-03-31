import { buildAnswer, json, semanticSearch } from "../_lib/chatbot";

export function onRequestOptions() {
  return json({}, 204);
}

export async function onRequestPost(context) {
  let payload;
  try {
    payload = await context.request.json();
  } catch (error) {
    return json({ detail: "invalid json body" }, 400);
  }

  const text = (payload.text || "").trim();
  const channel = payload.channel || "web";
  if (!text) {
    return json({ detail: "text is required" }, 400);
  }

  const hits = semanticSearch(text, 6, channel);
  const answer = buildAnswer(text, hits, channel);
  return json({ answer, sources: hits });
}
