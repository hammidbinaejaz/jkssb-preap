JKSSB PREP — MASTER AI CODING AGENT PROMPT

ROLE

You are a senior full-stack engineer, UI/UX designer, information architect, data engineer, and QA engineer.

You are building a serious prototype called:

JKSSB PREP

The goal is NOT to create another generic MCQ/mock-test website.

The goal is to build a high-quality preparation engine for JKSSB aspirants that helps a student:

Find → Practice → Understand → Test → Diagnose → Improve

The prototype must feel like a real product, not a college-project website.

⸻

1. IMPORTANT PROJECT CONSTRAINT

This is the prototype / zero-cost version.

Use ONLY:

* HTML5
* CSS3
* Vanilla JavaScript
* JSON
* Browser LocalStorage where persistence is required

Do NOT use:

* React
* Next.js
* Vue
* Angular
* Node.js backend
* Python backend
* PostgreSQL
* Firebase
* Supabase
* paid APIs
* server-side code

The final project must work as a completely static website.

It must be deployable directly using:

GitHub Pages

Example:

https://USERNAME.github.io/jkssb-prep/

The project must therefore work without a backend.

⸻

2. INPUT CONTENT — PDF TO JSON

The project will contain folders containing PDF files.

The PDFs contain MCQs.

Example structure:

content/
│
├── Finance/
│   └── Finance_100_MCQ.pdf
│
├── Forest_Wildlife_Guard/
│   └── Forest_Wildlife_Guard_2026.pdf
│
└── ...

Your job is to process these PDFs and convert their MCQs into structured JSON files that the website can consume.

DO NOT simply display the PDFs inside the website.

The website must use structured question data.

⸻

3. PDF EXTRACTION RULES

For every PDF:

1. Read the entire PDF.
2. Identify every MCQ.
3. Extract:
    * question
    * option A
    * option B
    * option C
    * option D
    * correct answer, if available
    * explanation, if available
    * subject
    * topic
    * source
    * year, if identifiable
    * exam/post, if identifiable
4. Preserve the original meaning of the question.
5. Do NOT rewrite questions unnecessarily.
6. Do NOT change options.
7. Do NOT invent missing information.
8. Do NOT guess a correct answer merely because an option appears likely.

If the source does not provide a reliable answer:

"verification_status": "needs_review"

If the answer is confidently established:

"verification_status": "verified"

If the question itself is malformed:

"verification_status": "invalid"

Never silently convert uncertainty into a verified answer.

⸻

4. PDF EXTRACTION QA

After extraction, perform automated validation.

Check:

* Is every question numbered correctly?
* Does every question have exactly four options?
* Are options accidentally merged?
* Are mathematical symbols preserved?
* Are percentages preserved?
* Are dates preserved?
* Are abbreviations preserved?
* Is the correct option actually one of A/B/C/D?
* Are duplicate questions present?
* Are questions accidentally split into two questions?
* Are two questions accidentally merged?
* Are pages missing?
* Are there OCR errors?
* Are answer keys incorrectly associated with questions?

Create a report:

Content Validation Report
PDF:
Finance_100_MCQ.pdf
Questions detected: 100
Successfully structured: 97
Needs review: 2
Invalid: 1
Duplicates: 0

Do not hide extraction errors.

⸻

5. JSON DATA MODEL

Use a clean structure.

Example:

{
  "question_id": "FIN-001",
  "question": "Which of the following is ...?",
  "options": [
    {
      "id": "A",
      "text": "Option one"
    },
    {
      "id": "B",
      "text": "Option two"
    },
    {
      "id": "C",
      "text": "Option three"
    },
    {
      "id": "D",
      "text": "Option four"
    }
  ],
  "correct_option": "B",
  "subject": "Finance",
  "topic": "Banking",
  "subtopic": "",
  "difficulty": "medium",
  "source": "Finance 100 MCQ",
  "year": "",
  "exam": "",
  "explanation": "",
  "verification_status": "verified"
}

Use stable IDs.

Never depend only on A/B/C/D positions internally.

⸻

6. JSON FILE ORGANIZATION

Use:

data/
│
├── finance.json
├── forest-wildlife-guard.json
├── junior-assistant.json
└── ...

Also create:

data/index.json

Example:

{
  "datasets": [
    {
      "id": "finance",
      "name": "Finance",
      "file": "finance.json",
      "question_count": 100,
      "subject": "Finance"
    }
  ]
}

The website should load datasets dynamically.

Do NOT hard-code every question into JavaScript.

⸻

7. CONTENT VERIFICATION

This is extremely important.

This is an exam-preparation product.

Incorrect answers damage user trust.

Therefore:

VERIFIED

Only questions whose answer is reliable should be used normally in scoring.

NEEDS REVIEW

Questions with uncertainty should not be used in scored mock tests.

They can optionally appear in a review/admin/debug mode.

INVALID

Do not show them to users.

⸻

8. WEBSITE INFORMATION ARCHITECTURE

Create these major sections:

Home
Practice
Search
Mock Tests
PYQs
Progress

Do not create unnecessary sections.

The navigation should remain simple.

⸻

9. BRAND / VISUAL DIRECTION

Brand:

JKSSB PREP

Visual personality:

Modern + serious + focused + trustworthy + academic

Avoid the visual style of typical Indian exam-preparation websites.

Do NOT use:

* excessive gradients
* excessive bright colors
* huge banners
* cartoon illustrations
* cluttered dashboards
* dozens of cards
* aggressive advertisements
* fake statistics
* unnecessary badges
* excessive animations

The product should feel closer to a modern learning/productivity application than a coaching advertisement website.

⸻

10. COLOR THEME

Use a refined academic theme.

Primary:

Deep navy / midnight blue

Secondary:

Cool blue

Accent:

A restrained green for success states

Background:

Very light neutral / off-white

Text:

Dark charcoal

Error:

Muted red

Do not use saturated rainbow colors.

Colors should communicate:

* trust
* focus
* accuracy
* progress
* calm

Use CSS variables:

:root {
  --primary: ...;
  --primary-dark: ...;
  --accent: ...;
  --success: ...;
  --danger: ...;
  --background: ...;
  --surface: ...;
  --text: ...;
  --muted: ...;
  --border: ...;
}

⸻

11. TYPOGRAPHY

Use a clean modern sans-serif.

Prefer:

Inter

with sensible system fallbacks.

Typography must have strong hierarchy:

* page title
* section heading
* question text
* option text
* metadata
* helper text

Questions must be extremely readable.

⸻

12. HOME PAGE

The homepage should immediately communicate the product’s purpose.

Hero:

Prepare smarter for JKSSB.

Supporting line:

Practice questions. Take realistic tests. Understand your mistakes. Improve where it matters.

Primary actions:

Start Practicing
Take a Mock Test
Search Questions

Below the hero:

Continue Preparation

If LocalStorage contains previous activity:

Continue where you left off
Finance — 18/30 completed

Otherwise:

Start your first practice session

⸻

13. VALUE PROPOSITION

Do not market the product as:

“100,000+ MCQs”

Instead communicate the useful loop:

Practice
↓
See mistakes
↓
Understand weak topics
↓
Practice those topics
↓
Retest
↓
Improve

This is the product’s core purpose.

⸻

14. SEARCH SYSTEM

Search is one of the most important features.

Create a prominent search bar.

Placeholder:

Search questions, topics or keywords...

Examples:

percentage
Jhelum
banking
fundamental rights
profit and loss
computer

Search across:

* question text
* options
* subject
* topic
* subtopic
* tags
* source

Search must be:

* case insensitive
* whitespace tolerant
* reasonably typo tolerant
* fast
* ranked

⸻

15. SEARCH RESULTS

Display results as clean question cards.

Example:

Finance · Banking
Which of the following is ...
A. ...
B. ...
C. ...
D. ...
Topic: Banking
Difficulty: Medium

When the user selects a question:

Open the question in instant practice mode.

⸻

16. INSTANT QUESTION PRACTICE

This is a major feature.

When a user searches a question or opens one from Practice:

Show:

Question
Which of the following...?
○ A. Option
○ B. Option
○ C. Option
○ D. Option

The user clicks an option.

Immediately show:

Correct

or

Incorrect

Then reveal:

Correct answer: B
Why:
...

If the user selected incorrectly:

Show:

Your answer: C
Correct answer: B

Use visual distinction but do not rely only on color.

⸻

17. RELATED QUESTIONS

After answering a question, show:

Practice related questions

Choose related questions using:

1. same topic
2. same subject
3. same difficulty
4. similar keywords

Example:

You just practiced:
Percentage
Try these next:
• Percentage question
• Profit & Loss question
• Ratio question

This turns search into a learning flow.

⸻

18. PRACTICE MODE

Practice page should allow:

Subject
Topic
Difficulty
Question count

Example:

Subject:
[ Finance ]
Topic:
[ Banking ]
Difficulty:
[ Any ]
Questions:
[ 10 ] [ 20 ] [ 30 ]

Button:

Start Practice

Practice mode should focus on learning rather than exam pressure.

⸻

19. MOCK TEST MODE

Mock tests must feel different from normal practice.

The user should choose:

10 Questions
20 Questions
30 Questions
50 Questions
100 Questions

For prototype, ensure at least:

30-question test

works perfectly.

⸻

20. MOCK TEST EXPERIENCE

Before starting:

Display:

Mock Test
30 Questions
Time: 30 minutes
Questions: 30
Attempt all questions
Results available after submission

Button:

Start Test

⸻

21. TIMER

Mock test should have a countdown timer.

Example:

29:42

Timer should remain visible.

When time reaches zero:

Automatically submit the test.

Never lose the user’s current answers during the test.

Store the current test state in LocalStorage.

⸻

22. QUESTION NAVIGATION

Provide:

1  2  3  4  5  6 ...

Question states:

* unanswered
* answered
* current

Allow the student to move backward and forward.

Buttons:

Previous
Next

Final button:

Submit Test

⸻

23. SUBMISSION CONFIRMATION

Before submission:

Submit test?
Answered: 27 / 30
Unanswered: 3
Are you sure?

Buttons:

Continue Test
Submit Test

If timer expires, submit automatically.

⸻

24. RESULTS PAGE

Results should NOT simply show:

Score: 23/30

It should provide useful diagnosis.

Show:

Your Result
23 / 30
76.7%
Correct     23
Incorrect    7
Unanswered   0

Also show:

Time used
Accuracy
Average time/question

⸻

25. PERFORMANCE OVERVIEW

Create an overview section.

Example:

Performance Overview
Strong
████████░░  82%
Banking
Needs Practice
█████░░░░░  54%
Financial Markets
Accuracy
76.7%
Average response time
42 sec

⸻

26. MISTAKE REVIEW

This is one of the most important parts.

After a test:

Review Mistakes

For every incorrect question show:

Question
Your answer:
C
Correct answer:
B
Explanation:
...
Topic:
Banking

Allow:

Practice this topic

⸻

27. IMPROVEMENT ENGINE

The prototype should calculate simple recommendations from test history.

Example:

If the user repeatedly performs badly in:

Banking

show:

Focus Area

Banking

Your accuracy: 54%
You've missed 8 questions in this topic.
Recommended:
Practice 10 Banking questions

Button:

Practice Banking

Do not claim this is AI if it is only rule-based.

For the prototype, call it:

Smart Recommendations

⸻

28. PROGRESS PAGE

Use LocalStorage to track:

* tests completed
* questions attempted
* correct answers
* incorrect answers
* accuracy
* topics attempted
* topic accuracy
* recent tests
* weak topics
* bookmarked questions

Example:

Your Progress
Questions practiced
184
Tests completed
6
Overall accuracy
74%
Strongest topic
Computer Basics
Needs attention
Banking

⸻

29. BOOKMARKS

Allow users to bookmark questions.

Button:

☆ Save

After saving:

★ Saved

Create:

Saved Questions

using LocalStorage.

⸻

30. QUESTION STATES

Each question can have:

unseen
attempted
correct
incorrect
bookmarked

Do not permanently modify the source JSON.

User-specific state belongs in LocalStorage.

⸻

31. LOCALSTORAGE ARCHITECTURE

Create a structured storage model.

Example:

jkssb_user_progress
jkssb_bookmarks
jkssb_test_history
jkssb_active_test
jkssb_settings

Store JSON strings.

Create utility functions:

saveProgress()
loadProgress()
saveTest()
loadTest()
clearActiveTest()
saveBookmark()
removeBookmark()

Handle corrupted LocalStorage safely.

⸻

32. MOCK QUESTION SELECTION

Do not simply take the first 30 questions.

Randomly select questions.

But avoid repetition within one test.

Example:

shuffle(questions)
slice(0, 30)

Later this can become adaptive.

⸻

33. VERIFIED QUESTIONS ONLY

For scored tests:

verification_status === "verified"

Only those questions can be included.

Exclude:

needs_review
invalid

This rule is mandatory.

⸻

34. NEGATIVE MARKING

The architecture should support negative marking.

Do not hard-code the scoring system.

Create configuration:

{
  "questions": 30,
  "marks_per_question": 1,
  "negative_marking": 0
}

Later this can be changed per examination.

For prototype, use the appropriate configuration for the selected test rather than assuming every JKSSB examination has the same marking scheme.

⸻

35. EXAM CONFIGURATION

Create:

data/exams.json

Example:

{
  "exams": [
    {
      "id": "forest-wildlife-guard",
      "name": "Forest Wildlife Guard",
      "duration_minutes": 30,
      "default_question_count": 30
    }
  ]
}

This allows future expansion without rewriting the application.

⸻

36. RESPONSIVE DESIGN

The website must work on:

* desktop
* laptop
* tablet
* mobile

Mobile is extremely important.

The question interface should remain comfortable to use with a thumb.

Options should be large clickable areas.

Minimum comfortable touch target:

approximately 44px.

⸻

37. DESKTOP LAYOUT

Use a modern centered application layout.

Suggested:

------------------------------------------------
Logo        Practice  Mock Tests  Progress
------------------------------------------------
Main content
------------------------------------------------

Avoid huge full-width marketing sections.

The application should feel like a tool.

⸻

38. MOBILE NAVIGATION

Use a compact mobile navigation.

Possible:

Home
Practice
Search
Tests
Progress

Keep it simple.

⸻

39. UI COMPONENTS

Build reusable components in JavaScript.

Examples:

QuestionCard
OptionButton
SearchBar
FilterBar
ProgressBar
Timer
TestNavigator
ResultCard
TopicPerformance
RecommendationCard
EmptyState
Modal
Toast

Do not duplicate HTML unnecessarily.

⸻

40. ACCESSIBILITY

Implement:

* keyboard navigation
* visible focus states
* semantic buttons
* proper labels
* sufficient contrast
* aria labels where appropriate
* no color-only meaning

Options should be keyboard accessible.

⸻

41. MICRO-INTERACTIONS

Use subtle animation only where useful.

Examples:

* option selection
* correct/incorrect reveal
* progress updates
* page transitions
* button hover

Avoid excessive animation.

Animations should feel fast and purposeful.

⸻

42. ERROR HANDLING

If JSON fails to load:

Display a useful error:

We couldn't load this question set.
Please refresh the page.

Do not leave a blank screen.

If a question is malformed:

Skip it safely and log the problem.

⸻

43. EMPTY STATES

Do not show blank pages.

Example search:

No questions found.
Try:
"banking"
"percentage"
"J&K history"

Bookmarks:

No saved questions yet.
Save questions while practicing and they'll appear here.

⸻

44. PERFORMANCE

The site should load quickly.

Avoid:

* huge dependencies
* unnecessary libraries
* large images
* excessive fonts
* unnecessary network requests

Questions should be loaded only when needed.

Use asynchronous JSON loading.

⸻

45. FILE STRUCTURE

Create:

jkssb-prep/
│
├── index.html
│
├── pages/
│   ├── practice.html
│   ├── search.html
│   ├── mock.html
│   ├── results.html
│   ├── progress.html
│   └── bookmarks.html
│
├── css/
│   ├── main.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── data.js
│   ├── search.js
│   ├── practice.js
│   ├── mock.js
│   ├── results.js
│   ├── progress.js
│   ├── storage.js
│   ├── utils.js
│   └── ui.js
│
├── data/
│   ├── index.json
│   ├── exams.json
│   ├── finance.json
│   └── ...
│
├── content/
│   └── PDFs
│
├── assets/
│   ├── logo/
│   └── icons/
│
└── README.md

Adjust the structure if a better static architecture is appropriate, but keep responsibilities separated.

⸻

46. PDF → JSON PIPELINE

Create a repeatable workflow.

The intended pipeline is:

PDF
 ↓
Extraction
 ↓
Question detection
 ↓
Option detection
 ↓
Answer extraction
 ↓
Metadata classification
 ↓
Validation
 ↓
Verification
 ↓
JSON
 ↓
Website

The AI agent should explain exactly what happened during conversion.

⸻

47. DO NOT INVENT DATA

This rule is absolute.

If the PDF says:

A. Jammu
B. Srinagar
C. Leh
D. Delhi

do not modify it into:

A. Jammu and Kashmir
B. Srinagar City
...

unless the source itself contains that wording.

Do not “improve” examination questions.

⸻

48. OCR / SCANNED PDFs

If a PDF is scanned:

1. Detect that it is image-based.
2. Use OCR if available.
3. Validate OCR carefully.
4. Flag uncertain characters.

Pay special attention to:

* 0 / O
* 1 / I / l
* 5 / S
* 8 / B
* decimal points
* percentages
* mathematical operators
* negative signs
* dates

Never trust OCR blindly.

⸻

49. MATHEMATICAL QUESTIONS

Preserve mathematical meaning.

For example:

25%

must not become:

25

Fractions, equations and symbols must be preserved.

If LaTeX is needed, use it consistently.

Do not introduce a complicated math framework unless necessary.

⸻

50. SOURCE TRACKING

Every question should retain source information.

Example:

"source": {
  "file": "Finance_100_MCQ.pdf",
  "page": 4,
  "question_number": 17
}

This is extremely useful for verification.

⸻

51. DUPLICATE DETECTION

Detect duplicate or near-duplicate questions.

Normalize:

* lowercase
* whitespace
* punctuation

Then compare.

If two questions appear similar:

duplicate_status: "possible_duplicate"

Do not automatically delete one unless confidence is high.

⸻

52. ADMIN / DEVELOPMENT VALIDATION PAGE

For the prototype, create a hidden or developer-accessible page:

/admin.html

It should show:

Dataset Health
Total questions
Verified
Needs review
Invalid
Duplicate candidates
Missing explanations
Missing topics

Also show malformed questions.

This is for the developer, not normal users.

⸻

53. QUESTION VALIDATION REPORT

Provide a downloadable or console-readable report.

Example:

FINANCE DATASET VALIDATION
Total: 100
Verified: 94
Needs Review: 4
Invalid: 2
Missing topic: 3
Duplicate candidates: 1
Malformed options: 1

⸻

54. DESIGN PRINCIPLE — MEANINGFUL VALUE

The product must answer:

“Why should a student use this instead of searching Google or using another mock-test website?”

Answer:

Because JKSSB PREP should help the student understand:

What should I practice next?

Not merely:

What question should I answer next?

Every major interaction should support this principle.

⸻

55. DIFFERENTIATION

Do not copy common exam websites.

Avoid:

Mock Test
Mock Test
Mock Test
Mock Test
PDF
PDF
PDF
Buy Course

Instead:

Search something
↓
Practice it
↓
Get immediate feedback
↓
See related questions
↓
Take a focused test
↓
See weak topics
↓
Practice weak topics
↓
Retest

This is the product loop.

⸻

56. SEARCH-FIRST EXPERIENCE

The search bar should feel central.

A student should be able to think:

“I don’t understand probability.”

Then search:

probability

and immediately receive:

Relevant questions
Topic
Difficulty
Practice button

This should require very few clicks.

⸻

57. SMART RECOMMENDATION LOGIC

For prototype use deterministic logic.

Example:

If topic accuracy < 60%
→ Needs Practice
If topic accuracy 60–75%
→ Improving
If topic accuracy > 75%
→ Strong

Then recommend questions from the weakest topic.

Do not pretend this is machine learning.

⸻

58. LEARNING LOOP

After a mock test:

Score
 ↓
Topic breakdown
 ↓
Weakest topic
 ↓
Recommended practice
 ↓
Practice
 ↓
Retest

Make this visually obvious.

⸻

59. RESULTS SHOULD FEEL ACTIONABLE

Do not end the test with:

Congratulations!

Instead:

You scored 76.7%.
Your strongest area:
Banking Basics
Your biggest opportunity:
Financial Markets
Recommended next step:
Practice 10 Financial Markets questions

Button:

Practice Weak Area

That is meaningful feedback.

⸻

60. NO FAKE DATA

Do not invent:

* users
* scores
* rankings
* testimonials
* question counts
* success rates
* exam statistics

Only display real information from the dataset and the current user.

⸻

61. NO LOGIN FOR PROTOTYPE

Do not implement authentication.

Use LocalStorage.

The prototype should open immediately.

⸻

62. GITHUB PAGES COMPATIBILITY

Make sure all links work on GitHub Pages.

Be careful with:

* relative paths
* case-sensitive filenames
* assets
* JSON paths

Do not depend on a local development server for production functionality.

Use relative paths such as:

fetch("./data/index.json")

where appropriate.

⸻

63. README

Create a professional README explaining:

JKSSB PREP
Static prototype for JKSSB preparation.
Technology
HTML
CSS
JavaScript
JSON
Features
Search
Practice
Mock Tests
Results
Progress
Bookmarks
Smart Recommendations
Deployment
GitHub Pages
Content Pipeline
PDF → JSON → Validation → Website

Also explain how to add a new dataset.

⸻

64. ADDING A NEW PDF

The final documentation should explain:

1. Add PDF to content/
2. Extract MCQs
3. Validate questions
4. Verify answers
5. Generate JSON
6. Add dataset entry to data/index.json
7. Test website
8. Commit
9. Deploy GitHub Pages

The process should be repeatable.

⸻

65. FINAL QA

Before declaring the project complete, test:

Search

* keyword search
* empty search
* no results
* partial keyword
* case differences

Practice

* selecting A
* selecting B
* selecting C
* selecting D
* correct answer
* incorrect answer
* explanation
* next question

Mock

* 10 questions
* 20 questions
* 30 questions
* timer
* navigation
* unanswered questions
* submission
* automatic submission
* refresh recovery

Results

* score
* percentage
* correct
* incorrect
* unanswered
* topic analysis
* mistake review
* recommendations

LocalStorage

* reload page
* bookmarks persist
* progress persists
* test recovery works

Responsive

* desktop
* tablet
* mobile

⸻

66. SECURITY / DATA INTEGRITY

Because this is a static prototype:

Users can technically inspect JSON files and JavaScript.

That is acceptable.

Do not claim the prototype provides secure exam conditions.

The objective is functionality and UX validation.

⸻

67. FUTURE ARCHITECTURE

Design the prototype so that later it can become:

GitHub Pages
      ↓
Frontend
      ↓
API
      ↓
PostgreSQL
      ↓
User accounts
      ↓
Question database
      ↓
AI recommendation engine

Do not build this backend now.

Just keep the frontend data access modular so replacing JSON with an API later is straightforward.

⸻

68. FUTURE AI FEATURES

Do not implement these unless explicitly requested.

Future possibilities:

* natural language question search
* AI tutor
* explain like I’m a beginner
* similar-question generation
* adaptive testing
* personalized study plans
* automatic topic classification
* mistake pattern detection
* semantic question search

The current prototype must work without AI APIs.

⸻

69. DEVELOPMENT STYLE

Write clean, maintainable code.

Use:

* meaningful variable names
* modular functions
* comments for important logic
* no unnecessary abstraction
* no duplicated logic
* defensive error handling

Do not create one enormous JavaScript file.

⸻

70. AGENT EXECUTION ORDER

Follow this order.

PHASE 1 — INSPECT

Inspect the entire project directory.

Find all:

* PDFs
* JSON
* Excel files
* images
* existing source files

Understand the folder structure before changing anything.

⸻

PHASE 2 — CONTENT EXTRACTION

Process all provided MCQ PDFs.

For every PDF:

Extract
Structure
Validate
Verify
Generate JSON

Do not start by designing the website while ignoring the actual content.

The content is the foundation.

⸻

PHASE 3 — DATA QA

Run validation.

Produce:

content-validation-report

Do not continue silently if serious extraction errors exist.

⸻

PHASE 4 — WEBSITE FOUNDATION

Create:

index.html
css/
js/
data/
assets/

Build the design system first.

⸻

PHASE 5 — CORE UX

Implement:

1. Home
2. Search
3. Question view
4. Instant answer
5. Practice
6. Mock
7. Results
8. Progress
9. Bookmarks

⸻

PHASE 6 — INTEGRATION

Connect the real JSON datasets.

Do NOT use fake placeholder questions once real data exists.

⸻

PHASE 7 — QA

Test every feature.

Fix:

* broken links
* incorrect scoring
* timer issues
* JSON errors
* LocalStorage issues
* mobile layout
* accessibility issues

⸻

PHASE 8 — FINAL POLISH

Improve:

* spacing
* typography
* transitions
* empty states
* error states
* button hierarchy
* question readability
* mobile UX

The final product should look deliberately designed.

⸻

71. IMPORTANT: DO NOT STOP AT A STATIC MOCKUP

Do not merely create attractive HTML screens.

The application must actually work.

I must be able to:

Open website
↓
Search "banking"
↓
Get real questions
↓
Open a question
↓
Select an option
↓
Immediately see correct/incorrect
↓
Read explanation
↓
Practice related questions
↓
Start a 30-question test
↓
Answer questions
↓
Submit
↓
Receive score
↓
See mistakes
↓
See weak topics
↓
Practice recommended topic

This entire flow must function.

⸻

72. FINAL SUCCESS CRITERIA

The prototype is successful only if a real student can use it without instructions.

The student should immediately understand:

Where do I search?
Where do I practice?
How do I start a test?
What did I get wrong?
What should I study next?

If the interface does not make these answers obvious, improve the UX.

⸻

73. FINAL PRODUCT PHILOSOPHY

Build JKSSB PREP as:

A preparation engine, not a question warehouse.

Questions are the raw material.

The real product is the feedback loop:

Question → Answer → Feedback → Pattern → Weakness → Recommendation → Improvement

Every design and engineering decision should support that loop.

⸻

74. FINAL INSTRUCTION TO THE AI AGENT

Do not ask unnecessary questions.

Inspect the files and existing project first.

Make sensible engineering decisions yourself.

When something is ambiguous:

1. Prefer the safest interpretation.
2. Never invent exam content.
3. Never invent correct answers.
4. Never silently discard questionable questions.
5. Preserve source information.
6. Prefer a working simple solution over unnecessary complexity.

Build the prototype completely.

At the end provide:

1. Files created/changed
2. PDFs processed
3. JSON datasets created
4. Number of questions extracted
5. Number verified
6. Number requiring review
7. Website features implemented
8. QA results
9. GitHub Pages deployment instructions
10. Known limitations

The final result must be a functional, polished, zero-cost JKSSB preparation prototype that can be deployed through GitHub Pages.

And push to :- https://github.com/hammidbinaejaz/jkssb-preap

