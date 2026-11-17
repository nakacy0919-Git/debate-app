// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useGameLogic } from '../src/hooks/useGameLogic.js';
import { calculateAward, normalizeTopic, readScores, saveLocalScore, scoreKey } from '../src/utils/gameSafety.js';
import { getAllTopics } from '../src/utils/dataLoader.js';

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
function prepare(topic = 'homework', stance = 'affirmative', difficulty = 'easy', images = false, timer = false) {
  const hook = renderHook(() => useGameLogic(() => {}));
  act(() => {
    hook.result.current.setSelectedTopicId(topic);
    hook.result.current.setUserStance(stance);
    hook.result.current.setDifficulty(difficulty);
    hook.result.current.setImageMatchEnabled(images);
    hook.result.current.setTimerEnabled(timer);
  });
  act(() => hook.result.current.initGame());
  return hook;
}
function choose(hook) {
  const game = hook.result.current;
  if (game.gameState.endsWith('_image')) {
    act(() => game.handleImageSelect(game.pendingCard.image_url));
  } else if (game.gameState === 'construct') {
    const card = game.visibleHand.find(c => c.group !== 'fake' && (!game.activeLogicGroup || c.group === game.activeLogicGroup));
    if (card) act(() => game.handleCardSelect(card));
  } else if (['cross_exam', 'rebuttal_defense', 'closing'].includes(game.gameState)) {
    const card = game.visibleHand.find(c => ['correct', 'perfect'].includes(c.judgment));
    if (card) act(() => game.handleCardSelect(card));
  }
  act(() => vi.advanceTimersByTime(1600));
}

describe('complete real curriculum', () => {
  for (const topic of getAllTopics()) for (const stance of ['affirmative', 'negative']) for (const difficulty of ['easy', 'medium', 'hard']) for (const images of [false, true]) {
    it(`${topic.id} / ${stance} / ${difficulty} / images=${images}`, () => {
      const hook = prepare(topic.id, stance, difficulty, images, true);
      const visited = [];
      for (let step = 0; step < 45 && hook.result.current.gameState !== 'result'; step++) {
        visited.push(hook.result.current.gameState);
        choose(hook);
      }
      const game = hook.result.current;
      expect(game.gameState).toBe('result');
      expect(visited).toContain('cross_exam');
      expect(visited).toContain('rebuttal_defense');
      expect(visited).toContain('closing');
      expect(game.currentRoundIndex).toBe(3);
      expect(game.playerHP).toBe(100);
      expect(game.score).toBe(Object.values(game.scoreDetails).reduce((sum, n) => sum + n, 0));
      expect(game.leaderboard).toHaveLength(1);
    });
  }
});
describe('full six-round battles never recycle a question', () => {
  for (const topic of getAllTopics()) for (const stance of ['affirmative', 'negative']) {
    it(`${topic.id} / ${stance} completes six distinct rounds`, () => {
      const hook = renderHook(() => useGameLogic(() => {}));
      act(() => {
        hook.result.current.setSelectedTopicId(topic.id);
        hook.result.current.setUserStance(stance);
        hook.result.current.setDifficulty('hard');
        hook.result.current.setBattleRounds(6);
      });
      act(() => hook.result.current.initGame());
      const questions = [];
      const attacks = [];
      for (let step = 0; step < 60 && hook.result.current.gameState !== 'result'; step++) {
        const g = hook.result.current;
        if (g.gameState === 'cross_exam') questions.push(g.rivalCard.text?.hard || g.rivalCard.text);
        if (g.gameState === 'rebuttal_defense') attacks.push(g.rivalCard.text?.hard || g.rivalCard.text);
        choose(hook);
      }
      const game = hook.result.current;
      expect(game.gameState).toBe('result');
      expect(game.currentRoundIndex).toBe(6);
      expect(questions).toHaveLength(6);
      expect(attacks).toHaveLength(6);
      expect(new Set(questions).size).toBe(6);
      expect(new Set(attacks).size).toBe(6);
      expect(game.playerHP).toBe(100);
      expect(game.score).toBe(Object.values(game.scoreDetails).reduce((sum, n) => sum + n, 0));
    });
  }
});

it('rejects duplicate synchronous clicks and undo score farming', () => {
  const hook = prepare();
  const game = hook.result.current;
  const card = game.visibleHand.find(c => c.group !== 'fake');
  act(() => { game.handleCardSelect(card); game.handleCardSelect(card); });
  expect(hook.result.current.tower).toHaveLength(1);
  const score = hook.result.current.score;
  act(() => hook.result.current.handleUndo());
  act(() => hook.result.current.handleCardSelect(hook.result.current.hand.find(c => c.id === card.id)));
  expect(hook.result.current.score).toBe(score);
});
it('home cancels phase callbacks and never resumes the previous game', () => {
  const hook = prepare();
  for (let i = 0; i < 4; i++) {
    const g = hook.result.current;
    const card = g.visibleHand.find(c => c.group !== 'fake' && (!g.activeLogicGroup || c.group === g.activeLogicGroup));
    act(() => g.handleCardSelect(card));
  }
  act(() => hook.result.current.goHome());
  act(() => vi.advanceTimersByTime(60000));
  expect(hook.result.current.gameState).toBe('start');
  expect(hook.result.current.tower).toHaveLength(0);
});
it('timer damages only active questions and stops at game over', () => {
  const hook = prepare('homework', 'affirmative', 'easy', false, true);
  act(() => vi.advanceTimersByTime(80000));
  expect(hook.result.current.gameState).toBe('gameover');
  expect(hook.result.current.playerHP).toBe(0);
  act(() => vi.advanceTimersByTime(100000));
  expect(hook.result.current.gameState).toBe('gameover');
});
it('awards no speed bonus with the timer off and adds the difficulty only once', () => {
  expect(calculateAward({ basePoints: 100, elapsed: 0, limit: 10, difficulty: 'hard', combo: 2, timerEnabled: false }))
    .toEqual({ base: 200, timeBonus: 0, comboBonus: 40 });
});
it('separates records for different settings and handles corrupt or blocked storage', () => {
  const key = scoreKey({ mode: 'area' });
  expect(key).not.toBe(scoreKey({ mode: 'logic_link' }));
  localStorage.setItem(key, '{}');
  expect(readScores(key)).toEqual([]);
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked'); });
  expect(saveLocalScore(key, { score: 10 }).saved).toBe(false);
  spy.mockRestore();
});
it('normalizes legacy attacks and closing without inventing negative exercises', () => {
  const topic = normalizeTopic({ rebuttal: { attack: { text: 'Opposition' }, options: [{ judgment: 'perfect' }] }, closing: { options: [{ judgment: 'perfect' }] } });
  expect(topic.rebuttal.affirmative[0].text).toBe('Opposition');
  expect(topic.closing.affirmative).toHaveLength(1);
  expect(topic.rebuttal.negative).toEqual([]);
});
it('keeps the same question available after an incorrect answer', () => {
  const hook = prepare();
  for (let i = 0; i < 4; i++) choose(hook);
  expect(hook.result.current.gameState).toBe('cross_exam');
  const rival = hook.result.current.rivalCard;
  const wrong = hook.result.current.hand.find(c => c.judgment === 'weak');
  act(() => hook.result.current.handleCardSelect(wrong));
  act(() => vi.advanceTimersByTime(1500));
  expect(hook.result.current.gameState).toBe('cross_exam');
  expect(hook.result.current.rivalCard).toEqual(rival);
  expect(hook.result.current.hand.some(c => c.judgment === 'correct')).toBe(true);
  expect(hook.result.current.mistakes).toHaveLength(1);
});
it('logic-link mode completes without cross examination', () => {
  const hook = prepare();
  act(() => hook.result.current.goHome());
  act(() => {
    hook.result.current.setSelectedTopicId('homework');
    hook.result.current.setUserStance('negative');
    hook.result.current.setDifficulty('hard');
    hook.result.current.setGameMode('logic_link');
  });
  act(() => hook.result.current.initGame());
  const states = [];
  for (let step = 0; step < 15 && hook.result.current.gameState !== 'result'; step++) {
    states.push(hook.result.current.gameState);
    choose(hook);
  }
  expect(hook.result.current.gameState).toBe('result');
  expect(states).not.toContain('cross_exam');
});
it('image and undo cannot repeatedly award image points', () => {
  const hook = prepare('homework', 'affirmative', 'easy', true);
  const initial = hook.result.current.visibleHand.find(c => c.group !== 'fake');
  act(() => hook.result.current.handleCardSelect(initial));
  const imagePhase = hook.result.current;
  act(() => { imagePhase.handleImageSelect(initial.image_url); imagePhase.handleImageSelect(initial.image_url); });
  const score = hook.result.current.score;
  expect(hook.result.current.tower).toHaveLength(1);
  act(() => hook.result.current.handleUndo());
  act(() => hook.result.current.handleCardSelect(hook.result.current.hand.find(c => c.id === initial.id)));
  act(() => hook.result.current.handleImageSelect(initial.image_url));
  expect(hook.result.current.score).toBe(score);
});


it('prevents repeated wrong structure taps from draining HP before feedback finishes', () => {
  const hook = prepare();
  const wrong = hook.result.current.hand.find(c => c.type !== 'assertion' && c.group !== 'fake');
  expect(wrong).toBeDefined();
  const hp = hook.result.current.playerHP;
  act(() => { hook.result.current.handleCardSelect(wrong); hook.result.current.handleCardSelect(wrong); hook.result.current.handleCardSelect(wrong); });
  expect(hook.result.current.playerHP).toBeLessThan(hp);
  const once = hook.result.current.playerHP;
  act(() => hook.result.current.handleCardSelect(wrong));
  expect(hook.result.current.playerHP).toBe(once);
  act(() => vi.advanceTimersByTime(650));
  act(() => hook.result.current.handleCardSelect(wrong));
  expect(hook.result.current.playerHP).toBeLessThan(once);
});

it('prevents repeated wrong image taps and allows correction after feedback', () => {
  const hook = prepare('homework', 'affirmative', 'easy', true);
  const first = hook.result.current.visibleHand.find(c => c.group !== 'fake' && c.image_url);
  expect(first).toBeDefined();
  act(() => hook.result.current.handleCardSelect(first));
  const image = hook.result.current;
  expect(image.gameState).toBe('construct_image');
  const wrongUrl = image.imageHand.find(url => url !== image.pendingCard.image_url);
  const originalHP = image.playerHP;
  act(() => {
    image.handleImageSelect(wrongUrl);
    image.handleImageSelect(wrongUrl);
    image.handleImageSelect(wrongUrl);
  });
  expect(hook.result.current.playerHP).toBe(originalHP - 25);
  const correctUrl = hook.result.current.pendingCard.image_url;
  act(() => hook.result.current.handleImageSelect(correctUrl));
  expect(hook.result.current.gameState).toBe('construct_image');
  act(() => vi.advanceTimersByTime(650));
  act(() => hook.result.current.handleImageSelect(correctUrl));
  expect(hook.result.current.gameState).toBe('construct');
  expect(hook.result.current.tower).toHaveLength(1);
});


it('pauses active question timers while confirming an exit, then resumes fairly', () => {
  const hook = prepare('homework', 'affirmative', 'easy', false, true);
  const hp = hook.result.current.playerHP;
  act(() => hook.result.current.pauseGame());
  act(() => vi.advanceTimersByTime(65000));
  expect(hook.result.current.playerHP).toBe(hp);
  act(() => hook.result.current.resumeGame());
  act(() => vi.advanceTimersByTime(10500));
  expect(hook.result.current.playerHP).toBeLessThan(hp);
});

it('resets pause and current result identifiers on a fresh game', () => {
  const hook = prepare('homework', 'affirmative', 'easy', false, true);
  act(() => hook.result.current.pauseGame());
  expect(hook.result.current.isPaused).toBe(true);
  act(() => hook.result.current.goHome());
  expect(hook.result.current.isPaused).toBe(false);
  expect(hook.result.current.resultRecordId).toBe(null);
  act(() => {
    hook.result.current.setSelectedTopicId('homework');
    hook.result.current.setUserStance('affirmative');
    hook.result.current.setDifficulty('easy');
  });
  act(() => hook.result.current.initGame());
  expect(hook.result.current.isPaused).toBe(false);
  expect(hook.result.current.gameState).toBe('construct');
});

it('returns to topic picker with language and difficulty preserved', () => {
  const hook = prepare('homework', 'negative', 'hard');
  act(() => hook.result.current.goToSetup());
  expect(hook.result.current.gameState).toBe('start');
  expect(hook.result.current.setupStep).toBe(3);
  expect(hook.result.current.selectedTopicId).toBe(null);
  expect(hook.result.current.userStance).toBe('negative');
  expect(hook.result.current.difficulty).toBe('hard');
});
