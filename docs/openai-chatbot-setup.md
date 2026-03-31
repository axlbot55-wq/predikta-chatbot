# OpenAI Chatbot Setup

## Environment Variables

Set these in Cloudflare Pages:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Recommended starting model:

- `OPENAI_MODEL=gpt-5.2`

If you want a faster, lower-cost option:

- `OPENAI_MODEL=gpt-5-mini`

## Routes

- `POST /chat`
  Returns a normal JSON response.
- `POST /chat/stream`
  Streams the reply into the UI using server-sent events.

## Conversation State

The frontend stores:

- visible chat history in `sessionStorage`
- the latest `previous_response_id` in `sessionStorage`

Each new turn is sent with `previous_response_id` so the Responses API can keep the conversation threaded.

## Current UX

- floating launcher button
- reliable modal/panel open behavior
- multiline input
- streaming assistant text
- graceful fallback if OpenAI is unavailable
- short, human, non-robotic assistant tone
