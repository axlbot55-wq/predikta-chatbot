import re
from typing import Dict, List


def _split_sentences(text: str) -> List[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text.strip()) if part.strip()]


def _is_handoff_question(user_text: str) -> bool:
    lowered = user_text.lower()
    keywords = [
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
    ]
    return any(keyword in lowered for keyword in keywords)


def build_fallback_answer(user_text: str, hits: List[Dict], channel: str = "web") -> str:
    if not hits:
        return (
            "I can help with Predikta's capabilities, use cases, and positioning. "
            "Could you rephrase your question or tell me whether you want product overview, use cases, or campaign testing details?"
        )

    snippets: List[str] = []
    seen_sources = set()
    for hit in hits[:3]:
        text = hit.get("text", "").strip()
        if not text:
            continue
        source_id = hit.get("metadata", {}).get("source_id") or hit.get("metadata", {}).get("source") or hit.get("id")
        sentences = _split_sentences(text)
        if not sentences:
            continue
        if source_id not in seen_sources:
            snippets.append(sentences[0])
            seen_sources.add(source_id)

    if not snippets:
        return "I found relevant Predikta material, but I need a narrower question to answer accurately."

    if channel == "whatsapp":
        answer = " ".join(snippets[:2])
        if _is_handoff_question(user_text):
            answer += " If you want pricing or a custom setup, I can route this to the Predikta team."
        return answer

    answer = " ".join(snippets[:3])
    if _is_handoff_question(user_text):
        answer += " For pricing, legal, or a tailored pilot, the best next step is a human follow-up with the Predikta team."
    return answer
