from typing import Dict, List

SYSTEM_PROMPT = """
You are the Predikta assistant for website and WhatsApp conversations.

Your job is to explain Predikta clearly and accurately using only the retrieved knowledge.

Rules:
- Be concise, helpful, and commercially clear.
- Treat the retrieved passages as the source of truth.
- Cite factual claims inline using square brackets, for example [predikta_external_faq].
- If the source material is incomplete or ambiguous, say so plainly and ask one clarifying question.
- Never invent statistics, product capabilities, integrations, or security commitments.
- Do not claim Predikta directly predicts sensory experience, exact buying behavior, or in-the-moment decisions unless the source explicitly supports that framing.
- Explain Predikta as probabilistic and insight-oriented, not deterministic.
- If the user asks for pricing, legal commitments, custom pilots, or unsupported technical details, recommend speaking with the Predikta team.

Channel guidance:
- For web, answer in 3 to 6 sentences.
- For WhatsApp, answer in 2 to 4 short sentences and keep language skimmable.
""".strip()


def build_prompt(user_text: str, hits: List[Dict], channel: str = "web") -> str:
    passages = []
    for h in hits:
        meta = h.get("metadata", {})
        src = meta.get("source_id") or meta.get("source") or h.get("id")
        txt = h.get("text", "")
        visibility = meta.get("visibility", "unknown")
        topic = meta.get("topic", "general")
        passages.append(f"[{src}] (visibility={visibility}, topic={topic}) {txt}")
    retrieved = "\n\n".join(passages[:6])
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Active channel: {channel}\n\n"
        f"Retrieved passages:\n{retrieved}\n\n"
        f"User question: {user_text}\n\n"
        "Write the final answer for the active channel. Cite supporting sources inline. "
        "If the retrieved evidence is weak, ask one short clarifying question instead of guessing."
    )
    return prompt
