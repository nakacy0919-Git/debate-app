// Scores are practice records on this browser, never proof of debate proficiency.
export function calculateAward({ basePoints, elapsed, limit, difficulty, combo, timerEnabled }) {
  const multiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
  return {
    base: Math.floor(basePoints * multiplier),
    timeBonus: timerEnabled ? Math.floor(Math.max(0, Math.floor((limit - elapsed) * 10)) * multiplier) : 0,
    comboBonus: combo > 1 ? Math.floor(combo * 10 * multiplier) : 0,
  };
}

export function scoreKey(settings) {
  return `debate_practice_v1:${JSON.stringify(settings)}`;
}
export function readScores(key) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(records)) return [];
    return records.filter(r => r && typeof r.id === 'string' && typeof r.name === 'string'
      && r.name.length <= 15 && typeof r.location === 'string' && r.location.length <= 20
      && Number.isSafeInteger(r.score) && r.score >= 0 && typeof r.date === 'string')
      .sort((a, b) => b.score - a.score).slice(0, 10);
  } catch { return []; }
}
export function saveLocalScore(key, record) {
  const records = [...readScores(key), record].sort((a, b) => b.score - a.score).slice(0, 10);
  try { localStorage.setItem(key, JSON.stringify(records)); return { saved: true, records }; }
  catch { return { saved: false, records }; }
}

export function localized(value, difficulty = 'easy') {
  if (typeof value === 'string') return value;
  return value?.[difficulty] || value?.easy || '';
}

// Earlier topics have one affirmative exercise, not exercises for both stances.
// Never reuse that answer as the negative stance's answer.
export function normalizeTopic(topic) {
  const phases = {};
  for (const phase of ['crossExam', 'rebuttal', 'closing']) {
    const raw = topic[phase];
    if (raw?.affirmative || raw?.negative) {
      phases[phase] = { affirmative: raw.affirmative || [], negative: raw.negative || [] };
    } else {
      phases[phase] = { affirmative: phase === 'closing' ? (Array.isArray(raw) ? raw : raw?.options || []) : (raw?.options ? [phase === 'rebuttal' ? { ...raw.attack, options: raw.options } : raw] : []), negative: [] };
    }
  }
  return { ...topic, ...phases };
}
