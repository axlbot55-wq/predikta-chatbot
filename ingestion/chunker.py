import re


def chunk_text_file(path: str, chunk_chars: int = 3000):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    paras = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks = []
    cur = ""
    for p in paras:
        if len(cur) + len(p) + 2 <= chunk_chars:
            cur = (cur + "\n\n" + p).strip() if cur else p
        else:
            if cur:
                chunks.append(cur)
            if len(p) <= chunk_chars:
                cur = p
            else:
                for i in range(0, len(p), chunk_chars):
                    chunks.append(p[i : i + chunk_chars])
                cur = ""
    if cur:
        chunks.append(cur)
    return chunks
