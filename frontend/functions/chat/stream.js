import { json } from "../_lib/chatbot";
import { createChatStreamResponse } from "../_lib/openai";

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

  const message = (payload.message || payload.text || "").trim();
  const previousResponseId = payload.previous_response_id || payload.previousResponseId || null;

  if (!message) {
    return json({ detail: "message is required" }, 400);
  }

  return createChatStreamResponse(context.env, message, previousResponseId);
}
