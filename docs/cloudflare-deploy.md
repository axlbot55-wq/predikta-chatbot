# Cloudflare Deployment

## Short Answer

Yes. The current Cloudflare path uses Cloudflare Pages Functions inside `frontend/functions`.

That means:

- the static React app is served by Cloudflare Pages
- the chatbot API is served by the same Pages project at `/chat`
- the OpenClaw webhook can be served by the same Pages project at `/webhook/openclaw`

## Cloudflare Pages Settings

Use these values if you connect the repo to Pages:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `build`

## Functions Included

These routes now live in Cloudflare Pages Functions:

- `POST /chat`
- `POST /chat/stream`
- `GET /health`
- `POST /webhook/openclaw`

## Why `_redirects` Exists

This frontend is a single-page app. The `_redirects` file ensures client-side routes fall back to `index.html`.

## Current Status

The frontend can now be deployed together with the chatbot API on Cloudflare Pages.

The current Cloudflare chatbot logic uses the seeded Predikta knowledge base. If you want richer answers later, the next step is to replace the seeded data with full ingestion from the Google Docs and Sheets sources.

The website chat UI can also use OpenAI securely through the server-side Pages Functions. See `docs/openai-chatbot-setup.md`.

## Environment Variables

If you want the OpenClaw webhook to send replies back through the vendor API, set these in Cloudflare Pages:

- `OPENCLAW_API_URL`
- `OPENCLAW_API_KEY`
- `OPENCLAW_SECRET`
- `OPENCLAW_REPLY_FORMAT` (optional)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

For the WhatsApp/OpenClaw setup details, see `docs/openclaw-whatsapp.md`.
