// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useGameLogic } from '../src/hooks/useGameLogic.js';
import { StartScreen } from '../src/components/Game/StartScreen.jsx';
import { GameHeader } from '../src/components/Game/GameHeader.jsx';
import { ResultScreen } from '../src/components/Game/ResultScreen.jsx';
import { BattleBoard } from '../src/components/Game/BattleBoard.jsx';
import { getAllTopics } from '../src/utils/dataLoader.js';

const noop = () => {};
describe('uncluttered lesson flows', () => {
  it('allows review from topic selection without unnecessary stance or difficulty', () => {
    const hook = renderHook(() => useGameLogic(noop));
    act(() => {
      hook.result.current.setGameMode('review');
      hook.result.current.setSelectedTopicId('homework');
    });
    expect(hook.result.current.userStance).toBeNull();
    expect(hook.result.current.difficulty).toBeNull();
    expect(hook.result.current.canStart).toBe(true);
    act(() => hook.result.current.initGame());
    expect(hook.result.current.gameState).toBe('review');
    cleanup();
  });

  it('shows only topics in review setup and supports searching', () => {
    const hook = renderHook(() => useGameLogic(noop));
    act(() => {
      hook.result.current.setGameMode('review');
      hook.result.current.setSelectedTopicId('homework');
    });
    const markup = renderToStaticMarkup(<StartScreen game={{ ...hook.result.current, setupStep: 3 }} playSound={noop} />);
    expect(markup).toContain('テーマを検索');
    expect(markup).toContain('ENTER REVIEW');
    expect(markup).not.toContain('Your Stance');
    expect(markup).not.toContain('Battle Rounds');
    cleanup();
  });

  it('removes obsolete news, BGM selections and mandatory profile step', () => {
    const hook = renderHook(() => useGameLogic(noop));
    const setup = renderToStaticMarkup(<StartScreen game={{ ...hook.result.current, setupStep: 2 }} playSound={noop} />);
    expect(setup).toContain('2. Game Mode');
    expect(setup).not.toContain('Practice Profile');
    expect(setup).not.toContain('NEWS & UPDATES');
    const final = renderToStaticMarkup(<StartScreen game={{ ...hook.result.current, setupStep: 3 }} playSound={noop} />);
    expect(final).toContain('ニックネームを設定');
    expect(final).not.toContain('BGM (音源未登録)');
    cleanup();
  });

  it('shows the selected stance once and shows Japanese title only when enabled', () => {
    const props = {
      goHome: noop, playerHP: 100, langMode: 'en', currentTopic: getAllTopics()[0],
      userStance: 'negative', gameState: 'cross_exam', battleRounds: 3, currentRoundIndex: 1,
      showJapanese: false, imageMatchEnabled: false, timerEnabled: false, timeProgress: 0,
      setFontSize: noop, setShowJapanese: noop, setImageSize: noop, playSound: noop,
      combo: 0, score: 0,
    };
    const markup = renderToStaticMarkup(<GameHeader {...props} />);
    expect(markup).toContain('NEGATIVE');
    expect(markup).not.toContain('AFFIRMATIVE');
    expect(markup).not.toContain(props.currentTopic.titleJP);
    expect(markup).not.toContain('画像サイズ変更');
    const withJapanese = renderToStaticMarkup(<GameHeader {...props} showJapanese />);
    expect(withJapanese).toContain(props.currentTopic.titleJP);
  });

  it('keeps instructions only in the choice panel, not twice on the battle board', () => {
    const topic = getAllTopics()[0];
    const markup = renderToStaticMarkup(<BattleBoard game={{
      gameState: 'cross_exam_image', gameMode: 'area', tower: [1, 2, 3, 4],
      difficulty: 'easy', langMode: 'en', currentTopic: topic,
      rivalCard: { text: 'Can you explain your reason?', textJP: '理由は？', isQuestion: true },
      pendingCard: { text: 'Here is my example.', textJP: '例です。' },
      fontSize: 'normal', showSuccessOverlay: false,
    }} />);
    const board = document.createElement('div');
    board.innerHTML = markup;
    expect(board.textContent).toContain('Here is my example.');
    expect(markup).not.toContain('SELECT MATCHING IMAGE');
    expect(markup).not.toContain('右のパネル');
  });

  it('provides replay and change-topic actions without an always-expanded leaderboard', () => {
    const topic = getAllTopics()[0];
    const markup = renderToStaticMarkup(<ResultScreen
      gameState="result" score={100} activeLogicGroup={null} currentTopic={topic}
      userStance="affirmative" langMode="en" difficulty="easy" showJapanese={false}
      onRetry={noop} onChangeTopic={noop} mistakes={[]}
      fontSize="normal" setFontSize={noop} setShowJapanese={noop} playSound={noop}
      scoreDetails={{ base: 100, timeBonus: 0, comboBonus: 0, perfect: 0 }}
      maxCombo={1} leaderboard={[{ id: 'saved1', score: 90, name: 'Anonymous', date: '2026/11/18', location: '' }]}
      storageNotice=""
    />);
    expect(markup).toContain('TRY AGAIN');
    expect(markup).toContain('CHANGE TOPIC');
    expect(markup).toContain('<details');
    expect(markup).toContain('PRACTICE CLEAR');
  });
  it('does not mark an older identical score as this attempt’s new record', () => {
    const topic = getAllTopics()[0];
    const props = {
      gameState: 'result', score: 100, activeLogicGroup: null, currentTopic: topic,
      userStance: 'affirmative', langMode: 'en', difficulty: 'easy', showJapanese: false,
      onRetry: noop, onChangeTopic: noop, mistakes: [], fontSize: 'normal',
      setFontSize: noop, setShowJapanese: noop, playSound: noop,
      scoreDetails: { base: 100, timeBonus: 0, comboBonus: 0, perfect: 0 },
      maxCombo: 1, leaderboard: [
        { id: 'older', score: 100, name: 'Anonymous', date: '2026/11/17', location: '' },
        { id: 'current', score: 100, name: 'Anonymous', date: '2026/11/18', location: '' },
      ], storageNotice: '',
    };
    const html = renderToStaticMarkup(<ResultScreen {...props} resultRecordId="current" />);
    expect(html).not.toContain('NEW RECORD!');
    const top = renderToStaticMarkup(<ResultScreen {...props} resultRecordId="older" />);
    expect(top).toContain('NEW RECORD!');
  });

});
