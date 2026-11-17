(() => {
  'use strict';

  // HTML data-key mapping:
  // comparisons.<baseline_year>-<target_year>.<field>
  // models.<primary|without_2022>.<field>
  // data-format: integer | signed | percent | pvalue
  // All HTML values are static fallbacks if fetching or validation fails.
  const targets = [...document.querySelectorAll('[data-key]')];
  if (!targets.length) return;

  const integer = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
  const signed = new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0, signDisplay: 'exceptZero'
  });
  const percent = new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero'
  });
  const formatters = {
    integer: value => integer.format(value),
    signed: value => signed.format(value),
    percent: value => percent.format(value) + '%',
    pvalue: value => Number(value.toPrecision(3)).toString()
  };

  async function updateSummary() {
    const response = await fetch('generated/summary.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Summary is unavailable');
    const summary = await response.json();
    if (!Array.isArray(summary.comparisons) || !summary.models) {
      throw new Error('Invalid summary schema');
    }
    const comparisons = Object.create(null);
    for (const comparison of summary.comparisons) {
      if (!Number.isInteger(comparison.baseline_year) || !Number.isInteger(comparison.target_year)) {
        throw new Error('Invalid comparison years');
      }
      const key = comparison.baseline_year + '-' + comparison.target_year;
      if (comparisons[key]) throw new Error('Duplicate comparison');
      comparisons[key] = comparison;
    }
    const groups = { comparisons, models: summary.models };
    // Prepare every replacement before changing the DOM, retaining a coherent
    // static report if the generated data does not match the HTML contract.
    const replacements = targets.map(element => {
      const parts = element.dataset.key.split('.');
      if (parts.length !== 3) throw new Error('Invalid data-key');
      const [group, key, field] = parts;
      const value = groups[group]?.[key]?.[field];
      const formatter = formatters[element.dataset.format || 'integer'];
      if (typeof value !== 'number' || !Number.isFinite(value) || !formatter) {
        throw new Error('Missing or invalid summary value');
      }
      if (field === 'p_value' && (value < 0 || value > 1)) {
        throw new Error('Invalid probability');
      }
      if ((field === 'n_teams' || field === 'increased_teams') &&
          (!Number.isInteger(value) || value < 0)) {
        throw new Error('Invalid team count');
      }
      return [element, formatter(value)];
    });
    for (const [element, text] of replacements) element.textContent = text;
  }

  updateSummary().catch(() => {
    // Offline, file:// previews, missing exports and invalid data all keep
    // the readable static results. No content or comparisons are hidden.
  });
})();
