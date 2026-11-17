import React, { useState } from 'react';
import { Play, BrainCircuit, Type, HelpCircle, BookOpen, ChevronLeft, Image as ImageIcon, Clock, Swords, Settings, X, Volume2, Speech, Trophy } from 'lucide-react';
import { DIFFICULTIES } from '../../constants';

export function StartScreen({ game, playSound }) {
  const {
    gameState, isDrillMode, setupStep, setSetupStep, langMode, setLangMode,
    gameMode, setGameMode, isTopicSelected, topics, selectedTopicId, setSelectedTopicId,
    isStanceSelected, userStance, setUserStance, isDifficultySelected, difficulty, setDifficulty,
    imageMatchEnabled, setImageMatchEnabled, timerEnabled, setTimerEnabled,
    battleRounds, setBattleRounds, canStart, initGame, setIsDrillMode, setFontSize, setShowRules,
    ttsVoiceType, setTtsVoiceType, sfxEnabled, setSfxEnabled,
    playerName, setPlayerName,
    leaderboard, fetchLeaderboard 
  } = game;

  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const handleLangSelect = (lang) => {
      playSound('click');
      setLangMode(lang);
      setSetupStep(2);
  };

  const handleModeSelect = (mode) => {
      playSound('click');
      setGameMode(mode);
      setSetupStep(3);
  };

  const handleOpenLeaderboard = async () => {
      playSound('click');
      setShowLeaderboard(true);
      await fetchLeaderboard(selectedTopicId, difficulty);
  };

  if (gameState !== 'start' || isDrillMode) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-6 bg-transparent overflow-hidden">
        
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3 z-50">
            {setupStep === 3 && isTopicSelected && isDifficultySelected && (
                <button onClick={handleOpenLeaderboard} className="p-3 bg-yellow-600/90 rounded-full border-2 border-yellow-300 text-white hover:bg-yellow-500 hover:scale-110 transition-all shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse" title="このブラウザの記録">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            )}
            <button onClick={() => { playSound('click'); setShowSettings(true); }} className="p-3 bg-slate-800/80 rounded-full border border-white/20 text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all shadow-lg" title="Settings">
                <Settings className="w-6 h-6 md:w-8 md:h-8" />
            </button>
        </div>

        {showLeaderboard && (
            <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
                <div className="bg-slate-900 border-2 border-yellow-500 rounded-3xl p-6 md:p-8 w-full max-w-md text-white relative shadow-[0_0_50px_rgba(234,179,8,0.4)] max-h-[80vh] flex flex-col">
                    <button onClick={() => { playSound('click'); setShowLeaderboard(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
                    <h3 className="text-2xl font-black mb-2 text-center text-yellow-400 flex items-center justify-center gap-2"><Trophy/> LOCAL RECORDS</h3>
                    <div className="text-center text-sm text-slate-400 mb-6 border-b border-white/10 pb-4">
                        {topics.find(t=>t.id===selectedTopicId)?.title} / <span className="uppercase text-cyan-400">{difficulty}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {leaderboard.length === 0 ? (
                            <div className="text-center text-slate-500 py-10 font-bold">まだ記録がありません。<br/>最初のチャンピオンになろう！</div>
                        ) : (
                            leaderboard.map((record, index) => {
                                return (
                                    <div key={record.id} className={`flex items-center justify-between p-3 rounded-xl border ${index === 0 ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300' : index === 1 ? 'bg-slate-800/80 border-slate-400 text-slate-300' : index === 2 ? 'bg-orange-950/50 border-orange-700 text-orange-400' : 'bg-slate-800/40 border-white/5 text-slate-400'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="font-black text-lg w-6">{index + 1}</div>
                                            <div className="flex flex-col">
                                                <div className="font-bold truncate max-w-[120px]">{record.name}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-0.5"><MapPin size={10}/> {record.location || 'Earth'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-xl">{record.score.toLocaleString()}</div>
                                            <div className="text-[10px] opacity-60">{record.date}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        )}

        {showSettings && (
            <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
                <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl p-6 md:p-8 w-full max-w-md text-white relative shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                    <button onClick={closeSettings} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
                    <h3 className="text-2xl font-black mb-6 text-center text-cyan-400 flex items-center justify-center gap-2 border-b border-white/10 pb-4"><Settings/> SETTINGS</h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 font-bold text-lg"><Volume2 className="text-pink-400 w-5 h-5"/> SFX (効果音)</div>
                            <button onClick={() => { playSound('click'); setSfxEnabled(!sfxEnabled); }} className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 shadow-inner ${sfxEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${sfxEnabled ? 'translate-x-6' : 'translate-x-0'}`}/>
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 font-bold text-lg"><Speech className="text-purple-400 w-5 h-5"/> Vocab Voice</div>
                            <div className="flex gap-2">
                                <button onClick={() => { playSound('click'); setTtsVoiceType('female'); }} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-colors ${ttsVoiceType === 'female' ? 'bg-purple-600 text-white border border-purple-400' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>Female</button>
                                <button onClick={() => { playSound('click'); setTtsVoiceType('male'); }} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-colors ${ttsVoiceType === 'male' ? 'bg-purple-600 text-white border border-purple-400' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>Male</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`text-center w-full flex flex-col items-center h-full max-h-[900px] relative z-10 pb-4 transition-all duration-500 ${setupStep === 1 ? 'max-w-6xl pt-20 md:pt-16' : 'max-w-7xl pt-20 md:pt-16'}`}>
            
            {setupStep === 1 && (
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-2xl mb-4 shrink-0 mt-2 animate-in fade-in">
                DEBATE BATTLE
                </h1>
            )}

            <div className="w-full flex-1 flex flex-col justify-center items-center min-h-0 custom-scrollbar pb-2 lg:pb-0">
                <div className={`bg-slate-900/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col min-h-[450px] lg:min-h-0 overflow-hidden transition-all duration-500 w-full ${setupStep >= 3 ? 'max-w-5xl h-full' : 'max-w-4xl'}`}>
                    
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 shrink-0">
                        {setupStep > 1 ? (
                            <button onClick={() => { playSound('click'); setSetupStep(prev => prev - 1); }} className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors font-bold">
                                <ChevronLeft className="w-6 h-6"/> Back
                            </button>
                        ) : <div className="w-20"></div>}
                        
                        <div className="flex gap-2 md:gap-3">
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all ${setupStep >= 1 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] scale-110' : 'bg-slate-700'}`}/>
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all ${setupStep >= 2 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] scale-110' : 'bg-slate-700'}`}/>
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all ${setupStep >= 3 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] scale-110' : 'bg-slate-700'}`}/>
                            
                        </div>

                        <button onClick={() => { playSound('click'); setShowRules(true); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors w-20 justify-end font-bold drop-shadow-md">
                            <HelpCircle className="w-5 h-5"/> Help
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center w-full min-h-0 overflow-y-auto custom-scrollbar">
                        
                        {setupStep === 1 && (
                            <div className="animate-warp w-full max-w-2xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 text-center tracking-widest uppercase drop-shadow-md">1. Language</h2>
                                <p className="text-cyan-300 font-bold mb-8 text-sm md:text-base drop-shadow-md text-center">どちらの言語で Debate Battle を楽しみますか？</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                    <button onClick={() => handleLangSelect('en')} className={`p-6 rounded-2xl border-4 text-xl md:text-2xl font-black transition-all hover:scale-105 backdrop-blur-sm ${langMode === 'en' ? 'bg-pink-600/90 border-pink-400 text-white shadow-[0_0_30px_rgba(219,39,119,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300 hover:bg-slate-700'}`}>English</button>
                                    <button onClick={() => handleLangSelect('ja')} className={`p-6 rounded-2xl border-4 text-xl md:text-2xl font-black transition-all hover:scale-105 backdrop-blur-sm ${langMode === 'ja' ? 'bg-pink-600/90 border-pink-400 text-white shadow-[0_0_30px_rgba(219,39,119,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300 hover:bg-slate-700'}`}>日本語</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 2 && (
                            <div className="animate-warp w-full max-w-2xl mx-auto h-full flex flex-col justify-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-6 text-center tracking-widest uppercase drop-shadow-md">2. Game Mode</h2>
                                <div className="flex flex-col gap-4">
                                    <button onClick={() => handleModeSelect('area')} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'area' ? 'bg-purple-600/90 border-purple-400 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300 hover:bg-slate-700'}`}>AREA Battle (Standard)</button>
                                    <button onClick={() => handleModeSelect('logic_link')} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'logic_link' ? 'bg-purple-600/90 border-purple-400 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300 hover:bg-slate-700'}`}>Logic Link (Reason → Example)</button>
                                    <button onClick={() => handleModeSelect('review')} className={`p-4 md:p-5 rounded-2xl border-4 text-lg md:text-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 backdrop-blur-sm ${gameMode === 'review' ? 'bg-teal-600/90 border-teal-400 text-white shadow-[0_0_30px_rgba(13,148,136,0.5)]' : 'bg-slate-800/80 border-slate-500 text-slate-300 hover:bg-slate-700'}`}><BookOpen className="w-5 h-5"/> Review Mode</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 3 && (
                            <div className="animate-warp w-full flex flex-col h-full min-h-0">
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

                                {canStart && gameMode === 'area' && <p role="status" className="text-sm text-amber-200 mt-3">{game.currentTopic.crossExam[userStance].length >= battleRounds && game.currentTopic.rebuttal[userStance].length >= battleRounds ? `全${battleRounds}ラウンドで異なる質問・反論を練習できます。` : `全${battleRounds}ラウンドを練習します。教材数を超えるラウンドでは問題を繰り返します。`}</p>}
                                {canStart && (
                                <button onClick={() => { playSound('click'); initGame(); }} className="w-full mt-4 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-black text-xl md:text-2xl hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] transition-all hover:scale-[1.02] border border-white/30 text-white flex justify-center items-center gap-3 shrink-0 animate-warp duration-300">
                                    {gameMode === 'review' ? <BookOpen className="w-6 h-6"/> : <Play className="fill-current w-6 h-6"/>} 
                                    {gameMode === 'review' ? 'ENTER REVIEW' : 'BATTLE START'}
                                </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center gap-8 text-sm md:text-base text-slate-300 font-mono mt-4 shrink-0 bg-slate-900/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 shadow-lg z-10">
                <button onClick={() => { playSound('click'); setIsDrillMode(true); }} className="hover:text-white flex items-center gap-2 font-bold"><BrainCircuit className="w-4 h-4 md:w-5 md:h-5"/> Vocab Quiz</button>
                <button onClick={() => { playSound('click'); setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'); }} className="hover:text-white flex items-center gap-2 font-bold"><Type className="w-4 h-4 md:w-5 md:h-5"/> Text Size</button>
            </div>
        </div>

        <style>{`
          @keyframes warp-transition {
            0% { opacity: 0; transform: scale(0.3) translateZ(-1000px); filter: blur(20px) brightness(2); }
            60% { opacity: 1; filter: blur(5px) brightness(1.5); transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1) translateZ(0); filter: blur(0) brightness(1); }
          }
          .animate-warp {
            animation: warp-transition 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}</style>
    </div>
  );
}
