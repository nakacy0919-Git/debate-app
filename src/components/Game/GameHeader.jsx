import React, { useEffect, useState } from 'react';
import { Home, Pause, Type, Menu, X, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { MAX_HP } from '../../constants';

export function GameHeader({
  goHome, onPause, playerHP, langMode, currentTopic, userStance,
  gameState, battleRounds, currentRoundIndex, showJapanese, imageMatchEnabled, timerEnabled, timeProgress,
  setFontSize,  setShowJapanese, playSound, combo, score,
   setImageSize // 💡 画像サイズ変更用
}) {
  const roundLabel = gameState === 'construct' || gameState === 'construct_image'
    ? (langMode === 'ja' ? '主張構築' : 'ARGUMENT')
    : gameState === 'closing'
      ? (langMode === 'ja' ? '最終弁論' : 'FINAL')
      : `ROUND ${Math.min(currentRoundIndex + 1, battleRounds)} / ${battleRounds}`;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scorePop, setScorePop] = useState(false);

  useEffect(() => {
    const start = setTimeout(() => setScorePop(true), 0);
    const timer = setTimeout(() => setScorePop(false), 300);
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, [score]);

  return (
    <div className="game-header bg-slate-900/90 border-b border-cyan-900/50 p-2 md:p-3 xl:p-5 flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-2 xl:gap-4 shrink-0 shadow-2xl relative z-40 backdrop-blur-md">
      
      <div className="flex items-center gap-2 xl:gap-4 w-auto md:w-[22%] shrink-0">
        <button aria-label="ホームへ戻る" onClick={goHome} className="p-2 md:p-3 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 rounded-xl transition-all shadow-md">
          <Home className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        {!['gameover','result'].includes(gameState) && (
          <button aria-label="一時停止" title="一時停止 / Pause" onClick={onPause} className="p-2 md:p-3 bg-slate-800 hover:bg-cyan-700 text-slate-300 hover:text-white rounded-xl transition-all shadow-md focus-visible:outline-cyan-300">
            <Pause className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
        <div className="flex-1 min-w-[78px] max-w-[200px]">
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

      <div className="order-3 md:order-none w-full md:w-auto md:min-w-0 flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="font-black text-sm md:text-base xl:text-xl text-white tracking-tight leading-snug max-w-full">
          {langMode === 'ja' ? currentTopic.titleJP : currentTopic.title}
        </h2>
        {langMode !== 'ja' && showJapanese && (
          <p className="font-semibold text-[11px] xl:text-sm text-cyan-200 mt-0.5">
            {currentTopic.titleJP}
          </p>
        )}
        <div className={`mt-1 px-3 py-1 rounded-full text-xs xl:text-sm font-extrabold border ${userStance === 'affirmative' ? 'bg-blue-700/80 border-blue-400 text-blue-100' : 'bg-rose-700/80 border-rose-400 text-rose-100'}`}>
          {userStance === 'affirmative'
            ? (langMode === 'ja' ? '肯定側' : 'AFFIRMATIVE')
            : (langMode === 'ja' ? '否定側' : 'NEGATIVE')}
        </div>
        <div role="status" aria-live="polite" className="mt-1 text-[11px] xl:text-sm text-amber-200 font-extrabold tracking-widest">
          {roundLabel}
        </div>

        {timerEnabled && gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
          <div className="w-full max-w-sm mt-3 relative h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-100 ease-linear" style={{ width: `${timeProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 xl:gap-4 w-auto md:w-[22%] shrink-0">
        <div className="flex flex-col items-end mr-0 bg-slate-950/60 px-2 xl:px-4 py-1 rounded-xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-black text-yellow-500 tracking-widest flex items-center gap-1">
             SCORE {combo > 1 && <span className="text-orange-400 text-[9px] bg-orange-950/80 px-1 rounded animate-pulse">{combo} COMBO!</span>}
          </span>
          <span className={`text-lg md:text-2xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-transform duration-300 ${scorePop ? 'scale-125' : 'scale-100'}`}>
            {score.toLocaleString()}
          </span>
        </div>

        <div className="hidden lg:flex gap-1 xl:gap-2">
            {/* 💡 わかりやすい「テキストサイズ変更」ボタン */}
            <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="relative p-2 md:p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors border border-white/10 shadow-md group" title="テキストサイズ変更 (Text Size)">
                <Type className="w-4 h-4 md:w-5 md:h-5" />
                <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 absolute bottom-0 right-0 opacity-70 group-hover:opacity-100 drop-shadow-md text-cyan-400" />
            </button>
            {/* 💡 わかりやすい「画像サイズ変更」ボタン */}
            {imageMatchEnabled && <button aria-label="画像サイズ変更" onClick={() => { playSound('click'); setImageSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'small' : 'normal'); }} className="relative p-2 md:p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors border border-white/10 shadow-md group" title="画像サイズ変更 (Image Size)">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 absolute bottom-0 right-0 opacity-70 group-hover:opacity-100 drop-shadow-md text-pink-400" />
            </button>}
            {langMode !== 'ja' && (
                <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); }} className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-2 flex items-center justify-center font-black text-xs md:text-sm shadow-md transition-colors ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-400 hover:text-white'}`}>
                    JP
                </button>
            )}
        </div>

        {/* モバイル用メニュー */}
        <div className="lg:hidden relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="表示設定メニュー" className="p-2 bg-slate-800 text-white rounded-lg">
                {isMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 z-50">
                    <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); setIsMenuOpen(false); }} className="flex items-center gap-3 text-white font-bold whitespace-nowrap bg-slate-700 p-2 rounded-lg">
                        <Type className="w-5 h-5 text-cyan-400" /> Text Size
                    </button>
                    {imageMatchEnabled && <button onClick={() => { playSound('click'); setImageSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'small' : 'normal'); setIsMenuOpen(false); }} className="flex items-center gap-3 text-white font-bold whitespace-nowrap bg-slate-700 p-2 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-pink-400" /> Image Size
                    </button>}
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
