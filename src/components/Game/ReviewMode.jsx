import React from 'react';
import { ShieldCheck, ArrowUpCircle, Lightbulb, Home } from 'lucide-react';
import { SmartText } from '../UI/SmartText';

const ICONS = {
  assertion: ShieldCheck, reason: ArrowUpCircle, evidence: Lightbulb, mini_conclusion: ShieldCheck
};
const COLORS = {
  assertion: "text-blue-400 border-blue-500/50 bg-blue-900/10",
  reason: "text-green-400 border-green-500/50 bg-green-900/10",
  evidence: "text-orange-400 border-orange-500/50 bg-orange-900/10",
  mini_conclusion: "text-purple-400 border-purple-500/50 bg-purple-900/10"
};

export const ReviewMode = ({ topic, onClose, showJapanese, langMode }) => {
  // グループ（論点）ごとにカードをまとめる処理
  const groupedCards = topic.deck.reduce((acc, card) => {
    if (!card.group) return acc;
    if (!acc[card.group]) acc[card.group] = [];
    acc[card.group].push(card);
    return acc;
  }, {});

  return (
    <div className="absolute inset-0 z-[100] bg-[#0f172a] text-slate-200 flex flex-col">
      <header className="shrink-0 bg-[#1e293b]/90 border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full flex gap-2 items-center font-bold text-slate-300">
           <Home className="w-5 h-5"/> Exit Review
        </button>
        <div className="text-center">
            <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Review Mode</div>
            <h1 className="font-black text-xl">{langMode === 'ja' ? topic.titleJP : topic.title}</h1>
        </div>
        <div className="w-24"></div> {/* バランス調整用 */}
      </header>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {/* レスポンシブなMasonry風グリッド（スマホは1列、タブレット以上は複数列） */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          
          {Object.entries(groupedCards).map(([groupName, cards]) => {
            const stance = cards[0]?.stance; // affirmative or negative
            return (
              <div key={groupName} className={`p-6 rounded-2xl border-t-4 shadow-xl ${stance === 'affirmative' ? 'bg-slate-900/80 border-blue-500' : 'bg-slate-900/80 border-red-500'}`}>
                
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/10">
                   <span className="font-mono text-slate-400 text-sm">Logic: {groupName}</span>
                   <span className={`px-3 py-1 rounded text-xs font-black uppercase ${stance === 'affirmative' ? 'bg-blue-600/20 text-blue-400' : 'bg-red-600/20 text-red-400'}`}>
                      {stance}
                   </span>
                </div>

                <div className="space-y-4">
                  {cards.map(card => {
                     const Icon = ICONS[card.type] || ArrowUpCircle;
                     const colorClass = COLORS[card.type] || COLORS.reason;
                     
                     return (
                        <div key={card.id} className={`p-4 rounded-xl border ${colorClass}`}>
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                               <Icon className="w-4 h-4"/>
                               <span className="text-[10px] font-black uppercase tracking-widest">{card.type}</span>
                            </div>
                            
                            {langMode === 'ja' ? (
                                <p className="font-bold text-lg text-white leading-relaxed">{card.textJP}</p>
                            ) : (
                                <>
                                  <p className="font-bold text-white leading-relaxed text-base">
                                      <SmartText text={card.text} vocabList={topic.vocabulary} />
                                  </p>
                                  {showJapanese && <p className="mt-2 pt-2 border-t border-white/10 text-slate-400 text-sm">{card.textJP}</p>}
                                </>
                            )}
                        </div>
                     );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};