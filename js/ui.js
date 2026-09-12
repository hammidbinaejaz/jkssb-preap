/**
 * Reusable UI components.
 */

const UI = {};

UI.Toast = {
  show(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--visible'));
    setTimeout(() => {
      el.classList.remove('toast--visible');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
};

UI.Modal = {
  open({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">${escapeHtml(title)}</h2>
        <div class="modal__body">${body}</div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost modal-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="btn btn--primary modal-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    const close = () => overlay.remove();
    overlay.querySelector('.modal-cancel').addEventListener('click', close);
    overlay.querySelector('.modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-confirm').focus();
    return { close };
  },
};

UI.EmptyState = function EmptyState({ icon = '📚', title, message, actionLabel, actionUrl }) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = `
    <div class="empty-state__icon" aria-hidden="true">${icon}</div>
    <h3 class="empty-state__title">${escapeHtml(title)}</h3>
    <p class="empty-state__message">${escapeHtml(message)}</p>
    ${actionLabel && actionUrl ? `<a href="${escapeHtml(actionUrl)}" class="btn btn--primary">${escapeHtml(actionLabel)}</a>` : ''}`;
  return wrap;
};

UI.SearchBar = function SearchBar({ placeholder, value = '', onSearch, id = 'search-input' }) {
  const form = document.createElement('form');
  form.className = 'search-bar';
  form.setAttribute('role', 'search');
  form.innerHTML = `
    <label class="visually-hidden" for="${id}">Search questions</label>
    <input type="search" id="${id}" class="search-bar__input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" autocomplete="off" />
    <button type="submit" class="btn btn--primary search-bar__btn" aria-label="Search">Search</button>`;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = form.querySelector('input').value.trim();
    if (onSearch) onSearch(q);
  });
  return form;
};

UI.QuestionCard = function QuestionCard(question, { compact = false, showMeta = true, href } = {}) {
  const card = document.createElement('article');
  card.className = `question-card${compact ? ' question-card--compact' : ''}`;
  const preview = question.question.split('\n')[0].slice(0, compact ? 120 : 200);
  const link = href || `./practice.html?q=${encodeURIComponent(question.question_id)}`;
  card.innerHTML = `
    <a href="${escapeHtml(link)}" class="question-card__link">
      <p class="question-card__text">${escapeHtml(preview)}${question.question.length > preview.length ? '…' : ''}</p>
      ${showMeta ? `<div class="question-card__meta">
        <span class="badge">${escapeHtml(question.subject || '')}</span>
        <span class="badge badge--muted">${escapeHtml(question.topic || '')}</span>
        ${question.difficulty ? `<span class="badge badge--outline">${escapeHtml(question.difficulty)}</span>` : ''}
      </div>` : ''}
    </a>`;
  return card;
};

UI.OptionButton = function OptionButton(option, { selected, correct, revealed, disabled }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'option-btn';
  btn.dataset.optionId = option.id;
  btn.setAttribute('aria-label', `Option ${option.id}: ${option.text}`);
  if (disabled) btn.disabled = true;
  if (selected) btn.classList.add('option-btn--selected');
  if (revealed) {
    if (option.id === correct) btn.classList.add('option-btn--correct');
    else if (option.id === selected && selected !== correct) btn.classList.add('option-btn--incorrect');
  }
  btn.innerHTML = `
    <span class="option-btn__id" aria-hidden="true">${escapeHtml(option.id)}</span>
    <span class="option-btn__text">${escapeHtml(option.text)}</span>
    ${revealed && option.id === correct ? '<span class="option-btn__mark" aria-label="Correct">✓</span>' : ''}
    ${revealed && option.id === selected && selected !== correct ? '<span class="option-btn__mark" aria-label="Incorrect">✗</span>' : ''}`;
  return btn;
};

UI.Timer = function Timer(container, { seconds, onExpire, onTick }) {
  let remaining = seconds;
  let intervalId = null;
  const el = document.createElement('div');
  el.className = 'timer';
  el.setAttribute('role', 'timer');
  el.setAttribute('aria-live', 'polite');

  function render() {
    el.textContent = formatTime(remaining);
    el.classList.toggle('timer--warning', remaining <= 300 && remaining > 60);
    el.classList.toggle('timer--danger', remaining <= 60);
  }

  function start() {
    render();
    intervalId = setInterval(() => {
      remaining -= 1;
      if (onTick) onTick(remaining);
      render();
      if (remaining <= 0) {
        stop();
        if (onExpire) onExpire();
      }
    }, 1000);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  function getRemaining() {
    return remaining;
  }

  container.appendChild(el);
  return { start, stop, getRemaining, element: el };
};

UI.TestNavigator = function TestNavigator({ questionIds, answers, currentIndex, onNavigate }) {
  const nav = document.createElement('div');
  nav.className = 'test-navigator';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Question navigator');
  questionIds.forEach((qid, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'test-navigator__item';
    btn.textContent = String(i + 1);
    btn.setAttribute('aria-label', `Question ${i + 1}`);
    if (answers[qid]) btn.classList.add('test-navigator__item--answered');
    if (i === currentIndex) btn.classList.add('test-navigator__item--current');
    btn.addEventListener('click', () => onNavigate(i));
    nav.appendChild(btn);
  });
  return nav;
};

UI.ProgressBar = function ProgressBar({ value, max, label }) {
  const pct = max ? clamp((value / max) * 100, 0, 100) : 0;
  const wrap = document.createElement('div');
  wrap.className = 'progress-bar';
  wrap.innerHTML = `
    ${label ? `<div class="progress-bar__label"><span>${escapeHtml(label)}</span><span>${value}/${max}</span></div>` : ''}
    <div class="progress-bar__track" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
      <div class="progress-bar__fill" style="width:${pct}%"></div>
    </div>`;
  return wrap;
};

UI.RecommendationCard = function RecommendationCard(rec) {
  const card = document.createElement('article');
  card.className = 'recommendation-card';
  card.innerHTML = `
    <h4 class="recommendation-card__title">${escapeHtml(rec.title)}</h4>
    <p class="recommendation-card__desc">${escapeHtml(rec.description)}</p>
    <a href="${escapeHtml(rec.actionUrl)}" class="btn btn--secondary btn--sm">${escapeHtml(rec.actionLabel)}</a>`;
  return card;
};

UI.renderLearningLoop = function renderLearningLoop(container) {
  container.innerHTML = `
    <div class="learning-loop" aria-label="Learning loop">
      <div class="learning-loop__step"><span class="learning-loop__num">1</span> Practice</div>
      <div class="learning-loop__arrow" aria-hidden="true">→</div>
      <div class="learning-loop__step"><span class="learning-loop__num">2</span> Mistakes</div>
      <div class="learning-loop__arrow" aria-hidden="true">→</div>
      <div class="learning-loop__step"><span class="learning-loop__num">3</span> Weak topics</div>
      <div class="learning-loop__arrow" aria-hidden="true">→</div>
      <div class="learning-loop__step"><span class="learning-loop__num">4</span> Retest</div>
      <div class="learning-loop__arrow" aria-hidden="true">→</div>
      <div class="learning-loop__step learning-loop__step--highlight"><span class="learning-loop__num">5</span> Improve</div>
    </div>`;
};
