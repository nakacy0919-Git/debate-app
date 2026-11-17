import { useCallback } from 'react';
const SOUND_FILES = { damage: 'wrong', click: 'click', clear: 'clear', correct: 'correct', wrong: 'wrong', gameover: 'gameover' };
export const useSound = (enabledRef) => {
  const playSound = useCallback((name) => {
    if (!enabledRef.current || !SOUND_FILES[name]) return;
    const audio = new Audio(`/sounds/${SOUND_FILES[name]}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, [enabledRef]);
  return { playSound };
};
