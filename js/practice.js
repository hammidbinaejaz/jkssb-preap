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
  const subjects = getSubjects();
  const topics = getTopics();
  const difficulties = getDifficulties();
  const params = new URLSearchParams(window.location.search);
  const presetTopic = params.get('topic') || '';
  const active = getActiveQuestions();
  const selected = getSelectedPostMeta();

  main.innerHTML = `
    <section class="page-header">
      <h1>Practice Mode</h1>
      <p class="page-header__sub">Learning-focused practice with immediate feedback.</p>
    </section>
    <div id="post-context-slot"></div>
    ${!active.length ? `
      <div class="card" style="margin-bottom:1.25rem;">
        <p class="empty-inline" style="margin:0;">
          ${selected
            ? 'No questions loaded for this post yet. Choose another post or wait for the question bank.'
            : 'No questions available. Browse a post to select your exam focus.'}
        </p>
        <div class="cta-row">
          <a href="${pagesHref('browse.html')}" class="btn btn--secondary btn--sm">Browse posts</a>
        </div>
      </div>` : ''}
    <form id="practice-form" class="filter-form card">
      <div class="form-row">
        <label for="filter-subject">Subject</label>
        <select id="filter-subject" name="subject">
          <option value="">All subjects</option>
          ${subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label for="filter-topic">Topic</label>
        <select id="filter-topic" name="topic">
          <option value="">All topics</option>
          ${topics.map((t) => `<option value="${escapeHtml(t)}"${t === presetTopic ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label for="filter-difficulty">Difficulty</label>
        <select id="filter-difficulty" name="difficulty">
          <option value="">All levels</option>
          ${difficulties.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label for="filter-count">Question count</label>
        <select id="filter-count" name="count">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
        </select>
      </div>
      <button type="submit" class="btn btn--primary btn--block"${active.length ? '' : ' disabled'}>Start Practice</button>
    </form>`;

  renderPostContext(document.getElementById('post-context-slot'), {
    allowClear: true,
    onClear: () => renderPracticeSetup(main),
  });

  const subjectSelect = document.getElementById('filter-subject');
  subjectSelect.addEventListener('change', () => {
    const topicSelect = document.getElementById('filter-topic');
    const subj = subjectSelect.value;
    const tps = getTopics(subj || undefined);
    topicSelect.innerHTML = `<option value="">All topics</option>${tps.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}`;
  });

  document.getElementById('practice-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const filters = {
      subject: fd.get('subject') || undefined,
      topic: fd.get('topic') || undefined,
      difficulty: fd.get('difficulty') || undefined,
      count: parseInt(fd.get('count'), 10) || 10,
      postId: getSelectedPostId() || undefined,
    };
    const questions = getPracticeQuestions(filters);
    if (!questions.length) {
      UI.Toast.show('No questions match your filters.', 'warning');
      return;
    }
    startPracticeSession(main, questions);
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
        setContinuePreparation(pagesHref('practice.html'), 'Continue practice');
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
    pagesHref('practice.html', { q: question.question_id }),
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
        actionLabel: 'Browse posts',
        actionUrl: pagesHref('browse.html'),
      }));
      return;
    }
    if (question.post_id) setSelectedPost(question.post_id);
    renderInstantPractice(main, question);
    return;
  }

  if (!requireSelectedPost(main, {
    title: 'Practice',
    message: 'Choose your target post first so practice stays on-syllabus.',
  })) return;

  renderPracticeSetup(main);
}

document.addEventListener('DOMContentLoaded', initPracticePage);
