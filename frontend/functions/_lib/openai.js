import { buildAnswer, semanticSearch } from "./chatbot";

export const PREDIKTA_INSTRUCTIONS = `You are Predikta's conversational guide.
Speak like an intelligent, warm, perceptive human operator.
Do not sound like a call-center bot, FAQ engine, or generic AI assistant.
Use plain English.
Keep most answers short to medium length.
Be natural, specific, and grounded.
Avoid filler, buzzwords, and canned phrases.
Do not over-apologize.
Do not constantly restate the user's question.
Be helpful, sharp, and conversational.
When useful, help the user think more clearly, compare options, or decide what to do next.
If you do not know something, say so directly.
Default to clarity, brevity, and good judgment.`;

function jsonHeaders(overrides = {}) {
  return {
    "Content-Type": "application/json",
    ...overrides,
  };
}

function streamHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function buildFallbackAnswer(message) {
  const hits = semanticSearch(message, 6, "web");
  return {
    answer: buildAnswer(message, hits, "web"),
    hits,
  };
}

function buildOpenAIRequest(env, message, previousResponseId, stream) {
  return {
    model: env.OPENAI_MODEL || "gpt-5.2",
    instructions: PREDIKTA_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    ],
    stream,
    store: true,
    previous_response_id: previousResponseId || undefined,
  };
}

function buildSyntheticResponseId() {
  return `fallback_${Date.now()}`;
}

function sseFrame(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function createChatJsonResponse(env, message, previousResponseId) {
  if (!env.OPENAI_API_KEY) {
    const fallback = buildFallbackAnswer(message);
    return new Response(
      JSON.stringify({
        answer: fallback.answer,
        response_id: buildSyntheticResponseId(),
        mode: "fallback",
        sources: fallback.hits,
      }),
      { status: 200, headers: jsonHeaders() }
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAIRequest(env, message, previousResponseId, false)),
  });

  if (!response.ok) {
    const fallback = buildFallbackAnswer(message);
    return new Response(
      JSON.stringify({
        answer: fallback.answer,
        response_id: buildSyntheticResponseId(),
        mode: "fallback",
        detail: "openai request failed",
        sources: fallback.hits,
      }),
      { status: 200, headers: jsonHeaders() }
    );
  }

  const payload = await response.json();
  return new Response(
    JSON.stringify({
      answer: payload.output_text || "",
      response_id: payload.id || null,
      mode: "openai",
    }),
    { status: 200, headers: jsonHeaders() }
  );
}

export async function createChatStreamResponse(env, message, previousResponseId) {
  if (!env.OPENAI_API_KEY) {
    const fallback = buildFallbackAnswer(message);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseFrame("token", { delta: fallback.answer })));
        controller.enqueue(
          new TextEncoder().encode(
            sseFrame("done", { response_id: buildSyntheticResponseId(), mode: "fallback" })
          )
        );
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: streamHeaders() });
  }

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAIRequest(env, message, previousResponseId, true)),
  });

  if (!upstream.ok || !upstream.body) {
    const fallback = buildFallbackAnswer(message);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseFrame("token", { delta: fallback.answer })));
        controller.enqueue(
          new TextEncoder().encode(
            sseFrame("done", { response_id: buildSyntheticResponseId(), mode: "fallback" })
          )
        );
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: streamHeaders() });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let responseId = null;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const raw = line.slice(5).trim();
              if (!raw || raw === "[DONE]") continue;

              let event;
              try {
                event = JSON.parse(raw);
              } catch (error) {
                continue;
              }

              if (event.response?.id) {
                responseId = event.response.id;
              }

              if (event.type === "response.output_text.delta" && event.delta) {
                controller.enqueue(encoder.encode(sseFrame("token", { delta: event.delta })));
              }

              if (event.type === "response.completed") {
                controller.enqueue(
                  encoder.encode(
                    sseFrame("done", {
                      response_id: responseId || event.response?.id || null,
                      mode: "openai",
                    })
                  )
                );
              }

              if (event.type === "error") {
                controller.enqueue(
                  encoder.encode(
                    sseFrame("error", {
                      message: event.message || "The assistant hit a problem while responding.",
                    })
                  )
                );
              }
            }
          }
        }

        if (buffer.trim()) {
          const raw = buffer.replace(/^data:\s*/, "").trim();
          if (raw && raw !== "[DONE]") {
            try {
              const event = JSON.parse(raw);
              if (event.type === "response.completed") {
                controller.enqueue(
                  encoder.encode(
                    sseFrame("done", {
                      response_id: responseId || event.response?.id || null,
                      mode: "openai",
                    })
                  )
                );
              }
            } catch (error) {
              // Ignore trailing parse issues from partial SSE frames.
            }
          }
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseFrame("error", {
              message: "The assistant hit a network problem while responding.",
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { status: 200, headers: streamHeaders() });
}
