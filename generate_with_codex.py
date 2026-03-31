# Optional helper if you prefer to generate via Codex; included for completeness.

import json
import os

import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

MANIFEST = "manifest.json"
MODEL = "code-davinci-002"
MAX_TOKENS = 1600
TEMPERATURE = 0.0


def call_codex(prompt, max_tokens=MAX_TOKENS):
    resp = openai.Completion.create(
        model=MODEL,
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=TEMPERATURE,
        n=1,
    )
    return resp["choices"][0]["text"]


def sanitize(text):
    text = text.strip()
    if text.startswith("```"):
        text = "\n".join(text.split("\n")[1:])
    if text.endswith("```"):
        text = "\n".join(text.split("\n")[:-1])
    return text


def generate():
    with open(MANIFEST, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    for e in manifest:
        p = e["path"]
        prompt = e["prompt"]
        print("Generating", p)
        out = call_codex(prompt, max_tokens=e.get("max_tokens", MAX_TOKENS))
        content = sanitize(out)
        parent = os.path.dirname(p)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(content)


if __name__ == "__main__":
    generate()
