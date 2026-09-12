/**
 * Mock test flow with timer, persistence, and navigator.
 */

let mockTimer = null;

async function initMockPage() {
  const main = initPage({ pageTitle: 'Mock Tests', currentNav: 'Mock Tests' });
  const dataResult = await initAppData();
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const active = loadTest();
  if (active && !active.submitted) {
    renderActiveTest(main, active);
    return;
  }

  renderMockSetup(main);
}

function renderMockSetup(main) {
  const exam = DataStore.exams?.exams?.[0];
  if (!exam) {
    main.appendChild(UI.EmptyState({
      title: 'No exams configured',
      message: 'Exam configuration is missing from data/exams.json.',
    }));
    return;
  }

  const counts = exam.allowed_counts || [10, 20, 30, 50, 100];
  main.innerHTML = `
    <section class="page-header">
      <h1>Mock Tests</h1>
      <p class="page-header__sub">${escapeHtml(exam.name)}</p>
    </section>
    <div class="card mock-rules">
      <h2>Test Rules</h2>
      <ul class="rules-list">
        <li>Duration: ${exam.duration_minutes} minutes (scaled by question count)</li>
        <li>Marks per question: ${exam.marks_per_question}</li>
        <li>Negative marking: ${exam.negative_marking} mark(s) per wrong answer</li>
        <li>Only verified questions are included</li>
        <li>Timer auto-submits when time runs out</li>
        <li>Progress is saved — you can resume after refresh</li>
      </ul>
    </div>
    <form id="mock-form" class="filter-form card">
      <div class="form-row">
        <label for="mock-count">Number of questions</label>
        <select id="mock-count" name="count">
          ${counts.map((c) => `<option value="${c}"${c === exam.default_question_count ? ' selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn--primary btn--block">Start Mock Test</button>
    </form>`;

  document.getElementById('mock-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const count = parseInt(document.getElementById('mock-count').value, 10);
    startMockTest(main, exam, count);
  });
}

function startMockTest(main, exam, count) {
  const questions = getMockQuestions(count, exam);
  if (!questions.length) {
    UI.Toast.show('Not enough verified questions available.', 'warning');
    return;
  }
  const questionIds = questions.map((q) => q.question_id);
  const durationMinutes = exam.duration_minutes * (questionIds.length / (exam.default_question_count || 30));
  const testState = {
    id: generateId(),
    examId: exam.id,
    examConfig: exam,
    questionIds,
    answers: {},
    currentIndex: 0,
    startedAt: Date.now(),
    durationSeconds: Math.round(durationMinutes * 60),
    count: questionIds.length,
    submitted: false,
  };
  saveTest(testState);
  renderActiveTest(main, testState);
}

function renderActiveTest(main, testState) {
  if (mockTimer) mockTimer.stop();

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
      <button type="button" id="mock-prev" class="btn btn--secondary">Previous</button>
      <button type="button" id="mock-next" class="btn btn--secondary">Next</button>
      <button type="button" id="mock-submit" class="btn btn--primary">Submit Test</button>
    </div>`;

  const elapsed = Math.floor((Date.now() - testState.startedAt) / 1000);
  let remaining = Math.max(0, testState.durationSeconds - elapsed);

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
        <span class="question-panel__id">Q${testState.currentIndex + 1} · ${escapeHtml(q.question_id)}</span>
      </div>
      <div class="question-panel__text">${escapeHtml(q.question).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
      <div class="options-grid" role="radiogroup" aria-label="Select your answer"></div>`;

    const grid = panel.querySelector('.options-grid');
    q.options.forEach((opt) => {
      const btn = UI.OptionButton(opt, {
        selected: testState.answers[qid],
        revealed: false,
        disabled: false,
      });
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', testState.answers[qid] === opt.id ? 'true' : 'false');
      btn.addEventListener('click', () => {
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

  renderQuestion();
}

function submitMockTest(main, testState, autoSubmitted) {
  if (mockTimer) mockTimer.stop();
  const exam = testState.examConfig || DataStore.exams?.exams?.find((e) => e.id === testState.examId);
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
  testState.submitted = true;
  clearActiveTest();
  setContinuePreparation(pagesHref('results.html'), 'View last results');

  const base = getBasePath();
  window.location.href = `${base}pages/results.html?id=${encodeURIComponent(result.id)}`;
}

document.addEventListener('DOMContentLoaded', initMockPage);
