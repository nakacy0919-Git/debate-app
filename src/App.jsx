import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

import { useSound } from './hooks/useSound';
import { useGameLogic } from './hooks/useGameLogic';

import { StartScreen } from './components/Game/StartScreen';
import { GameHeader } from './components/Game/GameHeader';
import { BattleBoard } from './components/Game/BattleBoard';
import { HandPanel } from './components/Game/HandPanel';
import { ResultScreen } from './components/Game/ResultScreen';
import { RuleBook } from './components/Game/RuleBook';
import { VocabDrill } from './components/Game/VocabDrill';
import { ReviewMode } from './components/Game/ReviewMode';

import { THEMES, FONT_SIZES } from './constants';

export default function App() {
  const { playSound } = useSound();
  const game = useGameLogic(playSound);

  const {
    topics, gameState, isDrillMode, currentTopic, showRules, showSuccessOverlay,
    shake, fontSize, feedback, particles, goHome,
    playerHP, langMode, userStance, battleRounds, currentRoundIndex,
    showJapanese, timerEnabled, timeProgress, setFontSize, setShowRules, setShowJapanese,
    bgmEnabled, bgmTrack, ttsVoiceType, combo, floatingTexts 
  } = game;

  const theme = THEMES.techno;
  
  const bgmRef = useRef(null);
  useEffect(() => {
    const isPlayingGame = gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && !isDrillMode;
    
    if (bgmEnabled && isPlayingGame) {
        if (!bgmRef.current) {
            bgmRef.current = new Audio(`/audio/${bgmTrack}.mp3`);
            bgmRef.current.loop = true;
        }
        bgmRef.current.play().catch(e => console.log("BGM Play Error:", e));
    } else {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0; 
        }
    }
  }, [gameState, bgmEnabled, bgmTrack, isDrillMode]);

  if (topics.length === 0) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;
  if (gameState === 'review') return <ReviewMode topic={currentTopic} onClose={() => { playSound('click'); goHome(); }} showJapanese={showJapanese} langMode={langMode} difficulty={game.difficulty || 'easy'} />;

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} font-sans flex flex-col overflow-hidden ${FONT_SIZES[fontSize]} ${shake ? 'animate-shake' : ''}`}>
      
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none animate-pop-in-out">
          <div className="w-48 h-48 md:w-72 md:h-72 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.8)] border-4 border-white/40 backdrop-blur-md relative">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
            <CheckCircle2 className="w-32 h-32 md:w-48 md:h-48 text-white drop-shadow-2xl" strokeWidth={3} />
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-[300] overflow-hidden">
          {floatingTexts.map(t => (
              <div key={t.id} className="absolute flex flex-col items-center animate-float-up drop-shadow-[0_0_10px_rgba(34,211,238,1)]" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                  {t.comboStr && <div className="text-orange-400 font-black text-sm md:text-base flex items-center gap-1 mb-1"><Flame className="w-4 h-4"/>{t.comboStr}</div>}
                  <div className="text-cyan-300 font-black text-3xl md:text-5xl">{t.text}</div>
              </div>
          ))}
      </div>

      <StartScreen game={game} playSound={playSound} />

      {gameState !== 'start' && (
        <GameHeader 
          goHome={() => { playSound('click'); goHome(); }}
          playerHP={playerHP} langMode={langMode} currentTopic={currentTopic}
          userStance={userStance} battleRounds={battleRounds} gameState={gameState}
          currentRoundIndex={currentRoundIndex} showJapanese={showJapanese}
          timerEnabled={timerEnabled} timeProgress={timeProgress} setFontSize={setFontSize}
          setShowRules={setShowRules} setShowJapanese={setShowJapanese} playSound={playSound}
          combo={combo} score={game.score} 
        />
      )}

      {/* 💡 修正: クラスに `game-core-layout` を追加してスマホ用の制御を可能にしました */}
      {gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
        <div className={`flex-1 flex overflow-hidden relative game-core-layout ${game.sidePanelPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
          <BattleBoard game={game} />
          <HandPanel game={game} playSound={playSound} />
        </div>
      )}

      {showRules && <RuleBook onClose={() => { playSound('click'); setShowRules(false); }} />}
      {isDrillMode && <VocabDrill topics={topics} onClose={() => { playSound('click'); game.setIsDrillMode(false); }} playSound={playSound} ttsVoiceType={ttsVoiceType} />}

      <ResultScreen 
        gameState={gameState} score={game.score} activeLogicGroup={game.activeLogicGroup}
        currentTopic={currentTopic} userStance={userStance} langMode={langMode}
        difficulty={game.difficulty} showJapanese={showJapanese} goHome={() => { playSound('click'); goHome(); }}
        mistakes={game.mistakes} fontSize={fontSize} setFontSize={setFontSize} setShowJapanese={setShowJapanese} playSound={playSound}
        scoreDetails={game.scoreDetails} maxCombo={game.maxCombo} 
        leaderboard={game.leaderboard} 
      />

      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (<div key={p.id} className={`absolute rounded-full ${p.color} animate-particle shadow-lg`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${10 * p.scale}px`, height: `${10 * p.scale}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }} />))}
      </div>
      
      {feedback && (
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none w-full flex justify-center">
            <div className={`px-10 py-6 rounded-xl backdrop-blur-md text-white font-black text-2xl md:text-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in flex items-center gap-4 ${feedback.type === 'damage' ? 'bg-red-600/90 border-4 border-red-400' : 'bg-blue-600/90 border-4 border-blue-400'}`}>
               {feedback.type === 'damage' ? <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md"/> : <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md"/>}<span className="drop-shadow-md">{feedback.msg}</span>
            </div>
         </div>
      )}

      <style>{`
        @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-xy { background-size: 400% 400%; animation: gradient-xy 15s ease infinite; }
        @keyframes shake-screen { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .animate-shake { animation: shake-screen 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes pop-in-out { 0% { opacity: 0; transform: scale(0.3); } 20% { opacity: 1; transform: scale(1.1); } 30% { transform: scale(1.0); } 80% { opacity: 1; transform: scale(1.0); } 100% { opacity: 0; transform: scale(0.8); } }
        .animate-pop-in-out { animation: pop-in-out 0.8s ease-in-out forwards; }
        @keyframes shake-card { 0%, 100% { transform: translateX(0); } 15% { transform: translateX(-12px); } 30% { transform: translateX(10px); } 45% { transform: translateX(-8px); } 60% { transform: translateX(6px); } 75% { transform: translateX(-4px); } }
        .animate-shake.ring-4 { animation: shake-card 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes float-up { 
            0% { opacity: 0; transform: translateY(20px) scale(0.8); } 
            20% { opacity: 1; transform: translateY(0) scale(1.2); } 
            100% { opacity: 0; transform: translateY(-80px) scale(1); } 
        }
        .animate-float-up { animation: float-up 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30,41,59,0.5); }

        /* 📱 魔法のレスポンシブCSS：スマホ・タブレット(iPad縦)の時に自動でレイアウトを最適化 */
        @media (max-width: 1024px) {
            .game-core-layout {
                flex-direction: column !important;
            }
            /* バトル盤（上部） */
            .game-core-layout > div:first-of-type {
                width: 100% !important;
                height: 55% !important;
                border-left: none !important;
                border-right: none !important;
            }
            /* 手札パネル（下部） */
            .game-core-layout > div:last-of-type {
                width: 100% !important;
                height: 45% !important;
                border-top: 3px solid rgba(6, 182, 212, 0.6) !important;
                border-left: none !important;
                border-right: none !important;
            }
            /* サイズ調整バーを非表示 */
            .game-core-layout [class*="cursor-col-resize"] {
                display: none !important;
            }
            /* 手札のカードを横スクロールにする */
            .game-core-layout > div:last-of-type [class*="overflow-y-auto"] {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                padding-bottom: 10px !important;
            }
            .game-core-layout > div:last-of-type [class*="overflow-y-auto"] > div {
                min-width: 280px !important;
                max-width: 300px !important;
                margin-right: 15px !important;
                margin-bottom: 0 !important;
                flex-shrink: 0 !important;
            }
            /* 画像選択クイズも横並びにする */
            .game-core-layout > div:last-of-type [class*="grid-cols-2"] {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                gap: 15px !important;
                padding-bottom: 10px !important;
            }
            .game-core-layout > div:last-of-type [class*="grid-cols-2"] > button {
                min-width: 240px !important;
                flex-shrink: 0 !important;
            }
        }
      `}</style>
    </div>
  );
}