import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, CheckCircle2, ArrowUpCircle, Play, AlertTriangle, Lightbulb, ShieldCheck, GripVertical,
  Home, Zap, Swords, Shield, MessageCircleQuestion, Gavel, Plus, BrainCircuit, X, Type, Heart, Clock, Undo2, HelpCircle, MoveHorizontal, BookOpen, ChevronLeft
} from 'lucide-react';

import { getAllTopics } from './utils/dataLoader';
import { SmartText } from './components/UI/SmartText';
import { VocabDrill } from './components/Game/VocabDrill';
import { ReviewMode } from './components/Game/ReviewMode';

// --- 設定値 ---
const MAX_HP = 100;
const DAMAGE_BIG = 50; 
const DAMAGE_SMALL = 25; 
const DAMAGE_TICK = 12.5; 
const TIME_LIMIT_SEC = 10; 

const DIFFICULTIES = {
  easy:   { label: 'Easy',   fakeCount: 4, battleOptions: 4, showHint: true },  
  medium: { label: 'Medium', fakeCount: 6, battleOptions: 5, showHint: false }, 
  hard:   { label: 'Hard',   fakeCount: 8, battleOptions: 6, showHint: false }, 
};

const FLOWS = {
  area: ['assertion', 'reason', 'evidence', 'mini_conclusion'],
  logic_link: ['reason', 'evidence']
};

const THEMES = {
  techno: { bg: 'bg-[#0f172a]', text: 'text-slate-100', headerBg: 'bg-[#1e293b]/90 border-b border-white/5', cardBg: 'bg-[#1e293b]' }
};

const CARD_TYPES = {
  assertion: { label: "Assertion", labelJP: "主張 (A)", icon: ShieldCheck, color: "text-blue-200", border: "border-blue-500", bg: "bg-gradient-to-br from-blue-600 to-blue-800" },
  reason:    { label: "Reason",    labelJP: "理由 (R)",    icon: ArrowUpCircle, color: "text-green-200", border: "border-green-500", bg: "bg-gradient-to-br from-green-600 to-green-800" },
  evidence:  { label: "Evidence",  labelJP: "根拠/例 (E)", icon: Lightbulb,     color: "text-orange-200", border: "border-orange-500", bg: "bg-gradient-to-br from-orange-600 to-orange-800" },
  mini_conclusion:{ label: "Summary",labelJP: "再主張 (A)", icon: ShieldCheck, color: "text-purple-200", border: "border-purple-500", bg: "bg-gradient-to-br from-purple-600 to-purple-800" },
  answer:    { label: "Answer",    labelJP: "回答", icon: MessageCircleQuestion, color: "text-teal-200", border: "border-teal-500", bg: "bg-gradient-to-br from-teal-600 to-teal-800" },
  defense:   { label: "Rebuttal",  labelJP: "再反論", icon: Shield, color: "text-indigo-200", border: "border-indigo-500", bg: "bg-gradient-to-br from-indigo-600 to-indigo-800" },
  closing:   { label: "Closing",   labelJP: "最終弁論", icon: Gavel, color: "text-pink-200", border: "border-pink-500", bg: "bg-gradient-to-br from-pink-600 to-pink-800" },
};

const FONT_SIZES = { normal: 'text-base', large: 'text-xl', xlarge: 'text-2xl' };

// ルール説明モーダル
const RuleBook = ({ onClose }) => {
  const [isJp, setIsJp] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1e293b] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-2"><HelpCircle/> {isJp ? "遊び方" : "How to Play"}</h2>
          <div className="flex gap-4">
            <button onClick={() => setIsJp(!isJp)} className="px-3 py-1 rounded bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30">{isJp ? "EN" : "日本語"}</button>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X/></button>
          </div>
        </div>
        {isJp ? (
          <div className="space-y-6 text-slate-300">
            <section><h3 className="text-xl font-bold text-blue-400 mb-2">1. 目的</h3><p>HPがなくなる前に、論理的な主張を組み立てて対戦相手を倒しましょう。</p></section>
            <section><h3 className="text-xl font-bold text-green-400 mb-2">2. AREA構造 (AREA Battle)</h3><ul className="list-disc pl-5 space-y-2"><li><span className="text-blue-400 font-bold">A</span>ssertion: あなたの主張</li><li><span className="text-green-400 font-bold">R</span>eason: そう考える理由</li><li><span className="text-orange-400 font-bold">E</span>vidence: 具体例や証拠</li><li><span className="text-purple-400 font-bold">A</span>ssertion: 結論（まとめ）</li></ul></section>
            <section><h3 className="text-xl font-bold text-red-400 mb-2">3. ダメージのルール</h3><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><AlertTriangle className="text-red-500 w-4 h-4"/> <strong>順番ミス:</strong> 大ダメージ (-50 HP)</li><li className="flex items-center gap-2"><Zap className="text-yellow-500 w-4 h-4"/> <strong>論理ミス:</strong> 小ダメージ (-25 HP) ※理由は合っていても別の論点を選んだ場合など</li><li className="flex items-center gap-2"><Clock className="text-slate-400 w-4 h-4"/> <strong>時間切れ:</strong> 10秒ごとに -12.5 HP</li></ul></section>
          </div>
        ) : (
          <div className="space-y-6 text-slate-300">
            <section><h3 className="text-xl font-bold text-blue-400 mb-2">1. Objective</h3><p>Build a logical argument and defeat your opponent before your HP runs out.</p></section>
            <section><h3 className="text-xl font-bold text-green-400 mb-2">2. The AREA Structure</h3><ul className="list-disc pl-5 space-y-2"><li><span className="text-blue-400 font-bold">A</span>ssertion: Your main point.</li><li><span className="text-green-400 font-bold">R</span>eason: Why you think so.</li><li><span className="text-orange-400 font-bold">E</span>vidence: Examples or facts.</li><li><span className="text-purple-400 font-bold">A</span>ssertion: Summary.</li></ul></section>
            <section><h3 className="text-xl font-bold text-red-400 mb-2">3. Damage Rules</h3><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><AlertTriangle className="text-red-500 w-4 h-4"/> <strong>Wrong Order:</strong> Large Damage (-50 HP).</li><li className="flex items-center gap-2"><Zap className="text-yellow-500 w-4 h-4"/> <strong>Logic Mismatch:</strong> Small Damage (-25 HP).</li><li className="flex items-center gap-2"><Clock className="text-slate-400 w-4 h-4"/> <strong>Time Penalty:</strong> -12.5 HP every 10 seconds.</li></ul></section>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userStance, setUserStance] = useState('affirmative'); 
  
  const [gameMode, setGameMode] = useState('area'); 
  const [langMode, setLangMode] = useState('en'); 
  const [fontSize, setFontSize] = useState('normal'); 
  const [difficulty, setDifficulty] = useState('easy');

  // UI用 State
  const [setupStep, setSetupStep] = useState(1);
  const [setupHelpStep, setSetupHelpStep] = useState(null);

  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  const [gameState, setGameState] = useState('start'); 
  const [tower, setTower] = useState([]); 
  const [hand, setHand] = useState([]);   
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [showJapanese, setShowJapanese] = useState(false);
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [rivalCard, setRivalCard] = useState(null); 
  const [particles, setParticles] = useState([]);
  const [shake, setShake] = useState(false);
  const [activeLogicGroup, setActiveLogicGroup] = useState(null);

  const [sidePanelPos, setSidePanelPos] = useState('right'); 
  const [sidePanelWidth, setSidePanelWidth] = useState(30); 
  const [timeProgress, setTimeProgress] = useState(0); 
  
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now()); 
  const isResizing = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadedTopics = getAllTopics();
    setTopics(loadedTopics);
    if(loadedTopics.length > 0) setSelectedTopicId(loadedTopics[0].id);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameState !== 'construct' && gameState !== 'cross_exam' && gameState !== 'rebuttal_defense') {
      clearInterval(timerIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / (TIME_LIMIT_SEC * 1000)) * 100, 100);
      setTimeProgress(progress);
      
      if (progress >= 100) {
        startTimeRef.current = Date.now(); 
        setPlayerHP(prev => Math.max(0, prev - DAMAGE_TICK));
        setShake(true); setTimeout(() => setShake(false), 300);
        setFeedback({ msg: `-${DAMAGE_TICK} HP (Time Penalty)`, type: 'damage', judgment: 'weak' });
        setTimeout(() => setFeedback(null), 1500); 
      }
    }, 100);

    return () => clearInterval(timerIntervalRef.current);
  }, [gameState]); 

  // HP Watcher
  useEffect(() => {
    if (playerHP <= 0 && gameState !== 'gameover') setGameState('gameover');
  }, [playerHP]);

  // Resizer
  useEffect(() => {
    const handleMove = (e) => {
      if (!isResizing.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const widthPercent = sidePanelPos === 'right' 
        ? ((window.innerWidth - clientX) / window.innerWidth) * 100
        : (clientX / window.innerWidth) * 100;
      setSidePanelWidth(Math.max(20, Math.min(50, widthPercent)));
    };
    const handleUp = () => isResizing.current = false;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [sidePanelPos]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [tower]);

  const takeDamage = (amount, reason = "") => {
    setPlayerHP(prev => Math.max(0, prev - amount));
    setShake(true); 
    setTimeout(() => setShake(false), 300);
    setFeedback({ msg: `-${amount} HP (${reason})`, type: 'damage', judgment: 'weak' });
    setTimeout(() => setFeedback(null), 1500); 
  };

  const damageOpponent = (amount) => {
    setOpponentHP(prev => Math.max(0, prev - amount));
    triggerExplosion(10, 'bg-red-500');
  };

  const triggerExplosion = (count = 15, color = 'bg-yellow-400') => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 40, y: 40 + (Math.random() - 0.5) * 20,
      tx: (Math.random() - 0.5) * 200, ty: (Math.random() - 0.5) * 200,
      scale: Math.random() * 1.5, color
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1000);
  };

  // Fake混入ヘルパー関数
  const setupBattlePhase = (options) => {
    if (!options || options.length === 0) return [];
    const corrects = options.filter(o => o.judgment === 'correct' || o.judgment === 'perfect');
    const weaks = options.filter(o => o.judgment === 'weak');
    const targetCount = DIFFICULTIES[difficulty].battleOptions || 4;
    const selectedCorrect = corrects.sort(() => Math.random() - 0.5).slice(0, 1);
    const neededWeaks = targetCount - selectedCorrect.length;
    const selectedWeaks = weaks.sort(() => Math.random() - 0.5).slice(0, Math.max(0, neededWeaks));
    return [...selectedCorrect, ...selectedWeaks].sort(() => Math.random() - 0.5);
  };

  const initGame = () => {
    if (gameMode === 'review') {
       setGameState('review');
       return;
    }
    setTower([]); setPlayerHP(MAX_HP); setOpponentHP(MAX_HP); setScore(0);
    setActiveLogicGroup(null); setRivalCard(null); setGameState('construct');
    setFeedback(null); setTimeProgress(0); startTimeRef.current = Date.now(); 
    
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    let myStanceCards = currentTopic.deck.filter(c => c.stance === userStance);
    
    if (gameMode === 'logic_link') {
       myStanceCards = myStanceCards.filter(c => c.type === 'reason' || c.type === 'evidence');
    }
    if (myStanceCards.length === 0) {
        alert("No appropriate cards found for this mode/stance!");
        return;
    }

    const allGroups = [...new Set(myStanceCards.filter(c => c.group !== 'fake').map(c => c.group))];
    const targetGroup = allGroups[Math.floor(Math.random() * allGroups.length)];
    const correctCards = myStanceCards.filter(c => c.group === targetGroup);
    const otherCards = myStanceCards.filter(c => c.group !== targetGroup || c.group === 'fake');
    
    const noiseCount = DIFFICULTIES[difficulty].fakeCount || 4;
    const noiseCards = otherCards.sort(() => Math.random() - 0.5).slice(0, Math.max(0, noiseCount));
    const deck = [...correctCards, ...noiseCards].sort(() => Math.random() - 0.5);
    
    setHand(deck);
    setActiveLogicGroup(targetGroup);
  };

  const goHome = () => {
    setGameState('start');
    setSetupStep(1); // 初期画面に戻る
    setPlayerHP(MAX_HP);
    setTower([]);
    setIsDrillMode(false);
  };

  const handleUndo = () => {
    if (tower.length === 0) return;
    const newTower = [...tower];
    const removedCard = newTower.pop();
    setTower(newTower);
    setHand(prev => [...prev, removedCard]);
  };

  // --- Phase Logic ---
  const triggerCrossExam = () => {
    if (gameMode === 'logic_link') { setGameState('result'); return; }
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    const q = currentTopic.crossExam?.question;
    if (q) {
      setGameState('cross_exam');
      setRivalCard({ id: 'rival_q', text: q.text, textJP: q.textJP, type: 'answer', isQuestion: true });
      setHand(setupBattlePhase(currentTopic.crossExam.options));
    } else triggerRebuttalPhase();
  };

  const triggerRebuttalPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('rebuttal_intro'); setRivalCard(null);
    setTimeout(() => {
      setGameState('rebuttal_attack');
      const atk = currentTopic.rebuttal?.attack;
      if (atk) {
        setRivalCard({ id: 'rival_atk', text: atk.text, textJP: atk.textJP, type: 'attack', damage: atk.damage || 15 });
        takeDamage(DAMAGE_TICK, "Opponent Attack!");
        setTimeout(() => { setGameState('rebuttal_defense'); setHand(setupBattlePhase(currentTopic.rebuttal.options)); }, 3000);
      } else triggerClosingPhase();
    }, 2000);
  };

  const triggerClosingPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('closing'); setRivalCard(null);
    if(currentTopic.closing?.options) setHand(setupBattlePhase(currentTopic.closing.options));
    else setTimeout(() => setGameState('result'), 1500);
  };

  const handleCardSelect = (card) => {
    startTimeRef.current = Date.now(); setTimeProgress(0);
    let judgment = 'weak'; let nextPhaseTrigger = null;

    if (gameState === 'construct') {
      const currentStepIndex = tower.length;
      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
      const expectedType = expectedFlow[currentStepIndex];
      const cardType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;

      if (cardType !== expectedType) { takeDamage(DAMAGE_BIG, "Wrong Structure!"); return; }
      if (currentStepIndex === 0) {
        if (card.group !== activeLogicGroup) takeDamage(DAMAGE_SMALL, "Logic Mismatch!");
        else judgment = 'correct';
      } else {
        if (card.group !== activeLogicGroup) takeDamage(DAMAGE_SMALL, "Logic Error!");
        else { judgment = 'perfect'; setScore(prev => prev + 100); damageOpponent(25); }
      }

      const newTower = [...tower, { ...card, judgment }];
      setTower(newTower); setHand(hand.filter(c => c.id !== card.id));
      
      if (newTower.length >= expectedFlow.length) {
        setFeedback({ msg: "PERFECT COMPLETE!", type: 'success', judgment: 'perfect' });
        setTimeout(() => setFeedback(null), 1500); 
        triggerExplosion(30, 'bg-blue-400');
        nextPhaseTrigger = () => setTimeout(triggerCrossExam, 1500);
      }
    } else {
        setHand([]); 
        if (card.judgment === 'weak') { takeDamage(DAMAGE_SMALL, "Weak Argument!"); judgment = 'weak'; } 
        else { setScore(prev => prev + 50); damageOpponent(20); judgment = 'perfect'; setFeedback({ msg: "NICE COUNTER!", type: 'success', judgment: 'perfect' }); setTimeout(() => setFeedback(null), 1500); }
        
        const newTower = [...tower, { ...card, judgment }];
        setTower(newTower);

        if (gameState === 'cross_exam') nextPhaseTrigger = () => setTimeout(triggerRebuttalPhase, 1500);
        else if (gameState === 'rebuttal_defense') nextPhaseTrigger = () => setTimeout(triggerClosingPhase, 1500);
        else if (gameState === 'closing') nextPhaseTrigger = () => setTimeout(() => setGameState('result'), 1500);
    }
    if (nextPhaseTrigger) nextPhaseTrigger();
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const theme = THEMES.techno;

  const getNextInstruction = () => {
      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
      const step = tower.length;
      if (step >= expectedFlow.length) return "Completed!";
      const nextType = expectedFlow[step];
      const typeInfo = CARD_TYPES[nextType];
      return (
          <div className="flex flex-col items-center animate-pulse">
              <span className="text-sm text-slate-400 mb-1 font-bold tracking-widest">NEXT BLOCK</span>
              <div className={`relative px-8 py-3 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 ${typeInfo.bg} ${typeInfo.border} text-white`}>
                  {React.createElement(typeInfo.icon, { size: 24 })}
                  <span className="text-2xl font-black">{langMode === 'ja' || showJapanese ? typeInfo.labelJP : typeInfo.label}</span>
              </div>
              <div className="mt-4 w-64 h-16 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="text-white/20 w-8 h-8"/>
              </div>
          </div>
      );
  };

  if (topics.length === 0) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;
  if (gameState === 'review') return <ReviewMode topic={currentTopic} onClose={goHome} showJapanese={showJapanese} langMode={langMode} />;

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} font-sans flex flex-col overflow-hidden ${FONT_SIZES[fontSize]}`}>
      
      {/* --- Start Screen (ステップ選択UI & アニメーション背景) --- */}
      {gameState === 'start' && !isDrillMode && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] animate-gradient-xy overflow-hidden">
             <div className="text-center w-full max-w-5xl flex flex-col items-center h-full max-h-[850px]">
                 
                 <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-2xl mb-6 shrink-0 mt-4">
                    DEBATE BATTLE
                 </h1>

                 {/* 段階的選択画面 (ウィザード形式) */}
                 <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative w-full flex-1 flex flex-col min-h-0 overflow-hidden">
                     
                     <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
                         {setupStep > 1 ? (
                             <button onClick={() => setSetupStep(prev => prev - 1)} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-bold">
                                 <ChevronLeft className="w-6 h-6"/> Back
                             </button>
                         ) : <div className="w-20"></div>}
                         
                         {/* Step Indicator */}
                         <div className="flex gap-3">
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 2 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 3 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                         </div>

                         {/* Help Button */}
                         <button onClick={() => setSetupHelpStep(setupStep)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors w-20 justify-end font-bold">
                             <HelpCircle className="w-6 h-6"/> Help
                         </button>
                     </div>

                     <div className="flex-1 flex flex-col justify-center w-full min-h-0">
                         {/* Step 1: Language */}
                         {setupStep === 1 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center tracking-widest uppercase">1. Language</h2>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     <button onClick={() => { setLangMode('en'); setSetupStep(2); }} className={`p-8 md:p-10 rounded-2xl border-4 text-2xl md:text-3xl font-black transition-all hover:scale-105 ${langMode === 'en' ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>English</button>
                                     <button onClick={() => { setLangMode('ja'); setSetupStep(2); }} className={`p-8 md:p-10 rounded-2xl border-4 text-2xl md:text-3xl font-black transition-all hover:scale-105 ${langMode === 'ja' ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>日本語</button>
                                 </div>
                             </div>
                         )}

                         {/* Step 2: Game Mode */}
                         {setupStep === 2 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center tracking-widest uppercase">2. Game Mode</h2>
                                 <div className="flex flex-col gap-5">
                                     <button onClick={() => { setGameMode('area'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold transition-all hover:scale-105 ${gameMode === 'area' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>AREA Battle (Standard)</button>
                                     <button onClick={() => { setGameMode('logic_link'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold transition-all hover:scale-105 ${gameMode === 'logic_link' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>Logic Link (Reason → Evidence)</button>
                                     <button onClick={() => { setGameMode('review'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 ${gameMode === 'review' ? 'bg-teal-600 border-teal-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}><BookOpen className="w-6 h-6"/> Review Mode</button>
                                 </div>
                             </div>
                         )}

                         {/* Step 3: Topic, Stance, Difficulty (スクロール調整済み) */}
                         {setupStep === 3 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col h-full min-h-0">
                                 <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center tracking-widest uppercase shrink-0">3. Final Settings</h2>
                                 
                                 <div className="grid md:grid-cols-2 gap-6 text-left flex-1 min-h-0">
                                     {/* Topic List (ここだけスクロール) */}
                                     <div className="bg-slate-950/50 p-4 md:p-5 rounded-2xl border border-white/5 flex flex-col h-full min-h-0">
                                         <h3 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2 shrink-0">Topic</h3>
                                         <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                             {topics.map(t => (
                                                 <button key={t.id} onClick={() => setSelectedTopicId(t.id)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTopicId === t.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                                     <div className="font-bold text-lg md:text-xl leading-tight">{langMode === 'ja' ? t.titleJP : t.title}</div>
                                                     {langMode === 'en' && <div className="text-sm md:text-base opacity-60 mt-1">{t.titleJP}</div>}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>

                                     {/* Stance & Difficulty */}
                                     <div className="flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                                         <div className="bg-slate-950/50 p-4 md:p-5 rounded-2xl border border-white/5">
                                             <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">Your Stance</h3>
                                             <div className="flex gap-3">
                                                 <button onClick={() => setUserStance('affirmative')} className={`flex-1 py-4 md:py-5 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'affirmative' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{langMode === 'ja' ? '肯定側' : 'AFFIRMATIVE'}</button>
                                                 <button onClick={() => setUserStance('negative')} className={`flex-1 py-4 md:py-5 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'negative' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{langMode === 'ja' ? '否定側' : 'NEGATIVE'}</button>
                                             </div>
                                         </div>
                                         {gameMode !== 'review' && (
                                             <div className="bg-slate-950/50 p-4 md:p-5 rounded-2xl border border-white/5">
                                                 <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">Difficulty</h3>
                                                 <div className="flex flex-wrap gap-2 md:gap-3">
                                                     {Object.keys(DIFFICULTIES).map(d => (
                                                         <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 px-2 rounded-lg border-2 font-bold transition-all ${difficulty === d ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{DIFFICULTIES[d].label}</button>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 <button onClick={initGame} className="w-full mt-6 py-4 md:py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-black text-2xl md:text-3xl hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all hover:scale-[1.02] border border-white/20 text-white flex justify-center items-center gap-3 shrink-0">
                                     {gameMode === 'review' ? <BookOpen/> : <Play className="fill-current"/>} 
                                     {gameMode === 'review' ? 'ENTER REVIEW' : 'BATTLE START'}
                                 </button>
                             </div>
                         )}
                     </div>
                 </div>
                 
                 <div className="flex justify-center gap-8 text-base text-slate-400 font-mono mt-6 shrink-0">
                     <button onClick={() => setIsDrillMode(true)} className="hover:text-white flex items-center gap-2"><BrainCircuit className="w-5 h-5"/> Vocab Quiz</button>
                     <button onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal')} className="hover:text-white flex items-center gap-2"><Type className="w-5 h-5"/> Text Size</button>
                 </div>
             </div>

             {/* Help Modal for Setup Screen */}
             {setupHelpStep && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 animate-in fade-in zoom-in-95" onClick={() => setSetupHelpStep(null)}>
                   <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="text-3xl font-black text-blue-400 mb-4 flex items-center gap-2"><HelpCircle/> Step {setupHelpStep} Guide</h3>
                      <div className="text-slate-200 mb-8 text-lg leading-relaxed whitespace-pre-line">
                         {setupHelpStep === 1 && "使用する言語を選びます。\n\n・English: 英語学習用の標準モードです。\n・日本語: 全てが日本語になり、国語の論理練習に使えます。"}
                         {setupHelpStep === 2 && "遊び方を選びます。\n\n・AREA Battle: 4枚のカードを正しい論理の順番で組み立てて敵と戦います。\n・Logic Link: 理由と根拠の2枚だけを繋ぐ短時間モードです。\n・Review Mode: バトルなしで、各テーマの模範解答をじっくり読むことができます。"}
                         {setupHelpStep === 3 && "最後に、ディベートのテーマ、あなたの立場（肯定/否定）、敵の強さを選びます。\n\n準備ができたら BATTLE START を押してゲーム開始です！"}
                      </div>
                      <button onClick={() => setSetupHelpStep(null)} className="w-full py-4 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 text-xl transition-colors">Got it!</button>
                   </div>
                </div>
             )}
          </div>
      )}

      {/* --- Game Header --- */}
      {gameState !== 'start' && (
        <header className={`shrink-0 ${theme.headerBg} z-30 px-4 py-2 flex justify-between items-center shadow-lg h-16`}>
          <div className="flex items-center gap-4 flex-1">
            <button onClick={goHome} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Home className="w-5 h-5"/></button>
            <div className="flex-1 max-w-[150px]">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1 opacity-80">
                    <span className="text-blue-400 flex items-center gap-1"><Heart className="w-3 h-3 fill-current"/> HP</span>
                    <span className="text-slate-400">{Math.ceil(playerHP)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
                    <div className={`h-full transition-all duration-300 ${playerHP > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-red-500'}`} style={{ width: `${(playerHP/MAX_HP)*100}%` }}/>
                </div>
            </div>
            <div className="hidden md:flex flex-col ml-4 border-l border-white/20 pl-4 max-w-sm">
                <span className="text-sm font-bold text-white truncate flex items-center gap-2">
                  {langMode === 'ja' ? currentTopic.titleJP : currentTopic.title}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase ${userStance === 'affirmative' ? 'bg-blue-600' : 'bg-red-600'}`}>
                     {userStance === 'affirmative' ? (langMode === 'ja' ? '肯定' : 'AFF') : (langMode === 'ja' ? '否定' : 'NEG')}
                  </span>
                </span>
                {showJapanese && langMode !== 'ja' && <span className="text-xs text-slate-400 mt-0.5 truncate">{currentTopic.titleJP}</span>}
            </div>
          </div>

          {(gameState === 'construct' || gameState === 'cross_exam' || gameState === 'rebuttal_defense') && (
              <div className="absolute left-1/2 -translate-x-1/2 top-2 flex flex-col items-center w-32">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time Limit</div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                      <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100 ease-linear" style={{ width: `${100 - timeProgress}%` }}/>
                  </div>
              </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal')} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><Type className="w-5 h-5"/></button>
            <button onClick={() => setShowRules(true)} className="p-2 hover:bg-white/10 rounded-full text-blue-400"><HelpCircle className="w-6 h-6"/></button>
            {langMode !== 'ja' && <button onClick={() => setShowJapanese(!showJapanese)} className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${showJapanese ? 'bg-blue-600 border-blue-400' : 'border-slate-600'}`}>JP</button>}
          </div>
        </header>
      )}

      {/* --- Main Game Layout --- */}
      {gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
        <div className={`flex-1 flex overflow-hidden relative ${sidePanelPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0f172a]/50">
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay"><img src={currentTopic.image_url} className="w-full h-full object-cover" /></div>
              
              {gameState === 'construct' && (
                  <div className="shrink-0 py-4 flex justify-center z-10 bg-gradient-to-b from-[#0f172a] to-transparent">
                    {(() => {
                      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
                      if (tower.length >= expectedFlow.length) return null;
                      const typeInfo = CARD_TYPES[expectedFlow[tower.length]];
                      return (
                          <div className="flex flex-col items-center animate-pulse">
                              <span className="text-sm text-slate-400 mb-1 font-bold tracking-widest">NEXT BLOCK</span>
                              <div className={`relative px-6 py-2 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 ${typeInfo.bg} ${typeInfo.border} text-white`}>
                                  {React.createElement(typeInfo.icon, { size: 20 })}
                                  <span className="text-xl font-black">{langMode === 'ja' || showJapanese ? typeInfo.labelJP : typeInfo.label}</span>
                              </div>
                          </div>
                      );
                    })()}
                  </div>
              )}

              {rivalCard && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 animate-in slide-in-from-top-4">
                   <div className={`p-4 md:p-6 rounded-2xl shadow-2xl border-4 flex gap-4 md:gap-6 ${rivalCard.type === 'attack' ? 'bg-rose-950/90 border-rose-500' : 'bg-teal-950/90 border-teal-500'}`}>
                      <div className={`shrink-0 p-3 md:p-4 rounded-full h-fit border-2 border-white/20 ${rivalCard.type === 'attack' ? 'bg-rose-600' : 'bg-teal-600'}`}>
                          {rivalCard.type === 'attack' ? <Swords className="w-6 h-6 md:w-8 md:h-8 text-white"/> : <MessageCircleQuestion className="w-6 h-6 md:w-8 md:h-8 text-white"/>}
                      </div>
                      <div>
                        <div className="font-black opacity-60 text-xs md:text-sm uppercase tracking-widest mb-1">{rivalCard.type === 'attack' ? "Opponent Attack!" : "Question"}</div>
                        {langMode === 'ja' ? <div className="text-lg md:text-2xl font-bold">{rivalCard.textJP}</div> : (
                            <><div className="text-lg md:text-2xl font-bold"><SmartText text={rivalCard.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-2 opacity-80 text-sm border-t border-white/20 pt-1">{rivalCard.textJP}</div>}</>
                        )}
                      </div>
                   </div>
                 </div>
              )}

              <div ref={scrollRef} className="flex-1 w-full overflow-y-auto p-4 flex flex-col items-center gap-4 scroll-smooth pb-20 z-10">
                  {tower.map((block) => {
                      const typeStyle = CARD_TYPES[block.type];
                      return (
                      <div key={block.id} className="relative w-full max-w-3xl animate-in slide-in-from-bottom-4">
                          <div className={`p-4 md:p-5 rounded-xl border-l-8 backdrop-blur-md shadow-lg flex gap-4 items-center ${block.judgment === 'weak' ? 'border-yellow-500/50 bg-yellow-900/10' : `border-${typeStyle.color.split('-')[1]}-500 bg-slate-900/90`}`}>
                              <div className={`p-2 md:p-3 rounded-xl bg-black/40 border border-white/5 ${typeStyle.color}`}>{React.createElement(typeStyle.icon, { size: 20 })}</div>
                              <div className="flex-1">
                                  <div className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-70 ${typeStyle.color}`}>{langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}</div>
                                  {langMode === 'ja' ? <div className="font-bold text-white text-base md:text-lg leading-relaxed">{block.textJP}</div> : (
                                      <><div className="font-bold leading-relaxed text-slate-100 text-base md:text-lg"><SmartText text={block.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-1 text-slate-400 text-xs md:text-sm border-t border-white/10 pt-1">{block.textJP}</div>}</>
                                  )}
                              </div>
                          </div>
                      </div>
                      );
                  })}
              </div>
          </div>

          <div className="w-4 bg-slate-900 border-x border-white/10 cursor-col-resize hover:bg-blue-900/30 flex items-center justify-center z-20" onMouseDown={() => isResizing.current = true} onTouchStart={() => isResizing.current = true}><GripVertical className="w-4 h-4 text-slate-600"/></div>

          <div className="flex flex-col bg-[#1e293b] border-l border-white/10 shadow-2xl z-20" style={{ width: `${sidePanelWidth}%`, minWidth: '250px' }}>
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hand</div>
                  <div className="flex gap-1">
                      <button onClick={() => setSidePanelPos(prev => prev === 'left' ? 'right' : 'left')} className="p-1 hover:bg-white/10 rounded"><MoveHorizontal className="w-4 h-4 text-slate-400"/></button>
                      {gameState === 'construct' && <button onClick={handleUndo} className="p-1 hover:bg-white/10 rounded flex items-center text-xs font-bold text-slate-300 disabled:opacity-30" disabled={tower.length === 0}><Undo2 className="w-4 h-4"/></button>}
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {hand.map((card) => {
                      const type = CARD_TYPES[card.type] || CARD_TYPES.reason;
                      return (
                          <button key={card.id} onClick={() => handleCardSelect(card)} className={`w-full relative overflow-hidden group text-left p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${type.bg} border-white/20 hover:border-white/50`}>
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                              <div className="flex justify-between items-start mb-2 relative z-10">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white`}>{langMode === 'ja' || showJapanese ? type.labelJP : type.label}</span>
                                  {React.createElement(type.icon, { className: "w-4 h-4 text-white opacity-80" })}
                              </div>
                              <div className="relative z-10">
                                  {langMode === 'ja' ? <div className="font-bold text-white text-sm md:text-base drop-shadow-md">{card.textJP}</div> : (
                                      <><div className="font-bold text-white leading-snug text-sm md:text-base drop-shadow-md"><SmartText text={card.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-2 pt-1 border-t border-white/20 text-white/70 text-xs">{card.textJP}</div>}</>
                                  )}
                              </div>
                          </button>
                      );
                  })}
              </div>
          </div>
        </div>
      )}

      {showRules && <RuleBook onClose={() => setShowRules(false)} />}
      {isDrillMode && <VocabDrill vocabList={currentTopic?.vocabulary || []} onClose={() => setIsDrillMode(false)} />}

      {/* --- ⑤ Result / Game Over Screens (模範解答付き) --- */}
      {(gameState === 'gameover' || gameState === 'result') && (
           <div className={`absolute inset-0 z-50 flex flex-col items-center p-6 backdrop-blur-3xl animate-in zoom-in overflow-y-auto ${gameState === 'gameover' ? 'bg-red-950/95' : 'bg-[#0f172a]/95'}`}>
               <h2 className={`text-6xl md:text-8xl font-black text-white mb-2 mt-10 tracking-tighter drop-shadow-lg ${gameState === 'gameover' ? 'text-red-400' : 'text-cyan-400'}`}>
                   {gameState === 'gameover' ? 'DEFEAT' : 'VICTORY'}
               </h2>
               <div className="text-2xl font-mono text-white/80 mb-8 bg-black/30 px-6 py-2 rounded-full border border-white/10">Score: {score}</div>
               
               {/* 模範解答の表示 */}
               {(() => {
                   let targetGroup = activeLogicGroup;
                   if (!targetGroup) {
                       const validGroups = currentTopic.deck.filter(c => c.stance === userStance && c.group !== 'fake').map(c => c.group);
                       targetGroup = validGroups[0];
                   }
                   if (targetGroup) {
                       const correctCards = currentTopic.deck.filter(c => c.stance === userStance && c.group === targetGroup && c.group !== 'fake');
                       const order = { assertion: 1, reason: 2, evidence: 3, mini_conclusion: 4 };
                       correctCards.sort((a, b) => order[a.type] - order[b.type]);

                       return (
                           <div className="w-full max-w-4xl bg-slate-900/80 rounded-2xl p-6 border border-white/10 mb-10 shadow-2xl">
                               <h3 className="text-xl md:text-2xl font-black text-green-400 mb-6 flex items-center justify-center gap-2 border-b border-white/10 pb-4">
                                   <CheckCircle2 className="w-6 h-6"/> Model Answer (模範解答)
                               </h3>
                               <div className="grid gap-3">
                                   {correctCards.map(card => {
                                       const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                                       return (
                                           <div key={card.id} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-800/50 rounded-xl border border-white/5 items-start md:items-center text-left">
                                               <div className={`shrink-0 text-[10px] md:text-xs font-black uppercase px-2 py-1 rounded bg-black/40 border border-white/10 ${typeStyle.color} w-24 text-center`}>
                                                   {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                               </div>
                                               <div className="flex-1">
                                                   {langMode === 'ja' ? (
                                                       <div className="font-bold text-white text-sm md:text-base leading-relaxed">{card.textJP}</div>
                                                   ) : (
                                                       <>
                                                           <div className="font-bold text-white text-sm md:text-base leading-relaxed"><SmartText text={card.text} vocabList={currentTopic.vocabulary} /></div>
                                                           {showJapanese && <div className="mt-1 text-slate-400 text-xs">{card.textJP}</div>}
                                                       </>
                                                   )}
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       );
                   }
                   return null;
               })()}

               <button onClick={goHome} className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl md:text-2xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-10">
                   PLAY AGAIN
               </button>
           </div>
      )}

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (<div key={p.id} className={`absolute rounded-full ${p.color} animate-particle`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${10 * p.scale}px`, height: `${10 * p.scale}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }} />))}
      </div>
      
      {/* Feedback Popup */}
      {feedback && (
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] pointer-events-none w-full flex justify-center">
            <div className={`px-10 py-6 rounded-xl backdrop-blur-md text-white font-black text-2xl md:text-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in flex items-center gap-4 ${feedback.type === 'damage' ? 'bg-red-600/90 border-2 border-red-400' : 'bg-blue-600/90 border-2 border-blue-400'}`}>
               {feedback.type === 'damage' ? <AlertTriangle className="w-8 h-8 md:w-10 md:h-10"/> : <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10"/>}<span>{feedback.msg}</span>
            </div>
         </div>
      )}

      {/* ④ 動的背景用アニメーションCSS */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 15s ease infinite;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
      `}</style>
    </div>
  );
}