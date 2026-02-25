import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { CARD_TYPES } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function ResultScreen({
  gameState, score, activeLogicGroup, currentTopic, userStance, 
  langMode, difficulty, showJapanese, goHome, mistakes // 💡 追加：mistakesを受け取る
}) {
  if (gameState !== 'gameover' && gameState !== 'result') return null;

  let targetGroup = activeLogicGroup;
  if (!targetGroup) {
      const validGroups = currentTopic.deck.filter(c => c.stance === userStance && c.group !== 'fake').map(c => c.group);
      targetGroup = validGroups[0];
  }
  
  let correctCards = [];
  if (targetGroup) {
      correctCards = currentTopic.deck.filter(c => c.stance === userStance && c.group === targetGroup && c.group !== 'fake');
      const order = { assertion: 1, reason: 2, example: 3, mini_conclusion: 4 };
      correctCards.sort((a, b) => order[a.type] - order[b.type]);
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center p-6 backdrop-blur-3xl animate-in zoom-in overflow-y-auto ${gameState === 'gameover' ? 'bg-red-950/95' : 'bg-[#0f172a]/95'}`}>
        <h2 className={`text-6xl md:text-8xl font-black text-white mb-2 mt-10 tracking-tighter drop-shadow-lg ${gameState === 'gameover' ? 'text-red-400' : 'text-cyan-400'}`}>
            {gameState === 'gameover' ? 'DEFEAT' : 'VICTORY'}
        </h2>
        <div className="text-2xl font-mono text-white/90 mb-8 bg-black/40 px-6 py-2 rounded-full border border-white/20 shadow-inner">Score: {score}</div>
        
        {/* 🌟 模範解答セクション */}
        {correctCards.length > 0 && (
            <div className="w-full max-w-5xl bg-slate-900/80 rounded-2xl p-6 border border-white/20 mb-8 shadow-2xl backdrop-blur-md">
                <h3 className="text-xl md:text-2xl font-black text-green-400 mb-6 flex items-center justify-center gap-2 border-b border-white/20 pb-4 drop-shadow-md">
                    <CheckCircle2 className="w-6 h-6"/> Model Answer (模範解答)
                </h3>
                <div className="grid gap-3">
                    {correctCards.map(card => {
                        const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                        return (
                            <div key={card.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-800/60 rounded-xl border border-white/10 items-start md:items-center text-left shadow-md">
                                {card.image_url && (
                                    <div className="shrink-0 w-full md:w-32 h-32 rounded-lg overflow-hidden border border-white/20 shadow-lg bg-black">
                                        <img src={card.image_url} className="w-full h-full object-cover" alt="Model" />
                                    </div>
                                )}
                                <div className="flex gap-4 flex-1 w-full items-center">
                                    <div className={`shrink-0 text-[10px] md:text-xs font-black uppercase px-2 py-1 rounded bg-black/50 border border-white/10 shadow-inner ${typeStyle.color} w-24 text-center drop-shadow-md`}>
                                        {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                    </div>
                                    <div className="flex-1">
                                        {langMode === 'ja' ? (
                                            <div className="font-bold text-white text-sm md:text-base leading-relaxed drop-shadow-md">{card.textJP}</div>
                                        ) : (
                                            <>
                                                <div className="font-bold text-white text-sm md:text-base leading-relaxed drop-shadow-md"><SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} /></div>
                                                {showJapanese && <div className="mt-1 text-slate-300 text-xs">{card.textJP}</div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* 🌟 新機能：間違えた問題の解説セクション */}
        {mistakes && mistakes.length > 0 && (
            <div className="w-full max-w-5xl bg-slate-900/80 rounded-2xl p-6 border border-white/20 mb-10 shadow-2xl backdrop-blur-md">
                <h3 className="text-xl md:text-2xl font-black text-rose-400 mb-6 flex items-center justify-center gap-2 border-b border-white/20 pb-4 drop-shadow-md">
                    <Lightbulb className="w-6 h-6"/> Review (間違えた問題の解説)
                </h3>
                <div className="grid gap-4">
                    {mistakes.map(card => {
                        const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                        // 💡 jsonデータに "explanationJP" があればそれを優先して表示します
                        const explanation = card.explanationJP || card.reasonStr; 
                        
                        return (
                            <div key={card.id} className="flex flex-col gap-3 p-4 bg-slate-800/60 rounded-xl border-l-4 border-rose-500 shadow-md text-left">
                                <div className="flex gap-4 items-start md:items-center">
                                    {card.image_url && (
                                        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-white/20 shadow-lg bg-black">
                                            <img src={card.image_url} className="w-full h-full object-cover" alt="Mistake" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className={`text-[10px] md:text-xs font-black uppercase px-2 py-0.5 rounded bg-black/50 border border-white/10 shadow-inner w-fit mb-1 ${typeStyle.color}`}>
                                            {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                        </div>
                                        <div className="font-bold text-slate-300 text-sm md:text-base leading-relaxed line-through opacity-80">
                                            {langMode === 'ja' ? card.textJP : (typeof card.text === 'object' ? card.text[difficulty] : card.text)}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-rose-950/50 p-3 rounded-lg border border-rose-500/30 text-rose-200 text-sm font-bold flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
                                    <p>{explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <button onClick={goHome} className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl md:text-2xl hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.4)] mb-10">
            PLAY AGAIN
        </button>
    </div>
  );
}