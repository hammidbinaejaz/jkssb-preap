# JKSSB PREP

A static exam preparation tool for JKSSB (Jammu & Kashmir Services Selection Board) candidates. Practice questions, take timed mock tests, search the question bank, and track progress — all in the browser with no backend required.

## Features

- **Practice mode** — Filter by subject, topic, difficulty; immediate feedback with explanations
- **Instant practice** — Open any question directly via search or `?q=QUESTION_ID`
- **Mock tests** — Timed tests with auto-submit, question navigator, and resume-on-refresh
- **Search** — Ranked, typo-tolerant search across questions, options, topics, and tags
- **Results & recommendations** — Score breakdown, topic performance, mistake review, rule-based study suggestions
- **Progress tracking** — Topic stats, test history, bookmarks (LocalStorage)
- **PYQs listing** — Browse available past-pattern datasets
- **Admin dashboard** — Dataset health and validation metrics

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- JSON data files (`data/`)
- LocalStorage for user state
- No build step, no framework, no backend
- GitHub Pages compatible (relative paths)

## Quick Start

Serve the project with any static file server (required for `fetch` to load JSON):

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080` in your browser.

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source to your default branch (`main`) and folder `/ (root)`.
4. Save. The site will be available at `https://<username>.github.io/<repo>/`.

All asset paths use relative URLs (`./data/...`, `../css/...`) so nested routes work correctly.

## Project Structure

```
index.html              Home page
pages/                  Practice, Search, Mock, Results, Progress, Bookmarks, PYQs
admin.html              Dataset health (not in main nav)
css/                    Styles (main, components, responsive)
js/                     App modules (data, storage, ui, page controllers)
data/                   Question datasets and config
  index.json            Dataset registry
  exams.json            Exam scoring config
  finance.json          Finance FAA question bank (100 MCQs)
assets/logo/            Brand assets
tests/                  Node-runnable unit tests
tools/                  Content extraction pipeline (Python)
```

## Data Format

Each dataset JSON file follows this structure:

```json
{
  "dataset_id": "finance",
  "name": "Finance — Latest Pattern MCQs for FAA",
  "subject": "Finance",
  "questions": [
    {
      "question_id": "FIN-001",
      "question": "...",
      "options": [{ "id": "A", "text": "..." }],
      "correct_option": "B",
      "subject": "Finance",
      "topic": "Basic Economic Concepts",
      "difficulty": "medium",
      "verification_status": "verified",
      "explanation": "",
      "tags": ["FAA", "JKSSB"]
    }
  ]
}
```

Register new datasets in `data/index.json` and add exam config in `data/exams.json`.

## Adding a New PDF / Dataset

1. Place the source PDF in the project (or reference its path).
2. Run OCR if the PDF is scanned (Tesseract recommended).
3. Use or extend `tools/extract_finance_mcqs.py` as a template:
   - Parse question text and options
   - Merge answer keys
   - Classify topics
   - Validate and assign `verification_status`
4. Output JSON to `data/<dataset_id>.json`.
5. Add an entry to `data/index.json`.
6. Optionally add exam rules to `data/exams.json`.
7. Check `admin.html` for validation metrics.

## LocalStorage Keys

| Key | Purpose |
|-----|---------|
| `jkssb_user_progress` | Practice attempts, topic stats, continue link |
| `jkssb_bookmarks` | Saved question IDs |
| `jkssb_test_history` | Completed mock test results |
| `jkssb_active_test` | In-progress mock test (resume support) |
| `jkssb_settings` | User preferences |

## Tests

```bash
node tests/storage.test.js
node tests/utils.test.js
```

## License

Content derived from publicly available JKSSB preparation materials. Code is provided for educational use.
