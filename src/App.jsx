import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, CheckCircle2, ArrowUpCircle, Play, AlertTriangle, Lightbulb, ShieldCheck, GripVertical,
  Home, Zap, Swords, Shield, MessageCircleQuestion, Gavel, Plus, BrainCircuit, X, Type, Heart, Clock, Undo2, HelpCircle, MoveHorizontal, BookOpen, ChevronLeft, Image as ImageIcon
} from 'lucide-react';

import { getAllTopics } from './utils/dataLoader';
import { SmartText } from './components/UI/SmartText';
import { VocabDrill } from './components/Game/VocabDrill';
import { ReviewMode } from './components/Game/ReviewMode';

const MAX_HP = 100;
const DAMAGE_BIG = 50; 
const DAMAGE_SMALL = 25; 
const DAMAGE_TICK = 12.5; 
const TIME_LIMIT_SEC = 10; 

const DIFFICULTIES = {
  easy:   { label: 'Easy',   fakeCount: 4, battleOptions: 4 },  
  medium: { label: 'Medium', fakeCount: 6, battleOptions: 5 }, 
  hard:   { label: 'Hard',   fakeCount: 8, battleOptions: 6 }, 
};

const FLOWS = {
  area: ['assertion', 'reason', 'example', 'mini_conclusion'],
  logic_link: ['reason', 'example']
};

const THEMES = {
  techno: { bg: 'bg-[#0f172a]', text: 'text-slate-100', headerBg: 'bg-[#1e293b]/90 border-b border-white/5', cardBg: 'bg-[#1e293b]' }
};

const CARD_TYPES = {
  assertion: { label: "Assertion", labelJP: "主張 (A)", icon: ShieldCheck, color: "text-blue-200", border: "border-blue-500", bg: "bg-gradient-to-br from-blue-600 to-blue-800" },
  reason:    { label: "Reason",    labelJP: "理由 (R)",    icon: ArrowUpCircle, color: "text-green-200", border: "border-green-500", bg: "bg-gradient-to-br from-green-600 to-green-800" },
  example:   { label: "Example",   labelJP: "具体例 (E)", icon: Lightbulb,     color: "text-orange-200", border: "border-orange-500", bg: "bg-gradient-to-br from-orange-600 to-orange-800" },
  mini_conclusion:{ label: "Summary",labelJP: "再主張 (A)", icon: ShieldCheck, color: "text-purple-200", border: "border-purple-500", bg: "bg-gradient-to-br from-purple-600 to-purple-800" },
  answer:    { label: "Answer",    labelJP: "回答", icon: MessageCircleQuestion, color: "text-teal-200", border: "border-teal-500", bg: "bg-gradient-to-br from-teal-600 to-teal-800" },
  defense:   { label: "Rebuttal",  labelJP: "再反論", icon: Shield, color: "text-indigo-200", border: "border-indigo-500", bg: "bg-gradient-to-br from-indigo-600 to-indigo-800" },
  closing:   { label: "Closing",   labelJP: "最終弁論", icon: Gavel, color: "text-pink-200", border: "border-pink-500", bg: "bg-gradient-to-br from-pink-600 to-pink-800" },
};

const FONT_SIZES = { normal: 'text-base', large: 'text-xl', xlarge: 'text-2xl' };

// Utility to grab all fake images for the distractors
const getAllFakeImages = (topic) => {
  const urls = new Set();
  if (topic.deck) topic.deck.forEach(c => { if(c.group === 'fake' && c.image_url) urls.add(c.image_url); });
  
  const extractFromPhase = (phaseObj) => {
    if(!phaseObj) return;
    ['affirmative', 'negative'].forEach(stance => {
      if(phaseObj[stance]) {
        phaseObj[stance].forEach(item => {
          if (item.options) {
            item.options.forEach(o => { if(o.judgment === 'weak' && o.image_url) urls.add(o.image_url); });
          } else if (item.judgment === 'weak' && item.image_url) {
            urls.add(item.image_url); // For closing array
          }
        });
      }
    });
  };

  extractFromPhase(topic.crossExam);
  extractFromPhase(topic.rebuttal);
  extractFromPhase(topic.closing);

  return Array.from(urls);
};

export default function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userStance, setUserStance] = useState(null); 
  const [difficulty, setDifficulty] = useState(null);
  
  // New Settings
  const [timerEnabled, setTimerEnabled] = useState(true); 
  const [imageMatchEnabled, setImageMatchEnabled] = useState(true);
  const [battleRounds, setBattleRounds] = useState(3); // 1 to 6
  
  const [gameMode, setGameMode] = useState('area'); 
  const [langMode, setLangMode] = useState('en'); 
  const [fontSize, setFontSize] = useState('normal'); 

  const [setupStep, setSetupStep] = useState(1);
  const [showRules, setShowRules] = useState(false);

  // Game State
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  const [gameState, setGameState] = useState('start'); 
  const [tower, setTower] = useState([]); 
  const [hand, setHand] = useState([]);   
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [showJapanese, setShowJapanese] = useState(false);
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [rivalCard, setRivalCard] = useState(null); 
  const [particles, setParticles] = useState([]);
  const [activeLogicGroup, setActiveLogicGroup] = useState(null);

  // Battle Logic States
  const [battlePlan, setBattlePlan] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // Image Match States
  const [pendingCard, setPendingCard] = useState(null);
  const [imageHand, setImageHand] = useState([]);

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
  }, []);

  useEffect(() => {
    if (!timerEnabled) {
      setTimeProgress(0);
      clearInterval(timerIntervalRef.current);
      return;
    }

    const activeTimerStates = ['construct', 'cross_exam', 'rebuttal_defense', 'construct_image', 'cross_exam_image', 'rebuttal_defense_image', 'closing', 'closing_image'];
    if (!activeTimerStates.includes(gameState)) {
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
  }, [gameState, timerEnabled]); 

  useEffect(() => {
    if (playerHP <= 0 && gameState !== 'gameover') setGameState('gameover');
  }, [playerHP]);

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
    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); };
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
      id: Date.now() + i, x: 50 + (Math.random() - 0.5) * 40, y: 40 + (Math.random() - 0.5) * 20,
      tx: (Math.random() - 0.5) * 200, ty: (Math.random() - 0.5) * 200, scale: Math.random() * 1.5, color
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1000);
  };

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
    
    // Setup AREA Deck
    let myStanceCards = currentTopic.deck.filter(c => c.stance === userStance);
    if (gameMode === 'logic_link') {
       myStanceCards = myStanceCards.filter(c => c.type === 'reason' || c.type === 'example');
    }
    const validCards = myStanceCards.filter(c => c.group !== 'fake');
    const fakeCardsAll = myStanceCards.filter(c => c.group === 'fake');
    const noiseCount = DIFFICULTIES[difficulty].fakeCount || 4;
    const noiseCards = fakeCardsAll.sort(() => Math.random() - 0.5).slice(0, Math.max(0, noiseCount));
    setHand([...validCards, ...noiseCards].sort(() => Math.random() - 0.5));
    
    // Setup Battle Plan (Loops)
    const cxList = currentTopic.crossExam?.[userStance] || [];
    const rebList = currentTopic.rebuttal?.[userStance] || [];
    
    const plan = [];
    const shuffledCx = [...cxList].sort(() => Math.random() - 0.5);
    const shuffledReb = [...rebList].sort(() => Math.random() - 0.5);
    
    for(let i=0; i < battleRounds; i++) {
        plan.push({
           cx: shuffledCx[i % Math.max(1, shuffledCx.length)],
           reb: shuffledReb[i % Math.max(1, shuffledReb.length)]
        });
    }
    setBattlePlan(plan);
    setCurrentRoundIndex(0);
  };

  const goHome = () => {
    setGameState('start');
    setSetupStep(1); 
    setSelectedTopicId(null);
    setUserStance(null);
    setDifficulty(null);
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
    if (newTower.length === 0) setActiveLogicGroup(null);
  };

  // --- Phase Triggers ---
  const triggerCrossExam = (roundIdx = currentRoundIndex) => {
    if (gameMode === 'logic_link' || roundIdx >= battlePlan.length) { 
        triggerClosingPhase(); 
        return; 
    }
    const currentData = battlePlan[roundIdx];
    if (currentData && currentData.cx) {
      setGameState('cross_exam');
      setRivalCard({ ...currentData.cx.question, type: 'answer', isQuestion: true });
      setHand(setupBattlePhase(currentData.cx.options));
    } else {
      triggerRebuttalPhase(roundIdx);
    }
  };

  const triggerRebuttalPhase = (roundIdx = currentRoundIndex) => {
    const currentData = battlePlan[roundIdx];
    setGameState('rebuttal_intro'); setRivalCard(null); setHand([]);
    setTimeout(() => {
      setGameState('rebuttal_attack');
      if (currentData && currentData.reb) {
        setRivalCard({ ...currentData.reb, type: 'attack' });
        if(timerEnabled) takeDamage(DAMAGE_TICK, "Opponent Attack!");
        setTimeout(() => { 
            setGameState('rebuttal_defense'); 
            setHand(setupBattlePhase(currentData.reb.options)); 
        }, 3000);
      } else {
        nextRound(roundIdx);
      }
    }, 2000);
  };

  const nextRound = (currentIdx) => {
      const nextIdx = currentIdx + 1;
      setCurrentRoundIndex(nextIdx);
      if (nextIdx < battlePlan.length) {
          triggerCrossExam(nextIdx);
      } else {
          triggerClosingPhase();
      }
  };

  const triggerClosingPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('closing'); setRivalCard(null);
    const closingOptions = currentTopic.closing?.[userStance];
    if(closingOptions) setHand(setupBattlePhase(closingOptions));
    else setTimeout(() => setGameState('result'), 1500);
  };

  // --- Action Handlers ---
  const launchImageMatch = (card, baseState) => {
      setPendingCard(card);
      const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
      const allFakes = getAllFakeImages(currentTopic);
      const randomFakes = allFakes.filter(url => url !== card.image_url).sort(() => Math.random() - 0.5).slice(0, 3);
      
      const grid = [...randomFakes];
      if (card.image_url) grid.push(card.image_url);
      
      setImageHand(grid.sort(() => Math.random() - 0.5));
      setGameState(baseState + '_image');
      startTimeRef.current = Date.now(); setTimeProgress(0);
  };

  const finalizeCardSuccess = (card, baseState) => {
      const newTower = [...tower, { ...card, judgment: 'perfect' }];
      setTower(newTower);
      setHand(gameState.startsWith('construct') ? hand.filter(c => c.id !== card.id) : []);

      if (baseState === 'construct') {
          const expectedFlow = FLOWS[gameMode] || FLOWS.area;
          if (newTower.length >= expectedFlow.length) {
              setFeedback({ msg: "PERFECT COMPLETE!", type: 'success', judgment: 'perfect' });
              triggerExplosion(30, 'bg-blue-400');
              setTimeout(() => triggerCrossExam(currentRoundIndex), 1500);
          } else {
              setGameState('construct');
          }
      } else if (baseState === 'cross_exam') {
          setFeedback({ msg: "NICE COUNTER!", type: 'success', judgment: 'perfect' });
          setTimeout(() => triggerRebuttalPhase(currentRoundIndex), 1500);
      } else if (baseState === 'rebuttal_defense') {
          setFeedback({ msg: "NICE COUNTER!", type: 'success', judgment: 'perfect' });
          setTimeout(() => nextRound(currentRoundIndex), 1500);
      } else if (baseState === 'closing') {
          setFeedback({ msg: "DEBATE FINISHED!", type: 'success', judgment: 'perfect' });
          setTimeout(() => setGameState('result'), 1500);
      }
  };

  const handleCardSelect = (card) => {
    startTimeRef.current = Date.now(); setTimeProgress(0);
    const baseState = gameState.replace('_image', '');

    if (baseState === 'construct') {
      const currentStepIndex = tower.length;
      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
      const expectedType = expectedFlow[currentStepIndex];
      const cardType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;

      if (cardType !== expectedType) { takeDamage(DAMAGE_BIG, "Wrong Structure!"); return; }
      if (currentStepIndex === 0) {
        if (card.group === 'fake') { takeDamage(DAMAGE_SMALL, "Weak Argument!"); return; } 
        else { setActiveLogicGroup(card.group); }
      } else {
        if (card.group !== activeLogicGroup) { takeDamage(DAMAGE_SMALL, "Logic Mismatch!"); return; } 
      }
      
      setScore(prev => prev + 100); damageOpponent(25);
      
      if (imageMatchEnabled && card.image_url) {
          launchImageMatch(card, baseState);
      } else {
          finalizeCardSuccess(card, baseState);
      }

    } else { // Battle Phases
        if (card.judgment === 'weak') { 
            takeDamage(DAMAGE_SMALL, "Weak Argument!"); 
            setHand([]);
            const newTower = [...tower, { ...card, judgment: 'weak' }];
            setTower(newTower);
            
            if (baseState === 'cross_exam') setTimeout(() => triggerRebuttalPhase(currentRoundIndex), 1500);
            else if (baseState === 'rebuttal_defense') setTimeout(() => nextRound(currentRoundIndex), 1500);
            else if (baseState === 'closing') setTimeout(() => setGameState('result'), 1500);
        } else { 
            setScore(prev => prev + 50); damageOpponent(20); 
            if (imageMatchEnabled && card.image_url) {
                launchImageMatch(card, baseState);
            } else {
                finalizeCardSuccess(card, baseState);
            }
        }
    }
  };

  const handleImageSelect = (url) => {
      startTimeRef.current = Date.now(); setTimeProgress(0);
      if (url === pendingCard.image_url) {
          setScore(prev => prev + 50);
          setFeedback({ msg: "IMAGE MATCH!", type: 'success', judgment: 'perfect' });
          setTimeout(() => setFeedback(null), 1000);
          const baseState = gameState.replace('_image', '');
          finalizeCardSuccess(pendingCard, baseState);
      } else {
          takeDamage(DAMAGE_SMALL, "Wrong Image!");
      }
  };

  const getVisibleHand = () => {
    if (gameState.endsWith('_image')) return [];
    if (gameState !== 'construct') return hand; 
    const expectedFlow = FLOWS[gameMode] || FLOWS.area;
    const currentStepIndex = tower.length;
    if (currentStepIndex >= expectedFlow.length) return hand;
    const expectedType = expectedFlow[currentStepIndex];
    return hand.filter(card => (card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type) === expectedType);
  };

  const visibleHand = getVisibleHand();
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const theme = THEMES.techno;

  const isTopicSelected = selectedTopicId !== null;
  const isStanceSelected = userStance !== null;
  const isDifficultySelected = difficulty !== null;
  const canStart = isTopicSelected && isStanceSelected && isDifficultySelected;

  if (topics.length === 0) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;
  if (gameState === 'review') return <ReviewMode topic={currentTopic} onClose={goHome} showJapanese={showJapanese} langMode={langMode} difficulty={difficulty || 'easy'} />;

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} font-sans flex flex-col overflow-hidden ${FONT_SIZES[fontSize]}`}>
      
      {/* --- Start Screen --- */}
      {gameState === 'start' && !isDrillMode && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] animate-gradient-xy overflow-hidden">
             <div className="text-center w-full max-w-5xl flex flex-col items-center h-full max-h-[850px]">
                 
                 <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-2xl mb-6 shrink-0 mt-4">
                    DEBATE BATTLE
                 </h1>

                 <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative w-full flex-1 flex flex-col min-h-0 overflow-hidden">
                     
                     <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
                         {setupStep > 1 ? (
                             <button onClick={() => setSetupStep(prev => prev - 1)} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-bold">
                                 <ChevronLeft className="w-6 h-6"/> Back
                             </button>
                         ) : <div className="w-20"></div>}
                         
                         <div className="flex gap-3">
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 2 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                            <div className={`w-3 h-3 rounded-full transition-colors ${setupStep >= 3 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}/>
                         </div>

                         <button onClick={() => setShowRules(true)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors w-20 justify-end font-bold">
                             <HelpCircle className="w-6 h-6"/> Help
                         </button>
                     </div>

                     <div className="flex-1 flex flex-col justify-center w-full min-h-0">
                         {setupStep === 1 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center tracking-widest uppercase">1. Language</h2>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     <button onClick={() => { setLangMode('en'); setSetupStep(2); }} className={`p-8 md:p-10 rounded-2xl border-4 text-2xl md:text-3xl font-black transition-all hover:scale-105 ${langMode === 'en' ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>English</button>
                                     <button onClick={() => { setLangMode('ja'); setSetupStep(2); }} className={`p-8 md:p-10 rounded-2xl border-4 text-2xl md:text-3xl font-black transition-all hover:scale-105 ${langMode === 'ja' ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>日本語</button>
                                 </div>
                             </div>
                         )}

                         {setupStep === 2 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
                                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center tracking-widest uppercase">2. Game Mode</h2>
                                 <div className="flex flex-col gap-5">
                                     <button onClick={() => { setGameMode('area'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold transition-all hover:scale-105 ${gameMode === 'area' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>AREA Battle (Standard)</button>
                                     <button onClick={() => { setGameMode('logic_link'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold transition-all hover:scale-105 ${gameMode === 'logic_link' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>Logic Link (Reason → Example)</button>
                                     <button onClick={() => { setGameMode('review'); setSetupStep(3); }} className={`p-5 md:p-6 rounded-2xl border-4 text-xl md:text-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 ${gameMode === 'review' ? 'bg-teal-600 border-teal-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}><BookOpen className="w-6 h-6"/> Review Mode</button>
                                 </div>
                             </div>
                         )}

                         {setupStep === 3 && (
                             <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col h-full min-h-0">
                                 <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center tracking-widest uppercase shrink-0">3. Final Settings</h2>
                                 
                                 <div className="grid md:grid-cols-2 gap-6 text-left flex-1 min-h-0">
                                     <div className={`bg-slate-950/50 p-4 md:p-5 rounded-2xl flex flex-col h-full min-h-0 transition-all duration-300 ${!isTopicSelected ? 'ring-4 ring-cyan-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/10'}`}>
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

                                     <div className="flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                                         <div className={`bg-slate-950/50 p-4 rounded-2xl transition-all duration-300 ${!isTopicSelected ? 'opacity-30 pointer-events-none border border-white/5' : (!isStanceSelected ? 'ring-4 ring-green-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/10')}`}>
                                             <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">Your Stance</h3>
                                             <div className="flex gap-3">
                                                 <button onClick={() => setUserStance('affirmative')} className={`flex-1 py-3 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'affirmative' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{langMode === 'ja' ? '肯定側' : 'AFFIRMATIVE'}</button>
                                                 <button onClick={() => setUserStance('negative')} className={`flex-1 py-3 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'negative' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{langMode === 'ja' ? '否定側' : 'NEGATIVE'}</button>
                                             </div>
                                         </div>

                                         <div className={`bg-slate-950/50 p-4 rounded-2xl transition-all duration-300 ${!isStanceSelected ? 'opacity-30 pointer-events-none border border-white/5' : (!isDifficultySelected ? 'ring-4 ring-yellow-500 ring-opacity-70 animate-pulse border-transparent' : 'border border-white/10')}`}>
                                             <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">Difficulty</h3>
                                             <div className="flex gap-2">
                                                 {Object.keys(DIFFICULTIES).map(d => (
                                                     <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all ${difficulty === d ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700'}`}>{DIFFICULTIES[d].label}</button>
                                                 ))}
                                             </div>
                                         </div>

                                         <div className={`bg-slate-950/50 p-4 rounded-2xl transition-all duration-300 border border-white/10 ${!isDifficultySelected ? 'opacity-30 pointer-events-none' : ''}`}>
                                             <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">Game Modifiers</h3>
                                             <div className="space-y-4">
                                                 <div className="flex justify-between items-center">
                                                     <span className="font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Image Match</span>
                                                     <button onClick={() => setImageMatchEnabled(!imageMatchEnabled)} className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${imageMatchEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}>
                                                         <div className={`bg-white w-5 h-5 rounded-full transform transition-transform ${imageMatchEnabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                                     </button>
                                                 </div>
                                                 <div className="flex justify-between items-center">
                                                     <span className="font-bold flex items-center gap-2"><Clock className="w-5 h-5"/> Time Limit</span>
                                                     <button onClick={() => setTimerEnabled(!timerEnabled)} className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${timerEnabled ? 'bg-pink-600' : 'bg-slate-600'}`}>
                                                         <div className={`bg-white w-5 h-5 rounded-full transform transition-transform ${timerEnabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                                     </button>
                                                 </div>
                                                 <div>
                                                     <div className="flex justify-between font-bold mb-2">
                                                         <span className="flex items-center gap-2"><Swords className="w-5 h-5"/> Battle Rounds</span>
                                                         <span className="text-cyan-400">{battleRounds} Rounds</span>
                                                     </div>
                                                     <input type="range" min="1" max="6" value={battleRounds} onChange={(e) => setBattleRounds(Number(e.target.value))} className="w-full accent-cyan-500" />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {canStart && (
                                    <button onClick={initGame} className="w-full mt-6 py-4 md:py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-black text-2xl md:text-3xl hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all hover:scale-[1.02] border border-white/20 text-white flex justify-center items-center gap-3 shrink-0 animate-in zoom-in duration-300">
                                        {gameMode === 'review' ? <BookOpen/> : <Play className="fill-current"/>} 
                                        {gameMode === 'review' ? 'ENTER REVIEW' : 'BATTLE START'}
                                    </button>
                                 )}
                             </div>
                         )}
                     </div>
                 </div>
                 
                 <div className="flex justify-center gap-8 text-base text-slate-400 font-mono mt-6 shrink-0">
                     <button onClick={() => setIsDrillMode(true)} className="hover:text-white flex items-center gap-2"><BrainCircuit className="w-5 h-5"/> Vocab Quiz</button>
                     <button onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal')} className="hover:text-white flex items-center gap-2"><Type className="w-5 h-5"/> Text Size</button>
                 </div>
             </div>
          </div>
      )}

      {/* --- Game Header --- */}
      {gameState !== 'start' && (
        <header className={`shrink-0 ${theme.headerBg} z-30 px-6 py-3 flex justify-between items-center shadow-xl min-h-[5rem] md:min-h-[6rem]`}>
          <div className="flex items-center gap-4 flex-1">
            <button onClick={goHome} className="p-3 rounded-full hover:bg-white/10 transition-colors bg-white/5 border border-white/10"><Home className="w-6 h-6 md:w-8 md:h-8"/></button>
            
            <div className="flex-1 max-w-[200px] md:max-w-[300px] mx-2 md:mx-6">
                <div className="flex justify-between text-xs md:text-sm font-black uppercase mb-2 opacity-90">
                    <span className="text-blue-400 flex items-center gap-1"><Heart className="w-4 h-4 md:w-5 md:h-5 fill-current"/> HP</span>
                    <span className="text-slate-100 text-base md:text-xl drop-shadow-md">{Math.ceil(playerHP)} / {MAX_HP}</span>
                </div>
                <div className="h-4 md:h-5 bg-slate-900 rounded-full overflow-hidden border-2 border-white/20 relative shadow-inner">
                    <div className={`h-full transition-all duration-300 ${playerHP > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} style={{ width: `${(playerHP/MAX_HP)*100}%` }}/>
                </div>
            </div>

            <div className="hidden lg:flex flex-col ml-4 border-l border-white/20 pl-6 max-w-xl">
                <span className="text-xl md:text-2xl font-black text-white truncate flex items-center gap-3 drop-shadow-md">
                  {langMode === 'ja' ? currentTopic.titleJP : currentTopic.title}
                  <span className={`text-xs md:text-sm px-3 py-1 rounded-md uppercase tracking-wider font-bold shadow-lg ${userStance === 'affirmative' ? 'bg-blue-600 border border-blue-400' : 'bg-red-600 border border-red-400'}`}>
                     {userStance === 'affirmative' ? (langMode === 'ja' ? '肯定' : 'AFFIRMATIVE') : (langMode === 'ja' ? '否定' : 'NEGATIVE')}
                  </span>
                  {battleRounds > 1 && (gameState.includes('cross') || gameState.includes('rebuttal')) && (
                     <span className="text-xs px-2 py-1 rounded-md bg-purple-600 border border-purple-400 ml-2">ROUND {currentRoundIndex + 1}/{battleRounds}</span>
                  )}
                </span>
                {showJapanese && langMode !== 'ja' && <span className="text-sm text-slate-400 mt-1 truncate">{currentTopic.titleJP}</span>}
            </div>
          </div>

          {timerEnabled && ['construct', 'cross_exam', 'rebuttal_defense', 'construct_image', 'cross_exam_image', 'rebuttal_defense_image', 'closing', 'closing_image'].includes(gameState) && (
              <div className="absolute left-1/2 -translate-x-1/2 top-4 md:top-6 flex flex-col items-center w-32 md:w-48 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-[10px] md:text-xs font-bold text-pink-400 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1"><Clock className="w-3 h-3 md:w-4 md:h-4"/> Time Limit</div>
                  <div className="w-full h-2 md:h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-600 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100 ease-linear" style={{ width: `${100 - timeProgress}%` }}/>
                  </div>
              </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal')} className="p-2 md:p-3 hover:bg-white/10 rounded-full text-slate-300 transition-colors bg-white/5 border border-white/10" title="Text Size"><Type className="w-5 h-5 md:w-6 md:h-6"/></button>
            <button onClick={() => setShowRules(true)} className="p-2 md:p-3 hover:bg-white/10 rounded-full text-blue-400 transition-colors bg-white/5 border border-white/10"><HelpCircle className="w-5 h-5 md:w-6 md:h-6"/></button>
            {langMode !== 'ja' && <button onClick={() => setShowJapanese(!showJapanese)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-black text-sm md:text-base shadow-lg transition-colors ${showJapanese ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-500 text-slate-300'}`}>JP</button>}
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

              {/* Rival Attack / Question Area */}
              {rivalCard && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 animate-in slide-in-from-top-4">
                   <div className={`p-4 md:p-6 rounded-2xl shadow-2xl border-4 flex flex-col md:flex-row gap-4 md:gap-6 ${rivalCard.type === 'attack' ? 'bg-rose-950/95 border-rose-500' : 'bg-teal-950/95 border-teal-500'}`}>
                      {rivalCard.image_url && (
                          <div className="shrink-0">
                              <img src={rivalCard.image_url} className="w-full md:w-32 h-32 object-cover rounded-xl border-2 border-white/20 shadow-md" alt="Rival" />
                          </div>
                      )}
                      <div className="flex gap-4">
                          <div className={`shrink-0 p-3 md:p-4 rounded-full h-fit border-2 border-white/20 ${rivalCard.type === 'attack' ? 'bg-rose-600' : 'bg-teal-600'}`}>
                              {rivalCard.type === 'attack' ? <Swords className="w-6 h-6 md:w-8 md:h-8 text-white"/> : <MessageCircleQuestion className="w-6 h-6 md:w-8 md:h-8 text-white"/>}
                          </div>
                          <div>
                            <div className="font-black opacity-60 text-xs md:text-sm uppercase tracking-widest mb-1">{rivalCard.type === 'attack' ? "Opponent Attack!" : "Question"}</div>
                            {langMode === 'ja' ? <div className="text-lg md:text-2xl font-bold leading-relaxed">{rivalCard.textJP}</div> : (
                                <><div className="text-lg md:text-xl font-bold leading-relaxed"><SmartText text={typeof rivalCard.text === 'object' ? rivalCard.text[difficulty] : rivalCard.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-2 opacity-80 text-sm border-t border-white/20 pt-1">{rivalCard.textJP}</div>}</>
                            )}
                          </div>
                      </div>
                   </div>
                 </div>
              )}

              {/* Prompt for Image Match */}
              {gameState.endsWith('_image') && pendingCard && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 animate-in slide-in-from-top-4">
                     <div className="bg-cyan-950/95 border-4 border-cyan-500 p-4 md:p-6 rounded-2xl shadow-2xl text-center">
                         <div className="flex items-center justify-center gap-2 text-cyan-400 font-black tracking-widest uppercase mb-2">
                             <ImageIcon className="w-6 h-6"/> Select Matching Image
                         </div>
                         <div className="text-lg md:text-xl font-bold text-white bg-black/40 p-4 rounded-xl border border-white/10">
                            {langMode === 'ja' ? pendingCard.textJP : (typeof pendingCard.text === 'object' ? pendingCard.text[difficulty] : pendingCard.text)}
                         </div>
                     </div>
                 </div>
              )}

              {/* Tower / Log Area */}
              <div ref={scrollRef} className="flex-1 w-full overflow-y-auto p-4 flex flex-col items-center gap-4 scroll-smooth pb-20 z-10 pt-48">
                  {tower.map((block, idx) => {
                      const typeStyle = CARD_TYPES[block.type] || CARD_TYPES.reason;
                      return (
                      <div key={block.id + idx} className="relative w-full max-w-3xl animate-in slide-in-from-bottom-4">
                          <div className={`p-4 md:p-5 rounded-xl border-l-8 backdrop-blur-md shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center ${block.judgment === 'weak' ? 'border-yellow-500/50 bg-yellow-900/40' : `border-${typeStyle.color.split('-')[1]}-500 bg-slate-900/90`}`}>
                              {block.image_url && (
                                  <div className="shrink-0 w-full md:w-32 h-32 rounded-lg overflow-hidden border border-white/20 shadow-md">
                                      <img src={block.image_url} className="w-full h-full object-cover" alt="Card Visual" />
                                  </div>
                              )}
                              <div className="flex-1 flex gap-4 w-full">
                                  <div className={`shrink-0 p-2 md:p-3 rounded-xl bg-black/40 border border-white/5 h-fit ${typeStyle.color}`}>{React.createElement(typeStyle.icon, { size: 20 })}</div>
                                  <div className="flex-1">
                                      <div className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-70 ${typeStyle.color}`}>{langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}</div>
                                      {langMode === 'ja' ? <div className="font-bold text-white text-base md:text-lg leading-relaxed">{block.textJP}</div> : (
                                          <><div className="font-bold leading-relaxed text-slate-100 text-base md:text-lg"><SmartText text={typeof block.text === 'object' ? block.text[difficulty] : block.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-1 text-slate-400 text-xs md:text-sm border-t border-white/10 pt-1">{block.textJP}</div>}</>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                      );
                  })}
              </div>
          </div>

          <div className="w-4 bg-slate-900 border-x border-white/10 cursor-col-resize hover:bg-blue-900/30 flex items-center justify-center z-20" onMouseDown={() => isResizing.current = true} onTouchStart={() => isResizing.current = true}><GripVertical className="w-4 h-4 text-slate-600"/></div>

          {/* Right/Left Control Panel */}
          <div className="flex flex-col bg-[#1e293b] border-l border-white/10 shadow-2xl z-20" style={{ width: `${sidePanelWidth}%`, minWidth: '300px' }}>
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      {gameState.endsWith('_image') ? <ImageIcon className="w-4 h-4"/> : <Lightbulb className="w-4 h-4"/>} 
                      {gameState.endsWith('_image') ? "Select Image" : "Hand"}
                  </div>
                  <div className="flex gap-1">
                      <button onClick={() => setSidePanelPos(prev => prev === 'left' ? 'right' : 'left')} className="p-1 hover:bg-white/10 rounded"><MoveHorizontal className="w-4 h-4 text-slate-400"/></button>
                      {gameState === 'construct' && <button onClick={handleUndo} className="p-1 hover:bg-white/10 rounded flex items-center text-xs font-bold text-slate-300 disabled:opacity-30" disabled={tower.length === 0}><Undo2 className="w-4 h-4"/></button>}
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {gameState.endsWith('_image') ? (
                      // Image Match Grid
                      <div className="grid grid-cols-2 gap-3 h-full pb-10">
                          {imageHand.map((url, idx) => (
                              <button key={idx} onClick={() => handleImageSelect(url)} className="relative border-4 border-white/10 rounded-xl overflow-hidden hover:border-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-lg group aspect-square">
                                  <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"/>
                                  {url ? (
                                     <img src={url} className="w-full h-full object-cover" alt="Choice" />
                                  ) : (
                                     <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">No Image</div>
                                  )}
                              </button>
                          ))}
                      </div>
                  ) : (
                      // Standard Text Hand
                      visibleHand.map((card) => {
                          const type = CARD_TYPES[card.type] || CARD_TYPES.reason;
                          return (
                              <button key={card.id} onClick={() => handleCardSelect(card)} className={`w-full relative overflow-hidden group text-left p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${type.bg} border-white/20 hover:border-white/50 animate-in fade-in zoom-in-95`}>
                                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white`}>{langMode === 'ja' || showJapanese ? type.labelJP : type.label}</span>
                                      {React.createElement(type.icon, { className: "w-4 h-4 text-white opacity-80" })}
                                  </div>
                                  <div className="relative z-10">
                                      {langMode === 'ja' ? <div className="font-bold text-white text-sm md:text-base drop-shadow-md">{card.textJP}</div> : (
                                          <><div className="font-bold text-white leading-snug text-sm md:text-base drop-shadow-md"><SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} /></div>{showJapanese && <div className="mt-2 pt-1 border-t border-white/20 text-white/70 text-xs">{card.textJP}</div>}</>
                                      )}
                                  </div>
                              </button>
                          );
                      })
                  )}
              </div>
          </div>
        </div>
      )}

      {showRules && <RuleBook onClose={() => setShowRules(false)} />}
      {isDrillMode && <VocabDrill vocabList={currentTopic?.vocabulary || []} onClose={() => setIsDrillMode(false)} />}

      {/* --- Result / Game Over Screens --- */}
      {(gameState === 'gameover' || gameState === 'result') && (
           <div className={`absolute inset-0 z-50 flex flex-col items-center p-6 backdrop-blur-3xl animate-in zoom-in overflow-y-auto ${gameState === 'gameover' ? 'bg-red-950/95' : 'bg-[#0f172a]/95'}`}>
               <h2 className={`text-6xl md:text-8xl font-black text-white mb-2 mt-10 tracking-tighter drop-shadow-lg ${gameState === 'gameover' ? 'text-red-400' : 'text-cyan-400'}`}>
                   {gameState === 'gameover' ? 'DEFEAT' : 'VICTORY'}
               </h2>
               <div className="text-2xl font-mono text-white/80 mb-8 bg-black/30 px-6 py-2 rounded-full border border-white/10">Score: {score}</div>
               
               {(() => {
                   let targetGroup = activeLogicGroup;
                   if (!targetGroup) {
                       const validGroups = currentTopic.deck.filter(c => c.stance === userStance && c.group !== 'fake').map(c => c.group);
                       targetGroup = validGroups[0];
                   }
                   if (targetGroup) {
                       const correctCards = currentTopic.deck.filter(c => c.stance === userStance && c.group === targetGroup && c.group !== 'fake');
                       const order = { assertion: 1, reason: 2, example: 3, mini_conclusion: 4 };
                       correctCards.sort((a, b) => order[a.type] - order[b.type]);

                       return (
                           <div className="w-full max-w-5xl bg-slate-900/80 rounded-2xl p-6 border border-white/10 mb-10 shadow-2xl">
                               <h3 className="text-xl md:text-2xl font-black text-green-400 mb-6 flex items-center justify-center gap-2 border-b border-white/10 pb-4">
                                   <CheckCircle2 className="w-6 h-6"/> Model Answer (模範解答)
                               </h3>
                               <div className="grid gap-3">
                                   {correctCards.map(card => {
                                       const typeStyle = CARD_TYPES[card.type] || CARD_TYPES.reason;
                                       return (
                                           <div key={card.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5 items-start md:items-center text-left">
                                               {card.image_url && (
                                                   <div className="shrink-0 w-full md:w-32 h-32 rounded-lg overflow-hidden border border-white/10 shadow-md">
                                                       <img src={card.image_url} className="w-full h-full object-cover" />
                                                   </div>
                                               )}
                                               <div className="flex gap-4 flex-1 w-full items-center">
                                                   <div className={`shrink-0 text-[10px] md:text-xs font-black uppercase px-2 py-1 rounded bg-black/40 border border-white/10 ${typeStyle.color} w-24 text-center`}>
                                                       {langMode === 'ja' ? typeStyle.labelJP : typeStyle.label}
                                                   </div>
                                                   <div className="flex-1">
                                                       {langMode === 'ja' ? (
                                                           <div className="font-bold text-white text-sm md:text-base leading-relaxed">{card.textJP}</div>
                                                       ) : (
                                                           <>
                                                               <div className="font-bold text-white text-sm md:text-base leading-relaxed"><SmartText text={typeof card.text === 'object' ? card.text[difficulty] : card.text} vocabList={currentTopic.vocabulary} /></div>
                                                               {showJapanese && <div className="mt-1 text-slate-400 text-xs">{card.textJP}</div>}
                                                           </>
                                                       )}
                                                   </div>
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

      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (<div key={p.id} className={`absolute rounded-full ${p.color} animate-particle`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${10 * p.scale}px`, height: `${10 * p.scale}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }} />))}
      </div>
      
      {feedback && (
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] pointer-events-none w-full flex justify-center">
            <div className={`px-10 py-6 rounded-xl backdrop-blur-md text-white font-black text-2xl md:text-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in flex items-center gap-4 ${feedback.type === 'damage' ? 'bg-red-600/90 border-2 border-red-400' : 'bg-blue-600/90 border-2 border-blue-400'}`}>
               {feedback.type === 'damage' ? <AlertTriangle className="w-8 h-8 md:w-10 md:h-10"/> : <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10"/>}<span>{feedback.msg}</span>
            </div>
         </div>
      )}

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