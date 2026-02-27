import React from 'react';
import { Home, Globe2, BookOpen, Clock, Zap, Flame, Trophy } from 'lucide-react';
import { MAX_HP } from '../../constants';

export function GameHeader({
  goHome, playerHP, langMode, currentTopic, userStance, battleRounds, gameState,
  currentRoundIndex, showJapanese, timerEnabled, timeProgress, setFontSize, setShowRules, setShowJapanese, playSound,
  combo, score // 💡 修正：scoreを受け取る
}) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-3 md:p-4 border-b border-white/10 flex justify-between items-center shadow-lg relative z-50">
      
      {/* 左ブロック：ホームボタン、HPバー、コンボ */}
      <div className="flex items-center gap-3 md:gap-4 w-1/3">
        <button onClick={goHome} className="p-2 bg-slate-800 rounded-full hover:bg-rose-600 text-white transition-colors border border-white/20 shadow-md shrink-0">
          <Home size={20} />
        </button>
        <div className="flex flex-col gap-1 w-full max-w-[200px]">
          <div className="flex justify-between text-xs font-black text-white">
            <span className="text-cyan-400">YOU</span>
            <span>{playerHP} / {MAX_HP}</span>
          </div>
          <div className="h-3 md:h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-white/20 shadow-inner">
            <div className={`h-full transition-all duration-300 ${playerHP > 60 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : playerHP > 30 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} style={{ width: `${(playerHP / MAX_HP) * 100}%` }} />
          </div>
          
          {/* 💡 修正②：コンボ表示をド派手＆巨大化！ */}
          <div className="h-8 mt-1 flex items-center overflow-visible">
              {combo > 1 && (
                  <div className="flex items-center gap-1 md:gap-2 text-orange-400 font-black animate-in slide-in-from-left-4 fade-in duration-300 drop-shadow-[0_0_15px_rgba(249,115,22,1)] whitespace-nowrap">
                      <Flame className="w-5 h-5 md:w-8 md:h-8 animate-pulse fill-current text-yellow-400" />
                      <span className="text-lg md:text-2xl italic tracking-wider">{combo} COMBO!</span>
                      <span className="text-xs md:text-sm ml-1 opacity-90 bg-orange-950/50 px-2 py-0.5 rounded-full border border-orange-500/50">x{(1.0 + (combo - 1) * 0.1).toFixed(1)}</span>
                  </div>
              )}
          </div>
        </div>
      </div>

      {/* 中央ブロック：テーマ、ラウンド、タイマー */}
      <div className="flex flex-col items-center justify-center w-1/3">
        <div className="text-xs md:text-sm font-black text-slate-400 flex items-center gap-2 tracking-widest uppercase mb-1 drop-shadow-md">
          <Globe2 className="w-4 h-4 text-blue-400" /> {langMode === 'ja' ? currentTopic.titleJP : currentTopic.title}
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-black shadow-inner border ${userStance === 'affirmative' ? 'bg-blue-900/50 text-blue-300 border-blue-500/50' : 'bg-red-900/50 text-red-300 border-red-500/50'}`}>
            {userStance === 'affirmative' ? 'AFFIRMATIVE' : 'NEGATIVE'}
          </div>
          {gameState !== 'construct' && gameState !== 'construct_image' && gameState !== 'closing' && (
             <div className="text-[10px] md:text-xs font-black text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-500/30">
               ROUND {currentRoundIndex + 1} / {battleRounds}
             </div>
          )}
          {gameState === 'closing' && (
             <div className="text-[10px] md:text-xs font-black text-fuchsia-400 bg-fuchsia-900/30 px-3 py-1 rounded-full border border-fuchsia-500/30 flex items-center gap-1"><Zap size={12}/> FINAL</div>
          )}
        </div>
        
        {timerEnabled && (
            <div className="w-full max-w-[250px] mt-2 flex items-center gap-2">
                <Clock className={`w-3 h-3 md:w-4 md:h-4 shrink-0 ${timeProgress > 80 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}/>
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-100 ${timeProgress > 80 ? 'bg-red-500' : 'bg-pink-500'}`} style={{ width: `${timeProgress}%` }}/>
                </div>
            </div>
        )}
      </div>

      {/* 右ブロック：スコア常時表示、設定ボタン */}
      <div className="flex gap-2 w-1/3 justify-end items-start md:items-center">
        
        {/* 💡 修正③：スコアを常時表示し、やる気を引き出す！ */}
        <div className="flex flex-col items-end mr-2 md:mr-4 bg-slate-950/80 px-3 py-1 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-[9px] md:text-[10px] font-black text-cyan-400 tracking-widest uppercase mb-0.5 flex items-center gap-1">
                <Trophy size={10}/> SCORE
            </span>
            <span className="text-lg md:text-2xl font-black text-white leading-none">
                {score.toLocaleString()}
            </span>
        </div>

        <div className="flex gap-2">
            <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); }} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-black text-xs md:text-sm transition-colors shadow-lg ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-300 hover:text-white'}`}>JP</button>
            <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-500 text-slate-300 hover:text-white transition-colors shadow-lg font-bold text-xs md:text-sm">T</button>
            <button onClick={() => { playSound('click'); setShowRules(true); }} className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-500 text-slate-300 hover:text-white transition-colors shadow-lg"><BookOpen className="w-4 h-4 md:w-5 md:h-5" /></button>
        </div>
      </div>
    </div>
  );
}