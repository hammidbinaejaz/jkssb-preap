/**
 * Test results and mistake review.
 */

async function initResultsPage() {
  const main = initPage({ pageTitle: 'Results', currentNav: 'Mock Tests' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const resultId = getQueryParam('id');
  let result = loadTestHistory().find((r) => r.id === resultId);
  if (!result) result = getLatestTestResult();

  if (!result) {
    main.innerHTML = '';
    main.appendChild(UI.EmptyState({
      title: 'No results yet',
      message: 'Complete a mock test to see your performance analysis here.',
      actionLabel: 'Take a mock test',
      actionUrl: pagesHref('mock.html'),
    }));
    return;
  }

  if (result.examId) {
    await loadPostDataset(result.examId);
    rebuildQuestionIndex();
  }

  renderResults(main, result);
}

function renderResults(main, result) {
  const avgTime = result.count ? result.timeUsedSeconds / result.count : 0;
  const progress = loadProgress();
  const recs = getRecommendations(progress, result);
  const base = getBasePath();

  main.innerHTML = `
    <section class="page-header">
      <h1>Test Results</h1>
      <p class="page-header__sub">${escapeHtml(result.examName || 'Mock Test')} · ${new Date(result.completedAt).toLocaleString()}</p>
    </section>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-card__label">Score</span>
        <span class="stat-card__value">${result.score}/${result.maxScore}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Percentage</span>
        <span class="stat-card__value">${formatPercent(result.percentage)}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Accuracy</span>
        <span class="stat-card__value">${formatPercent(result.accuracy)}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Time Used</span>
        <span class="stat-card__value">${formatTime(result.timeUsedSeconds)}</span>
      </div>
    </div>

    <div class="card results-summary">
      <div class="results-summary__row"><span>Correct</span><strong class="text-success">${result.correct}</strong></div>
      <div class="results-summary__row"><span>Incorrect</span><strong class="text-danger">${result.incorrect}</strong></div>
      <div class="results-summary__row"><span>Unanswered</span><strong>${result.unanswered}</strong></div>
      <div class="results-summary__row"><span>Avg time per question</span><strong>${formatTime(avgTime)}</strong></div>
    </div>

    <section class="section">
      <h2 class="section-title">Performance by Topic</h2>
      <div id="topic-performance" class="topic-performance"></div>
    </section>

    <section class="section">
      <h2 class="section-title">Smart Recommendations</h2>
      <div id="recommendations" class="recommendations-grid"></div>
    </section>

    <section class="section">
      <h2 class="section-title">Mistake Review</h2>
      <div id="mistakes-list"></div>
    </section>

    <section class="section">
      <div id="learning-loop-slot"></div>
    </section>

    <div class="cta-row">
      <a href="${base}pages/practice.html" class="btn btn--primary">Practice Weak Area</a>
      <a href="${base}pages/mock.html" class="btn btn--secondary">Take Another Test</a>
    </div>`;

  renderTopicPerformance(document.getElementById('topic-performance'), result.topicBreakdown);
  renderRecommendations(document.getElementById('recommendations'), recs, base);
  renderMistakes(document.getElementById('mistakes-list'), result.mistakes || [], base);
  UI.renderLearningLoop(document.getElementById('learning-loop-slot'));
}

function renderTopicPerformance(container, breakdown) {
  container.innerHTML = '';
  const entries = Object.entries(breakdown || {});
  if (!entries.length) {
    container.appendChild(UI.EmptyState({ title: 'No topic data', message: 'Topic breakdown unavailable.' }));
    return;
  }
  entries.forEach(([topic, stats]) => {
    const accuracy = stats.total ? (stats.correct / stats.total) * 100 : 0;
    const perf = topicPerformanceLabel(accuracy);
    const row = document.createElement('div');
    row.className = `topic-row ${perf.className}`;
    row.innerHTML = `
      <div class="topic-row__header">
        <span class="topic-row__name">${escapeHtml(topic)}</span>
        <span class="topic-row__badge">${perf.label}</span>
      </div>
      <div class="topic-row__stats">${stats.correct}/${stats.total} correct · ${Math.round(accuracy)}%</div>
      <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${accuracy}%"></div></div>`;
    container.appendChild(row);
  });
}

function renderRecommendations(container, recs, base) {
  container.innerHTML = '';
  recs.forEach((rec) => {
    const adjusted = { ...rec, actionUrl: rec.actionUrl.startsWith('pages/') ? `${base}${rec.actionUrl}` : rec.actionUrl };
    container.appendChild(UI.RecommendationCard(adjusted));
  });
}

function renderMistakes(container, mistakes, base) {
  container.innerHTML = '';
  if (!mistakes.length) {
    container.appendChild(UI.EmptyState({
      icon: '🎉',
      title: 'No mistakes',
      message: 'Great job — you answered every attempted question correctly.',
    }));
    return;
  }
  mistakes.forEach((m) => {
    const q = m.question;
    const card = document.createElement('article');
    card.className = 'mistake-card card';
    card.innerHTML = `
      <p class="mistake-card__text">${escapeHtml((() => {
        const text = q.question || '';
        return text.length > 200 ? `${text.slice(0, 200)}…` : text;
      })())}</p>
      <div class="mistake-card__answers">
        <span class="text-danger">Your answer: ${escapeHtml(m.selected)}</span>
        <span class="text-success">Correct: ${escapeHtml(m.correct)}</span>
      </div>
      <div class="mistake-card__meta">
        <span class="badge badge--muted">${escapeHtml(q.topic || '')}</span>
        <a href="${base}pages/practice.html?topic=${encodeURIComponent(q.topic || '')}" class="btn btn--sm btn--secondary">Practice this topic</a>
      </div>`;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', initResultsPage);
