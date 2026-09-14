/**
 * Unlimited computed numericals for Math / Statistics / Accountancy.
 * Keys are calculated, so they stay internally consistent.
 */

const NumericalDrill = {
  subjects: new Set([
    'Mathematics',
    'Statistics',
    'Accountancy and Book Keeping',
  ]),

  /**
   * @param {string} subject
   * @param {number} count
   * @param {number} [start]
   * @returns {object[]}
   */
  generate(subject, count = 20, start = 0) {
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const n = start + i;
      if (subject === 'Statistics') out.push(this.stats(n));
      else if (subject === 'Accountancy and Book Keeping') out.push(this.accounts(n));
      else out.push(this.math(n));
    }
    return out;
  },

  /**
   * Mix of Math, Statistics, and Accountancy — fresh values every index.
   * @param {number} count
   */
  generateMix(count = 20) {
    const order = ['Mathematics', 'Statistics', 'Accountancy and Book Keeping'];
    return Array.from({ length: count }, (_, i) => this.generate(order[i % 3], 1, i)[0]);
  },

  math(i) {
    const P = 2000 + 25 * i;
    const R = 5 + (i % 8);
    const T = 2 + (i % 5);
    const kind = i % 6;
    if (kind === 0) {
      const ans = (P * R * T) / 100;
      return this.wrap('Mathematics', 'Simple interest', i,
        `Find simple interest on ₹${P} at ${R}% p.a. for ${T} years.`,
        ans, [ans * 2, (P * R) / 100, P],
        `SI = PRT/100 = ${ans}.`);
    }
    if (kind === 1) {
      const ans = Math.round((P * ((1 + R / 100) ** 2) - P) * 100) / 100;
      return this.wrap('Mathematics', 'Compound interest', i,
        `CI on ₹${P} at ${R}% p.a. for 2 years (annual compounding) is:`,
        ans, [Math.round((P * R * 2) / 100), P, Math.round(ans / 2)],
        'CI = P(1+R/100)² − P.');
    }
    if (kind === 2) {
      const cp = 200 + 3 * i;
      const sp = cp + 20 + (i % 7);
      const ans = sp - cp;
      return this.wrap('Mathematics', 'Profit and loss', i,
        `Cost price ₹${cp}, selling price ₹${sp}. Profit is:`,
        ans, [sp + cp, cp, sp],
        'Profit = SP − CP.');
    }
    if (kind === 3) {
      const n = 40 + i;
      const p = 10 + (i % 9);
      const ans = (n * p) / 100;
      return this.wrap('Mathematics', 'Percentage', i,
        `${p}% of ${n} is:`,
        ans, [n + p, n - p, n * p],
        `${p}% of ${n} = ${n} × ${p}/100.`);
    }
    if (kind === 4) {
      const a = 2 + (i % 8);
      const b = 3 + (i % 5);
      const scale = 12 + i;
      return this.wrap('Mathematics', 'Ratio and proportion', i,
        `If A:B = ${a}:${b} and A = ${a * scale}, then B is:`,
        b * scale, [a * scale, a + b, a * b],
        'B = A × (b/a).');
    }
    const n = 6 + i;
    const r = 2;
    const ans = this.perm(n, r);
    return this.wrap('Mathematics', 'Permutations', i,
      `P(${n},${r}) equals:`,
      ans, [this.comb(n, r), n * r, n + r],
      'P(n,r) = n!/(n−r)!.');
  },

  stats(i) {
    const kind = i % 4;
    const a = 2 + i;
    const b = a + 2;
    const c = a + 4;
    if (kind === 0) {
      const mean = (a + b + c) / 3;
      return this.wrap('Statistics', 'Measures of central Tendency', i,
        `Mean of ${a}, ${b}, ${c} is:`,
        mean, [a + b + c, a, c],
        'Mean = sum/count.');
    }
    if (kind === 1) {
      return this.wrap('Statistics', 'Measures of central Tendency', i,
        `Median of ${a}, ${b}, ${c} (already ordered) is:`,
        b, [a, c, a + c],
        'For three ordered values, the middle value is the median.');
    }
    if (kind === 2) {
      const range = c - a;
      return this.wrap('Statistics', 'Dispersion', i,
        `Range of ${a}, ${b}, ${c} is:`,
        range, [c + a, b, a],
        'Range = largest − smallest.');
    }
    const n = 5 + (i % 6);
    const sum = n * (10 + i);
    const mean = sum / n;
    return this.wrap('Statistics', 'Measures of central Tendency', i,
      `If the sum of ${n} observations is ${sum}, the mean is:`,
      mean, [sum, n, sum + n],
      'Mean = Σx / n.');
  },

  accounts(i) {
    const kind = i % 4;
    if (kind === 0) {
      const assets = 50000 + 1000 * i;
      const liab = 20000 + 400 * i;
      const cap = assets - liab;
      return this.wrap('Accountancy and Book Keeping', 'Accounting equation', i,
        `Assets ₹${assets}, liabilities ₹${liab}. Capital is:`,
        cap, [assets + liab, assets, liab],
        'Capital = Assets − Liabilities.');
    }
    if (kind === 1) {
      const cost = 80000 + 1000 * i;
      const scrap = 8000;
      const years = 8 + (i % 4);
      const dep = (cost - scrap) / years;
      return this.wrap('Accountancy and Book Keeping', 'Depreciation', i,
        `Cost ₹${cost}, scrap ₹${scrap}, life ${years} years. Annual SLM depreciation is:`,
        dep, [cost / years, scrap, cost - scrap],
        'SLM = (Cost − Scrap) / Life.');
    }
    if (kind === 2) {
      const sales = 120000 + 2000 * i;
      const cogs = 70000 + 1000 * i;
      const gp = sales - cogs;
      return this.wrap('Accountancy and Book Keeping', 'Trading Account', i,
        `Sales ₹${sales}, cost of goods sold ₹${cogs}. Gross profit is:`,
        gp, [sales + cogs, cogs, sales],
        'GP = Sales − COGS.');
    }
    const ca = 90000 + 1000 * i;
    const cl = 30000 + 500 * i;
    const ratio = Math.round((ca / cl) * 100) / 100;
    return this.wrap('Accountancy and Book Keeping', 'Financial statements', i,
      `Current assets ₹${ca}, current liabilities ₹${cl}. Current ratio is:`,
      ratio, [ca - cl, Math.round((cl / ca) * 100) / 100, ca + cl],
      'Current ratio = CA / CL.');
  },

  perm(n, r) {
    let v = 1;
    for (let k = 0; k < r; k += 1) v *= (n - k);
    return v;
  },

  comb(n, r) {
    return this.perm(n, r) / this.perm(r, r);
  },

  seededShuffle(items, seed) {
    const a = items.slice();
    let s = (seed * 1103515245 + 12345) >>> 0;
    for (let k = a.length - 1; k > 0; k -= 1) {
      s = (s * 16807) % 2147483647;
      const j = s % (k + 1);
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  },

  wrap(subject, topic, i, question, correct, distractors, explanation) {
    const fmt = (x) => {
      const n = Number(x);
      if (!Number.isFinite(n)) return String(x);
      if (Number.isInteger(n)) return String(n);
      return String(Math.round(n * 100) / 100);
    };
    const texts = [fmt(correct), ...distractors.map(fmt)];
    const uniq = [];
    texts.forEach((t) => { if (!uniq.includes(t)) uniq.push(t); });
    let pad = 1;
    while (uniq.length < 4) {
      const extra = String(Number(fmt(correct)) + pad);
      if (!uniq.includes(extra)) uniq.push(extra);
      pad += 1;
    }
    const sliced = this.seededShuffle(uniq.slice(0, 4), i + 17);
    const letters = ['A', 'B', 'C', 'D'];
    const options = sliced.map((text, idx) => ({ id: letters[idx], text }));
    const key = letters[sliced.indexOf(fmt(correct))];
    return {
      question_id: `faa-live-${subject.slice(0, 3).toLowerCase()}-${i}`,
      question,
      options,
      correct_option: key,
      subject,
      topic,
      difficulty: ['easy', 'medium', 'hard'][i % 3],
      explanation,
      verification_status: 'generated',
      source: { label: 'Computed numerical drill (generated, not an official key)' },
      pool_type: 'post_primary',
      post_id: 'accounts-assistant-finance',
    };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NumericalDrill };
}
