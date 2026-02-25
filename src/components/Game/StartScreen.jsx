import React from 'react';
import { Play, BrainCircuit, Type, HelpCircle, BookOpen, ChevronLeft, Image as ImageIcon, Clock, Swords, Bell } from 'lucide-react';
import { DIFFICULTIES } from '../../constants';

// 🌟 ニュースのデータを定義（あとで自由に追加・変更できます）
const NEWS_ITEMS = [
  { id: 1, date: '2026.02.26', tag: 'UPDATE', color: 'bg-blue-500', text: 'サウンド機能と各種アニメーションを追加し、テンポを大幅に改善しました！' },
  { id: 2, date: '2026.02.25', tag: 'NEW', color: 'bg-green-500', text: '「AREA Battle」と「Logic Link」の2つのゲームモードが選択可能になりました。' },
  { id: 3, date: '2026.02.23', tag: 'INFO', color: 'bg-purple-500', text: 'アプリのデザインをサイバーパンク風のリッチなUIにリニューアルしました。' },
  { id: 4, date: '2026.02.20', tag: 'RELEASE', color: 'bg-pink-500', text: 'ディベートバトルアプリのベータ版を公開しました！' },
];

export function StartScreen({ game, playSound }) {
  const {
    gameState, isDrillMode, setupStep, setSetupStep, langMode, setLangMode,
    gameMode, setGameMode, isTopicSelected, topics, selectedTopicId, setSelectedTopicId,
    isStanceSelected, userStance, setUserStance, isDifficultySelected, difficulty, setDifficulty,
    imageMatchEnabled, setImageMatchEnabled, timerEnabled, setTimerEnabled,
    battleRounds, setBattleRounds, canStart, initGame, setIsDrillMode, setFontSize, setShowRules
  } = game;

  if (gameState !== 'start' || isDrillMode) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-6 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60" style={{ backgroundImage: "url('/images/background.webp')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/80 via-[#1e1b4b]/70 to-[#0f172a]/80 animate-gradient-xy mix-blend-overlay pointer-events-none"></div>
        
        <div className="text-center w-full max-w-6xl flex flex-col items-center h-full max-h-[850px] relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-2xl mb-4 shrink-0 mt-2">
            DEBATE BATTLE
            </h1>

            {/* 🌟 2カラム（左右）レイアウトに変更 */}
            <div className="w-full flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pb-2 lg:pb-0">
                
                {/* 📰 左側：NEWSパネル */}
                <div className="order-2 lg:order-1 lg:w-[32%] bg-slate-900/40 backdrop-blur-md p-4 md:p-5 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col shrink-0 overflow-hidden relative min-h-[300px] lg:min-h-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                    <h2 className="text-lg md:text-xl font-black text-white mb-3 md:mb-4 flex items-center gap-2 border-b border-white/20 pb-2 drop-shadow-md">
                        <Bell className="w-5 h-5 text-yellow-400 fill-current animate-pulse" /> NEWS & UPDATES
                    </h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 text-left">
                        {NEWS_ITEMS.map(news => (
                            <div key={news.id} className="bg-slate-800/60 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-colors shadow-md">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white shadow-inner ${news.color}`}>{news.tag}</span>
                                    <span className="text-xs text-slate-400 font-mono tracking-wider">{news.date}</span>
                                </div>
                                <p className="text-sm text-slate-200 leading-relaxed">{news.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⚙️ 右側：既存のメイン設定パネル */}
                <div className="order-1 lg:order-2 lg:w-[68%] bg-slate-900/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col min-h-[450px] lg:min-h-0 overflow-hidden">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 shrink-0">
                        {setupStep > 1 ? (
                            <button onClick={() => { playSound('click'); setSetupStep(prev => prev - 1); }} className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors font-bold">
                                <ChevronLeft className="w-6 h-6"/> Back
                            </button>
                        ) : <div className="w-20"></div>}
                        
                        <div className="flex gap-3">
                        <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                        <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 2 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                        <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 3 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                        </div>

                        <button onClick={() => { playSound('click'); setShowRules(true); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors w-20 justify-end font-bold drop-shadow-md">
                            <HelpCircle className="w-5 h-5"/> Help
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center w-full min-h-0">
                        {setupStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center tracking-widest uppercase drop-shadow-md">1. Language</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button onClick={() => { playSound('click'); setLangMode('en'); setSetupStep(2); }} className={`p-6 md:p-8 rounded-2xl border-4 text-xl md:text-2xl font-black transition-all hover:scale-105 backdrop-blur-sm ${langMode === 'en' ? 'bg-pink-600/90 border-pink-400 text-white shadow-[0_0_30px_rgba(219,39,119,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300'}`}>English</button>
                                    <button onClick={() => { playSound('click'); setLangMode('ja'); setSetupStep(2); }} className={`p-6 md:p-8 rounded-2xl border-4 text-xl md:text-2xl font-black transition-all hover:scale-105 backdrop-blur-sm ${langMode === 'ja' ? 'bg-pink-600/90 border-pink-400 text-white shadow-[0_0_30px_rgba(219,39,119,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300'}`}>日本語</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center tracking-widest uppercase drop-shadow-md">2. Game Mode</h2>
                                <div className="flex flex-col gap-4">
                                    <button onClick={() => { playSound('click'); setGameMode('area'); setSetupStep(3); }} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'area' ? 'bg-purple-600/90 border-purple-400 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300'}`}>AREA Battle (Standard)</button>
                                    <button onClick={() => { playSound('click'); setGameMode('logic_link'); setSetupStep(3); }} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'logic_link' ? 'bg-purple-600/90 border-purple-400 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300'}`}>Logic Link (Reason → Example)</button>
                                    <button onClick={() => { playSound('click'); setGameMode('review'); setSetupStep(3); }} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'review' ? 'bg-teal-600/90 border-teal-400 text-white shadow-[0_0_30px_rgba(13,148,136,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300'}`}><BookOpen className="w-5 h-5"/> Review Mode</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col h-full min-h-0">
                                <h2 className="text-lg md:text-xl font-bold text-white mb-4 text-center tracking-widest uppercase shrink-0 drop-shadow-md">3. Final Settings</h2>
                                
                                <div className="grid md:grid-cols-2 gap-4 md:gap-6 text-left flex-1 min-h-0">
                                    <div className={`bg-slate-950/70 backdrop-blur-md p-3 md:p-4 rounded-2xl flex flex-col h-full min-h-0 transition-all duration-300 ${!isTopicSelected ? 'ring-4 ring-cyan-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/20 shadow-lg'}`}>
                                        <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest border-b border-white/20 pb-1 shrink-0 drop-shadow-md">Topic</h3>
                                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                            {topics.map(t => (
                                                <button key={t.id} onClick={() => { playSound('click'); setSelectedTopicId(t.id); }} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTopicId === t.id ? 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                                                    <div className="font-bold text-base md:text-lg leading-tight">{langMode === 'ja' ? t.titleJP : t.title}</div>
                                                    {langMode === 'en' && <div className="text-xs md:text-sm opacity-60 mt-1">{t.titleJP}</div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 md:gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                                        <div className={`bg-slate-950/70 backdrop-blur-md p-3 md:p-4 rounded-2xl transition-all duration-300 ${!isTopicSelected ? 'opacity-30 pointer-events-none border border-white/5' : (!isStanceSelected ? 'ring-4 ring-green-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/20 shadow-lg')}`}>
                                            <h3 className="text-xs font-bold text-green-400 mb-2 uppercase tracking-widest border-b border-white/20 pb-1 drop-shadow-md">Your Stance</h3>
                                            <div className="flex gap-2">
                                                <button onClick={() => { playSound('click'); setUserStance('affirmative'); }} className={`flex-1 py-2 md:py-3 rounded-xl font-black text-sm md:text-base border-2 transition-all ${userStance === 'affirmative' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>{langMode === 'ja' ? '肯定側' : 'AFFIRMATIVE'}</button>
                                                <button onClick={() => { playSound('click'); setUserStance('negative'); }} className={`flex-1 py-2 md:py-3 rounded-xl font-black text-sm md:text-base border-2 transition-all ${userStance === 'negative' ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>{langMode === 'ja' ? '否定側' : 'NEGATIVE'}</button>
                                            </div>
                                        </div>

                                        <div className={`bg-slate-950/70 backdrop-blur-md p-3 md:p-4 rounded-2xl transition-all duration-300 ${!isStanceSelected ? 'opacity-30 pointer-events-none border border-white/5' : (!isDifficultySelected ? 'ring-4 ring-yellow-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/20 shadow-lg')}`}>
                                            <h3 className="text-xs font-bold text-yellow-400 mb-2 uppercase tracking-widest border-b border-white/20 pb-1 drop-shadow-md">Difficulty</h3>
                                            <div className="flex gap-2">
                                                {Object.keys(DIFFICULTIES).map(d => (
                                                    <button key={d} onClick={() => { playSound('click'); setDifficulty(d); }} className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-all ${difficulty === d ? 'bg-yellow-600 border-yellow-400 text-white shadow-[0_0_15px_rgba(202,138,4,0.5)]' : 'bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>{DIFFICULTIES[d].label}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`bg-slate-950/70 backdrop-blur-md p-3 md:p-4 rounded-2xl transition-all duration-300 border border-white/20 shadow-lg ${!isDifficultySelected ? 'opacity-30 pointer-events-none' : ''}`}>
                                            <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-widest border-b border-white/20 pb-1 drop-shadow-md">Game Modifiers</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-slate-200">
                                                    <span className="font-bold text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Image Match</span>
                                                    <button onClick={() => { playSound('click'); setImageMatchEnabled(!imageMatchEnabled); }} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${imageMatchEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full transform transition-transform shadow-md ${imageMatchEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-200">
                                                    <span className="font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> Time Limit</span>
                                                    <button onClick={() => { playSound('click'); setTimerEnabled(!timerEnabled); }} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${timerEnabled ? 'bg-pink-500' : 'bg-slate-600'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full transform transition-transform shadow-md ${timerEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between font-bold mb-1 text-sm text-slate-200">
                                                        <span className="flex items-center gap-2"><Swords className="w-4 h-4"/> Battle Rounds</span>
                                                        <span className="text-cyan-400">{battleRounds} Rounds</span>
                                                    </div>
                                                    <input type="range" min="1" max="6" value={battleRounds} onChange={(e) => setBattleRounds(Number(e.target.value))} className="w-full accent-cyan-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {canStart && (
                                <button onClick={() => { playSound('click'); initGame(); }} className="w-full mt-4 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-black text-xl md:text-2xl hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] transition-all hover:scale-[1.02] border border-white/30 text-white flex justify-center items-center gap-3 shrink-0 animate-in zoom-in duration-300">
                                    {gameMode === 'review' ? <BookOpen className="w-6 h-6"/> : <Play className="fill-current w-6 h-6"/>} 
                                    {gameMode === 'review' ? 'ENTER REVIEW' : 'BATTLE START'}
                                </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 画面下のメニューボタン */}
            <div className="flex justify-center gap-8 text-sm md:text-base text-slate-300 font-mono mt-4 shrink-0 bg-slate-900/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 shadow-lg">
                <button onClick={() => { playSound('click'); setIsDrillMode(true); }} className="hover:text-white flex items-center gap-2 font-bold"><BrainCircuit className="w-4 h-4 md:w-5 md:h-5"/> Vocab Quiz</button>
                <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="hover:text-white flex items-center gap-2 font-bold"><Type className="w-4 h-4 md:w-5 md:h-5"/> Text Size</button>
            </div>
        </div>
    </div>
  );
}