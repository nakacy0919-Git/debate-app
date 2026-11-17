// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readFileSync } from 'node:fs';
import { getAllTopics } from '../src/utils/dataLoader.js';
import { SmartText } from '../src/components/UI/SmartText.jsx';
import { ReviewMode } from '../src/components/Game/ReviewMode.jsx';
import App from '../src/App.jsx';

it('preserves whitespace and punctuation in the reading text', () => {
  const text = 'Hello, world!  Why? (Yes.)';
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<SmartText text={text} />);
  expect(container.textContent).toBe(text);
});
it('renders the start screen', () => {
  expect(renderToStaticMarkup(<App />)).toContain('日本語');
});
describe('all topic references', () => {
  for (const topic of getAllTopics()) {
    it(`${topic.id} has accessible local illustrations and renders Japanese review`, () => {
      function inspect(value) {
        if (!value || typeof value !== 'object') return;
        if (value.image_url?.startsWith('/')) expect(existsSync(`public${value.image_url}`), value.image_url).toBe(true);
        Object.values(value).forEach(inspect);
      }
      inspect(topic);
      expect(() => renderToStaticMarkup(<ReviewMode topic={topic} onClose={() => {}} langMode="ja" difficulty="hard" />)).not.toThrow();
    });
  }
});
it('production configuration prevents outbound cloud score requests and framing', () => {
  const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
  const headers = config.hosting.headers[0].headers;
  expect(headers.find(h => h.key === 'Content-Security-Policy').value).toContain("connect-src 'self'");
  expect(headers.find(h => h.key === 'Content-Security-Policy').value).toContain("frame-ancestors 'none'");
  expect(readFileSync(config.firestore.rules, 'utf8')).toContain('allow read, write: if false');
});


describe('two-sided debate curriculum completeness', () => {
  for (const topic of getAllTopics()) for (const stance of ['affirmative', 'negative']) {
    it(`${topic.id} / ${stance} supports three full, non-repeated rounds`, () => {
      const questions = topic.crossExam[stance];
      const rebuttals = topic.rebuttal[stance];
      const closings = topic.closing[stance];
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(rebuttals.length).toBeGreaterThanOrEqual(3);
      expect(closings.length).toBeGreaterThanOrEqual(6);

      const line = value => typeof value === 'string' ? value : value?.easy || '';
      const questionTexts = questions.map(item => line(item.question?.text));
      const rebuttalTexts = rebuttals.map(item => line(item.text));
      expect(new Set(questionTexts).size).toBe(questions.length);
      expect(new Set(rebuttalTexts).size).toBe(rebuttals.length);

      for (const [phase, rounds] of [['cross', questions], ['rebuttal', rebuttals]]) {
        for (const round of rounds) {
          const opts = round.options || [];
          expect(opts.length, `${topic.id} ${stance} ${phase}`).toBeGreaterThanOrEqual(6);
          expect(opts.filter(o => ['correct', 'perfect'].includes(o.judgment))).toHaveLength(1);
          expect(opts.filter(o => o.judgment === 'weak').length).toBeGreaterThanOrEqual(5);
          expect(line(phase === 'cross' ? round.question?.text : round.text).trim()).not.toBe('');
          expect(line(phase === 'cross' ? round.question?.textJP : round.textJP).trim()).not.toBe('');
          for (const option of opts) {
            expect(line(option.text).trim()).not.toBe('');
            expect(line(option.textJP).trim()).not.toBe('');
          }
        }
      }
      expect(closings.filter(o => o.judgment === 'perfect')).toHaveLength(1);
      expect(closings.filter(o => o.judgment === 'weak').length).toBeGreaterThanOrEqual(5);
    });
  }
});
