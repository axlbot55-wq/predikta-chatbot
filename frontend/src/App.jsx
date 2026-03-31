import React from "react";

import ChatWidget from "./ChatWidget";
import "./chat.css";

export default function App() {
  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBase = process.env.REACT_APP_API_BASE || (isLocal ? "http://127.0.0.1:8000" : "");

  return (
    <main className="app-shell">
      <section className="hero-copy">
        <p className="eyebrow">Predikta conversational guide</p>
        <h1>Talk through audiences, reactions, and messaging without the robotic chatbot feel.</h1>
        <p className="hero-text">
          This version is designed to feel more like a sharp human operator: warm, concise, and
          genuinely useful when someone is thinking through people, sentiment, positioning, or what
          to do next.
        </p>
      </section>
      <ChatWidget apiBase={apiBase} />
    </main>
  );
}
