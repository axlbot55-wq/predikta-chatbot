from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.rag.prompt_builder import build_prompt
from backend.app.rag.retrieval import semantic_search
from backend.app.services.fallback_answer import build_fallback_answer
from backend.app.services.llm_client import call_llm

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    text: str
    channel: str = "web"


@router.post("/")
async def chat(req: ChatRequest):
    if not req.text:
        raise HTTPException(status_code=400, detail="text is required")

    hits = semantic_search(req.text, top_k=6, channel=req.channel)
    prompt = build_prompt(req.text, hits, channel=req.channel)
    fallback_text = build_fallback_answer(req.text, hits, channel=req.channel)
    resp = call_llm(prompt, max_tokens=400, fallback_text=fallback_text)
    text = resp.get("text", "").strip()
    return {"answer": text, "sources": hits}
