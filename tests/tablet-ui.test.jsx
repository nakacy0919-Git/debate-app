// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameHeader } from '../src/components/Game/GameHeader.jsx';
import { HandPanel } from '../src/components/Game/HandPanel.jsx';
import App from '../src/App.jsx';

const noop = () => {};

function header(state, index) {
  return renderToStaticMarkup(
    <GameHeader
      goHome={noop}
      playerHP={100}
      langMode="en"
      currentTopic={{ title: 'Sample Debate', titleJP: '討論' }}
      userStance="negative"
      gameState={state}
      battleRounds={6}
      currentRoundIndex={index}
      showJapanese={false}
      timerEnabled={false}
      timeProgress={0}
      setFontSize={noop}
      setShowJapanese={noop}
      playSound={noop}
      combo={0}
      score={1250}
      setImageSize={noop}
    />
  );
}

describe('tablet and touch controls', () => {
  it('announces the current round and the closing stage', () => {
    expect(header('cross_exam', 5)).toContain('ROUND 6 / 6');
    expect(header('closing', 6)).toContain('FINAL');
    expect(header('construct', 0)).toContain('ARGUMENT');
    expect(header('cross_exam', 5)).toContain('aria-label="ホームへ戻る"');
  });

  it('only enables Undo while building an argument', () => {
    const game = {
      visibleHand: [], imageHand: [], gameState: 'cross_exam', handleCardSelect: noop,
      handleImageSelect: noop, difficulty: 'easy', langMode: 'en',
      currentTopic: { vocabulary: [] }, handleUndo: noop, tower: [{ id: 'a' }],
      activeLogicGroup: null, sidePanelPos: 'right', setSidePanelPos: noop,
      imageSize: 'normal', fontSize: 'normal',
    };
    const cross = renderToStaticMarkup(<HandPanel game={game} playSound={noop} />);
    expect(cross).toMatch(/title="一手戻る \(Undo\)"[^>]*disabled/);
    const construct = renderToStaticMarkup(<HandPanel game={{ ...game, gameState: 'construct' }} playSound={noop} />);
    expect(construct).not.toMatch(/title="一手戻る \(Undo\)"[^>]*disabled/);
  });

  it('uses smaller image tiles so choices fit side by side on a tablet', () => {
    const game = {
      visibleHand: [], imageHand: ['/images/fake_1.webp', '/images/fake_2.webp'],
      gameState: 'construct_image', handleCardSelect: noop, handleImageSelect: noop,
      difficulty: 'easy', langMode: 'en', currentTopic: { vocabulary: [] },
      handleUndo: noop, tower: [], activeLogicGroup: null, sidePanelPos: 'right',
      setSidePanelPos: noop, imageSize: 'normal', fontSize: 'normal',
    };
    const html = renderToStaticMarkup(<HandPanel game={game} playSound={noop} />);
    expect(html).toContain('140px');
    expect(html).toContain('aria-label="画像選択肢 1"');
    expect(html).toContain('aria-label="画像選択肢 2"');
  });

  it('provides dynamic viewport height and reduced-motion support', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('100dvh');
    expect(html).toContain('prefers-reduced-motion');
  });
});
