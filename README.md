# JKSSB PREP

Static preparation engine for **JKSSB Accounts Assistant (Finance)**.

Find → Practice → Understand → Test → Diagnose → Improve.

## What’s inside

- FAA-only question bank (**4398 MCQs**) across the eight official subjects plus a 100-item latest-pattern pack
- Provenance on every item (`generated`, `human_reviewed`, `official_pyq`) — generated drills are never labelled verified
- Exam hub with syllabus, pattern, duration, and marking (Advt. 10 of 2025: 120 Q / 2 hours / −0.25)
- Practice with source badges, timed mocks that update topic progress, search, bookmarks
- Zero backend — HTML, CSS, Vanilla JS, JSON, LocalStorage
- GitHub Pages ready

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
JKSSB/FINANCE/Accounts_Assistant_Finance/   Source notes
data/catalog.json                           Single-post registry
data/qbanks/finance/faa/                    Subject banks
pages/post.html                             Exam hub
pages/practice|mock|search|results|progress|bookmarks.html
```

## Tests

```bash
node tests/catalog.test.js
node tests/utils.test.js
node tests/storage.test.js
node tests/data.test.js
node tests/product.test.js
node tests/app.test.js
node tests/faa.test.js
node tests/provenance.test.js
python3 tools/validate_qbanks.py
```

## Deploy (GitHub Pages)

1. Push to `main`
2. Settings → Pages → Deploy from `main` / root
3. Open `https://<user>.github.io/jkssb-preap/`
