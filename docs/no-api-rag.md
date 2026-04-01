# No-API RAG Layer

## What This Is

This project now includes a no-API retrieval layer for the website chatbot and the OpenClaw WhatsApp webhook.

It is not embedding-based semantic search. Instead, it uses:

- a larger static knowledge pack extracted from the approved Predikta source materials
- chunk-level metadata such as topic and visibility
- heuristic retrieval with token overlap, phrase overlap, and topic hints

## Why This Exists

- avoids paid model API usage
- keeps the current Cloudflare deployment simple
- performs better than a tiny hardcoded FAQ seed
- gives us a practical bridge until we decide whether to add a fuller RAG stack later

## Source Base

The content is grounded in the sources listed in `docs/source-manifest.json`.

## Current Behavior

- public website and WhatsApp routes only retrieve from public/external content
- internal-only chunks remain excluded from public channels
- answers stay short, clean, and user-facing rather than exposing raw source ids

## Next Upgrade

If we want a stronger RAG system later without jumping straight to paid APIs, the next step would be:

1. export fuller snapshots of the Google Docs and Sheets content
2. generate more complete chunk sets automatically
3. improve retrieval ranking and answer composition further
