# predikta-chatbot

Predikta Chatbot: RAG + LLM chatbot powering website and WhatsApp (OpenClaw).

## Goal
Deliver a single chat brain (RAG + LLM) powering:
- Web chat widget (React)
- WhatsApp channel via OpenClaw

## Quickstart (local)

1. Copy `docs/env.example` -> `.env` and fill values.
2. Create Python venv and install dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. (Optional) Index docs:

```bash
python ingestion/ingest_docs.py --path ./your_docs/predikta_non_technical.txt --doc_id predikta_non_tech --source_name predikta --doc_type external
```

4. Run backend:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

5. Run frontend (development):

```bash
cd frontend
npm install
npm start
```

## Docker (quick):

```bash
docker-compose -f infra/docker-compose.yml up --build
```

## Notes

- Review and set secrets in `docs/env.example`.
- Pinecone and OpenAI credentials required.
- OpenClaw integration is a webhook placeholder - add vendor credentials.

## Predikta Knowledge Base

The current seed sources for the chatbot are listed in `docs/source-manifest.json`.

- Non-technical product description
- External FAQ
- Internal FAQ
- BS Dictionary
- Use case sheets

Use `docs/chatbot-strategy.md` as the operating guide for:

- website chatbot behavior
- WhatsApp/OpenClaw behavior
- public vs internal retrieval boundaries
- handoff and guardrail rules

For Cloudflare publishing notes, see `docs/cloudflare-deploy.md`.
