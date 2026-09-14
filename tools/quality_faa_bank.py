#!/usr/bin/env python3
"""Honesty + quality pass for FAA banks.

- Relabel generated items (never 'verified')
- Strip '(item N)' filler suffixes and drop duplicate stems
- Replace placeholder explanations with statement-aware or keyed text
- Require explanations of at least 20 words
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "qbanks" / "finance" / "faa"
ITEM_RE = re.compile(r"\s*\(item\s+\d+\)\s*", re.I)
PLACEHOLDER_RE = re.compile(
    r"Correct option is [A-D]\.\s*Review the related concept in your syllabus notes\.?",
    re.I,
)
WORD_RE = re.compile(r"[A-Za-z0-9']+")
ROMAN_RE = re.compile(r"(?<![IVX])(III|II|IV|I)(?![IVX])")
GENERATED_SOURCE = "Generated syllabus drill (not an official JKSSB key)"
PATTERN_SOURCE = "Latest-pattern practice pack (unofficial; not a JKSSB answer key)"


def words(text: str) -> int:
    return len(WORD_RE.findall(text or ""))


def key_text(q: dict) -> str:
    key = str(q.get("correct_option") or "")
    for o in q.get("options") or []:
        if str(o.get("id")) == key:
            return str(o.get("text") or key)
    return key


def parse_statements(stem: str) -> list[tuple[str, str]]:
    return [
        (roman, body.strip())
        for roman, body in re.findall(
            r"Statement\s+(I{1,3}|IV)\s*:\s*(.+?)(?=\s*Statement\s+(?:I{1,3}|IV)\s*:|$)",
            stem or "",
            flags=re.S,
        )
    ]


def true_romans(option_text: str) -> set[str]:
    t = (option_text or "").upper()
    if re.search(r"\bALL\b", t) or "I, II, AND III" in t or "I, II AND III" in t:
        return {"I", "II", "III"}
    return set(ROMAN_RE.findall(t.replace("AND", " ")))


def statement_explanation(q: dict, keyed: str) -> str | None:
    stmts = parse_statements(q.get("question") or "")
    if len(stmts) < 2:
        return None
    true = true_romans(keyed)
    lines = []
    for roman, text in stmts:
        flag = "true" if roman in true else "false"
        lines.append(f"Statement {roman} is {flag}: {text.strip().rstrip('.')}." )
    lines.append(
        f"The keyed option is “{keyed}”, matching only the true statements in the FAA economics/GK syllabus sense."
    )
    return " ".join(lines)


def expand_explanation(q: dict, *, pattern: bool) -> str:
    keyed = key_text(q)
    existing = str(q.get("explanation") or "").strip()
    if PLACEHOLDER_RE.search(existing):
        existing = ""
    stmt = statement_explanation(q, keyed)
    if stmt:
        existing = stmt
    elif pattern and existing.lower().startswith("correct option is"):
        existing = ""
    topic = q.get("topic") or "this syllabus topic"
    subject = q.get("subject") or "Accounts Assistant (Finance)"
    if words(existing) >= 20 and not pattern:
        return existing
    if words(existing) >= 20 and pattern and stmt:
        return existing
    prefix = existing.rstrip(".") + ". " if existing else ""
    extra = (
        f"The correct choice is “{keyed}”. That matches the standard treatment of {topic} "
        f"in the {subject} paper. Discard options that contradict this definition or mix unrelated facts."
    )
    if pattern:
        extra += " This pack is unofficial practice, not a published JKSSB answer key."
    return (prefix + extra).strip()


def clean_stem(stem: str) -> str:
    return re.sub(r"\s+", " ", ITEM_RE.sub(" ", stem or "")).strip()


def process_bank(path: Path) -> dict:
    bank = json.loads(path.read_text(encoding="utf-8"))
    pattern = path.name == "latest-pattern.json"
    seen: set[str] = set()
    kept: list[dict] = []
    for q in bank.get("questions") or []:
        q["question"] = clean_stem(q.get("question") or "")
        if not q["question"]:
            continue
        if q["question"] in seen:
            continue
        seen.add(q["question"])
        q["verification_status"] = "generated"
        src = PATTERN_SOURCE if pattern else GENERATED_SOURCE
        if isinstance(q.get("source"), dict):
            q["source"] = {**q["source"], "label": src}
        else:
            q["source"] = src
        q["explanation"] = expand_explanation(q, pattern=pattern)
        kept.append(q)
    bank["questions"] = kept
    bank["question_count"] = len(kept)
    path.write_text(json.dumps(bank, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path.name}: {len(kept)}")
    return bank


def main() -> None:
    grand = 0
    for path in sorted(OUT.glob("*.json")):
        bank = process_bank(path)
        grand += len(bank.get("questions") or [])
    manifest_path = ROOT / "data" / "qbanks" / "finance" / "accounts-assistant-finance.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["question_count"] = grand
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    catalog_path = ROOT / "data" / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog["categories"][0]["posts"][0]["question_count"] = grand
    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    index_path = ROOT / "data" / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    index["datasets"][0]["question_count"] = grand
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Grand total {grand}")


if __name__ == "__main__":
    main()
