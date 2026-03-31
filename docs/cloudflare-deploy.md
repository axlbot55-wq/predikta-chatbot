# Cloudflare Deployment

## Short Answer

Yes, we can publish the frontend on Cloudflare Pages.

The current backend is FastAPI, so it does not deploy to Cloudflare Pages as-is. For a full online chatbot, use one of these paths:

- Fastest path: deploy the frontend to Cloudflare Pages and host the FastAPI API on another service
- Cloudflare-only path: rewrite the backend into Cloudflare Workers or Pages Functions

## Fastest Path

1. Deploy `frontend/` to Cloudflare Pages
2. Deploy the FastAPI backend somewhere that supports Python servers
3. Set `REACT_APP_API_BASE` in Cloudflare Pages to the public backend URL

Example:

- Frontend: `https://chat.predikta.com`
- Backend: `https://predikta-api.example.com`
- Pages env var: `REACT_APP_API_BASE=https://predikta-api.example.com`

## Cloudflare Pages Settings

Use these values if you connect the repo to Pages:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `build`

## Why `_redirects` Exists

This frontend is a single-page app. The `_redirects` file ensures client-side routes fall back to `index.html`.

## Current Status

The frontend builds successfully for production.

The backend runs locally and serves `/chat/`, but it still needs a public host before the Pages site can use it online.

## Recommended Next Move

If you want the quickest live result:

1. Put the frontend on Cloudflare Pages now
2. Put the FastAPI backend on a Python host
3. Point Pages to the backend with `REACT_APP_API_BASE`

If you want everything on Cloudflare:

1. Keep the frontend on Pages
2. Rebuild `/chat/` and the OpenClaw webhook as Cloudflare Workers
3. Move secrets to Cloudflare environment variables
