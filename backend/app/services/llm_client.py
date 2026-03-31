from backend.app.config import OPENAI_API_KEY

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - optional dependency behavior
    OpenAI = None


def call_llm(prompt: str, max_tokens: int = 300, fallback_text: str = ""):
    if not OPENAI_API_KEY or OpenAI is None:
        return {"text": fallback_text, "raw": None, "mode": "fallback"}

    client = OpenAI(api_key=OPENAI_API_KEY)
    models_to_try = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"]
    for model in models_to_try:
        try:
            resp = client.responses.create(
                model=model,
                input=prompt,
                max_output_tokens=max_tokens,
            )
            text = getattr(resp, "output_text", "").strip()
            if text:
                return {"text": text, "raw": resp, "mode": "llm"}
        except Exception:
            continue

    return {"text": fallback_text, "raw": None, "mode": "fallback"}
