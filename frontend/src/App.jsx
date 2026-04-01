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
        <p className="eyebrow">Meet Predikta</p>
        <h1>Ask what Predikta does, how it works, and whether it fits your team.</h1>
        <p className="hero-text">
          This chat is built for potential customers who want a clear feel for Predikta. Use it to
          explore the product, understand the kinds of questions it can help answer, and see where
          it fits in your workflow.
        </p>
      </section>
      <ChatWidget apiBase={apiBase} />
    </main>
  );
}
