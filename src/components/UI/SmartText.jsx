import React, { useState } from 'react';

// 文中の単語がVocabularyリストにあるかチェックし、あればクリック可能にする
export const SmartText = ({ text, vocabList = [] }) => {
  const [activeWord, setActiveWord] = useState(null);

  // 単語単位に分割
  const words = text.split(/(\s+|[.,!?;:"'()])+/);

  return (
    <span className="relative inline-block">
      {words.map((segment, i) => {
        const cleanWord = segment.toLowerCase().replace(/[^a-z]/g, '');
        const vocabMatch = vocabList.find(v => v.word.toLowerCase() === cleanWord);

        if (vocabMatch && cleanWord.length > 1) {
          return (
            <span key={i} className="relative group cursor-pointer inline-block">
              <span 
                // 変更点：色は継承(text-inherit)し、下線のみで表現
                className="border-b-2 border-dotted border-current opacity-90 hover:opacity-100 hover:border-solid transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveWord(vocabMatch);
                }}
              >
                {segment}
              </span>
            </span>
          );
        }
        return <span key={i}>{segment}</span>;
      })}

      {/* ポップアップデザインもリッチに変更 */}
      {activeWord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setActiveWord(null); }}>
          <div className="bg-slate-900/90 border border-white/10 text-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h3 className="text-4xl font-black mb-2 capitalize tracking-tight">{activeWord.word}</h3>
            <p className="text-xl font-medium text-slate-300 mb-6">{activeWord.meaning}</p>
            <button 
              onClick={() => setActiveWord(null)}
              className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2 rounded-full text-sm font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </span>
  );
};