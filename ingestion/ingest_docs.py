import argparse

from app.config import PINECONE_INDEX
from app.services.embeddings import embed_text
from app.services.pinecone_client import PineconeClient
from ingestion.chunker import chunk_text_file


def ingest_file(path, doc_id, source_name, doc_type="external"):
    pc = PineconeClient(index_name=PINECONE_INDEX)
    chunks = chunk_text_file(path, chunk_chars=3000)
    vectors = []
    for i, txt in enumerate(chunks):
        emb = embed_text(txt)
        vid = f"{doc_id}_{i}"
        meta = {
            "text": txt,
            "source": source_name,
            "doc_type": doc_type,
            "visibility": "external",
        }
        vectors.append((vid, emb, meta))
    pc.upsert(vectors)
    print(f"Indexed {len(vectors)} chunks from {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", required=True)
    parser.add_argument("--doc_id", required=True)
    parser.add_argument("--source_name", required=True)
    parser.add_argument("--doc_type", default="external")
    args = parser.parse_args()
    ingest_file(args.path, args.doc_id, args.source_name, args.doc_type)
