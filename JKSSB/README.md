# JKSSB question banks

Folder layout mirrors the exam streams:

```
JKSSB/
├── FINANCE/          (6 posts)
├── CLERICAL/         (19 posts)
└── REVENUE_RURAL_DEVELOPMENT/  (3 posts)
```

Each post folder contains:

- `qbank.json` — 100 MCQs in the flat schema  
  `question | option_a | option_b | option_c | option_d | correct | subject | topic | year | source`
- `README.md` — post summary

The live website reads the mirrored banks from `data/qbanks/` via `data/catalog.json`.

## Sources

Banks are built from:

- Existing FAA latest-pattern economics MCQs (OCR from project PDF)
- Published JKSSB FAA 2024 solved-paper items (where parseable)
- JKSSB Patwari 2024 PYQ items (public compilations)
- Syllabus-aligned JKSSB-pattern MCQs (J&K GK, Computer, Reasoning, English, Arithmetic, Accounts, Revenue, Rural Development) with verified answers

Posts with overlapping syllabi share pool questions; `source` is preserved per item.
