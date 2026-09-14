/**
 * Mock test flow with timer, persistence, and navigator.
 */

let mockTimer = null;
let mockKeyHandler = null;

function endExamChrome() {
  document.body.classList.remove('exam-mode');
  if (mockKeyHandler) document.removeEventListener('keydown', mockKeyHandler);
  mockKeyHandler = null;
}

async function initMockPage() {
  const main = initPage({ pageTitle: 'Mock Tests', currentNav: 'Mock Tests' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const active = loadTest();
  if (active && !active.submitted) {
    if (active.examId) {
      setSelectedPost(active.examId);
      await loadPostDataset(active.examId);
      rebuildQuestionIndex();
    }
    renderActiveTest(main, active);
    return;
  }

  if (!requireSelectedPost(main, {
    title: 'Mock Tests',
    message: 'Reload to open the Accounts Assistant (Finance) mock pattern.',
  })) return;

  renderMockSetup(main);
}

function renderMockSetup(main) {
  endExamChrome();
  const exam = getExamConfigForPost();
  const selected = getSelectedPostMeta();
  const active = getActiveQuestions().filter(isExamReadyQuestion);

  if (!selected && !DataStore.allQuestions.length) {
    main.innerHTML = `
      <section class="page-header">
        <h1>Mock Tests</h1>
        <p class="page-header__sub">Timed practice under exam conditions.</p>
      </section>`;
    main.appendChild(UI.EmptyState({
      title: 'No questions available',
      message: 'Browse a post and load a question bank before starting a mock test.',
      actionLabel: 'Exam hub',
      actionUrl: pagesHref('post.html', { id: DEFAULT_POST_ID }),
    }));
    return;
  }

  main.innerHTML = `
    <section class="page-header">
      <h1>Mock Tests</h1>
      <p class="page-header__sub">${escapeHtml(exam.name)}</p>
    </section>
    <div id="post-context-slot"></div>
    <div class="card mock-rules">
      <h2 class="section-title" style="margin-top:0;">Exam pattern</h2>
      <p class="empty-inline">${escapeHtml(exam.pattern || 'Follow the latest JKSSB notification for official pattern.')}</p>
      ${exam.syllabus_summary ? `<p class="empty-inline"><strong>Sections:</strong> ${escapeHtml(exam.syllabus_summary)}</p>` : ''}
      <ul class="rules-list">
        <li>Official paper: 120 questions in 120 minutes (Advt. 10 of 2025)</li>
        <li>Marks: +1 correct · −0.25 wrong · 0 for unattempted</li>
        <li>Section mix: GK 30 · Accountancy 30 · English 10 · Statistics 10 · Mathematics 10 · Economics 10 · Science 10 · Computers 10</li>
        <li>Timer uses wall-clock time and auto-submits at zero</li>
        <li>Progress is saved — you can resume after refresh</li>
      </ul>
    </div>
    ${!active.length ? `
      <div class="card" style="margin:1rem 0;">
        <p class="empty-inline" style="margin:0;">No verified questions for this selection yet.</p>
      </div>` : `
    <form id="mock-form" class="filter-form card">
      <div class="form-row">
        <label for="mock-mode">Paper</label>
        <select id="mock-mode" name="mode">
          <option value="official" selected>Official 120 (real section mix)</option>
          <option value="section">One section only</option>
          <option value="short">Short mixed mock</option>
        </select>
      </div>
      ${(exam.sections || []).length ? `
      <div class="form-row" id="mock-section-row" hidden>
        <label for="mock-section">Section</label>
        <select id="mock-section" name="section">
          ${exam.sections.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${s.marks} marks)</option>`).join('')}
        </select>
      </div>` : ''}
      <div class="form-row" id="mock-count-row" hidden>
        <label for="mock-count">Number of questions</label>
        <select id="mock-count" name="count">
          <option value="30">30</option>
          <option value="60">60</option>
        </select>
      </div>
      <button type="submit" class="btn btn--primary btn--block">Start Mock Test</button>
    </form>`}`;

  renderPostContext(document.getElementById('post-context-slot'), {
    allowClear: false,
  });

  const form = document.getElementById('mock-form');
  if (form) {
    const modeEl = document.getElementById('mock-mode');
    const sectionRow = document.getElementById('mock-section-row');
    const countRow = document.getElementById('mock-count-row');
    const syncMode = () => {
      const mode = modeEl.value;
      if (sectionRow) sectionRow.hidden = mode !== 'section';
      if (countRow) countRow.hidden = mode !== 'short';
    };
    modeEl.addEventListener('change', syncMode);
    syncMode();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mode = modeEl.value;
      const sectionId = document.getElementById('mock-section')?.value || '';
      let count = exam.default_question_count || 120;
      let official = false;
      if (mode === 'official') {
        official = true;
        count = exam.default_question_count || 120;
      } else if (mode === 'section') {
        const section = (exam.sections || []).find((s) => s.id === sectionId);
        count = section?.question_count || section?.marks || 30;
      } else {
        count = parseInt(document.getElementById('mock-count').value, 10) || 30;
      }
      startMockTest(main, exam, count, mode === 'section' ? sectionId : '', official);
    });
  }
}

function startMockTest(main, exam, count, sectionId = '', official = false) {
  const questions = getMockQuestions(count, exam, {
    sectionId: sectionId || undefined,
    official,
  });
  if (!questions.length) {
    UI.Toast.show('Not enough verified questions for this section.', 'warning');
    return;
  }
  const questionIds = questions.map((q) => q.question_id);
  const durationMinutes = exam.duration_minutes * (questionIds.length / (exam.default_question_count || 30));
  const testState = {
    id: generateId(),
    examId: exam.id,
    examConfig: exam,
    sectionId: sectionId || null,
    questionIds,
    answers: {},
    currentIndex: 0,
    startedAt: Date.now(),
    endsAt: Date.now() + Math.round(durationMinutes * 60) * 1000,
    durationSeconds: Math.round(durationMinutes * 60),
    count: questionIds.length,
    submitted: false,
  };
  saveTest(testState);
  renderActiveTest(main, testState);
}

function renderActiveTest(main, testState) {
  if (mockTimer) mockTimer.stop();
  document.body.classList.add('exam-mode');

  main.innerHTML = `
    <section class="mock-header">
      <div id="mock-timer-slot"></div>
      <div id="mock-progress-slot"></div>
    </section>
    <div class="mock-layout">
      <aside id="mock-nav-slot" class="mock-nav-slot"></aside>
      <div id="mock-question-slot" class="mock-question-slot"></div>
    </div>
    <div class="mock-controls">
      <button type="button" id="mock-prev" class="btn btn--ghost">Previous</button>
      <button type="button" id="mock-next" class="btn btn--secondary">Next</button>
      <button type="button" id="mock-submit" class="btn btn--primary">Submit</button>
    </div>
    <p class="empty-inline">1–4 or A–D to mark · arrows to move · palette on the side</p>`;

  const remaining = testState.endsAt
    ? Math.max(0, Math.ceil((testState.endsAt - Date.now()) / 1000))
    : Math.max(0, testState.durationSeconds - Math.floor((Date.now() - testState.startedAt) / 1000));

  mockTimer = UI.Timer(document.getElementById('mock-timer-slot'), {
    seconds: remaining,
    onExpire: () => submitMockTest(main, testState, true),
  });
  mockTimer.start();

  function persist() {
    testState.currentIndex = clamp(testState.currentIndex, 0, testState.questionIds.length - 1);
    saveTest(testState);
  }

  function renderQuestion() {
    const qid = testState.questionIds[testState.currentIndex];
    const q = getQuestionById(qid);
    const slot = document.getElementById('mock-question-slot');
    slot.innerHTML = '';
    if (!q) {
      slot.textContent = 'Question not found.';
      return;
    }

    document.getElementById('mock-progress-slot').innerHTML = '';
    document.getElementById('mock-progress-slot').appendChild(UI.ProgressBar({
      value: Object.keys(testState.answers).length,
      max: testState.questionIds.length,
      label: 'Answered',
    }));

    const navSlot = document.getElementById('mock-nav-slot');
    navSlot.innerHTML = '';
    navSlot.appendChild(UI.TestNavigator({
      questionIds: testState.questionIds,
      answers: testState.answers,
      currentIndex: testState.currentIndex,
      onNavigate: (i) => {
        testState.currentIndex = i;
        persist();
        renderQuestion();
      },
    }));

    const panel = document.createElement('div');
    panel.className = 'question-panel card';
    panel.innerHTML = `
      <div class="question-panel__header">
        <span class="question-panel__id">Q${testState.currentIndex + 1} of ${testState.questionIds.length}${q.subject ? ` · ${escapeHtml(q.subject)}` : ''}</span>
      </div>
      <div class="question-panel__text" lang="${detectTextLang(q.question)}">${escapeHtml(q.question).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
      <div class="options-grid" role="radiogroup" aria-label="Select your answer"></div>`;

    const grid = panel.querySelector('.options-grid');
    q.options.forEach((opt) => {
      const btn = UI.OptionButton(opt, {
        selected: testState.answers[qid],
        revealed: false,
        disabled: false,
      });
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', isChosenOption(opt.id, testState.answers[qid]) ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if (!opt.id || !qid) return;
        testState.answers[qid] = opt.id;
        persist();
        renderQuestion();
      });
      grid.appendChild(btn);
    });
    slot.appendChild(panel);

    document.getElementById('mock-prev').disabled = testState.currentIndex === 0;
    document.getElementById('mock-next').disabled = testState.currentIndex >= testState.questionIds.length - 1;
  }

  document.getElementById('mock-prev').addEventListener('click', () => {
    testState.currentIndex -= 1;
    persist();
    renderQuestion();
  });

  document.getElementById('mock-next').addEventListener('click', () => {
    testState.currentIndex += 1;
    persist();
    renderQuestion();
  });

  document.getElementById('mock-submit').addEventListener('click', () => {
    const unanswered = testState.questionIds.filter((id) => !testState.answers[id]).length;
    UI.Modal.open({
      title: 'Submit mock test?',
      body: `<p>You have ${unanswered} unanswered question${unanswered !== 1 ? 's' : ''}. Submit anyway?</p>`,
      confirmLabel: 'Submit',
      onConfirm: () => submitMockTest(main, testState, false),
    });
  });

  if (mockKeyHandler) document.removeEventListener('keydown', mockKeyHandler);
  mockKeyHandler = (e) => {
    if (e.target.closest('input, select, textarea, .modal')) return;
    const qid = testState.questionIds[testState.currentIndex];
    const key = e.key.toLowerCase();
    const letter = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', a: 'A', b: 'B', c: 'C', d: 'D' }[key];
    if (letter && qid) {
      e.preventDefault();
      testState.answers[qid] = letter;
      persist();
      renderQuestion();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('mock-next')?.click();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      document.getElementById('mock-prev')?.click();
    }
  };
  document.addEventListener('keydown', mockKeyHandler);

  renderQuestion();
}

function submitMockTest(main, testState, autoSubmitted) {
  if (!testState || testState.submitted) return;
  testState.submitted = true;
  endExamChrome();
  if (mockTimer) mockTimer.stop();
  const exam = testState.examConfig || getExamConfigForPost(testState.examId);
  const timeUsed = testState.durationSeconds - (mockTimer ? mockTimer.getRemaining() : 0);
  const scored = scoreTest({
    questionIds: testState.questionIds,
    answers: testState.answers,
    questionsById: DataStore.questionsById,
    examConfig: exam || { marks_per_question: 1, negative_marking: 0 },
  });

  const result = {
    id: testState.id,
    examId: testState.examId,
    examName: exam?.name || 'Mock Test',
    count: testState.questionIds.length,
    questionIds: testState.questionIds,
    answers: testState.answers,
    timeUsedSeconds: timeUsed,
    completedAt: Date.now(),
    autoSubmitted,
    ...scored,
  };

  saveTestResult(result);
  recordMockProgress(result, DataStore.questionsById);
  clearActiveTest();
  setContinuePreparation(rootPagesPath('results.html', { id: result.id }), 'View last results');
  window.location.href = pagesHref('results.html', { id: result.id });
}

document.addEventListener('DOMContentLoaded', initMockPage);
