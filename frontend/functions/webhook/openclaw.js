import {
  buildAnswer,
  buildOpenClawReplyPayload,
  json,
  normalizeOpenClawMessage,
  semanticSearch,
  sessionIdForPhone,
  verifySignature,
} from "../_lib/chatbot";

export function onRequestOptions() {
  return json({}, 204);
}

export async function onRequestPost(context) {
  const rawBody = await context.request.arrayBuffer();
  const signature = context.request.headers.get("X-Signature");
  const secret = context.env.OPENCLAW_SECRET || "";
  const valid = await verifySignature(secret, signature, rawBody);

  if (!valid) {
    return json({ detail: "invalid signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch (error) {
    return json({ detail: "invalid json body" }, 400);
  }

  const { phone, text, eventType } = normalizeOpenClawMessage(payload);
  if (!phone || !text) {
    return json({ status: "ignored", reason: "missing phone or text", event_type: eventType || "unknown" });
  }

  const sessionId = await sessionIdForPhone(phone);
  const hits = semanticSearch(text, 6, "whatsapp_openclaw");
  const reply = buildAnswer(text, hits, "whatsapp");

  if (context.env.OPENCLAW_API_URL && context.env.OPENCLAW_API_KEY) {
    const outboundPayload = buildOpenClawReplyPayload(phone, reply, context.env);
    const sendResponse = await fetch(context.env.OPENCLAW_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.OPENCLAW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(outboundPayload),
    });

    if (!sendResponse.ok) {
      return json(
        {
          status: "error",
          session_id: sessionId,
          reply,
          detail: "openclaw send failed",
          openclaw_status: sendResponse.status,
        },
        502
      );
    }
  }

  return json({ status: "ok", session_id: sessionId, reply, event_type: eventType || "message" });
}
