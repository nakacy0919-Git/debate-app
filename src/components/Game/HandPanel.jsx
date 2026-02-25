import React from 'react';
import { Lightbulb, GripVertical, Undo2, MoveHorizontal, Image as ImageIcon } from 'lucide-react';
import { CARD_TYPES } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function HandPanel({ game, playSound }) {
  const { 
    gameState, sidePanelWidth, sidePanelPos, setSidePanelPos, isResizing,
    handleUndo, tower, imageHand, shakingCardId, handleImageSelect, 
    visibleHand, handleCardSelect, langMode, showJapanese, difficulty, currentTopic 
  } = game;

  return (
    <>
      <div className="w-4 bg-slate-900/80 border-x border-white/10 cursor-col-resize hover:bg-blue-900/50 flex items-center justify-center z-20 backdrop-blur-md" 
           onMouseDown={() => isResizing.current = true} onTouchStart={() => isResizing.current = true}>
        <GripVertical className="w-4 h-4 text-slate-500"/>
      </div>

      <div className="flex flex-col bg-[#1e293b]/80 backdrop-blur-md border-l border-white/10 shadow-2xl z-20" style={{ width: `${sidePanelWidth}%`, minWidth: '300px' }}>
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-slate-900/60 shadow-inner">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  {gameState.endsWith('_image') ? <ImageIcon className="w-4 h-4"/> : <Lightbulb className="w-4 h-4"/>} 
                  {gameState.endsWith('_image') ? "Select Image" : "Hand"}
              </div>
              <div className="flex gap-1">
                  <button onClick={() => { playSound('click'); setSidePanelPos(prev => prev === 'left' ? 'right' : 'left'); }} className="p-1 hover:bg-white/20 rounded text-white transition-colors"><MoveHorizontal className="w-4 h-4"/></button>
                  {gameState === 'construct' && <button onClick={() => { playSound('click'); handleUndo(); }} className="p-1 hover:bg-white/20 rounded flex items-center text-xs font-bold text-white transition-colors disabled:opacity-30" disabled={tower.length === 0}><Undo2 className="w-4 h-4"/></button>}
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {gameState.endsWith('_image') ? (
                  <div className="flex flex-col items-center gap-3 h-full pb-10 overflow-y-auto">
                      {imageHand.map((url, idx) => {
                          const shakeClass = url === shakingCardId ? 'animate-shake ring-4 ring-red-500' : 'border-white/20';
                          return (
                            <button key={idx} onClick={() => handleImageSelect(url)} className={`relative w-[90%] max-w-[220px] shrink-0 border-4 rounded-xl overflow-hidden hover:border-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-lg group aspect-video ${shakeClass}`}>
                                <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"/>
                                {url ? <img src={url} className="w-full h-full object-cover" alt="Choice" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">No Image</div>}
                            </button>
                          );
                      })}
                  </div>
              ) : (
                  visibleHand.map((card) => {
                      const type = CARD_TYPES[card.type] || CARD_TYPES.reason;
                      const shakeClass = card.id === shakingCardId ? 'animate-shake ring-4 ring-red-500 bg-red-900/60' : '';

                      return (
                          <button key={card.id} onClick={() => handleCardSelect(card)} className={`w-full relative overflow-hidden group text-left p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${type.bg} border-white/20 hover:border-white/50 animate-in fade-in zoom-in-95 shadow-md ${shakeClass}`}>
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                              <div className="flex justify-between items-start mb-2 relative z-10">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white shadow-inner`}>{langMode === 'ja' || showJapanese ? type.labelJP : type.label}</span>
                                  {React.createElement(type.icon, { className: "w-4 h-4 text-white opacity-90 drop-shadow-md" })}
                              </div>
                              <div className="relative z-10">
                                  {langMode === 'ja' ? <div className="font-bold text-white text-sm md:text-base drop-shadow-md leading-relaxed">{card.textJP}</div> : (
                                      <><div className="font-bold text-white leading-relaxed text-sm md:text-base drop-shadow-md"><SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic?.vocabulary || []} /></div>{showJapanese && <div className="mt-2 pt-2 border-t border-white/20 text-slate-200 text-xs">{card.textJP}</div>}</>
                                  )}
                              </div>
                          </button>
                      );
                  })
              )}
          </div>
      </div>
    </>
  );
}