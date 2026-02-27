import React, { useState } from 'react';
import { Lightbulb, GripVertical, Undo2, MoveHorizontal, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { CARD_TYPES } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function HandPanel({ game, playSound }) {
  const { 
    gameState, sidePanelWidth, sidePanelPos, setSidePanelPos, isResizing, fontSize,
    handleUndo, tower, imageHand, shakingCardId, handleImageSelect, 
    visibleHand, handleCardSelect, langMode, showJapanese, difficulty, currentTopic 
  } = game;

  const [imgSizeConfig, setImgSizeConfig] = useState(240);

  const textBaseClass = fontSize === 'xlarge' ? 'text-2xl md:text-3xl' : fontSize === 'large' ? 'text-xl md:text-2xl' : 'text-base md:text-lg';
  const jpTextClass = fontSize === 'xlarge' ? 'text-xl md:text-2xl' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-sm md:text-base';

  return (
    <>
      <div className="w-4 bg-slate-900/80 border-x border-white/10 cursor-col-resize hover:bg-blue-900/50 flex items-center justify-center z-20 backdrop-blur-md" 
           onMouseDown={() => isResizing.current = true} onTouchStart={() => isResizing.current = true}>
        <GripVertical className="w-4 h-4 text-slate-500"/>
      </div>

      <div className="flex flex-col bg-[#1e293b]/80 backdrop-blur-md border-l border-white/10 shadow-2xl z-20" style={{ width: `${sidePanelWidth}%`, minWidth: '300px' }}>
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-slate-900/60 shadow-inner shrink-0">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  {gameState.endsWith('_image') ? <ImageIcon className="w-4 h-4"/> : <Lightbulb className="w-4 h-4"/>} 
                  {gameState.endsWith('_image') ? "Select Image" : "Hand"}
              </div>
              
              <div className="flex gap-1 items-center shrink-0">
                  {gameState.endsWith('_image') && (
                      <div className="flex gap-1 mr-2 bg-black/50 rounded-lg p-1 border border-white/20 shadow-inner">
                          <button onClick={() => setImgSizeConfig(p => Math.min(p + 40, 500))} className="p-1 hover:bg-white/20 rounded text-cyan-300 transition-colors"><ZoomIn className="w-5 h-5"/></button>
                          <button onClick={() => setImgSizeConfig(p => Math.max(p - 40, 120))} className="p-1 hover:bg-white/20 rounded text-pink-300 transition-colors"><ZoomOut className="w-5 h-5"/></button>
                      </div>
                  )}
                  <button onClick={() => { playSound('click'); setSidePanelPos(prev => prev === 'left' ? 'right' : 'left'); }} className="p-1 hover:bg-white/20 rounded text-white transition-colors"><MoveHorizontal className="w-4 h-4"/></button>
                  {gameState === 'construct' && <button onClick={() => { playSound('click'); handleUndo(); }} className="p-1 hover:bg-white/20 rounded flex items-center text-xs font-bold text-white transition-colors disabled:opacity-30" disabled={tower.length === 0}><Undo2 className="w-4 h-4"/></button>}
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {gameState.endsWith('_image') ? (
                  <div className="flex flex-col h-full pb-10">
                      <div className="bg-cyan-900/60 border-2 border-cyan-400 text-white font-black text-center p-3 md:p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[pulse_3s_ease-in-out_infinite] tracking-wide">
                          ↑ 例文の内容に最も合っている画像を選びましょう！
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-4 w-full">
                          {imageHand.map((url, idx) => {
                              const shakeClass = url === shakingCardId ? 'animate-shake ring-4 ring-red-500' : 'border-white/20';
                              return (
                                <button 
                                  key={idx} 
                                  onClick={() => handleImageSelect(url)} 
                                  style={{ width: `${imgSizeConfig}px`, maxWidth: '100%' }}
                                  className={`relative shrink-0 border-4 rounded-xl overflow-hidden hover:border-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-lg group aspect-video ${shakeClass}`}
                                >
                                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"/>
                                    {url ? <img src={url} className="w-full h-full object-cover" alt="Choice" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">No Image</div>}
                                </button>
                              );
                          })}
                      </div>
                  </div>
              ) : (
                  <div className="space-y-4 pb-10">
                      {/* 💡 Easyモード限定の丁寧な指示表示（アニメーション付き） */}
                      {difficulty === 'easy' && gameState === 'construct' && (
                          <div className="bg-blue-900/60 border-2 border-blue-400 text-white font-black text-center p-3 md:p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[pulse_3s_ease-in-out_infinite] tracking-wide">
                              {tower.length === 0 && "あなたの主張 (Assertion) を選びましょう！"}
                              {tower.length === 1 && "主張に対する理由 (Reason) を選びましょう！"}
                              {tower.length === 2 && "理由を裏付ける例 (Example) を選びましょう！"}
                              {tower.length === 3 && "最後に再びあなたの主張 (Assertion) を選びましょう！"}
                          </div>
                      )}
                      {difficulty === 'easy' && gameState === 'cross_exam' && (
                          <div className="bg-teal-900/60 border-2 border-teal-400 text-white font-black text-center p-3 md:p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(45,212,191,0.8)] animate-[pulse_3s_ease-in-out_infinite] tracking-wide">
                              相手の質問に論理的に答えましょう！
                          </div>
                      )}
                      {difficulty === 'easy' && gameState === 'rebuttal_defense' && (
                          <div className="bg-rose-900/60 border-2 border-rose-400 text-white font-black text-center p-3 md:p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(251,113,133,0.8)] animate-[pulse_3s_ease-in-out_infinite] tracking-wide">
                              相手の反論をブロックしましょう！
                          </div>
                      )}
                      {/* 💡 修正②：Closingフェーズの指示を追加 */}
                      {difficulty === 'easy' && gameState === 'closing' && (
                          <div className="bg-purple-900/60 border-2 border-purple-400 text-white font-black text-center p-3 md:p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-[pulse_3s_ease-in-out_infinite] tracking-wide">
                              ディベートを締めくくる最終主張 (Assertion) を選びましょう！
                          </div>
                      )}

                      {visibleHand.map((card) => {
                          const type = CARD_TYPES[card.type] || CARD_TYPES.reason;
                          const shakeClass = card.id === shakingCardId ? 'animate-shake ring-4 ring-red-500 bg-red-900/60' : '';
                          
                          // 💡 修正①：カード自体の光るエフェクトを削除し、通常表示のみにする
                          const highlightClass = 'border-white/20 hover:border-white/50 shadow-md';

                          return (
                              <button key={card.id} onClick={() => handleCardSelect(card)} className={`w-full h-auto min-h-fit relative overflow-hidden group text-left p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${type.bg} ${highlightClass} animate-in fade-in zoom-in-95 ${shakeClass}`}>
                                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white shadow-inner`}>{langMode === 'ja' || showJapanese ? type.labelJP : type.label}</span>
                                      {React.createElement(type.icon, { className: "w-4 h-4 text-white opacity-90 drop-shadow-md" })}
                                  </div>
                                  <div className="relative z-10 flex-1">
                                      {langMode === 'ja' ? <div className={`font-bold text-white leading-normal md:leading-relaxed drop-shadow-md ${textBaseClass}`}>{card.textJP}</div> : (
                                          <><div className={`font-bold text-white leading-normal md:leading-relaxed drop-shadow-md ${textBaseClass}`}><SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic?.vocabulary || []} /></div>{showJapanese && <div className={`mt-2 pt-2 border-t border-white/20 text-slate-200 ${jpTextClass}`}>{card.textJP}</div>}</>
                                      )}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              )}
          </div>
      </div>
    </>
  );
}