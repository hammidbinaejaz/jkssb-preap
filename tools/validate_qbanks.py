#!/usr/bin/env python3
"""CI checks for JKSSB PREP question banks.

Validates unique IDs, 4 options, valid keys, provenance, explanations,
and rejects filler stems / fake-verified generated items.
Exit 0 on success, 1 on failure.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QBANKS = ROOT / "data" / "qbanks"
CATALOG = ROOT / "data" / "catalog.json"
EXAMS = ROOT / "data" / "exams.json"
VALID_KEYS = set("ABCD")
VALID_STATUS = {"generated", "human_reviewed", "official_pyq", "needs_review", "invalid"}
EXAM_READY = {"generated", "human_reviewed", "official_pyq"}
WORD_RE = re.compile(r"[A-Za-z0-9']+")
ITEM_RE = re.compile(r"\(item\s+\d+\)", re.I)
PLACEHOLDER_RE = re.compile(r"Review the related concept in your syllabus notes", re.I)
FAKE_OFFICIAL_RE = re.compile(r"official JKSSB (PYQ|answer key)", re.I)
MIN_EXPL_WORDS = 20


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def word_count(text: str) -> int:
    return len(WORD_RE.findall(text or ""))


def source_label(q: dict) -> str:
    src = q.get("source")
    if isinstance(src, dict):
        return str(src.get("label") or "")
    return str(src or "")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    seen_ids: dict[str, str] = {}
    total = 0

    if not CATALOG.exists():
        errors.append("Missing data/catalog.json")
    if not EXAMS.exists():
        errors.append("Missing data/exams.json")

    catalog_posts = {}
    if CATALOG.exists():
        catalog = load_json(CATALOG)
        for cat in catalog.get("categories", []):
            for post in cat.get("posts", []):
                catalog_posts[post["id"]] = post

    exam_ids = set()
    if EXAMS.exists():
        exams = load_json(EXAMS)
        for exam in exams.get("exams", []):
            exam_ids.add(exam.get("id") or exam.get("dataset_id"))

    for path in sorted(QBANKS.rglob("*.json")):
        bank = load_json(path)
        questions = bank.get("questions") or []
        post_id = bank.get("post_id") or path.stem
        if post_id not in catalog_posts:
            warnings.append(f"{path}: post_id {post_id!r} not in catalog")
        if post_id not in exam_ids:
            warnings.append(f"{path}: no exams.json entry for {post_id!r}")

        stems: set[str] = set()
        for q in questions:
            total += 1
            qid = q.get("question_id")
            if not qid:
                errors.append(f"{path}: question missing question_id")
                continue
            if qid in seen_ids:
                errors.append(f"Duplicate ID {qid}: {seen_ids[qid]} and {path}")
            else:
                seen_ids[qid] = str(path)
            if not str(qid).startswith(f"{post_id}-") and not str(qid).startswith("faa-"):
                warnings.append(f"{path}: {qid} does not use postId:nnn or faa- prefix")

            opts = q.get("options") or []
            if len(opts) != 4:
                errors.append(f"{qid}: expected 4 options, got {len(opts)}")
            ids = [str(o.get("id", "")).upper() for o in opts]
            if ids and ids != ["A", "B", "C", "D"]:
                errors.append(f"{qid}: option ids must be A–D in order, got {ids}")
            for o in opts:
                if not str(o.get("text", "")).strip():
                    errors.append(f"{qid}: empty option text")

            key = str(q.get("correct_option") or "").upper()
            status = q.get("verification_status") or "needs_review"
            if status == "verified":
                errors.append(f"{qid}: generated banks must not use verification_status 'verified'")
            elif status not in VALID_STATUS:
                errors.append(f"{qid}: bad verification_status {status!r}")
            if status in EXAM_READY:
                if key not in VALID_KEYS:
                    errors.append(f"{qid}: {status} but invalid key {key!r}")
            elif status == "needs_review" and key and key not in VALID_KEYS:
                errors.append(f"{qid}: needs_review with invalid key {key!r}")

            stem = str(q.get("question") or "")
            if not stem.strip():
                errors.append(f"{qid}: empty question text")
            if ITEM_RE.search(stem):
                errors.append(f"{qid}: filler stem suffix (item N)")
            if stem in stems:
                errors.append(f"{qid}: duplicate stem in {path.name}")
            stems.add(stem)

            expl = str(q.get("explanation") or "")
            if PLACEHOLDER_RE.search(expl):
                errors.append(f"{qid}: placeholder explanation")
            if status in EXAM_READY and word_count(expl) < MIN_EXPL_WORDS:
                errors.append(f"{qid}: explanation has {word_count(expl)} words (need {MIN_EXPL_WORDS}+)")

            label = source_label(q)
            if status == "generated" and FAKE_OFFICIAL_RE.search(label) and "not" not in label.lower():
                errors.append(f"{qid}: generated item claims official PYQ/key in source")
            if status == "generated" and not label.strip():
                errors.append(f"{qid}: generated item missing source label")
            if "option_a" in q or "option_b" in q:
                warnings.append(f"{qid}: legacy flat option_a…d still present")

    for post_id, post in catalog_posts.items():
        file_rel = post.get("file")
        if not file_rel:
            errors.append(f"Catalog post {post_id} missing file")
            continue
        if not (ROOT / "data" / file_rel).exists():
            errors.append(f"Catalog post {post_id}: missing {file_rel}")

    print(f"Validated {total} questions across {len(list(QBANKS.rglob('*.json')))} banks")
    print(f"Unique IDs: {len(seen_ids)}")
    for w in warnings[:40]:
        print(f"WARN: {w}")
    if len(warnings) > 40:
        print(f"WARN: …and {len(warnings) - 40} more")
    for e in errors:
        print(f"ERROR: {e}")
    if errors:
        print(f"FAILED with {len(errors)} error(s)")
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
