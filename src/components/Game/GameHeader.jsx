import React from 'react';
import { Home, Heart, Clock, Type, HelpCircle } from 'lucide-react';
import { MAX_HP } from '../../constants';

export function GameHeader({
  goHome, playerHP, langMode, currentTopic, userStance, 
  battleRounds, gameState, currentRoundIndex, showJapanese, 
  timerEnabled, timeProgress, setFontSize, setShowRules, setShowJapanese, playSound
}) {
  return (
    <header className={`shrink-0 bg-[#1e293b]/90 border-b border-white/5 z-30 px-6 py-3 flex justify-between items-center shadow-xl min-h-[5rem] md:min-h-[6rem]`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button onClick={goHome} className="p-3 rounded-full hover:bg-white/10 transition-colors bg-white/5 border border-white/10"><Home className="w-6 h-6 md:w-8 md:h-8"/></button>
        
        <div className="flex-1 max-w-[150px] md:max-w-[250px] mx-2 md:mx-4 shrink-0">
            <div className="flex justify-between text-xs md:text-sm font-black uppercase mb-1 md:mb-2 opacity-90">
                <span className="text-blue-400 flex items-center gap-1"><Heart className="w-4 h-4 md:w-5 md:h-5 fill-current"/> HP</span>
                <span className="text-slate-100 text-base md:text-xl drop-shadow-md">{Math.ceil(playerHP)} / {MAX_HP}</span>
            </div>
            <div className="h-3 md:h-5 bg-slate-900 rounded-full overflow-hidden border-2 border-white/20 relative shadow-inner">
                <div className={`h-full transition-all duration-300 ${playerHP > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} style={{ width: `${(playerHP/MAX_HP)*100}%` }}/>
            </div>
        </div>

        <div className="hidden lg:flex flex-col ml-2 border-l border-white/20 pl-4 flex-1 min-w-0 overflow-hidden">
            <span className="text-lg md:text-2xl font-black text-white truncate flex items-center gap-3 drop-shadow-md">
              <span className="truncate">{langMode === 'ja' ? currentTopic.titleJP : currentTopic.title}</span>
              <span className={`shrink-0 text-[10px] md:text-xs px-2 py-1 rounded-md uppercase tracking-wider font-bold shadow-lg ${userStance === 'affirmative' ? 'bg-blue-600 border border-blue-400' : 'bg-red-600 border border-red-400'}`}>
                 {userStance === 'affirmative' ? (langMode === 'ja' ? '肯定' : 'AFFIRMATIVE') : (langMode === 'ja' ? '否定' : 'NEGATIVE')}
              </span>
              {battleRounds > 1 && (gameState.includes('cross') || gameState.includes('rebuttal')) && (
                 <span className="shrink-0 text-[10px] md:text-xs px-2 py-1 rounded-md bg-purple-600 border border-purple-400 ml-1">ROUND {currentRoundIndex + 1}/{battleRounds}</span>
              )}
            </span>
            {showJapanese && langMode !== 'ja' && <span className="text-xs md:text-sm text-slate-400 mt-1 truncate">{currentTopic.titleJP}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-4">
        {timerEnabled && ['construct', 'cross_exam', 'rebuttal_defense', 'construct_image', 'cross_exam_image', 'rebuttal_defense_image', 'closing', 'closing_image'].includes(gameState) && (
            <div className="flex flex-col items-center w-20 md:w-32 bg-slate-900/50 px-2 py-1 md:py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-inner mr-1 md:mr-2">
                <div className="text-[9px] md:text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</div>
                <div className="w-full h-1.5 md:h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-600 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100 ease-linear" style={{ width: `${100 - timeProgress}%` }}/>
                </div>
            </div>
        )}
        <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="p-2 md:p-3 hover:bg-white/10 rounded-full text-slate-300 transition-colors bg-white/5 border border-white/10" title="Text Size"><Type className="w-5 h-5 md:w-6 md:h-6"/></button>
        <button onClick={() => { playSound('click'); setShowRules(true); }} className="p-2 md:p-3 hover:bg-white/10 rounded-full text-blue-400 transition-colors bg-white/5 border border-white/10"><HelpCircle className="w-5 h-5 md:w-6 md:h-6"/></button>
        {langMode !== 'ja' && <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); }} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-black text-sm md:text-base shadow-lg transition-colors ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-300'}`}>JP</button>}
      </div>
    </header>
  );
}