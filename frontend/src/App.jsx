import React from "react";

import ChatWidget from "./ChatWidget";

export default function App() {
  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBase = process.env.REACT_APP_API_BASE || (isLocal ? "http://127.0.0.1:8000" : "");

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: "40px" }}>
      <div style={{ width: 480 }}>
        <h2>Predikta Chat</h2>
        <ChatWidget apiBase={apiBase} />
      </div>
    </div>
  );
}
