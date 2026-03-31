# Predikta Chatbot Strategy

## Objective

Build one shared "chat brain" for Predikta that powers:

- The website chatbot for prospects, partners, and warm leads
- WhatsApp support and sales conversations via OpenClaw

The channel changes. The underlying retrieval, guardrails, and answer policy should stay the same.

## Recommended Architecture

1. Knowledge layer

- Ingest approved source material into a retrieval index
- Store chunk text, source URL, source type, audience, and last-reviewed date
- Separate external-safe sources from internal-only sources with metadata filters

2. Answer layer

- Retrieve the most relevant chunks for each user question
- Build a constrained prompt that answers only from approved knowledge
- Require the model to cite sources and avoid unsupported claims
- Fall back to a clarification question when the source material is thin

3. Channel adapters

- Website: short, polished answers for first-touch discovery
- WhatsApp: shorter answers, stronger lead capture, easier handoff to a human
- OpenClaw should only wrap transport, session mapping, and webhook security

## What The Bot Should Be Good At

Based on the current source material, the bot should answer confidently about:

- What Predikta is and how it differs from surveys or social listening
- What Predikta can simulate
- What Predikta cannot predict directly
- Audience segmentation, personas, and psychographic targeting
- Supported use cases across campaign planning, testing, optimization, and monitoring
- Example applications for marketing teams and selected industries

## Guardrails

The chatbot should not overclaim. Current source material supports these boundaries:

- Predikta simulates sentiment and behavioral response signals
- Predikta is probabilistic, not deterministic
- Predikta can help evaluate messaging, concepts, scripts, and broad creative directions
- Predikta should not claim to directly predict sensory experience
- Predikta should not claim to directly predict actual purchases
- Predikta should not claim to fully predict in-the-moment decisions without context

## Knowledge Base Design

Recommended metadata per chunk:

- `source_id`
- `source_name`
- `source_url`
- `source_type`
- `audience`
- `visibility`
- `topic`
- `channel`

Recommended `visibility` values:

- `external`
- `internal`
- `public`

## Retrieval Policy

- Website chatbot should default to `external` and `public` content only
- WhatsApp can use the same default unless the number is mapped to an internal team workflow
- Internal FAQ content should stay excluded from public answers unless explicitly enabled for an authenticated internal assistant

## Suggested MVP

1. Ingest the three Google Docs and two Sheets into Pinecone
2. Tag each chunk with `visibility`
3. Expose one `/chat` endpoint for web and one webhook for OpenClaw
4. Add source citations and a friendly fallback when confidence is low
5. Add human handoff triggers for pricing, enterprise security, or unsupported questions

## Handoff Triggers

The bot should offer human follow-up when the user asks for:

- Pricing or commercial proposals
- Security, legal, or data processing commitments not documented in the KB
- Highly specific methodology details not confirmed in the FAQ
- Custom demos, pilots, or campaign setup support
