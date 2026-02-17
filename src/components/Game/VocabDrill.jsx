import React, { useState } from 'react';
import { RefreshCcw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const VocabDrill = ({ vocabList, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  // ランダムに出題順をシャッフル
  const [shuffledList] = useState(() => [...vocabList].sort(() => Math.random() - 0.5));
  const currentWord = shuffledList[currentIndex];

  const handleNext = () => {
    if (currentIndex < shuffledList.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-white animate-in fade-in">
        <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Training Complete!</h2>
            <p className="mb-8 text-slate-300">You reviewed {vocabList.length} words.</p>
            <button onClick={onClose} className="bg-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-500 transition-colors shadow-lg hover:shadow-blue-500/50">
            Back to Game
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[450px] flex flex-col relative animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 bg-slate-100 flex justify-between items-center text-slate-600 border-b">
          <span className="font-bold text-xs uppercase tracking-widest">Vocabulary Drill</span>
          <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">{currentIndex + 1} / {shuffledList.length}</span>
        </div>

        {/* Card Content */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-50 transition-colors select-none"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="text-center w-full">
            <h3 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 capitalize break-words">{currentWord.word}</h3>
            
            <div className="h-24 flex items-center justify-center">
                {isFlipped ? (
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
                    <div className="w-16 h-1 bg-blue-500 mx-auto mb-4 rounded-full"></div>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600 break-words">{currentWord.meaning}</p>
                </div>
                ) : (
                <p className="text-slate-400 text-sm animate-pulse border border-slate-200 rounded-full px-4 py-1 inline-block">Tap to flip</p>
                )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-4 py-2">
            Quit
          </button>
          
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all active:scale-95 shadow-lg ml-auto"
          >
            {currentIndex < shuffledList.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};