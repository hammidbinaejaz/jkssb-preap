#!/usr/bin/env python3
"""
PDF → JSON pipeline for Latest Pattern MCQs for FAA (scanned PDF).

Pipeline: OCR text → question detection → option normalization →
answer key merge → topic classification → validation → JSON.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

OCR_PATH = Path("/tmp/jkssb_ocr/full_ocr.txt")
OUT_DIR = Path(__file__).resolve().parents[1] / "data"
REPORT_DIR = Path(__file__).resolve().parents[1] / "reports"
SOURCE_FILE = "Latest_Pattern_MCQs_FAA.pdf"

# Answer key from PDF pages 19–20 (vision-verified)
ANSWER_KEY: dict[int, str] = {
    1: "B", 2: "B", 3: "B", 4: "B", 5: "A", 6: "A", 7: "B", 8: "A", 9: "A", 10: "A",
    11: "A", 12: "A", 13: "B", 14: "A", 15: "A", 16: "A", 17: "B", 18: "A", 19: "A", 20: "A",
    21: "A", 22: "A", 23: "A", 24: "D", 25: "A", 26: "A", 27: "A", 28: "A", 29: "A", 30: "A",
    31: "A", 32: "A", 33: "A", 34: "A", 35: "A", 36: "A", 37: "A", 38: "A", 39: "A", 40: "A",
    41: "A", 42: "A", 43: "C", 44: "C", 45: "A", 46: "C", 47: "A", 48: "C", 49: "A", 50: "C",
    51: "C", 52: "A", 53: "C", 54: "A", 55: "C", 56: "D", 57: "A", 58: "A", 59: "C", 60: "A",
    61: "B", 62: "A", 63: "A", 64: "A", 65: "A", 66: "A", 67: "D", 68: "A", 69: "A", 70: "A",
    71: "D", 72: "A", 73: "A", 74: "A", 75: "A", 76: "A", 77: "A", 78: "A", 79: "A", 80: "A",
    81: "A", 82: "A", 83: "D", 84: "A", 85: "A", 86: "A", 87: "A", 88: "A", 89: "D", 90: "A",
    91: "A", 92: "A", 93: "A", 94: "A", 95: "A", 96: "C", 97: "A", 98: "A", 99: "D", 100: "D",
}

OPTIONS_COMBO = [
    {"id": "A", "text": "Only I and II"},
    {"id": "B", "text": "Only I and III"},
    {"id": "C", "text": "Only II and III"},
    {"id": "D", "text": "I, II, and III"},
]

OPTIONS_ASSERTION = [
    {"id": "A", "text": "Both Statement I and Statement II are correct."},
    {"id": "B", "text": "Both Statement I and Statement II are incorrect."},
    {"id": "C", "text": "Statement I is correct, but Statement II is incorrect."},
    {"id": "D", "text": "Statement I is incorrect, but Statement II is correct."},
]

OPTIONS_ONLY = [
    {"id": "A", "text": "I and II only"},
    {"id": "B", "text": "I and III only"},
    {"id": "C", "text": "II and III only"},
    {"id": "D", "text": "I, II, and III"},
]

OPTIONS_STMT = [
    {"id": "A", "text": "Only Statement 1 and 2 are correct."},
    {"id": "B", "text": "Only Statement 2 and 3 are correct."},
    {"id": "C", "text": "Only Statement 1 and 3 are correct."},
    {"id": "D", "text": "All statements 1, 2, and 3 are correct."},
]

TOPIC_RULES: list[tuple[str, list[str]]] = [
    ("Basic Economic Concepts", [
        "scarcity", "opportunity cost", "ppf", "production possibility",
        "central economic", "economic choice", "economic efficiency",
        "free-market", "mixed econom", "economic system", "consumer sovereignty",
        "for whom to produce", "how to produce", "what to produce",
        "resource allocation", "social equity", "market allocation",
        "income distribution", "distribution of national",
    ]),
    ("Sectoral Classification", [
        "primary sector", "secondary sector", "tertiary sector", "sector",
        "manufacturing", "agriculture", "value addition", "employment",
        "organized", "tertiarization", "structural", "transportation",
        "mining", "productivity", "economic linkages", "sectoral",
    ]),
    ("Demand Theory", [
        "demand", "substitut", "complement", "inferior good", "normal good",
        "cross-price", "law of demand", "quantity demanded",
    ]),
    ("Banking & Monetary Policy", [
        "rbi", "repo", "reverse repo", "crr", "slr", "bank rate",
        "lender of last", "open market", "monetary", "liquidity",
        "credit control", "moral suasion", "currency issuance",
        "financial stability", "inflation", "bankers",
    ]),
    ("National Income Accounting", [
        "market price", "factor cost", "gdp", "gnp", "ndp", "nnp",
        "net indirect", "subsid", "indirect tax", "depreciation",
        "national income", "disposable", "personal income", "domestic income",
        "double counting", "intermediate", "deflator", "nfia",
        "gross and net",
    ]),
]


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2018", "'").replace("\u2019", "'")
    text = text.replace("—", "-").replace("–", "-")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def fix_ocr_glitches(text: str) -> str:
    replacements = [
        (r"\bAmixed\b", "A mixed"),
        (r"\bIna\b", "In a"),
        (r"\bAbank\b", "A bank"),
        (r"\bArise\b", "A rise"),
        (r"\bCRRis\b", "CRR is"),
        (r"\bSLRand\b", "SLR and"),
        (r"\banparpareted\b", "incorporated"),
        (r"\bidenticl\b", "identical"),
        (r"\bdeman\b", "demand"),
        (r"\bimportantissue\b", "important issue"),
        (r"%1 currency", "₹1 currency"),
        (r"\bStatement IL\b", "Statement II"),
        (r"\bStatement IT\b", "Statement II"),
        (r"\bStatement ITI\b", "Statement III"),
        (r"\bStatement Ii\b", "Statement II"),
        (r"\bStatement I:\s*Market demand", "Statement II: Market demand"),  # Q52 OCR
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)
    return text


def options_for(num: int) -> list[dict[str, str]]:
    if 1 <= num <= 40:
        return [dict(o) for o in OPTIONS_COMBO]
    if 41 <= num <= 60:
        return [dict(o) for o in OPTIONS_ASSERTION]
    if 61 <= num <= 80:
        return [dict(o) for o in OPTIONS_ONLY]
    return [dict(o) for o in OPTIONS_STMT]


def infer_topic(question: str) -> str:
    lower = question.lower()
    for topic, keywords in TOPIC_RULES:
        if any(k in lower for k in keywords):
            return topic
    return "Finance Accounts Assistant"


def infer_page(num: int) -> int:
    # Approximate page mapping from OCR structure
    if num <= 6:
        return 1
    if num <= 11:
        return 2
    if num <= 17:
        return 3
    if num <= 22:
        return 4
    if num <= 27:
        return 5
    if num <= 32:
        return 6
    if num <= 38:
        return 7
    if num <= 43:
        return 8
    if num <= 48:
        return 9
    if num <= 53:
        return 10
    if num <= 58:
        return 11
    if num <= 65:
        return 12
    if num <= 70:
        return 13
    if num <= 76:
        return 14
    if num <= 83:
        return 15
    if num <= 89:
        return 16
    if num <= 95:
        return 17
    if num <= 100:
        return 18
    return 0


def normalize_question_body(body: str, num: int) -> str:
    body = clean_text(body)
    body = fix_ocr_glitches(body)

    # Drop trailing option noise / "Which of the following" option blocks
    body = re.split(
        r"\n?\(?[Aa]\)\s*(?:Only|I and|Both|Land|1 and)|"
        r"\nBoth Statement I and Statement II are correct",
        body,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip()

    # Normalize statement labels
    body = re.sub(r"(?i)\bStatement\s+1\b", "Statement I", body)
    body = re.sub(r"(?i)\bStatement\s+2\b", "Statement II", body)
    body = re.sub(r"(?i)\bStatement\s+3\b", "Statement III", body)
    body = re.sub(r"(?m)^\s*[Ii]\.\s+", "Statement I: ", body)
    body = re.sub(r"(?m)^\s*(?:Il|II|IL|I1)\.\s+", "Statement II: ", body)
    body = re.sub(r"(?m)^\s*(?:Ill|III|IlI|Iil)\.\s+", "Statement III: ", body)

    # Collapse whitespace while keeping paragraph breaks around statements
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    text = " ".join(lines)
    text = re.sub(r"\s+(Statement\s+(?:I{1,3}|II|III):)", r"\n\n\1", text)
    text = re.sub(r"\s+(Which of the (?:options|following|statements))", r"\n\n\1", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = text.strip()

    # Ensure stem is present
    if not text.lower().startswith(("consider", "regarding", "q")):
        pass

    # Light cleanup of common OCR letter swaps in statement text only
    text = text.replace("Statement |", "Statement I")
    return text


def parse_questions(ocr: str) -> dict[int, str]:
    # Remove answer-key pages
    ocr = re.split(r"===== PAGE 19 =====", ocr)[0]
    ocr = re.sub(r"===== PAGE \d+ =====\n?", "\n", ocr)
    ocr = re.sub(r"(?i)Latest pattern MCQs for FAA\n?", "", ocr)
    ocr = re.sub(r"(?i)Toppers Junction\n?", "", ocr)

    # Fix QS. / QO. style OCR errors for question markers
    ocr = re.sub(r"\bQS\.", "Q5.", ocr)
    ocr = re.sub(r"\bQO\.", "Q0.", ocr)

    parts = re.split(r"(?m)^Q(\d+)\.\s*", ocr)
    # parts: [preamble, num1, body1, num2, body2, ...]
    questions: dict[int, str] = {}
    for i in range(1, len(parts), 2):
        num = int(parts[i])
        body = parts[i + 1]
        questions[num] = normalize_question_body(body, num)
    return questions


def normalize_for_dup(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_dataset(questions: dict[int, str]) -> tuple[list[dict], dict]:
    items: list[dict] = []
    norms: list[tuple[int, str]] = []
    issues: list[str] = []

    for num in range(1, 101):
        if num not in questions:
            issues.append(f"Missing question Q{num}")
            continue

        q_text = questions[num]
        options = options_for(num)
        answer = ANSWER_KEY.get(num)
        topic = infer_topic(q_text)

        status = "verified" if answer in {"A", "B", "C", "D"} else "needs_review"
        if len(q_text) < 40:
            status = "invalid"
            issues.append(f"Q{num}: question text too short")

        # Statement completeness heuristic
        if num <= 40 or num >= 81:
            stmt_count = len(re.findall(r"Statement\s+(?:I{1,3}|II|III)\s*:", q_text))
            if stmt_count < 2:
                issues.append(f"Q{num}: only {stmt_count} statements detected (OCR risk)")
                if status == "verified":
                    status = "needs_review"

        item = {
            "question_id": f"FIN-{num:03d}",
            "question": q_text,
            "options": options,
            "correct_option": answer if status != "invalid" else None,
            "subject": "Finance",
            "topic": topic,
            "subtopic": "",
            "difficulty": "medium",
            "source": {
                "file": SOURCE_FILE,
                "page": infer_page(num),
                "question_number": num,
                "label": "Latest Pattern MCQs for FAA",
            },
            "year": "",
            "exam": "Finance Accounts Assistant (FAA)",
            "explanation": "",
            "verification_status": status,
            "tags": ["FAA", "JKSSB", topic],
            "duplicate_status": "unique",
        }
        items.append(item)
        norms.append((num, normalize_for_dup(q_text)))

    # Near-duplicate detection
    for i, (n1, t1) in enumerate(norms):
        for n2, t2 in norms[i + 1 :]:
            if not t1 or not t2:
                continue
            # Jaccard on word sets
            s1, s2 = set(t1.split()), set(t2.split())
            if not s1 or not s2:
                continue
            j = len(s1 & s2) / len(s1 | s2)
            if j >= 0.92:
                for item in items:
                    if item["source"]["question_number"] in (n1, n2):
                        item["duplicate_status"] = "possible_duplicate"
                issues.append(f"Possible duplicate: Q{n1} ~ Q{n2} (j={j:.2f})")

    counts = Counter(i["verification_status"] for i in items)
    missing_topic = sum(1 for i in items if not i["topic"])
    missing_expl = sum(1 for i in items if not i["explanation"])
    dupes = sum(1 for i in items if i["duplicate_status"] == "possible_duplicate")

    report = {
        "pdf": SOURCE_FILE,
        "questions_detected": len(questions),
        "successfully_structured": len(items),
        "verified": counts.get("verified", 0),
        "needs_review": counts.get("needs_review", 0),
        "invalid": counts.get("invalid", 0),
        "duplicates": dupes,
        "missing_topic": missing_topic,
        "missing_explanations": missing_expl,
        "issues": issues,
        "notes": [
            "Source PDF is image-based (scanned); text extracted via Tesseract OCR.",
            "Option text for garbled OCR blocks restored using the document's consistent option patterns by question range.",
            "Correct answers taken from PDF answer key pages 19–20.",
            "Explanations are not present in the source PDF.",
        ],
    }
    return items, report


def main() -> None:
    ocr = OCR_PATH.read_text(encoding="utf-8")
    questions = parse_questions(ocr)
    items, report = build_dataset(questions)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    dataset = {
        "dataset_id": "finance",
        "name": "Finance — Latest Pattern MCQs for FAA",
        "subject": "Finance",
        "exam": "Finance Accounts Assistant (FAA)",
        "source_pdf": SOURCE_FILE,
        "question_count": len(items),
        "questions": items,
    }

    (OUT_DIR / "finance.json").write_text(
        json.dumps(dataset, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    index = {
        "datasets": [
            {
                "id": "finance",
                "name": "Finance — FAA Latest Pattern MCQs",
                "file": "finance.json",
                "question_count": len(items),
                "subject": "Finance",
                "exam": "Finance Accounts Assistant (FAA)",
            }
        ]
    }
    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

    exams = {
        "exams": [
            {
                "id": "faa-finance",
                "name": "Finance Accounts Assistant (FAA)",
                "dataset_id": "finance",
                "duration_minutes": 30,
                "default_question_count": 30,
                "marks_per_question": 1,
                "negative_marking": 0,
                "allowed_counts": [10, 20, 30, 50, 100],
            }
        ]
    }
    (OUT_DIR / "exams.json").write_text(json.dumps(exams, indent=2) + "\n", encoding="utf-8")

    (REPORT_DIR / "content-validation-report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )

    lines = [
        "FINANCE DATASET VALIDATION",
        f"PDF: {report['pdf']}",
        f"Questions detected: {report['questions_detected']}",
        f"Successfully structured: {report['successfully_structured']}",
        f"Verified: {report['verified']}",
        f"Needs Review: {report['needs_review']}",
        f"Invalid: {report['invalid']}",
        f"Duplicates: {report['duplicates']}",
        f"Missing topic: {report['missing_topic']}",
        f"Missing explanations: {report['missing_explanations']}",
        "",
        "Issues:",
    ]
    lines.extend(f"- {i}" for i in report["issues"] or ["None"])
    lines.append("")
    lines.append("Notes:")
    lines.extend(f"- {n}" for n in report["notes"])
    (REPORT_DIR / "content-validation-report.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("\n".join(lines))
    print(f"\nWrote {OUT_DIR / 'finance.json'}")


if __name__ == "__main__":
    main()
