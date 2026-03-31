import os

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional dependency behavior
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
OPENCLAW_API_URL = os.getenv("OPENCLAW_API_URL")
OPENCLAW_API_KEY = os.getenv("OPENCLAW_API_KEY")
OPENCLAW_SECRET = os.getenv("OPENCLAW_SECRET")
PORT = int(os.getenv("PORT", 8000))
