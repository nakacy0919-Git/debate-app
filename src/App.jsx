import React, { useEffect, useRef, useState } from 'react';
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
    bgmEnabled, bgmTrack, ttsVoiceType, combo, floatingTexts,
    isResizing, imageSize, setImageSize
  } = game;

  const theme = THEMES.techno;
  const bgmRef = useRef(null);
  
  // 💡 リサイズ用のRef
  const containerRef = useRef(null);
  const panelRef = useRef(null); 
  
  const [isDragging, setIsDragging] = useState(false);
  const currentWidthRef = useRef(game.sidePanelWidth);

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

  // 💡 究極の超軽量リサイズ処理：ドラッグ中はReactを通さず直接幅を変え、フリーズを100%防ぐ
  const startResizing = (e) => {
    isResizing.current = true;
    setIsDragging(true);
    document.body.style.userSelect = 'none'; // 文字選択を防ぐ
  };

  const stopResizing = () => {
    if (isResizing.current) {
        isResizing.current = false;
        setIsDragging(false);
        document.body.style.userSelect = '';
        // 最後に手を離した時だけ、Reactのデータを更新する（負荷ゼロ）
        game.setSidePanelWidth(currentWidthRef.current);
    }
  };

  const resize = (e) => {
    if (!isResizing.current || !containerRef.current) return;
    
    let clientX = e.clientX;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    }
    if (clientX === undefined) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newWidthRatio;

    if (game.sidePanelPos === 'left') {
        newWidthRatio = ((clientX - containerRect.left) / containerRect.width) * 100;
    } else {
        newWidthRatio = ((containerRect.right - clientX) / containerRect.width) * 100;
    }

    if (newWidthRatio >= 25 && newWidthRatio <= 70) {
        currentWidthRef.current = newWidthRatio;
        // 💡 直接スタイルを書き換えることで、再描画の嵐（フリーズ）を完全回避
        if (panelRef.current) {
            panelRef.current.style.width = `${newWidthRatio}%`;
        }
    }
  };

  // マウスが画面のどこに行っても追跡する
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize, { passive: false });
    window.addEventListener('touchend', stopResizing);

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [game.sidePanelPos]);

  if (topics.length === 0) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;
  if (gameState === 'review') return <ReviewMode topic={currentTopic} onClose={() => { playSound('click'); goHome(); }} showJapanese={showJapanese} langMode={langMode} difficulty={game.difficulty || 'easy'} />;

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} font-sans flex flex-col overflow-hidden relative ${FONT_SIZES[fontSize]} ${shake ? 'animate-shake' : ''}`}>
      
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0 pointer-events-none" style={{ backgroundImage: "url('/images/background.webp')" }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#1e1b4b]/80 to-[#0f172a]/90 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        
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
                <div key={t.id} className="absolute flex flex-col items-center animate-float-up-burst" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                    {t.comboStr && (
                        <div className="text-orange-400 font-black text-xl md:text-3xl flex items-center gap-1 mb-1 drop-shadow-[0_0_15px_rgba(251,146,60,1)] animate-bounce">
                            <Flame className="w-6 h-6 md:w-8 md:h-8 fill-current"/>
                            {t.comboStr}
                        </div>
                    )}
                    <div className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] ${t.comboStr ? 'text-5xl md:text-7xl scale-125' : 'text-3xl md:text-5xl'}`}>
                        {t.text}
                    </div>
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
            imageSize={imageSize} setImageSize={setImageSize} 
          />
        )}

        {gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
          <div ref={containerRef} className={`flex-1 flex overflow-hidden relative game-core-layout ${game.sidePanelPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            <div className="flex-1 overflow-hidden">
               <BattleBoard game={game} />
            </div>

            <div 
               className={`w-3 md:w-4 bg-slate-900 border-x border-cyan-500/50 hover:bg-cyan-500 cursor-col-resize flex items-center justify-center transition-colors z-40 touch-none flex-shrink-0 game-resizer shadow-[0_0_20px_rgba(6,182,212,0.5)] ${isDragging ? 'bg-cyan-500 border-white' : ''}`}
               onMouseDown={startResizing}
               onTouchStart={startResizing}
            >
               <div className="w-1 h-20 bg-white/80 rounded-full pointer-events-none" />
            </div>

            {/* 💡 panelRefを追加。Reactを通さず直接幅を書き換える対象 */}
            <div ref={panelRef} style={{ width: `${game.sidePanelWidth}%` }} className="overflow-hidden flex-shrink-0 bg-slate-900/80 backdrop-blur-md game-hand-panel-container z-30 shadow-[-20px_0_30px_rgba(0,0,0,0.5)]">
               <HandPanel game={game} playSound={playSound} />
            </div>
            
          </div>
        )}

        {/* 💡 ドラッグ中だけ画面全体を透明な下敷きで覆い、文字選択や画像の干渉を完全にブロック */}
        {isDragging && (
            <div className="fixed inset-0 z-[9999] cursor-col-resize touch-none" />
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
      </div>

      <style>{`
        @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-xy { background-size: 400% 400%; animation: gradient-xy 15s ease infinite; }
        @keyframes shake-screen { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .animate-shake { animation: shake-screen 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes pop-in-out { 0% { opacity: 0; transform: scale(0.3); } 20% { opacity: 1; transform: scale(1.1); } 30% { transform: scale(1.0); } 80% { opacity: 1; transform: scale(1.0); } 100% { opacity: 0; transform: scale(0.8); } }
        .animate-pop-in-out { animation: pop-in-out 0.8s ease-in-out forwards; }
        @keyframes shake-card { 0%, 100% { transform: translateX(0); } 15% { transform: translateX(-12px); } 30% { transform: translateX(10px); } 45% { transform: translateX(-8px); } 60% { transform: translateX(6px); } 75% { transform: translateX(-4px); } }
        .animate-shake.ring-4 { animation: shake-card 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        
        /* 💡 自分の反論が下から相手に向かって突き上げる（激突） */
        @keyframes clash-up {
            0% { transform: translate(-50%, 100vh) scale(0.8); opacity: 0; }
            20% { transform: translate(-50%, 100vh) scale(0.8); opacity: 0; } /* わずかに待つ */
            40% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; filter: brightness(2); }
            60% { transform: translate(-50%, -40%) scale(1.05); opacity: 1; filter: brightness(1.2); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .animate-clash-up { animation: clash-up 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }

        /* 💡 相手のカードが激突されて粉々に砕け散る（粉砕） */
        @keyframes shatter {
            0% { transform: scale(1) rotate(0deg); filter: brightness(1); opacity: 1; }
            35% { transform: scale(1) rotate(0deg); filter: brightness(1); opacity: 1; } /* ぶつかるまで待つ */
            40% { transform: scale(1.1) rotate(-3deg); filter: brightness(2) contrast(2); }
            50% { transform: scale(1.15) rotate(3deg); filter: blur(2px) sepia(1) hue-rotate(-50deg); opacity: 1; }
            100% { transform: scale(0) translateY(-200px) rotate(45deg); filter: blur(20px) brightness(3); opacity: 0; }
        }
        .animate-shatter { animation: shatter 0.8s ease-out forwards; }

        @keyframes float-up-burst { 
            0% { opacity: 0; transform: translateY(20px) scale(0.5); filter: brightness(2); } 
            15% { opacity: 1; transform: translateY(0px) scale(1.3); filter: brightness(1.5); } 
            30% { transform: translateY(-10px) scale(1); filter: brightness(1); }
            80% { opacity: 1; transform: translateY(-60px) scale(1); }
            100% { opacity: 0; transform: translateY(-100px) scale(0.8); } 
        }
        .animate-float-up-burst { animation: float-up-burst 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15,23,42,0.8); }

        .game-hand-panel-container > div {
            max-width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
        }

        /* フリーズの原因だった恐ろしいCSSを完全に削除しました */

        @media (max-width: 1024px) and (orientation: portrait), (max-width: 767px) {
            .game-core-layout {
                flex-direction: column !important;
            }
            .game-core-layout > div.flex-1 {
                width: 100% !important;
                height: 50% !important;
                flex: none !important;
            }
            .game-hand-panel-container {
                width: 100% !important;
                height: 50% !important;
                border-top: 4px solid rgba(6, 182, 212, 0.8) !important;
            }
            .game-resizer {
                display: none !important;
            }
        }
      `}</style>
    </div>
  );
}