import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, BrainCircuit, Play, Volume2 } from 'lucide-react';

export function VocabDrill({ topics, onClose, playSound, ttsVoiceType }) {
  const [quizState, setQuizState] = useState('select_topic'); 
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // 🗣️ 音声読み上げロジック（男女の声の判別）
  const speakWord = (wordText) => {
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      
      if (voices.length > 0) {
          if (ttsVoiceType === 'male') {
              utterance.voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('david')) || voices[0];
          } else {
              utterance.voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('girl') || v.name.toLowerCase().includes('zira')) || voices[0];
          }
      }
      window.speechSynthesis.speak(utterance);
  };

  const startQuiz = (topic) => {
    playSound('click');
    const vocab = topic.vocabulary || [];
    if (vocab.length < 4) {
        alert("このトピックには十分な単語データがありません。"); return;
    }

    const shuffledVocab = [...vocab].sort(() => Math.random() - 0.5).slice(0, 10);
    const generatedQuestions = shuffledVocab.map(correctWord => {
      const others = vocab.filter(v => v.word !== correctWord.word).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctWord, ...others].sort(() => Math.random() - 0.5);
      return { answer: correctWord, options };
    });

    setSelectedTopic(topic);
    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setQuizState('playing');
    
    // 最初の単語を読み上げ
    setTimeout(() => speakWord(generatedQuestions[0].answer.word), 500);
  };

  const handleAnswer = (selectedWord) => {
    const isCorrect = selectedWord.word === questions[currentIndex].answer.word;
    if (isCorrect) {
      playSound('correct'); setScore(prev => prev + 1); setFeedback('correct');
    } else {
      playSound('wrong'); setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        // 次の問題に進んだら自動で読み上げ
        speakWord(questions[currentIndex + 1].answer.word);
      } else {
        playSound('clear'); setQuizState('result');
      }
    }, 1000);
  };

  return (
    <div className="absolute inset-0 z-[200] bg-[#0f172a]/95 backdrop-blur-md flex flex-col items-center p-6 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-cyan-400 flex items-center gap-3 drop-shadow-lg">
            <BrainCircuit className="w-8 h-8" /> VOCABULARY QUIZ
        </h2>
        <button onClick={() => { playSound('click'); onClose(); }} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 text-white transition-colors border border-white/20">
          <X className="w-6 h-6" />
        </button>
      </div>

      {quizState === 'select_topic' && (
        <div className="w-full max-w-2xl bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center border-b border-white/10 pb-4">練習するトピックを選んでください</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {topics.map(topic => (
                    <button key={topic.id} onClick={() => startQuiz(topic)} className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-blue-600 rounded-xl border border-white/10 transition-all group">
                        <div className="text-left">
                            <div className="font-bold text-white text-lg">{topic.title}</div>
                            <div className="text-sm text-slate-400 group-hover:text-blue-200">{topic.titleJP}</div>
                        </div>
                        <Play className="text-cyan-400 group-hover:text-white w-6 h-6" />
                    </button>
                ))}
            </div>
        </div>
      )}

      {quizState === 'playing' && questions.length > 0 && (
        <div className="w-full max-w-2xl bg-slate-900/80 p-6 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            {feedback && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm animate-in zoom-in ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {feedback === 'correct' ? <CheckCircle2 className="w-32 h-32 text-green-400 drop-shadow-lg"/> : <AlertTriangle className="w-32 h-32 text-red-400 drop-shadow-lg"/>}
                </div>
            )}
            
            <div className="flex justify-between items-center text-sm font-bold text-slate-400 mb-8 tracking-widest uppercase border-b border-white/10 pb-4">
                <span>{selectedTopic.title}</span>
                <span>Question {currentIndex + 1} / {questions.length}</span>
            </div>
            
            <div className="text-center mb-10 flex flex-col items-center">
                <div className="text-sm text-cyan-400 font-bold mb-3">この単語の意味は？</div>
                <div className="flex items-center gap-4">
                    <div className="text-4xl md:text-5xl font-black text-white tracking-wider drop-shadow-md">
                        {questions[currentIndex].answer.word}
                    </div>
                    {/* 🗣️ もう一度聞くためのスピーカーボタン */}
                    <button onClick={() => speakWord(questions[currentIndex].answer.word)} className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-lg transition-transform hover:scale-110">
                        <Volume2 className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {questions[currentIndex].options.map((opt, i) => (
                    <button key={i} disabled={feedback !== null} onClick={() => handleAnswer(opt)} className="p-4 bg-slate-800 border-2 border-slate-600 rounded-xl text-white font-bold text-lg hover:border-cyan-400 hover:bg-slate-700 transition-all disabled:opacity-50">
                        {opt.meaning}
                    </button>
                ))}
            </div>
        </div>
      )}

      {quizState === 'result' && (
        <div className="w-full max-w-2xl bg-slate-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl text-center animate-in slide-in-from-bottom-8">
            <h3 className="text-3xl font-black text-white mb-2">QUIZ FINISHED!</h3>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8 drop-shadow-lg">
                {score} / {questions.length}
            </div>
            <p className="text-lg text-slate-300 mb-8">よく頑張りました！ディベート本番でもこの単語を使ってみましょう。</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => setQuizState('select_topic')} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-colors">別のトピックを選ぶ</button>
                <button onClick={() => { playSound('click'); onClose(); }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-colors shadow-lg shadow-blue-500/50">終了する</button>
            </div>
        </div>
      )}
    </div>
  );
}