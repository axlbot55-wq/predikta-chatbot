import { SEED_KNOWLEDGE } from "./seedKnowledge";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Signature",
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export function tokenize(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []));
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function allowedVisibilities(channel) {
  if (channel === "web" || channel === "whatsapp" || channel === "whatsapp_openclaw") {
    return new Set(["public", "external"]);
  }
  return new Set(["public", "external", "internal"]);
}

export function semanticSearch(text, topK = 6, channel = "web") {
  const queryTokens = tokenize(text);
  const allowed = allowedVisibilities(channel);
  const hits = [];

  for (const item of SEED_KNOWLEDGE) {
    if (!allowed.has(item.metadata.visibility)) {
      continue;
    }

    const bodyTokens = tokenize(item.text);
    const overlap = [...queryTokens].filter((token) => bodyTokens.has(token)).length;
    if (overlap === 0) {
      continue;
    }

    let score = overlap / Math.max(queryTokens.size, 1);
    if (item.text.toLowerCase().includes(text.toLowerCase())) {
      score += 0.5;
    }

    hits.push({
      id: item.id,
      score: Number(score.toFixed(4)),
      text: item.text,
      metadata: item.metadata,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, topK);
}

function isHandoffQuestion(text) {
  const lowered = text.toLowerCase();
  return [
    "price",
    "pricing",
    "cost",
    "proposal",
    "quote",
    "demo",
    "pilot",
    "security",
    "privacy",
    "legal",
    "contract",
  ].some((keyword) => lowered.includes(keyword));
}

export function buildAnswer(userText, hits, channel = "web") {
  if (!hits.length) {
    return channel === "whatsapp"
      ? "I can help with Predikta's positioning, use cases, and campaign-testing capabilities. Could you rephrase that or ask about overview, use cases, or audience simulation?"
      : "I can help with Predikta's positioning, use cases, and campaign-testing capabilities. Could you rephrase the question or ask about overview, use cases, or audience simulation?";
  }

  const snippets = [];
  const seen = new Set();

  for (const hit of hits.slice(0, 3)) {
    const sourceId = hit.metadata.source_id || hit.metadata.source || hit.id;
    if (seen.has(sourceId)) {
      continue;
    }
    const firstSentence = splitSentences(hit.text)[0];
    if (firstSentence) {
      snippets.push(channel === "whatsapp" ? firstSentence : `${firstSentence} [${sourceId}]`);
      seen.add(sourceId);
    }
  }

  if (!snippets.length) {
    return "I found related Predikta material, but I need a narrower question to answer it accurately.";
  }

  let answer = channel === "whatsapp" ? snippets.slice(0, 2).join(" ") : snippets.join(" ");
  if (isHandoffQuestion(userText)) {
    answer +=
      channel === "whatsapp"
        ? " If you want pricing or a custom setup, I can route this to the Predikta team."
        : " For pricing, legal, or a tailored pilot, the best next step is a human follow-up with the Predikta team.";
  }
  return answer;
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export function normalizeOpenClawMessage(payload) {
  const firstMessage = Array.isArray(payload.messages) ? payload.messages[0] || {} : {};
  const firstEntry = Array.isArray(payload.entry) ? payload.entry[0] || {} : {};
  const firstChange = Array.isArray(firstEntry.changes) ? firstEntry.changes[0] || {} : {};
  const changeValue = firstChange.value || {};

  const phone = pickFirstString([
    payload.from,
    payload.from_number,
    payload.sender,
    payload.phone,
    payload.contact?.phone,
    payload.contact?.wa_id,
    firstMessage.from,
    firstMessage.from_number,
    changeValue.from,
    changeValue.from_number,
    changeValue.contacts?.[0]?.wa_id,
    changeValue.contacts?.[0]?.phone,
  ]);

  const text = pickFirstString([
    payload.body,
    payload.text,
    payload.message,
    payload.content,
    firstMessage.body,
    firstMessage.text?.body,
    firstMessage.message?.text,
    changeValue.body,
    changeValue.text,
    changeValue.messages?.[0]?.text?.body,
    changeValue.messages?.[0]?.body,
  ]);

  const eventType = pickFirstString([
    payload.type,
    payload.event,
    payload.message_type,
    firstMessage.type,
    changeValue.field,
    changeValue.messages?.[0]?.type,
  ]);

  return { phone, text, eventType };
}

export function buildOpenClawReplyPayload(phone, reply, env) {
  const mode = env.OPENCLAW_REPLY_FORMAT || "simple";

  if (mode === "whatsapp_text") {
    return {
      to: phone,
      type: "text",
      text: { body: reply },
    };
  }

  return {
    to: phone,
    message: reply,
  };
}

function constantTimeEquals(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

async function hexHmacSha256(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, message);
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifySignature(secret, signature, body) {
  if (!secret || !signature) {
    return true;
  }
  const digest = await hexHmacSha256(secret, body);
  return constantTimeEquals(digest, signature);
}

export async function sessionIdForPhone(phone) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(phone));
  return [...new Uint8Array(digest)].slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
