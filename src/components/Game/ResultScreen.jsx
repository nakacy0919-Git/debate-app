import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, Type, Flame, Trophy, Clock, Target, Star, Crown } from 'lucide-react';
import { CARD_TYPES } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function ResultScreen({
  gameState, score, activeLogicGroup, currentTopic, userStance, 
  langMode, difficulty, showJapanese, onRetry, onChangeTopic, mistakes,
  fontSize, setFontSize, setShowJapanese, playSound,
  scoreDetails, maxCombo,
  leaderboard, storageNotice
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
      const order = { assertion: 1, reason: 2, example: 3, mini_conclusion: 4, closing: 5 };
      correctCards.sort((a, b) => order[a.type] - order[b.type]);
  }

  const textBaseClass = fontSize === 'xlarge' ? 'text-2xl md:text-3xl' : fontSize === 'large' ? 'text-xl md:text-2xl' : 'text-base md:text-lg';
  const jpTextClass = fontSize === 'xlarge' ? 'text-xl md:text-2xl' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-sm md:text-base';

  const isNewRecord = leaderboard.length > 0 && leaderboard[0].score === score;

  const getLocalizedJP = (cardObj) => {
      if (!cardObj.textJP) return "";
      return typeof cardObj.textJP === 'object' ? cardObj.textJP[difficulty] : cardObj.textJP;
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center p-4 md:p-6 backdrop-blur-3xl animate-in fade-in overflow-y-auto custom-scrollbar ${gameState === 'gameover' ? 'bg-red-950/95' : 'bg-[#0f172a]/95'}`}>
        
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3 z-50">
            <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="p-3 bg-slate-800/80 rounded-full border border-white/20 text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all shadow-lg" title="Text Size">
                <Type className="w-6 h-6" />
            </button>
            {langMode !== 'ja' && (
                <button onClick={() => { playSound('click'); setShowJapanese(!showJapanese); }} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black shadow-lg transition-colors ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-300'}`}>
                    JP
                </button>
            )}
        </div>

        <h2 className={`text-4xl md:text-6xl font-black text-white mb-6 mt-16 md:mt-10 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-in zoom-in-50 duration-500 ${gameState === 'gameover' ? 'text-red-400' : 'text-cyan-400'}`}>
            {gameState === 'gameover' ? 'TRY AGAIN' : 'PRACTICE CLEAR'}
        </h2>

        <div className="w-full max-w-xl bg-slate-900/80 rounded-3xl p-6 md:p-8 border border-white/20 mb-10 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-10 delay-200">
            <div className="flex items-center justify-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h3 className="text-2xl font-black text-white tracking-widest">SCORE BREAKDOWN</h3>
            </div>
            
            <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-slate-300 font-bold text-lg px-2">
                    <span className="flex items-center gap-2"><Target className="w-5 h-5 text-blue-400"/> Base Score</span>
                    <span className="text-white">{scoreDetails.base.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-bold text-lg px-2">
                    <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-pink-400"/> Time Bonus</span>
                    <span className="text-white">+{scoreDetails.timeBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-bold text-lg px-2">
                    <span className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400"/> Combo Bonus <span className="text-xs ml-1 text-slate-500">(Max {maxCombo})</span></span>
                    <span className="text-white">+{scoreDetails.comboBonus.toLocaleString()}</span>
                </div>
                {scoreDetails.perfect > 0 && (
                    <div className="flex justify-between items-center text-yellow-300 font-black text-xl px-2 py-2 bg-yellow-900/40 rounded-lg border border-yellow-500/50 animate-pulse shadow-inner">
                        <span className="flex items-center gap-2"><Star className="w-6 h-6 fill-current"/> PERFECT CLEAR!</span>
                        <span>+{scoreDetails.perfect.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div className="border-t-4 border-slate-700 pt-6">
                <div className="flex justify-between items-end">
                    <span className="text-slate-400 font-bold text-xl uppercase tracking-widest">Total Score</span>
                    <div className="flex flex-col items-end">
                        {isNewRecord && <span className="text-yellow-400 font-black text-sm animate-pulse mb-1 flex items-center gap-1"><Crown size={14}/> NEW RECORD!</span>}
                        <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
                            {score.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {gameState === 'result' && leaderboard.length > 0 && (
            <details className="w-full max-w-3xl bg-slate-900/80 rounded-3xl p-4 md:p-6 border border-yellow-500/50 mb-6 shadow-lg backdrop-blur-md">
                <summary className="text-lg font-black text-yellow-300 mb-3 cursor-pointer focus-visible:outline-cyan-400">
                    LOCAL RECORDS / 記録を見る（{difficulty?.toUpperCase()}）
                </summary>
                <div className="space-y-3">
                    {leaderboard.map((record, index) => {
                        const isCurrentPlay = record.score === score && index === leaderboard.findIndex(r => r.score === score);
                        
                        return (
                            <div key={record.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCurrentPlay ? 'bg-yellow-600/30 border-yellow-400 text-white shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse' : index === 0 ? 'bg-slate-800/80 border-yellow-500/50 text-yellow-400' : index === 1 ? 'bg-slate-800/60 border-slate-400/50 text-slate-300' : index === 2 ? 'bg-slate-800/40 border-orange-700/50 text-orange-400' : 'bg-slate-800/30 border-white/5 text-slate-400'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`font-black text-xl w-8 text-center ${isCurrentPlay ? 'text-yellow-300' : ''}`}>{index + 1}</div>
                                    <div className="flex flex-col">
                                        <div className={`font-bold text-lg md:text-xl truncate max-w-[150px] md:max-w-[200px] ${isCurrentPlay ? 'text-white' : ''}`}>{record.name}</div>
                                        {record.location && <div className="text-xs mt-0.5 text-slate-400">{record.location}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-black text-2xl md:text-3xl tracking-wider ${isCurrentPlay ? 'text-yellow-300' : ''}`}>{record.score.toLocaleString()}</div>
                                    <div className="text-xs opacity-60 font-mono">{record.date}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </details>
        )}
        
        <p className="max-w-3xl text-slate-300 text-center mb-6">この得点はカード選択の練習記録です。実際のディベート能力や主張の真偽を判定するものではありません。具体例は練習用で、統計・研究結果として引用する前に出典を確認してください。</p>
        {storageNotice && <p role="status" className="text-amber-300 mb-4">{storageNotice}</p>}
        {correctCards.length > 0 && (
            <details className="w-full max-w-5xl bg-slate-900/80 rounded-2xl p-4 md:p-6 border border-white/20 mb-6 shadow-xl backdrop-blur-md">
                <summary className="text-lg md:text-xl font-extrabold text-green-300 mb-4 cursor-pointer focus-visible:outline-cyan-400">
                  Model example / 主張の構成例を見る
                </summary>
                <div className="grid gap-4 md:gap-6">
                    {correctCards.map(card => {
                        const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                        return (
                            <div key={card.id} className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 bg-slate-800/60 rounded-xl border border-white/10 items-start md:items-center text-left shadow-md">
                                {card.image_url && (
                                    <div className="shrink-0 w-full md:w-64 h-auto aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black">
                                        <img src={card.image_url} className="w-full h-full object-cover" alt="Model" />
                                    </div>
                                )}
                                <div className="flex-1 w-full flex flex-col justify-center">
                                    <div className={`shrink-0 text-xs md:text-sm font-black uppercase px-3 py-1 rounded bg-black/50 border border-white/10 shadow-inner w-fit mb-4 ${typeStyle.color}`}>
                                        {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                    </div>
                                    <div className="flex-1 w-full">
                                        {langMode === 'ja' ? (
                                            <div className={`font-bold text-white leading-normal md:leading-relaxed drop-shadow-md ${textBaseClass}`}>
                                                {getLocalizedJP(card)}
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`font-bold text-white leading-normal md:leading-relaxed drop-shadow-md ${textBaseClass}`}>
                                                    <SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} />
                                                </div>
                                                {showJapanese && (
                                                    <div className={`mt-2 text-slate-300 border-t border-white/10 pt-2 ${jpTextClass}`}>
                                                        {getLocalizedJP(card)}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </details>
        )}

        {mistakes && mistakes.length > 0 && (
            <div className="w-full max-w-5xl bg-slate-900/80 rounded-2xl p-4 md:p-8 border border-white/20 mb-10 shadow-2xl backdrop-blur-md">
                <h3 className="text-xl md:text-2xl font-black text-rose-400 mb-6 flex items-center justify-center gap-2 border-b border-white/20 pb-4 drop-shadow-md">
                    <Lightbulb className="w-6 h-6"/> Review (間違えた問題の解説)
                </h3>
                <div className="grid gap-4 md:gap-6">
                    {mistakes.map(card => {
                        const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                        const explanation = card.explanationJP || card.reasonStr; 
                        
                        return (
                            <div key={card.id} className="flex flex-col gap-4 p-4 md:p-6 bg-slate-800/60 rounded-xl border-l-8 border-rose-500 shadow-md text-left">
                                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
                                    {card.image_url && (
                                        <div className="shrink-0 w-full md:w-48 h-auto aspect-video rounded-lg overflow-hidden border border-white/20 shadow-lg bg-black">
                                            <img src={card.image_url} className="w-full h-full object-cover" alt="Mistake" />
                                        </div>
                                    )}
                                    <div className="flex-1 w-full flex flex-col justify-center">
                                        <div className={`text-xs font-black uppercase px-3 py-1 rounded bg-black/50 border border-white/10 shadow-inner w-fit mb-2 ${typeStyle.color}`}>
                                            {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                        </div>
                                        <div className={`font-bold text-slate-300 leading-normal md:leading-relaxed line-through opacity-80 ${textBaseClass}`}>
                                            {langMode === 'ja' ? getLocalizedJP(card) : (typeof card.text === 'object' ? card.text[difficulty] : card.text)}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-rose-950/80 p-4 rounded-xl border border-rose-500/50 text-rose-200 text-sm md:text-base font-bold flex items-start gap-3 shadow-inner">
                                    <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400"/>
                                    <p className="leading-relaxed">{explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="flex flex-wrap justify-center items-center gap-3 mb-10">
          <button onClick={onRetry} className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-full font-black text-lg md:text-xl hover:bg-cyan-400 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
            {langMode === 'ja' ? '同じ条件でもう一度' : 'TRY AGAIN'}
          </button>
          <button onClick={onChangeTopic} className="px-8 py-4 bg-slate-700 text-white border border-white/20 rounded-full font-black text-lg hover:bg-slate-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300">
            {langMode === 'ja' ? 'テーマを変更' : 'CHANGE TOPIC'}
          </button>
        </div>
    </div>
  );
}
