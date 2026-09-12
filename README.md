# JKSSB PREP

Static preparation engine for JKSSB aspirants: **Find → Practice → Understand → Test → Diagnose → Improve**.

## What’s inside

- **28 posts** across Finance, Clerical, and Revenue / Rural Development
- **100 MCQs per post** (2,800 total) in flat schema: question, options A–D, correct, subject, topic, year, source
- Browse → Post hub → Practice / Mock / Search
- Instant feedback, timed mocks, progress, bookmarks, smart recommendations
- Zero backend — HTML, CSS, Vanilla JS, JSON, LocalStorage
- GitHub Pages ready

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
JKSSB/                  Source post folders + qbank.json (flat schema)
data/catalog.json       Category → post registry
data/qbanks/            App-facing banks (same questions)
pages/browse.html       Stream & post explorer
pages/post.html         Post hub
pages/practice|mock|search|results|progress|bookmarks.html
```

## Add / refresh a bank

1. Place or update `JKSSB/<CATEGORY>/<Post>/qbank.json`
2. Mirror into `data/qbanks/<category>/<post-id>.json` (or re-run the build script)
3. Register the post in `data/catalog.json`
4. Test Browse → Post → Practice

## Deploy (GitHub Pages)

1. Push to `main`
2. Settings → Pages → Deploy from `main` / root
3. Open `https://<user>.github.io/jkssb-preap/`

## Tests

```bash
node tests/storage.test.js
node tests/utils.test.js
```

## Notes

- Incorrect answers damage trust — prefer verified keys from PYQs / official keys
- Explanations are often empty when the source paper had none
- This prototype is for learning UX, not a secure live exam
