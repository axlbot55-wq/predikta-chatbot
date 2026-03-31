import React, { useEffect, useMemo, useRef, useState } from "react";

const STARTERS = [
  "What kinds of questions can Predikta help a marketing team answer?",
  "How is Predikta different from surveys or social listening?",
  "We have two campaign directions. How would Predikta help us choose?",
];

const HISTORY_KEY = "predikta_chat_history_v2";
const RESPONSE_KEY = "predikta_previous_response_id_v2";

function parseSseChunk(chunk, onEvent) {
  const frames = chunk.split("\n\n");
  const remainder = frames.pop() || "";

  for (const frame of frames) {
    const lines = frame.split("\n").filter(Boolean);
    let eventName = "message";
    const dataParts = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      }
      if (line.startsWith("data:")) {
        dataParts.push(line.slice(5).trim());
      }
    }

    if (!dataParts.length) continue;

    try {
      onEvent(eventName, JSON.parse(dataParts.join("\n")));
    } catch (error) {
      // Ignore malformed partial frames.
    }
  }

  return remainder;
}

export default function ChatWidget({ apiBase }) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        return [];
      }
    }
    return [
      {
        id: "intro",
        role: "assistant",
        text: "Hi. I can help you think through messaging, audiences, likely reactions, and what Predikta can actually do.",
      },
    ];
  });
  const [previousResponseId, setPreviousResponseId] = useState(
    () => sessionStorage.getItem(RESPONSE_KEY) || ""
  );

  const streamUrl = useMemo(() => `${apiBase}/chat/stream`, [apiBase]);

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (previousResponseId) {
      sessionStorage.setItem(RESPONSE_KEY, previousResponseId);
    }
  }, [previousResponseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  async function sendMessage(rawText) {
    const message = rawText.trim();
    if (!message || isSending) return;

    const assistantId = `assistant_${Date.now()}`;
    setIsOpen(true);
    setIsSending(true);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `user_${Date.now()}`, role: "user", text: message },
      { id: assistantId, role: "assistant", text: "", pending: true },
    ]);

    try {
      const response = await fetch(streamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          previous_response_id: previousResponseId || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("The assistant could not respond right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseChunk(buffer, (eventName, payload) => {
          if (eventName === "token") {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? { ...item, text: `${item.text}${payload.delta || ""}`, pending: false }
                  : item
              )
            );
          }

          if (eventName === "done") {
            if (payload.response_id) {
              setPreviousResponseId(payload.response_id);
            }
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId ? { ...item, pending: false } : item
              )
            );
          }

          if (eventName === "error") {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      text: payload.message || "The assistant hit a problem while responding.",
                      pending: false,
                      error: true,
                    }
                  : item
              )
            );
          }
        });
      }
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                text: "Something went wrong on the connection side. Please try again in a moment.",
                pending: false,
                error: true,
              }
            : item
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  function resetConversation() {
    sessionStorage.removeItem(HISTORY_KEY);
    sessionStorage.removeItem(RESPONSE_KEY);
    setPreviousResponseId("");
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: "Fresh start. Tell me what you're trying to understand, compare, or decide.",
      },
    ]);
  }

  return (
    <>
      <button className="chat-launcher" type="button" onClick={() => setIsOpen(true)}>
        Talk to Predikta
      </button>

      <div className={`chat-overlay ${isOpen ? "chat-overlay--open" : ""}`}>
        <section className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`} aria-live="polite">
          <header className="chat-header">
            <div>
              <p className="chat-kicker">Predikta guide</p>
              <h2>Let’s think it through.</h2>
            </div>
            <div className="chat-actions">
              <button className="chat-action-link" type="button" onClick={resetConversation}>
                Reset
              </button>
              <button className="chat-close" type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </header>

          <div className="chat-scroll">
            {messages.length <= 1 && (
              <div className="chat-starters">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    className="starter-pill"
                    onClick={() => sendMessage(starter)}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            <div className="chat-thread">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-row chat-row--${message.role}`}
                >
                  <div
                    className={`chat-bubble ${
                      message.role === "user" ? "chat-bubble--user" : "chat-bubble--assistant"
                    } ${message.error ? "chat-bubble--error" : ""}`}
                  >
                    {message.text || (message.pending ? "Thinking..." : "")}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="chat-composer">
            <textarea
              ref={textareaRef}
              value={input}
              rows={3}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about audience reactions, messaging choices, or what Predikta can help with."
            />
            <div className="chat-composer-bar">
              <p>{isSending ? "Replying..." : "Enter to send, Shift+Enter for a new line"}</p>
              <button type="button" onClick={() => sendMessage(input)} disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </>
  );
}
