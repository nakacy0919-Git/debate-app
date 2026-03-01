import React, { useEffect, useState } from 'react';
import { Home, Type, Menu, X, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { MAX_HP } from '../../constants';

export function GameHeader({
  goHome, playerHP, langMode, currentTopic, userStance, battleRounds,
  gameState, currentRoundIndex, showJapanese, timerEnabled, timeProgress,
  setFontSize, setShowRules, setShowJapanese, playSound, combo, score,
  imageSize, setImageSize // 💡 画像サイズ変更用
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scorePop, setScorePop] = useState(false);

  useEffect(() => {
    setScorePop(true);
    const timer = setTimeout(() => setScorePop(false), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="bg-slate-900/90 border-b border-cyan-900/50 p-3 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-2xl relative z-40 backdrop-blur-md">
      
      <div className="flex items-center gap-4 w-full md:w-1/4">
        <button onClick={goHome} className="p-2 md:p-3 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 rounded-xl transition-all shadow-md">
          <Home className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[10px] md:text-xs font-black text-cyan-400 mb-1 tracking-widest drop-shadow-md">
            <span>YOU (HP)</span>
            <span>{playerHP} / {MAX_HP}</span>
          </div>
          <div className="h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className={`h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${playerHP > 60 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : playerHP > 30 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'}`} 
              style={{ width: `${(playerHP / MAX_HP) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <h2 className="font-black text-lg md:text-2xl text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-tight">
          {currentTopic.title}
        </h2>
        <h3 className="font-bold text-xs md:text-sm text-cyan-300 opacity-90 drop-shadow-md mt-1 mb-3">
          {currentTopic.titleJP}
        </h3>
        
        <div className="flex gap-4 md:gap-6 bg-slate-950/50 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
           <div className={`flex items-center gap-2 font-black text-xs md:text-sm tracking-widest px-4 py-1 rounded-full transition-all duration-500 ${userStance === 'affirmative' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)] border border-blue-400 scale-105' : 'text-slate-500 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${userStance === 'affirmative' ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
              AFFIRMATIVE (肯定派)
           </div>
           <div className={`flex items-center gap-2 font-black text-xs md:text-sm tracking-widest px-4 py-1 rounded-full transition-all duration-500 ${userStance === 'negative' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)] border border-red-400 scale-105' : 'text-slate-500 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${userStance === 'negative' ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
              NEGATIVE (否定派)
           </div>
        </div>

        {timerEnabled && gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
          <div className="w-full max-w-sm mt-3 relative h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-100 ease-linear" style={{ width: `${timeProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 md:gap-4 w-full md:w-1/4">
        <div className="flex flex-col items-end mr-2 bg-slate-950/60 px-4 py-1 rounded-xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-black text-yellow-500 tracking-widest flex items-center gap-1">
             SCORE {combo > 1 && <span className="text-orange-400 text-[9px] bg-orange-950/80 px-1 rounded animate-pulse">{combo} COMBO!</span>}
          </span>
          <span className={`text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-transform duration-300 ${scorePop ? 'scale-125' : 'scale-100'}`}>
            {score.toLocaleString()}
          </span>
        </div>

        <div className="hidden md:flex gap-2">
            {/* 💡 わかりやすい「テキストサイズ変更」ボタン */}
            <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="relative p-2 md:p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors border border-white/10 shadow-md group" title="テキストサイズ変更 (Text Size)">
                <Type className="w-4 h-4 md:w-5 md:h-5" />
                <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 absolute bottom-0 right-0 opacity-70 group-hover:opacity-100 drop-shadow-md text-cyan-400" />
            </button>
            {/* 💡 わかりやすい「画像サイズ変更」ボタン */}
            <button onClick={() => { playSound('click'); setImageSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'small' : 'normal'); }} className="relative p-2 md:p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors border border-white/10 shadow-md group" title="画像サイズ変更 (Image Size)">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 absolute bottom-0 right-0 opacity-70 group-hover:opacity-100 drop-shadow-md text-pink-400" />
            </button>
            {langMode !== 'ja' && (
                <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); }} className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-2 flex items-center justify-center font-black text-xs md:text-sm shadow-md transition-colors ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-400 hover:text-white'}`}>
                    JP
                </button>
            )}
        </div>

        {/* モバイル用メニュー */}
        <div className="md:hidden relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-800 text-white rounded-lg">
                {isMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 z-50">
                    <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); setIsMenuOpen(false); }} className="flex items-center gap-3 text-white font-bold whitespace-nowrap bg-slate-700 p-2 rounded-lg">
                        <Type className="w-5 h-5 text-cyan-400" /> Text Size
                    </button>
                    <button onClick={() => { playSound('click'); setImageSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'small' : 'normal'); setIsMenuOpen(false); }} className="flex items-center gap-3 text-white font-bold whitespace-nowrap bg-slate-700 p-2 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-pink-400" /> Image Size
                    </button>
                    {langMode !== 'ja' && (
                        <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); setIsMenuOpen(false); }} className="flex items-center gap-3 text-white font-bold whitespace-nowrap bg-slate-700 p-2 rounded-lg">
                           <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${showJapanese ? 'bg-blue-600 border-blue-400' : 'bg-slate-700 border-slate-500'}`}>JP</div>
                           Toggle Japanese
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}