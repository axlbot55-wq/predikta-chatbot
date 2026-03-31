from backend.app.config import OPENAI_API_KEY

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - optional dependency behavior
    OpenAI = None


def embed_text(text: str):
    if not text or not OPENAI_API_KEY or OpenAI is None:
        return []

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.embeddings.create(model="text-embedding-3-small", input=text)
        return resp.data[0].embedding
    except Exception:
        return []
