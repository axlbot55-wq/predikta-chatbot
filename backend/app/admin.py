from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.services.pinecone_client import PineconeClient

router = APIRouter()


class ReindexRequest(BaseModel):
    index_name: str


@router.post("/reindex")
async def reindex(req: ReindexRequest):
    client = PineconeClient(index_name=req.index_name)
    return {"status": "ok", "index": req.index_name, "pinecone_enabled": client.is_enabled}
