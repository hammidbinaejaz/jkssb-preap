/**
 * Practice mode and instant single-question view.
 */

let practiceState = {
  mode: 'setup',
  questions: [],
  currentIndex: 0,
  revealed: false,
  selected: null,
};

function renderInstantPractice(main, question) {
  practiceState = { mode: 'instant', questions: [question], currentIndex: 0, revealed: false, selected: null };
  main.innerHTML = `
    <section class="page-header">
      <h1>Instant Practice</h1>
      <div class="question-meta">
        <span class="badge">${escapeHtml(question.subject)}</span>
        <span class="badge badge--muted">${escapeHtml(question.topic)}</span>
      </div>
    </section>
    <div id="practice-area" class="practice-area"></div>
    <section id="related-section" class="related-section"></section>`;
  renderCurrentQuestion(document.getElementById('practice-area'));
  renderRelated(document.getElementById('related-section'), question);
}

function renderPracticeSetup(main) {
  const exam = getExamConfigForPost();
  const params = new URLSearchParams(window.location.search);
  const presetSubject = params.get('subject') || '';
  const presetTopic = params.get('topic') || '';
  const active = getActiveQuestions();
  const sections = exam.sections || [];

  main.innerHTML = `
    <section class="page-header">
      <h1>Practice</h1>
      <p class="page-header__sub">Pick a subject. A fresh random set is drawn every time — easy, medium, and hard mixed unless you lock a level.</p>
    </section>
    <div id="post-context-slot"></div>
    ${!active.length ? `
      <div class="card" style="margin-bottom:1.25rem;">
        <p class="empty-inline" style="margin:0;">Question bank is still loading. Refresh if this stays empty.</p>
      </div>` : ''}
    <h2 class="section-title">Official subjects (Advt. 10 of 2025)</h2>
    <div class="subject-grid" id="subject-grid"></div>
    <form id="practice-form" class="filter-form card" style="margin-top:1.25rem;">
      <input type="hidden" name="subject" id="filter-subject" value="${escapeHtml(presetSubject)}" />
      <p class="empty-inline" id="subject-chosen">${presetSubject ? `Selected: <strong>${escapeHtml(presetSubject)}</strong>` : 'Select a subject above, or practise a full mix.'}</p>
      <div class="form-row">
        <label for="filter-difficulty">Difficulty</label>
        <select id="filter-difficulty" name="difficulty">
          <option value="">Mixed (easy / medium / hard)</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div class="form-row">
        <label for="filter-count">Question count</label>
        <select id="filter-count" name="count">
          <option value="10">10</option>
          <option value="20" selected>20</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      <p class="empty-inline">Unlimited numericals generate a fresh computed set each time (Math, Statistics, Accountancy — or a mix if you pick Full mix).</p>
      <div class="cta-row">
        <button type="submit" class="btn btn--primary"${active.length ? '' : ' disabled'}>Start random practice</button>
        <button type="button" class="btn btn--secondary" id="btn-numerical">Unlimited numericals</button>
      </div>
    </form>`;

  renderPostContext(document.getElementById('post-context-slot'));

  const grid = document.getElementById('subject-grid');
  const hidden = document.getElementById('filter-subject');
  const chosen = document.getElementById('subject-chosen');

  function addCard(name, meta, value) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `post-hub__action${hidden.value === value ? ' post-hub__action--active' : ''}`;
    btn.innerHTML = `<span class="post-hub__action-title">${escapeHtml(name)}</span>
      <p class="post-hub__action-desc">${escapeHtml(meta)}</p>`;
    btn.addEventListener('click', () => {
      hidden.value = value;
      chosen.innerHTML = value ? `Selected: <strong>${escapeHtml(name)}</strong>` : 'Full mix across the official paper.';
      grid.querySelectorAll('.post-hub__action').forEach((el) => el.classList.remove('post-hub__action--active'));
      btn.classList.add('post-hub__action--active');
    });
    grid.appendChild(btn);
  }

  addCard('Full mix', 'All eight official units', '');
  sections.forEach((s) => {
    addCard(s.name, `${s.marks} marks in the real paper`, s.name);
  });
  addCard('Latest pattern paper', 'The original 100 FAA-pattern MCQs', 'Latest pattern paper');

  if (presetTopic) {
    hidden.value = '';
  }

  document.getElementById('practice-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const filters = {
      subject: fd.get('subject') || undefined,
      topic: presetTopic || undefined,
      difficulty: fd.get('difficulty') || undefined,
      count: parseInt(fd.get('count'), 10) || 20,
      postId: getSelectedPostId() || undefined,
    };
    const questions = getPracticeQuestions(filters);
    if (!questions.length) {
      UI.Toast.show('No questions match your filters.', 'warning');
      return;
    }
    startPracticeSession(main, questions);
  });

  document.getElementById('btn-numerical').addEventListener('click', () => {
    if (typeof NumericalDrill === 'undefined') {
      UI.Toast.show('Numerical drill is unavailable.', 'warning');
      return;
    }
    const subject = hidden.value;
    const count = parseInt(document.getElementById('filter-count').value, 10) || 20;
    if (!subject) {
      startPracticeSession(main, NumericalDrill.generateMix(count));
      return;
    }
    if (!NumericalDrill.subjects.has(subject)) {
      UI.Toast.show('Pick Mathematics, Statistics, Accountancy, or Full mix for unlimited numericals.', 'info');
      return;
    }
    startPracticeSession(main, NumericalDrill.generate(subject, count));
  });
}

function startPracticeSession(main, questions) {
  practiceState = { mode: 'session', questions, currentIndex: 0, revealed: false, selected: null };
  main.innerHTML = `
    <section class="practice-header">
      <div id="practice-progress"></div>
      <button type="button" id="exit-practice" class="btn btn--ghost btn--sm">Exit</button>
    </section>
    <div id="practice-area" class="practice-area"></div>`;
  document.getElementById('exit-practice').addEventListener('click', () => renderPracticeSetup(main));
  renderCurrentQuestion(document.getElementById('practice-area'));
}

function renderCurrentQuestion(container) {
  const q = practiceState.questions[practiceState.currentIndex];
  if (!q) return;

  const progressEl = document.getElementById('practice-progress');
  if (progressEl && practiceState.mode === 'session') {
    progressEl.innerHTML = '';
    progressEl.appendChild(UI.ProgressBar({
      value: practiceState.currentIndex + 1,
      max: practiceState.questions.length,
      label: `Question ${practiceState.currentIndex + 1} of ${practiceState.questions.length}`,
    }));
  }

  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'question-panel card';
  const bookmarked = isBookmarked(q.question_id);

  card.innerHTML = `
    <div class="question-panel__header">
      <span class="question-panel__id">${escapeHtml(q.question_id)}</span>
      ${q.pool_type === 'shared_syllabus_pool' ? '<span class="badge badge--muted">Shared syllabus pool</span>' : '<span class="badge">Post bank</span>'}
      <button type="button" class="btn btn--icon bookmark-btn" aria-label="${bookmarked ? 'Remove bookmark' : 'Bookmark question'}" aria-pressed="${bookmarked}">
        ${bookmarked ? '★' : '☆'}
      </button>
    </div>
    <div class="question-panel__text" lang="${detectTextLang(q.question)}">${formatQuestionText(q.question)}</div>
    <div class="options-grid" role="group" aria-label="Answer options"></div>
    <div id="feedback-area" class="feedback-area" aria-live="polite"></div>
    <div class="question-panel__actions"></div>`;

  const optionsGrid = card.querySelector('.options-grid');
  q.options.forEach((opt) => {
    const btn = UI.OptionButton(opt, {
      selected: practiceState.selected,
      correct: q.correct_option,
      revealed: practiceState.revealed,
      disabled: practiceState.revealed,
    });
    btn.addEventListener('click', () => selectOption(q, opt.id, container));
    optionsGrid.appendChild(btn);
  });

  card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
    const nowBookmarked = toggleBookmark(q.question_id);
    e.currentTarget.textContent = nowBookmarked ? '★' : '☆';
    e.currentTarget.setAttribute('aria-pressed', String(nowBookmarked));
    e.currentTarget.setAttribute('aria-label', nowBookmarked ? 'Remove bookmark' : 'Bookmark question');
    UI.Toast.show(nowBookmarked ? 'Bookmarked' : 'Bookmark removed', 'info', 2000);
  });

  if (practiceState.revealed) renderFeedback(card.querySelector('#feedback-area'), q);

  const actions = card.querySelector('.question-panel__actions');
  if (practiceState.revealed && practiceState.mode === 'session') {
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn--primary';
    nextBtn.textContent = practiceState.currentIndex < practiceState.questions.length - 1 ? 'Next Question' : 'Finish';
    nextBtn.addEventListener('click', () => {
      if (practiceState.currentIndex < practiceState.questions.length - 1) {
        practiceState.currentIndex += 1;
        practiceState.revealed = false;
        practiceState.selected = null;
        renderCurrentQuestion(container);
      } else {
        setContinuePreparation(rootPagesPath('practice.html'), 'Continue practice');
        UI.Toast.show('Practice session complete!', 'success');
        renderPracticeSetup(document.getElementById('main-content'));
      }
    });
    actions.appendChild(nextBtn);
  }

  container.appendChild(card);
}

function formatQuestionText(text) {
  return escapeHtml(text).replace(/\n\n/g, '</p><p class="question-panel__para">').replace(/\n/g, '<br>');
}

function selectOption(question, optionId, container) {
  if (practiceState.revealed) return;
  if (!optionId) return;
  practiceState.selected = optionId;
  practiceState.revealed = true;
  const correct = optionId === question.correct_option;
  recordAttempt({
    questionId: question.question_id,
    selected: optionId,
    correct,
    topic: question.topic,
    subject: question.subject,
    mode: practiceState.mode === 'instant' ? 'instant' : 'practice',
  });
  setContinuePreparation(
    rootPagesPath('practice.html', { q: question.question_id }),
    `Review ${question.question_id}`,
  );
  renderCurrentQuestion(container);
}

function renderFeedback(feedbackEl, question) {
  const correct = practiceState.selected === question.correct_option;
  feedbackEl.innerHTML = `
    <div class="feedback ${correct ? 'feedback--correct' : 'feedback--incorrect'}" role="status">
      <strong>${correct ? 'Correct' : 'Incorrect'}</strong>
      <p>Your answer: <span class="feedback__answer">${escapeHtml(practiceState.selected)}</span></p>
      ${!correct ? `<p>Correct answer: <span class="feedback__answer">${escapeHtml(question.correct_option)}</span></p>` : ''}
      ${question.explanation ? `<p class="feedback__explanation" lang="${detectTextLang(question.explanation)}">${escapeHtml(question.explanation)}</p>` : '<p class="feedback__explanation feedback__explanation--muted">No explanation available for this question.</p>'}
    </div>`;
}

function renderRelated(container, question) {
  const related = getRelatedQuestions(question);
  container.innerHTML = '<h2 class="section-title">Related Questions</h2>';
  if (!related.length) {
    container.appendChild(UI.EmptyState({
      title: 'No related questions',
      message: 'Try searching by topic to find more questions.',
      actionLabel: 'Search',
      actionUrl: `${getBasePath()}pages/search.html?q=${encodeURIComponent(question.topic || '')}`,
    }));
    return;
  }
  const list = document.createElement('div');
  list.className = 'card-list';
  related.forEach((q) => list.appendChild(UI.QuestionCard(q, { compact: true })));
  container.appendChild(list);
}

async function initPracticePage() {
  const main = initPage({ pageTitle: 'Practice', currentNav: 'Practice' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const qid = getQueryParam('q');
  if (qid) {
    const question = await ensureQuestionLoaded(qid);
    if (!question) {
      main.appendChild(UI.EmptyState({
        title: 'Question not found',
        message: `No question with ID "${qid}" exists.`,
        actionLabel: 'Exam hub',
        actionUrl: pagesHref('post.html', { id: DEFAULT_POST_ID }),
      }));
      return;
    }
    if (question.post_id && getPost(question.post_id)) setSelectedPost(question.post_id);
    renderInstantPractice(main, question);
    return;
  }

  const topicParam = getQueryParam('topic');
  const subjectParam = getQueryParam('subject');
  if (!requireSelectedPost(main, {
    title: 'Practice',
    message: 'Reload to open the Accounts Assistant (Finance) question bank.',
  })) {
    if (topicParam || subjectParam) {
      setContinuePreparation(
        rootPagesPath('practice.html', {
          ...(topicParam ? { topic: topicParam } : {}),
          ...(subjectParam ? { subject: subjectParam } : {}),
        }),
        topicParam ? `Practice ${topicParam}` : 'Continue practice',
      );
    }
    return;
  }

  renderPracticeSetup(main);
}

document.addEventListener('DOMContentLoaded', initPracticePage);
