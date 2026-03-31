# OpenClaw WhatsApp Setup

## Live Endpoint

Use this webhook URL in OpenClaw:

- `https://predikta-chatbot.pages.dev/webhook/openclaw`

## What It Does

- receives incoming WhatsApp-style messages from OpenClaw
- verifies the `X-Signature` header when `OPENCLAW_SECRET` is set
- generates a short WhatsApp-safe Predikta answer
- optionally sends the reply back through OpenClaw using your outbound API URL and API key

## Required Cloudflare Pages Environment Variables

Set these in the `predikta-chatbot` Pages project if you want automatic outbound replies:

- `OPENCLAW_API_URL`
- `OPENCLAW_API_KEY`
- `OPENCLAW_SECRET`

Optional:

- `OPENCLAW_REPLY_FORMAT`

Use `OPENCLAW_REPLY_FORMAT=whatsapp_text` if your OpenClaw send API expects:

```json
{
  "to": "639171234567",
  "type": "text",
  "text": { "body": "..." }
}
```

If not set, the default outbound payload is:

```json
{
  "to": "639171234567",
  "message": "..."
}
```

## Incoming Payloads Supported

The webhook currently accepts several shapes as long as it can find:

- sender phone number
- message text

Examples it can parse:

```json
{ "from": "639171234567", "body": "What is Predikta?" }
```

```json
{ "from_number": "639171234567", "text": "What can Predikta do?" }
```

```json
{
  "messages": [
    { "from": "639171234567", "text": { "body": "How is it different from surveys?" } }
  ]
}
```

## Quick Test

You can test the live webhook without OpenClaw first:

```bash
curl -s -X POST https://predikta-chatbot.pages.dev/webhook/openclaw \
  -H 'Content-Type: application/json' \
  -d '{"from":"639171234567","body":"What is Predikta?"}'
```

## Notes

- WhatsApp answers are intentionally shorter and do not include inline source ids
- pricing, legal, security, and pilot questions are still nudged toward human follow-up
- right now the live bot uses the seeded Predikta knowledge base; replacing that with full Google Docs and Sheets ingestion is the next quality upgrade
