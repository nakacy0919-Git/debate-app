import React from 'react';
import { Undo2, PanelLeftClose, PanelRightClose, CheckCircle2 } from 'lucide-react';
import { CARD_TYPES, FLOWS } from '../../constants';
import { SmartText } from '../UI/SmartText';

export function HandPanel({ game, playSound }) {
  const {
    visibleHand, // 💡 抽出済みの手札を使う
    imageHand, gameState, gameMode, handleCardSelect, handleImageSelect,
    difficulty, langMode, currentTopic, handleUndo, tower, activeLogicGroup,
    sidePanelPos, setSidePanelPos, imageSize, fontSize // 💡 テキストサイズを取得
  } = game;

  const togglePosition = () => {
    playSound('click');
    setSidePanelPos(prev => prev === 'right' ? 'left' : 'right');
  };

  const isImagePhase = gameState.endsWith('_image');

  const getLocalizedJP = (cardObj) => {
    if (!cardObj.textJP) return "";
    return typeof cardObj.textJP === 'object' ? cardObj.textJP[difficulty] : cardObj.textJP;
  };

  const nextType = (FLOWS[gameMode] || FLOWS.area)[tower.length];
  const nextLabel = CARD_TYPES[nextType] || CARD_TYPES.assertion;
  const instruction = isImagePhase
    ? (langMode === 'ja' ? '英文に合う画像を選ぶ' : 'Choose the matching image')
    : gameState === 'construct'
      ? (langMode === 'ja' ? `${nextLabel.labelJP}を選ぶ` : `Choose ${nextLabel.label}`)
      : gameState === 'cross_exam'
        ? (langMode === 'ja' ? '質問への回答を選ぶ' : 'Answer the question')
        : gameState === 'rebuttal_defense'
          ? (langMode === 'ja' ? '反論への回答を選ぶ' : 'Choose your rebuttal')
          : gameState === 'closing'
            ? (langMode === 'ja' ? '最終弁論を選ぶ' : 'Choose your closing statement')
            : '';

  const imageMinWidth = imageSize === 'large' ? '240px' : imageSize === 'normal' ? '140px' : '110px';
  
  // 💡 テキストサイズ変更ボタンの数値をCSSのクラスに変換
  const textClass = fontSize === 'xlarge' ? 'text-xl md:text-2xl' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-sm md:text-base';

  return (
    <div className="flex flex-col h-full bg-[#0b1121] border-x border-white/10 shadow-2xl relative">
      
      <div className="flex justify-between items-center p-3 md:p-4 bg-slate-900 border-b border-cyan-900/50 shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-black text-white tracking-widest text-sm md:text-base">{langMode === 'ja' ? '選択肢' : 'YOUR CHOICES'}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePosition} 
            className="game-panel-position-toggle p-2 md:p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 min-w-11 min-h-11 justify-center"
            title={`パネルを${sidePanelPos === 'right' ? '左' : '右'}に移動`}
          >
            {sidePanelPos === 'right' ? <PanelLeftClose className="w-5 h-5"/> : <PanelRightClose className="w-5 h-5"/>}
            <span className="text-xs font-bold hidden xl:block">移動</span>
          </button>

          <button 
            onClick={() => { playSound('click'); handleUndo(); }} 
            disabled={gameState !== 'construct' || tower.length === 0 || isImagePhase} 
            className="p-2 md:p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 min-w-11 min-h-11 justify-center"
            title="一手戻る (Undo)"
          >
            <Undo2 className="w-5 h-5" />
            <span className="text-xs font-bold hidden xl:block">戻る</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gradient-to-b from-slate-900/50 to-transparent">
        
        {instruction && (
          <p role="status" className="text-sm md:text-base font-semibold text-cyan-200 bg-slate-800/60 rounded-lg px-3 py-2 mb-3">
            {instruction}
          </p>
        )}

        <div className="w-full flex flex-col gap-4">
          
          {isImagePhase ? (
            <div 
              className="grid gap-4 w-full" 
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${imageMinWidth}), 1fr))` }}
            >
              {imageHand.map((url, i) => (
                <button 
                  key={i} 
                  onClick={() => handleImageSelect(url)} 
                  aria-label={`画像選択肢 ${i + 1}`}
                  className="w-full aspect-video rounded-xl overflow-hidden border-2 border-white/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition-all bg-black group relative"
                >
                  <img src={url} alt={`画像選択肢 ${i + 1}`} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/20 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            /* 💡 修正：visibleHand を使う */
            visibleHand.map(card => {
              const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
              const isFaded = gameState === 'construct' && activeLogicGroup && card.group !== activeLogicGroup;
              
              return (
                <button 
                  key={card.id} 
                  onClick={() => handleCardSelect(card)} 
                  className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300 transition-all group relative overflow-hidden ${isFaded ? 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0' : 'hover:scale-[1.02] shadow-lg'} ${typeStyle.border} ${typeStyle.bg} ${typeStyle.hoverBg}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] md:text-xs font-black px-3 py-1 rounded bg-black/40 border shadow-inner ${typeStyle.color} ${typeStyle.border}`}>
                      {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                    </span>
                    <typeStyle.icon className={`w-5 h-5 ${typeStyle.color} opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md`} />
                  </div>

                  {/* 💡 修正：テキストサイズを適用 */}
                  <div className={`font-bold text-white leading-relaxed drop-shadow-md ${textClass}`}>
                    {langMode === 'ja' ? getLocalizedJP(card) : (
                      <SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}