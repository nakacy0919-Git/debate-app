import extendedRounds from '../data/extendedRounds.json';
import { normalizeTopic } from './gameSafety.js';

// Preserve the original affirmative exercises and finish the two-sided
// curriculum without inventing or reusing an opponent's correct answer.
function createOptions(correct, correctJP, weakPool, prefix, type, successJudgment) {
  return [
    {
      id: `${prefix}_correct`,
      type,
      judgment: successJudgment,
      text: correct,
      textJP: correctJP,
    },
    ...weakPool.map(([text, textJP, explanationJP], index) => ({
      id: `${prefix}_weak_${index + 1}`,
      type,
      judgment: 'weak',
      text,
      textJP,
      explanationJP,
    })),
  ];
}

function makeCrossExam([question, questionJP, answer, answerJP], pool, prefix) {
  return {
    id: prefix,
    question: { text: question, textJP: questionJP },
    options: createOptions(answer, answerJP, pool, prefix, 'answer', 'correct'),
  };
}

function makeRebuttal([attack, attackJP, response, responseJP], pool, prefix) {
  return {
    id: prefix,
    damage: 15,
    text: attack,
    textJP: attackJP,
    options: createOptions(response, responseJP, pool, prefix, 'defense', 'perfect'),
  };
}

function makeClosing([summary, summaryJP], pool, prefix) {
  return createOptions(summary, summaryJP, pool, prefix, 'closing', 'perfect');
}

// Historical question banks can contain only five candidates. Keep the
// existing correct answer and pad with distinct weak answers for hard mode.
function ensureSixOptions(rounds, weakPool, topicId, stance, phase) {
  return rounds.map((round, roundIndex) => {
    const missing = Math.max(0, 6 - (round.options?.length || 0));
    if (!missing) return round;
    const extras = weakPool.slice(0, missing).map(([text, textJP, explanationJP], index) => ({
      id: `ext_${topicId}_${stance}_${phase}_${roundIndex + 1}_padding_${index + 1}`,
      type: phase === 'cross' ? 'answer' : 'defense',
      judgment: 'weak',
      text,
      textJP,
      explanationJP,
    }));
    return { ...round, options: [...(round.options || []), ...extras] };
  });
}

// First four topics already contain complete multi-round material.
// For the eight older topics, add two new affirmative rounds to their
// original round, and three distinct negative rounds plus a closing.
export function completeTopic(raw) {
  const topic = normalizeTopic(raw);
  const extension = extendedRounds[topic.id];
  if (!extension) return topic;

  const createRounds = (rows, make, stance, phase) => rows.map((row, index) =>
    make(row, extension.weak, `ext_${topic.id}_${stance}_${phase}_${index + 1}`));

  return {
    ...topic,
    crossExam: {
      affirmative: ensureSixOptions([
        ...topic.crossExam.affirmative,
        ...createRounds(extension.aC, makeCrossExam, 'affirmative', 'cross'),
      ], extension.weak, topic.id, 'affirmative', 'cross'),
      negative: createRounds(extension.nC, makeCrossExam, 'negative', 'cross'),
    },
    rebuttal: {
      affirmative: ensureSixOptions([
        ...topic.rebuttal.affirmative,
        ...createRounds(extension.aR, makeRebuttal, 'affirmative', 'rebuttal'),
      ], extension.weak, topic.id, 'affirmative', 'rebuttal'),
      negative: createRounds(extension.nR, makeRebuttal, 'negative', 'rebuttal'),
    },
    closing: {
      affirmative: [
        ...topic.closing.affirmative,
        // Hard mode displays six choices; a few older closings had only five.
        ...extension.weak
          .slice(0, Math.max(0, 6 - topic.closing.affirmative.length))
          .map(([text, textJP, explanationJP], index) => ({
            id: `ext_${topic.id}_affirmative_closing_weak_${index + 1}`,
            type: 'closing',
            judgment: 'weak',
            text,
            textJP,
            explanationJP,
          })),
      ],
      negative: makeClosing(extension.nF, extension.weak, `ext_${topic.id}_negative_closing`),
    },
  };
}
