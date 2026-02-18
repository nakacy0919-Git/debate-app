import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, X, Trophy } from 'lucide-react';

export const VocabDrill = ({ vocabList, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // ランダムに出題順をシャッフル
  const [shuffledList] = useState(() => [...vocabList].sort(() => Math.random() - 0.5));
  const currentWord = shuffledList[currentIndex];

  // 音声読み上げ機能 (Web Speech API)
  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // 英語に設定
    utterance.rate = 0.9; // 少しゆっくりめに
    window.speechSynthesis.speak(utterance);
  };

  // 4択の選択肢を生成
  useEffect(() => {
    if (finished || !currentWord) return;
    
    const wrongAnswers = vocabList
      .filter(v => v.meaning !== currentWord.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.meaning);
      
    // 正解と不正解を混ぜてシャッフル
    const choices = [currentWord.meaning, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(choices);
    setSelectedAnswer(null);

    // 問題が出た時に自動で発音（設定でオフにすることも可能ですが今回はオン）
    playAudio(currentWord.word);
  }, [currentIndex, currentWord, finished, vocabList]);

  const handleSelect = (answer) => {
    if (selectedAnswer) return; // すでに選んでいたら無視
    setSelectedAnswer(answer);
    if (answer === currentWord.meaning) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="absolute inset-0 z-[150] bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
        <div className="bg-[#1e293b] text-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/10">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-4xl font-black mb-2">Training Complete!</h2>
            <p className="text-xl text-slate-300 mb-8">Score: {score} / {vocabList.length}</p>
            <button onClick={onClose} className="w-full bg-blue-600 py-4 rounded-xl font-bold text-xl hover:bg-blue-500 transition-colors shadow-lg">
              Back to Game
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[150] bg-[#0f172a]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-slate-900/50 border-b border-white/10">
          <span className="font-bold text-blue-400 uppercase tracking-widest text-sm">Vocabulary Quiz</span>
          <div className="flex items-center gap-4">
             <span className="text-sm font-mono text-slate-400">{currentIndex + 1} / {shuffledList.length}</span>
             <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
          </div>
        </div>

        {/* Word Area */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-800 to-[#1e293b]">
           <div className="flex justify-center items-center gap-4 mb-2">
             <h3 className="text-5xl font-black text-white capitalize">{currentWord?.word}</h3>
             <button onClick={() => playAudio(currentWord?.word)} className="p-3 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/40 transition-colors">
               <Volume2 className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-1 gap-3 flex-1">
           {options.map((opt, i) => {
             let btnClass = "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500";
             if (selectedAnswer) {
               if (opt === currentWord.meaning) btnClass = "bg-green-600/20 border-green-500 text-green-400"; // 正解の色
               else if (opt === selectedAnswer) btnClass = "bg-red-600/20 border-red-500 text-red-400"; // 間違えた選択肢の色
               else btnClass = "bg-slate-800 border-slate-700 text-slate-600 opacity-50"; // その他
             }

             return (
               <button 
                 key={i} 
                 onClick={() => handleSelect(opt)}
                 disabled={!!selectedAnswer}
                 className={`w-full p-4 rounded-xl border-2 font-bold text-lg text-left transition-all flex justify-between items-center ${btnClass}`}
               >
                 {opt}
                 {selectedAnswer && opt === currentWord.meaning && <CheckCircle2 className="w-6 h-6" />}
                 {selectedAnswer && opt === selectedAnswer && opt !== currentWord.meaning && <XCircle className="w-6 h-6" />}
               </button>
             );
           })}
        </div>

        {/* Footer (Next Button) */}
        {selectedAnswer && (
          <div className="p-4 bg-slate-900/50 border-t border-white/10 animate-in slide-in-from-bottom-2">
            <button 
              onClick={handleNext}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"
            >
              {currentIndex < shuffledList.length - 1 ? 'Next Word' : 'See Results'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};