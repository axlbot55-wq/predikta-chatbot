import re
from typing import Dict, List

from backend.app.config import PINECONE_INDEX
from backend.app.data.seed_knowledge import SEED_KNOWLEDGE
from backend.app.services.embeddings import embed_text
from backend.app.services.pinecone_client import PineconeClient


def _allowed_visibilities(channel: str) -> set[str]:
    if channel in {"web", "whatsapp", "whatsapp_openclaw"}:
        return {"public", "external"}
    return {"public", "external", "internal"}


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _local_search(text: str, top_k: int, channel: str) -> List[Dict]:
    query_tokens = _tokenize(text)
    allowed = _allowed_visibilities(channel)
    scored = []
    for item in SEED_KNOWLEDGE:
        metadata = item.get("metadata", {})
        if metadata.get("visibility") not in allowed:
            continue
        body = item.get("text", "")
        body_tokens = _tokenize(body)
        overlap = len(query_tokens & body_tokens)
        if overlap == 0:
            continue
        score = overlap / max(len(query_tokens), 1)
        if text.lower() in body.lower():
            score += 0.5
        scored.append(
            {
                "id": item["id"],
                "score": round(score, 4),
                "text": body,
                "metadata": metadata,
            }
        )
    scored.sort(key=lambda hit: hit["score"], reverse=True)
    return scored[:top_k]


def semantic_search(text: str, top_k: int = 6, channel: str = "web") -> List[Dict]:
    if not text.strip():
        return []

    pine = PineconeClient(index_name=PINECONE_INDEX)
    if pine.is_enabled:
        emb = embed_text(text)
        if emb:
            filter_meta = None
            if channel == "web":
                filter_meta = {"visibility": {"$in": ["external", "public"]}}
            results = pine.query_vector(emb, top_k=top_k, filter=filter_meta)
            if results:
                return results

    return _local_search(text, top_k=top_k, channel=channel)
