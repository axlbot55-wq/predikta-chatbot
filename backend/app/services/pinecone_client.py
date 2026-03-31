from backend.app.config import PINECONE_API_KEY, PINECONE_ENV

try:
    import pinecone
except Exception:  # pragma: no cover - optional dependency behavior
    pinecone = None


class PineconeClient:
    def __init__(self, index_name: str):
        self.index = None
        self.is_enabled = False

        if not index_name or not PINECONE_API_KEY or not PINECONE_ENV or pinecone is None:
            return

        try:
            pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENV)
            self.index = pinecone.Index(index_name)
            self.is_enabled = True
        except Exception:
            self.index = None
            self.is_enabled = False

    def upsert(self, vectors):
        if not self.is_enabled or self.index is None:
            return
        entries = []
        for vid, emb, meta in vectors:
            entries.append({"id": vid, "values": emb, "metadata": meta})
        self.index.upsert(vectors=entries)

    def query_vector(self, embedding, top_k=6, filter=None):
        if not self.is_enabled or self.index is None:
            return []
        res = self.index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter,
        )
        matches = res.get("matches", [])
        hits = []
        for m in matches:
            metadata = m.get("metadata", {})
            hits.append(
                {
                    "id": m.get("id"),
                    "score": m.get("score"),
                    "text": metadata.get("text", ""),
                    "metadata": metadata,
                }
            )
        return hits
