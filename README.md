# JKSSB PREP

Static preparation engine for **JKSSB Accounts Assistant (Finance)**.

Find → Practice → Understand → Test → Diagnose → Improve.

## What’s inside

- FAA-only question bank (100 MCQs)
- Exam hub with syllabus, pattern, duration, and marking
- Practice with instant feedback, timed mocks, search, progress, bookmarks
- Zero backend — HTML, CSS, Vanilla JS, JSON, LocalStorage
- GitHub Pages ready

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
JKSSB/FINANCE/Accounts_Assistant_Finance/   Source bank
data/catalog.json                           Single-post registry
data/qbanks/finance/accounts-assistant-finance.json
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
python3 tools/validate_qbanks.py
```

## Deploy (GitHub Pages)

1. Push to `main`
2. Settings → Pages → Deploy from `main` / root
3. Open `https://<user>.github.io/jkssb-preap/`
