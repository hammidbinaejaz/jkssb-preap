/**
 * Simple WPM typing drill for clerical / computer posts.
 */

const TYPING_PROMPTS = [
  'The Jammu and Kashmir Services Selection Board conducts recruitment for various posts through objective examinations and skill tests.',
  'A Junior Assistant should type accurately at the required speed while maintaining correct grammar and spelling throughout the passage.',
  'Candidates must practice regularly to improve words per minute and reduce errors before appearing in the official skill test.',
  'Computer knowledge includes operating systems, MS Office tools, internet basics, and safe handling of government records.',
];

const URDU_TYPING_PROMPTS = [
  'جموں و کشمیر سروسز سلیکشن بورڈ مختلف عہدوں کے لیے امتحانات کا انعقاد کرتا ہے۔',
  'اردو ٹائپسٹ کو درست ہجے اور رفتار کے ساتھ ٹائپنگ کی مشق کرنی چاہیے۔',
  'صبح بخیر، شکریہ اور خدا حافظ روزمرہ اردو محاورے ہیں۔',
];

async function initTypingPage() {
  const main = initPage({ pageTitle: 'Typing Drill', currentNav: 'Practice' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }
  const selected = getSelectedPostMeta();
  const isUrdu = selected?.id === 'urdu-typist';
  const prompts = isUrdu ? URDU_TYPING_PROMPTS : TYPING_PROMPTS;
  let prompt = shuffle([...prompts])[0];
  let startedAt = null;
  let finished = false;

  main.innerHTML = `
    <section class="page-header">
      <h1>Typing drill</h1>
      <p class="page-header__sub">${isUrdu
    ? 'Urdu skill practice with Nastaliq rendering. Aim for accuracy first, then speed.'
    : 'Practice accuracy and speed for clerical / computer skill tests. Target often cited: ~35 WPM.'}</p>
    </section>
    <div id="post-context-slot"></div>
    <div class="card">
      <p class="eyebrow">Passage</p>
      <p id="typing-prompt" class="question-panel__text" lang="${isUrdu ? 'ur' : 'en'}">${escapeHtml(prompt)}</p>
      <label class="visually-hidden" for="typing-input">Type the passage</label>
      <textarea id="typing-input" class="typing-input" rows="6" placeholder="Start typing here…" autocomplete="off" spellcheck="false" lang="${isUrdu ? 'ur' : 'en'}" dir="${isUrdu ? 'rtl' : 'ltr'}"></textarea>
      <div class="stats-grid" style="margin-top:1rem;">
        <div class="stat-card"><span class="stat-card__value" id="wpm-val">0</span><span class="stat-card__label">WPM</span></div>
        <div class="stat-card"><span class="stat-card__value" id="acc-val">100%</span><span class="stat-card__label">Accuracy</span></div>
        <div class="stat-card"><span class="stat-card__value" id="err-val">0</span><span class="stat-card__label">Errors</span></div>
      </div>
      <div class="cta-row">
        <button type="button" class="btn btn--secondary" id="typing-reset">New passage</button>
        <a class="btn btn--ghost" href="${pagesHref('practice.html')}">Back to practice</a>
      </div>
    </div>`;

  renderPostContext(document.getElementById('post-context-slot'));

  const input = document.getElementById('typing-input');
  const promptEl = document.getElementById('typing-prompt');

  function score() {
    const typed = input.value;
    if (!startedAt && typed.length) startedAt = Date.now();
    if (!startedAt) return;
    const elapsedMin = Math.max((Date.now() - startedAt) / 60000, 1 / 60);
    const words = typed.trim().split(/\s+/).filter(Boolean).length;
    const wpm = Math.round(words / elapsedMin);
    let errors = 0;
    const len = Math.min(typed.length, prompt.length);
    for (let i = 0; i < len; i += 1) {
      if (typed[i] !== prompt[i]) errors += 1;
    }
    errors += Math.max(0, typed.length - prompt.length);
    const accuracy = typed.length ? Math.max(0, Math.round((1 - errors / typed.length) * 100)) : 100;
    document.getElementById('wpm-val').textContent = String(wpm);
    document.getElementById('acc-val').textContent = `${accuracy}%`;
    document.getElementById('err-val').textContent = String(errors);
    if (!finished && typed === prompt) {
      finished = true;
      UI.Toast.show(`Done — ${wpm} WPM at ${accuracy}% accuracy`, 'success');
      const progress = loadProgress();
      progress.typingBestWpm = Math.max(progress.typingBestWpm || 0, wpm);
      saveProgress(progress);
    }
  }

  input.addEventListener('input', score);
  document.getElementById('typing-reset').addEventListener('click', () => {
    prompt = shuffle(prompts.filter((p) => p !== prompt))[0] || prompts[0];
    promptEl.textContent = prompt;
    promptEl.lang = detectTextLang(prompt);
    input.value = '';
    startedAt = null;
    finished = false;
    document.getElementById('wpm-val').textContent = '0';
    document.getElementById('acc-val').textContent = '100%';
    document.getElementById('err-val').textContent = '0';
    input.focus();
  });
  input.focus();
}

document.addEventListener('DOMContentLoaded', initTypingPage);
