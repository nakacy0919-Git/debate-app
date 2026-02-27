import React from 'react';
import { Swords, MessageCircleQuestion, Image as ImageIcon } from 'lucide-react';
import { CARD_TYPES, FLOWS } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function BattleBoard({ game }) {
  const {
    gameState, currentTopic, tower, gameMode, rivalCard, langMode, showJapanese, difficulty,
    pendingCard, scrollRef, fontSize
  } = game;

  const textBaseClass = fontSize === 'xlarge' ? 'text-2xl md:text-3xl' : fontSize === 'large' ? 'text-xl md:text-2xl' : 'text-base md:text-lg';
  const jpTextClass = fontSize === 'xlarge' ? 'text-xl md:text-2xl' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-sm md:text-base';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0f172a]/60 z-10">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay">
        <img src={currentTopic.image_url} className="w-full h-full object-cover" alt="Background" />
      </div>
      
      {gameState === 'construct' && (
          <div className="shrink-0 py-4 flex justify-center z-10 bg-gradient-to-b from-[#0f172a] to-transparent">
            {(() => {
              const expectedFlow = FLOWS[gameMode] || FLOWS.area;
              if (tower.length >= expectedFlow.length) return null;
              const typeInfo = CARD_TYPES[expectedFlow[tower.length]];
              return (
                  <div className="flex flex-col items-center animate-pulse">
                      <span className="text-sm text-slate-400 mb-1 font-bold tracking-widest drop-shadow-md">NEXT BLOCK</span>
                      <div className={`relative px-6 py-2 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 ${typeInfo.bg} ${typeInfo.border} text-white`}>
                          {React.createElement(typeInfo.icon, { size: 20 })}
                          <span className="text-xl font-black">{langMode === 'ja' || showJapanese ? typeInfo.labelJP : typeInfo.label}</span>
                      </div>
                  </div>
              );
            })()}
          </div>
      )}

      {/* Rival Attack / Question Area */}
      {rivalCard && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-4 animate-in slide-in-from-top-4">
           <div className={`p-4 md:p-6 rounded-2xl shadow-2xl border-4 flex flex-col md:flex-row gap-4 md:gap-6 backdrop-blur-md ${rivalCard.type === 'attack' ? 'bg-rose-950/90 border-rose-500' : 'bg-teal-950/90 border-teal-500'}`}>
              {rivalCard.image_url && (
                  /* 💡 修正：親のdivに固定幅 (w-32 md:w-48) を与え、画像が潰れて見えなくなるのを防ぎました */
                  <div className="shrink-0 w-32 md:w-48">
                      <img src={rivalCard.image_url} className="w-full h-auto aspect-video object-cover rounded-xl border-2 border-white/20 shadow-md" alt="Rival" />
                  </div>
              )}
              <div className="flex gap-4 w-full h-auto">
                  <div className={`shrink-0 p-3 md:p-4 rounded-full h-fit border-2 border-white/20 shadow-lg ${rivalCard.type === 'attack' ? 'bg-rose-600' : 'bg-teal-600'}`}>
                      {rivalCard.type === 'attack' ? <Swords className="w-6 h-6 md:w-8 md:h-8 text-white"/> : <MessageCircleQuestion className="w-6 h-6 md:w-8 md:h-8 text-white"/>}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="font-black opacity-80 text-xs md:text-sm uppercase tracking-widest mb-1 text-white">{rivalCard.type === 'attack' ? "Opponent Attack!" : "Question"}</div>
                    {langMode === 'ja' ? <div className={`font-bold leading-normal md:leading-relaxed text-white drop-shadow-md ${textBaseClass}`}>{rivalCard.textJP}</div> : (
                        <><div className={`font-bold leading-normal md:leading-relaxed text-white drop-shadow-md ${textBaseClass}`}><SmartText text={typeof rivalCard.text === 'object' ? rivalCard.text[difficulty] : rivalCard.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className={`mt-2 opacity-80 border-t border-white/20 pt-1 text-slate-200 ${jpTextClass}`}>{rivalCard.textJP}</div>}</>
                    )}
                  </div>
              </div>
           </div>
         </div>
      )}

      {/* Prompt for Image Match */}
      {gameState.endsWith('_image') && pendingCard && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-4 animate-in slide-in-from-top-4">
             <div className="bg-cyan-950/90 backdrop-blur-md border-4 border-cyan-500 p-4 md:p-6 rounded-2xl shadow-2xl text-center">
                 <div className="flex items-center justify-center gap-2 text-cyan-400 font-black tracking-widest uppercase mb-2 drop-shadow-md">
                     <ImageIcon className="w-6 h-6"/> Select Matching Image
                 </div>
                 <div className={`font-bold text-white bg-black/50 p-4 rounded-xl border border-white/10 shadow-inner h-auto ${textBaseClass}`}>
                    {langMode === 'ja' ? pendingCard.textJP : (typeof pendingCard.text === 'object' ? pendingCard.text[difficulty] : pendingCard.text)}
                 </div>
             </div>
         </div>
      )}

      {/* Tower / Log Area */}
      <div ref={scrollRef} className="flex-1 w-full overflow-y-auto p-4 flex flex-col items-center gap-4 scroll-smooth pb-20 z-10 pt-48">
          {tower.map((block, idx) => {
              const typeStyle = CARD_TYPES[block.type] || CARD_TYPES.reason;
              return (
              <div key={block.id + idx} className="relative w-full max-w-4xl animate-in slide-in-from-bottom-4">
                  <div className={`p-4 md:p-5 rounded-xl border-l-8 backdrop-blur-md shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center min-h-min ${block.judgment === 'weak' ? 'border-yellow-500/50 bg-yellow-900/40' : `border-${typeStyle.color.split('-')[1]}-500 bg-slate-900/80`}`}>
                      {block.image_url && (
                          /* 💡 修正：タワーに積まれた画像も固定幅を持たせて潰れないようにしました */
                          <div className="shrink-0 w-32 md:w-48">
                              <img src={block.image_url} className="w-full h-auto aspect-video object-cover rounded-lg border border-white/20 shadow-md bg-black" alt="Card Visual" />
                          </div>
                      )}
                      <div className="flex-1 flex gap-4 w-full h-auto">
                          <div className={`shrink-0 p-2 md:p-3 rounded-xl bg-black/50 border border-white/10 shadow-inner h-fit ${typeStyle.color}`}>{React.createElement(typeStyle.icon, { size: 20 })}</div>
                          <div className="flex-1 flex flex-col justify-center">
                              <div className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-90 drop-shadow-md ${typeStyle.color}`}>{langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}</div>
                              {langMode === 'ja' ? <div className={`font-bold text-white leading-normal md:leading-relaxed drop-shadow-md ${textBaseClass}`}>{block.textJP}</div> : (
                                  <><div className={`font-bold leading-normal md:leading-relaxed text-slate-100 drop-shadow-md ${textBaseClass}`}><SmartText text={typeof block.text === 'object' ? block.text[difficulty] : block.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className={`mt-1 text-slate-300 border-t border-white/10 pt-1 ${jpTextClass}`}>{block.textJP}</div>}</>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
              );
          })}
      </div>
    </div>
  );
}