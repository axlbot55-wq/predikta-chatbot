import hashlib
import hmac
import uuid
from typing import Optional

import redis
import requests
from fastapi import APIRouter, Header, HTTPException, Request

from backend.app.config import OPENCLAW_API_KEY, OPENCLAW_API_URL, OPENCLAW_SECRET, REDIS_URL
from backend.app.rag.prompt_builder import build_prompt
from backend.app.rag.retrieval import semantic_search
from backend.app.services.fallback_answer import build_fallback_answer
from backend.app.services.llm_client import call_llm

router = APIRouter()

r = None
if REDIS_URL:
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
    except Exception:
        r = None


def verify_signature(body: bytes, signature: Optional[str]) -> bool:
    if not OPENCLAW_SECRET or not signature:
        return True
    digest = hmac.new(OPENCLAW_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)


def get_or_create_session(phone: str) -> str:
    if not phone:
        return str(uuid.uuid4())

    key = f"session:{phone}"
    if r:
        sid = r.get(key)
        if sid:
            return sid
        sid = str(uuid.uuid4())
        r.set(key, sid)
        return sid

    return str(uuid.uuid5(uuid.NAMESPACE_DNS, phone))


@router.post("/openclaw")
async def openclaw_webhook(request: Request, x_signature: Optional[str] = Header(None)):
    raw = await request.body()
    if not verify_signature(raw, x_signature):
        raise HTTPException(status_code=401, detail="invalid signature")

    payload = await request.json()
    phone = payload.get("from") or payload.get("from_number")
    text = payload.get("body") or payload.get("text")
    if not phone or not text:
        raise HTTPException(status_code=400, detail="missing fields")

    session_id = get_or_create_session(phone)
    hits = semantic_search(text, top_k=6, channel="whatsapp_openclaw")
    prompt = build_prompt(text, hits, channel="whatsapp")
    fallback_text = build_fallback_answer(text, hits, channel="whatsapp")
    resp = call_llm(prompt, max_tokens=300, fallback_text=fallback_text)
    answer = resp.get("text", "").strip()

    if OPENCLAW_API_URL and OPENCLAW_API_KEY:
        requests.post(
            OPENCLAW_API_URL,
            headers={
                "Authorization": f"Bearer {OPENCLAW_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"to": phone, "message": answer},
            timeout=30,
        )

    return {"status": "ok", "session_id": session_id, "reply": answer}
