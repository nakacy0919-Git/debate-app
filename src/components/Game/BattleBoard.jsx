import React, { useEffect, useRef } from 'react';
import { Shield, AlertCircle, ArrowDown } from 'lucide-react';
import { CARD_TYPES, FLOWS } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function BattleBoard({ game }) {
  const { tower, gameState, gameMode, difficulty, langMode, currentTopic, rivalCard, fontSize, pendingCard, showSuccessOverlay } = game;
  const scrollRef = useRef(null);

  useEffect(() => {
    const board = scrollRef.current;
    if (!board) return;
    if (typeof board.scrollTo === 'function') {
      board.scrollTo({ top: board.scrollHeight, behavior: 'smooth' });
    } else {
      // Older embedded browsers and test DOMs may not support element.scrollTo.
      board.scrollTop = board.scrollHeight;
    }
  }, [tower, rivalCard, gameState]);

  const getLocalizedJP = (cardObj) => {
    if (!cardObj.textJP) return "";
    return typeof cardObj.textJP === 'object' ? cardObj.textJP[difficulty] : cardObj.textJP;
  };

  const expectedFlow = FLOWS[gameMode] || FLOWS.area;
  const isConstructPhase = gameState === 'construct' || gameState === 'construct_image';
  const isBattlePhase = !isConstructPhase && tower.length >= expectedFlow.length;

  const textClass = fontSize === 'xlarge' ? 'text-xl md:text-2xl' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  // 💡 バトルフェーズ：激突アニメーションと画像選択待ちのUI
  if (isBattlePhase) {
    const isImageWait = gameState.endsWith('_image');

    return (
      <div className="flex-1 h-full flex flex-col items-center justify-start lg:justify-center p-3 md:p-6 gap-4 relative overflow-y-auto custom-scrollbar min-h-0 bg-slate-950/50">
        
        {/* 相手からの攻撃・質問カード（自分が正解すると粉々に砕け散る！） */}
        {rivalCard && (
          <div className={`w-full max-w-4xl p-4 md:p-6 rounded-3xl border-4 shadow-[0_0_80px_rgba(220,38,38,0.5)] flex flex-col items-center text-center gap-4 bg-red-950/90 border-red-500 relative transition-all duration-300 z-10 ${showSuccessOverlay ? 'animate-shatter' : 'animate-in zoom-in-90 fade-in'}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-400 animate-pulse"/>
              <span className="text-base md:text-lg font-black uppercase px-6 py-2 rounded-full bg-black/60 border border-red-500/50 text-red-400 shadow-inner tracking-widest">
                {rivalCard.isQuestion ? (langMode === 'ja' ? '相手の質問' : 'OPPONENT QUESTION') : (langMode === 'ja' ? '相手の反論' : 'OPPONENT REBUTTAL')}
              </span>
            </div>
            
            {rivalCard.image_url && (
              <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-red-500/50 bg-black my-2">
                <img src={rivalCard.image_url} alt="Rival" className="w-full h-full object-cover" />
              </div>
            )}

            <div className={`font-black text-rose-100 leading-relaxed drop-shadow-xl ${fontSize === 'xlarge' ? 'text-2xl md:text-3xl' : fontSize === 'large' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
              {langMode === 'ja' ? getLocalizedJP(rivalCard) : (rivalCard.text?.[difficulty] || rivalCard.text)}
            </div>
          </div>
        )}

        {/* 💡 自分が正解を選んだ瞬間、下から自分のカードが猛スピードで突き上げて激突する！ */}
        {showSuccessOverlay && tower.length > expectedFlow.length && (
          <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl animate-clash-up z-50 pointer-events-none">
            <div className={`p-6 md:p-8 rounded-3xl border-4 shadow-[0_0_80px_rgba(59,130,246,1)] bg-blue-900/95 border-blue-400 text-center flex flex-col items-center gap-3`}>
              <div className="flex items-center gap-2 mb-2">
                 <Shield className="w-8 h-8 md:w-10 md:h-10 text-blue-300" />
                 <span className="font-black text-blue-300 tracking-widest uppercase text-base md:text-lg">YOUR DEFENSE (あなたの反論)</span>
              </div>
              <div className={`font-black text-white ${textClass}`}>
                {langMode === 'ja' ? getLocalizedJP(tower[tower.length - 1]) : (tower[tower.length - 1].text?.[difficulty] || tower[tower.length - 1].text)}
              </div>
            </div>
          </div>
        )}

        {/* 💡 バトルフェーズ中に「画像選択待ち」になったら、自分が選んだ反論テキストを画面下に特大表示する */}
        {isImageWait && pendingCard && (
           <div className="relative w-full max-w-4xl shrink-0 p-4 md:p-6 rounded-2xl border-2 border-cyan-400 bg-cyan-950/95 shadow-[0_0_25px_rgba(34,211,238,0.45)] flex flex-col items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 z-20">
              <div className={`font-bold text-white text-center drop-shadow-md ${textClass}`}>
                 {langMode === 'ja' ? getLocalizedJP(pendingCard) : (
                    <SmartText text={typeof pendingCard.text === 'object' ? pendingCard.text[difficulty] : pendingCard.text} vocabList={currentTopic.vocabulary} />
                 )}
              </div>
           </div>
        )}
      </div>
    );
  }

  // ===== 建国フェーズ (AREAの組み立て) =====
  return (
    <div ref={scrollRef} className="flex-1 h-full p-4 md:p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar scroll-smooth relative">
      
      {expectedFlow.map((expectedType, index) => {
        const isPlaced = index < tower.length; 
        const isNext = index === tower.length && isConstructPhase; 
        const isFuture = index > tower.length && isConstructPhase; 
        
        const typeStyle = CARD_TYPES[expectedType] || CARD_TYPES.reason;

        // 建国フェーズ中の画像選択待ち
        if (isNext && pendingCard && gameState.endsWith('_image')) {
           return (
              <div key={`pending-${index}`} className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-2xl border-4 border-cyan-400 bg-cyan-950/80 shadow-[0_0_30px_rgba(34,211,238,0.5)] flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                 <div className={`font-bold text-white text-center drop-shadow-md ${textClass}`}>
                    {langMode === 'ja' ? getLocalizedJP(pendingCard) : (
                       <SmartText text={typeof pendingCard.text === 'object' ? pendingCard.text[difficulty] : pendingCard.text} vocabList={currentTopic.vocabulary} />
                    )}
                 </div>
              </div>
           );
        }

        if (isPlaced) {
          const card = tower[index];
          const actualStyle = CARD_TYPES[card.type] || typeStyle;

          return (
            <div key={card.id || index} className={`relative w-full max-w-4xl mx-auto p-4 md:p-6 rounded-2xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 fade-in duration-500 flex flex-col md:flex-row items-center gap-4 md:gap-6 overflow-hidden ${actualStyle.bg} ${actualStyle.border}`}>
              
              <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-effect pointer-events-none" />

              {card.image_url && (
                <div className="shrink-0 w-full md:w-48 h-auto aspect-video rounded-lg overflow-hidden shadow-lg border border-white/20 bg-black z-10">
                  <img src={card.image_url} alt="Reference" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 w-full text-left z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black uppercase px-3 py-1 rounded bg-black/50 border shadow-inner ${actualStyle.color} ${actualStyle.border}`}>
                    {langMode === 'ja' ? actualStyle.labelJP : actualStyle.label}
                  </span>
                  <actualStyle.icon className={`w-6 h-6 ${actualStyle.color} drop-shadow-md`} />
                </div>
                <div className={`font-bold text-white leading-relaxed drop-shadow-md ${textClass}`}>
                  {langMode === 'ja' ? getLocalizedJP(card) : (
                    <SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} />
                  )}
                </div>
              </div>
            </div>
          );
        }

        if (isNext || isFuture) {
          let skelBg = 'bg-slate-900/30 border-slate-700/50 text-slate-500';
          if (expectedType === 'assertion') skelBg = 'bg-blue-900/30 border-blue-500/40 text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]';
          else if (expectedType === 'reason') skelBg = 'bg-yellow-900/30 border-yellow-500/40 text-yellow-400 shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]';
          else if (expectedType === 'example') skelBg = 'bg-green-900/30 border-green-500/40 text-green-400 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]';
          else if (expectedType === 'mini_conclusion') skelBg = 'bg-purple-900/30 border-purple-500/40 text-purple-400 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]';

          return (
            <div key={`skeleton-${index}`} className={`w-full max-w-4xl mx-auto p-4 md:p-6 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center min-h-[72px] md:min-h-[120px] transition-all duration-500 ${isNext ? `${skelBg} animate-pulse` : 'border-slate-700/30 bg-slate-900/10 opacity-30'}`}>
              <typeStyle.icon className={`w-8 h-8 mb-2 ${isNext ? '' : 'text-slate-600'}`} />
              <div className={`font-black tracking-widest uppercase text-lg md:text-xl ${isNext ? '' : 'text-slate-600'}`}>
                {isNext ? `NEXT BLOCK: ${typeStyle.label}` : typeStyle.label}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}