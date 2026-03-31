import React, { useEffect, useState } from "react";

export default function ChatWidget({ apiBase }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi - ask me anything about Predikta." },
  ]);
  const [input, setInput] = useState("");
  const sessionKey = "predikta_session_id";

  useEffect(() => {
    let sid = localStorage.getItem(sessionKey);
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 10);
      localStorage.setItem(sessionKey, sid);
    }
  }, []);

  async function sendMessage(text) {
    if (!text) return;

    const session_id = localStorage.getItem(sessionKey);
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");

    try {
      const res = await fetch(`${apiBase}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, text, channel: "web" }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Error: could not connect to server." },
      ]);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ height: 320, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ textAlign: m.from === "user" ? "right" : "left", margin: "8px 0" }}
          >
            <div
              style={{
                display: "inline-block",
                background: m.from === "user" ? "#daf1ff" : "#f1f1f1",
                padding: "8px 12px",
                borderRadius: 12,
                maxWidth: "90%",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(input);
          }}
          placeholder="Type a question..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button onClick={() => sendMessage(input)} style={{ marginLeft: 8, padding: "8px 12px" }}>
          Send
        </button>
      </div>
    </div>
  );
}
