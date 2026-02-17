import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, RefreshCcw, CheckCircle2, ArrowUpCircle, Play,
  AlertTriangle, Lightbulb, ShieldCheck, Languages, GripVertical,
  ChevronRight, ChevronLeft, Palette, Home, Zap, Swords,
  Shield, MessageCircleQuestion, Gavel, Plus, BrainCircuit,
  Settings, X, Type, Monitor, Target, Heart, Clock, Undo2, Skull,
  HelpCircle, AlignJustify, MoveHorizontal
} from 'lucide-react';

import { getAllTopics } from './utils/dataLoader';
import { SmartText } from './components/UI/SmartText';
import { VocabDrill } from './components/Game/VocabDrill';

// --- 設定値 ---
const MAX_HP = 100;
const DAMAGE_BIG = 50; 
const DAMAGE_SMALL = 25; 
const DAMAGE_TICK = 12.5; 
const TIME_LIMIT_SEC = 10; 

const DIFFICULTIES = {
  easy: { label: 'Easy', deckSize: 4, showHint: true },
  medium: { label: 'Medium', deckSize: 5, showHint: false },
  hard: { label: 'Hard', deckSize: 6, showHint: false },
};

const AREA_FLOW = ['assertion', 'reason', 'evidence', 'mini_conclusion'];

const THEMES = {
  techno: {
    id: 'techno',
    label: 'Cyber',
    bg: 'bg-[#0f172a]',
    text: 'text-slate-100',
    headerBg: 'bg-[#1e293b]/90 border-b border-white/5 backdrop-blur-md',
    cardBg: 'bg-[#1e293b]',
  },
};

const CARD_TYPES = {
  assertion: { label: "Assertion", labelJP: "主張 (A)", icon: ShieldCheck, color: "text-blue-200", border: "border-blue-500", bg: "bg-gradient-to-br from-blue-600 to-blue-800" },
  reason:    { label: "Reason",    labelJP: "理由 (R)",    icon: ArrowUpCircle, color: "text-green-200", border: "border-green-500", bg: "bg-gradient-to-br from-green-600 to-green-800" },
  evidence:  { label: "Example",   labelJP: "具体例 (E)",  icon: Lightbulb,     color: "text-orange-200", border: "border-orange-500", bg: "bg-gradient-to-br from-orange-600 to-orange-800" },
  mini_conclusion:{ label: "Summary",labelJP: "再主張 (A)", icon: ShieldCheck, color: "text-purple-200", border: "border-purple-500", bg: "bg-gradient-to-br from-purple-600 to-purple-800" },
  // 追加カードタイプ
  answer:    { label: "Answer",    labelJP: "回答", icon: MessageCircleQuestion, color: "text-teal-200", border: "border-teal-500", bg: "bg-gradient-to-br from-teal-600 to-teal-800" },
  defense:   { label: "Rebuttal",  labelJP: "再反論", icon: Shield, color: "text-indigo-200", border: "border-indigo-500", bg: "bg-gradient-to-br from-indigo-600 to-indigo-800" },
  closing:   { label: "Closing",   labelJP: "最終弁論", icon: Gavel, color: "text-pink-200", border: "border-pink-500", bg: "bg-gradient-to-br from-pink-600 to-pink-800" },
};

// ルール説明モーダル
const RuleBook = ({ onClose }) => (
  <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-[#1e293b] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><X/></button>
      <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-2"><HelpCircle/> How to Play</h2>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h3 className="text-xl font-bold text-blue-400 mb-2">1. Objective</h3>
          <p>Construct your argument (AREA) and defeat your opponent before HP runs out.</p>
        </section>
        <section>
          <h3 className="text-xl font-bold text-red-400 mb-2">2. Battle Phases</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Construct:</strong> Build AREA (Assertion, Reason, Example, Assertion).</li>
            <li><strong>Cross Exam:</strong> Answer the opponent's question.</li>
            <li><strong>Rebuttal:</strong> Defend against the opponent's attack.</li>
            <li><strong>Closing:</strong> Make a final statement.</li>
          </ul>
        </section>
      </div>
      <button onClick={onClose} className="w-full mt-8 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500">Got it!</button>
    </div>
  </div>
);

export default function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userStance, setUserStance] = useState('affirmative'); 
  
  const [difficulty, setDifficulty] = useState('easy');
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
  const [rivalCard, setRivalCard] = useState(null); // 敵のメッセージ用
  const [particles, setParticles] = useState([]);
  const [shake, setShake] = useState(false);
  const [activeLogicGroup, setActiveLogicGroup] = useState(null);

  const [sidePanelPos, setSidePanelPos] = useState('right'); 
  const [sidePanelWidth, setSidePanelWidth] = useState(30); 
  
  const [timeProgress, setTimeProgress] = useState(0); 
  const timerIntervalRef = useRef(null);
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
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    let startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / (TIME_LIMIT_SEC * 1000)) * 100, 100);
      setTimeProgress(progress);
      
      if (progress >= 100) {
        startTime = Date.now(); 
        takeDamage(DAMAGE_TICK, "Time Penalty");
      }
    }, 100);

    return () => {
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, playerHP]); 

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

  // --- Helper Functions ---
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

  const initGame = () => {
    setTower([]);
    setPlayerHP(MAX_HP);
    setOpponentHP(MAX_HP);
    setScore(0);
    setActiveLogicGroup(null);
    setRivalCard(null);
    setGameState('construct');
    setFeedback(null);
    setTimeProgress(0);
    
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    const myStanceCards = currentTopic.deck.filter(c => c.stance === userStance);
    
    if (myStanceCards.length === 0) {
        alert("No cards found for this stance! Please check data.");
        return;
    }

    const allGroups = [...new Set(myStanceCards.map(c => c.group))];
    const targetGroup = allGroups[Math.floor(Math.random() * allGroups.length)];
    
    const correctCards = myStanceCards.filter(c => c.group === targetGroup);
    const otherCards = myStanceCards.filter(c => c.group !== targetGroup);
    const noiseCount = DIFFICULTIES[difficulty].deckSize - 4;
    const noiseCards = otherCards.sort(() => Math.random() - 0.5).slice(0, Math.max(0, noiseCount));
    
    const deck = [...correctCards, ...noiseCards].sort(() => Math.random() - 0.5);
    setHand(deck);
    setActiveLogicGroup(targetGroup);
  };

  const goHome = () => {
    setGameState('start');
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
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    const q = currentTopic.crossExam?.question;
    
    if (q) {
      setGameState('cross_exam');
      setRivalCard({ id: 'rival_q', text: q.text, textJP: q.textJP, type: 'answer', isQuestion: true });
      setHand(currentTopic.crossExam.options || []);
    } else {
      // データがない場合はスキップして次のフェーズへ
      triggerRebuttalPhase();
    }
  };

  const triggerRebuttalPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('rebuttal_intro');
    setRivalCard(null);
    
    setTimeout(() => {
      setGameState('rebuttal_attack');
      const atk = currentTopic.rebuttal?.attack;
      
      if (atk) {
        setRivalCard({ id: 'rival_atk', text: atk.text, textJP: atk.textJP, type: 'attack', damage: atk.damage });
        // 反論ダメージ発生
        takeDamage(DAMAGE_TICK, "Rival Attack");
        
        setTimeout(() => {
          setGameState('rebuttal_defense');
          setHand(currentTopic.rebuttal.options || []);
        }, 3000);
      } else {
        triggerClosingPhase();
      }
    }, 2000);
  };

  const triggerClosingPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('closing');
    setRivalCard(null);
    setHand(currentTopic.closing?.options || []);
  };

  const handleCardSelect = (card) => {
    setTimeProgress(0); 

    let judgment = 'weak';
    let nextPhaseTrigger = null;

    if (gameState === 'construct') {
      const currentStepIndex = tower.length;
      const expectedType = AREA_FLOW[currentStepIndex];
      const cardType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;

      // 1. Structure Check
      if (cardType !== expectedType) {
        takeDamage(DAMAGE_BIG, "Wrong Structure!");
        return;
      }

      // 2. Logic Check
      if (currentStepIndex === 0) {
        if (card.group !== activeLogicGroup) {
             takeDamage(DAMAGE_SMALL, "Logic Mismatch!");
        } else {
             judgment = 'correct';
        }
      } else {
        if (card.group !== activeLogicGroup) {
           takeDamage(DAMAGE_SMALL, "Logic Error!");
        } else {
           judgment = 'perfect';
           setScore(prev => prev + 100);
           damageOpponent(25);
        }
      }

      const newTower = [...tower, { ...card, judgment }];
      setTower(newTower);
      setHand(hand.filter(c => c.id !== card.id));
      
      if (newTower.length >= 4) {
        setFeedback({ msg: "AREA COMPLETE!", type: 'success', judgment: 'perfect' });
        triggerExplosion(30, 'bg-blue-400');
        // Construct完了 → Cross Examへ
        nextPhaseTrigger = () => setTimeout(triggerCrossExam, 1500);
      }
    } else {
        // --- 対戦フェーズ (Cross Exam / Rebuttal / Closing) ---
        setHand([]); // 一旦手札を隠す

        if (card.judgment === 'weak') {
            takeDamage(DAMAGE_SMALL, "Weak Argument");
            judgment = 'weak';
        } else {
            setScore(prev => prev + 50);
            damageOpponent(20);
            judgment = 'perfect';
            setFeedback({ msg: "NICE MOVE!", type: 'success', judgment: 'perfect' });
        }

        // 次のフェーズへの遷移
        if (gameState === 'cross_exam') {
            nextPhaseTrigger = () => setTimeout(triggerRebuttalPhase, 1500);
        } else if (gameState === 'rebuttal_defense') {
            nextPhaseTrigger = () => setTimeout(triggerClosingPhase, 1500);
        } else if (gameState === 'closing') {
            nextPhaseTrigger = () => setTimeout(() => setGameState('result'), 1500);
        }
    }

    if (nextPhaseTrigger) nextPhaseTrigger();
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const theme = THEMES.techno;

  const getNextInstruction = () => {
      const step = tower.length;
      if (step >= 4) return "AREA Completed!";
      const nextType = AREA_FLOW[step];
      const typeInfo = CARD_TYPES[nextType];
      
      return (
          <div className="flex flex-col items-center animate-pulse">
              <span className="text-sm text-slate-400 mb-1 font-bold tracking-widest">NEXT BLOCK</span>
              <div className={`
                  relative px-8 py-3 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3
                  ${typeInfo.bg} ${typeInfo.border} text-white
              `}>
                  {React.createElement(typeInfo.icon, { size: 24 })}
                  <span className="text-2xl font-black">{showJapanese ? typeInfo.labelJP : typeInfo.label}</span>
              </div>
              
              <div className="mt-4 w-64 h-20 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="text-white/20 w-8 h-8"/>
              </div>
          </div>
      );
  };

  if (topics.length === 0) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} font-sans flex flex-col overflow-hidden`}>
      
      {showRules && <RuleBook onClose={() => setShowRules(false)} />}

      {/* Header */}
      <header className={`shrink-0 ${theme.headerBg} z-30 px-4 py-2 flex justify-between items-center shadow-lg h-16`}>
        <div className="flex items-center gap-4 flex-1">
          <button onClick={goHome} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Home className="w-5 h-5"/></button>
          
          {/* Player HP */}
          <div className="flex-1 max-w-[200px]">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1 opacity-80">
                  <span className="text-blue-400 flex items-center gap-1"><Heart className="w-3 h-3 fill-current"/> HP</span>
                  <span className="text-slate-400">{Math.ceil(playerHP)}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
                  <div className={`h-full transition-all duration-300 ${playerHP > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-red-500'}`} style={{ width: `${(playerHP/MAX_HP)*100}%` }}/>
              </div>
          </div>
        </div>

        {/* Timer */}
        {(gameState === 'construct' || gameState === 'cross_exam' || gameState === 'rebuttal_defense') && (
            <div className="absolute left-1/2 -translate-x-1/2 top-2 flex flex-col items-center w-32">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3"/> Time Limit
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                    <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100 ease-linear" style={{ width: `${100 - timeProgress}%` }}/>
                </div>
            </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)} className="p-2 hover:bg-white/10 rounded-full text-blue-400"><HelpCircle className="w-6 h-6"/></button>
          <button onClick={() => setShowJapanese(!showJapanese)} className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${showJapanese ? 'bg-blue-600 border-blue-400' : 'border-slate-600'}`}>JP</button>
        </div>
      </header>

      {/* Main Layout */}
      <div className={`flex-1 flex overflow-hidden relative ${sidePanelPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Left/Center Panel (Tower) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0f172a]/50">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay">
                <img src={currentTopic.image_url} className="w-full h-full object-cover" />
            </div>

            {/* Instruction Area */}
            {gameState === 'construct' && (
                <div className="shrink-0 py-6 flex justify-center z-10 bg-gradient-to-b from-[#0f172a] to-transparent">
                    {getNextInstruction()}
                </div>
            )}

            {/* Rival Message Overlay */}
            {rivalCard && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 animate-in slide-in-from-top-4">
                 <div className={`p-6 rounded-2xl shadow-2xl border-4 flex gap-6 ${rivalCard.type === 'attack' ? 'bg-rose-950/90 border-rose-500 text-rose-100' : 'bg-teal-950/90 border-teal-500 text-teal-100'}`}>
                    <div className={`shrink-0 p-4 rounded-full h-fit border-2 border-white/20 ${rivalCard.type === 'attack' ? 'bg-rose-600' : 'bg-teal-600'}`}>
                        {rivalCard.type === 'attack' ? <Swords className="w-8 h-8 text-white"/> : <MessageCircleQuestion className="w-8 h-8 text-white"/>}
                    </div>
                    <div>
                      <div className="font-black opacity-60 text-sm uppercase tracking-widest mb-2">
                          {rivalCard.type === 'attack' ? "Opponent's Counterattack!" : "Cross Examination"}
                      </div>
                      <div className="text-xl md:text-2xl font-bold leading-snug"><SmartText text={rivalCard.text} vocabList={currentTopic.vocabulary} /></div>
                      {showJapanese && <div className="mt-3 opacity-80 text-base border-t border-white/20 pt-2 font-medium">{rivalCard.textJP}</div>}
                    </div>
                 </div>
               </div>
            )}

            <div ref={scrollRef} className="flex-1 w-full overflow-y-auto p-4 flex flex-col items-center gap-4 scroll-smooth pb-20 z-10">
                {tower.map((block) => {
                    const typeStyle = CARD_TYPES[block.type];
                    return (
                    <div key={block.id} className="relative w-full max-w-3xl animate-in slide-in-from-bottom-4">
                        <div className={`
                            p-5 rounded-xl border-l-8 backdrop-blur-md shadow-lg flex gap-4 items-center
                            ${block.judgment === 'weak' ? 'border-yellow-500/50 bg-yellow-900/10' : `border-${typeStyle.color.split('-')[1]}-500 bg-slate-900/90`}
                        `}>
                            <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${typeStyle.color}`}>
                                {React.createElement(typeStyle.icon, { size: 24 })}
                            </div>
                            <div className="flex-1">
                                <div className={`text-xs font-black uppercase tracking-widest mb-1 opacity-70 ${typeStyle.color}`}>
                                {typeStyle.label}
                                </div>
                                <div className="font-bold leading-relaxed text-slate-100 text-lg">
                                <SmartText text={block.text} vocabList={currentTopic.vocabulary} />
                                </div>
                                {showJapanese && <div className="mt-2 text-slate-400 text-sm border-t border-white/10 pt-1">{block.textJP}</div>}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>

        {/* Resizer */}
        {gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result' && (
            <div 
                className="w-4 bg-slate-900 border-x border-white/10 cursor-col-resize hover:bg-blue-900/30 flex items-center justify-center z-20 transition-colors"
                onMouseDown={() => isResizing.current = true}
                onTouchStart={() => isResizing.current = true}
            >
                <GripVertical className="w-4 h-4 text-slate-600"/>
            </div>
        )}

        {/* Side Panel (Hand) */}
        {(gameState !== 'start' && gameState !== 'gameover' && gameState !== 'result') && (
            <div className="flex flex-col bg-[#1e293b] border-l border-white/10 shadow-2xl z-20" style={{ width: `${sidePanelWidth}%`, minWidth: '250px' }}>
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {gameState === 'construct' ? 'Your Hand' : 'Select Response'}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSidePanelPos(prev => prev === 'left' ? 'right' : 'left')} className="p-1 hover:bg-white/10 rounded" title="Switch Side">
                            <MoveHorizontal className="w-4 h-4 text-slate-400"/>
                        </button>
                        {gameState === 'construct' && (
                            <button onClick={handleUndo} className="p-1 hover:bg-white/10 rounded flex items-center gap-1 text-xs font-bold text-slate-300 disabled:opacity-30" disabled={tower.length === 0}>
                                <Undo2 className="w-4 h-4"/> Undo
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {hand.map((card) => {
                        const type = CARD_TYPES[card.type] || CARD_TYPES.reason;
                        return (
                            <button 
                                key={card.id} 
                                onClick={() => handleCardSelect(card)}
                                className={`
                                    w-full relative overflow-hidden group text-left p-4 rounded-xl border transition-all duration-200
                                    hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]
                                    ${type.bg} border-white/20 hover:border-white/50
                                `}
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white`}>
                                        {showJapanese ? type.labelJP : type.label}
                                    </span>
                                    {React.createElement(type.icon, { className: "w-4 h-4 text-white opacity-80" })}
                                </div>
                                <div className="relative z-10">
                                    <div className="font-bold text-white leading-snug text-sm md:text-base drop-shadow-md">
                                        <SmartText text={card.text} vocabList={currentTopic.vocabulary} />
                                    </div>
                                    {showJapanese && <div className="mt-2 pt-2 border-t border-white/20 text-white/70 text-xs">{card.textJP}</div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {/* Start Screen */}
      {gameState === 'start' && !isDrillMode && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0f172a]/95 backdrop-blur-md animate-in fade-in overflow-y-auto">
             <div className="text-center space-y-6 max-w-4xl w-full py-10">
                 <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-400 tracking-tighter drop-shadow-2xl">
                    DEBATE BATTLE
                 </h1>
                 
                 <div className="grid md:grid-cols-2 gap-8 w-full">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest">1. Select Topic</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {topics.map(t => (
                                <button key={t.id} onClick={() => setSelectedTopicId(t.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTopicId === t.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                    <div className="font-bold text-sm md:text-base leading-tight">{t.title}</div>
                                    {showJapanese && <div className="text-xs opacity-60 mt-1">{t.titleJP}</div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/10">
                            <h2 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-widest">2. Your Stance</h2>
                            <div className="flex gap-4">
                                <button onClick={() => setUserStance('affirmative')} className={`flex-1 py-4 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'affirmative' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                    AFFIRMATIVE<br/><span className="text-xs font-normal">肯定側</span>
                                </button>
                                <button onClick={() => setUserStance('negative')} className={`flex-1 py-4 rounded-xl font-black text-lg border-2 transition-all ${userStance === 'negative' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                    NEGATIVE<br/><span className="text-xs font-normal">否定側</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/10">
                            <h2 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-widest">3. Difficulty</h2>
                            <div className="flex gap-2">
                                {Object.keys(DIFFICULTIES).map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)} 
                                        className={`flex-1 py-3 rounded-lg border font-bold transition-all ${difficulty === d ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                        {DIFFICULTIES[d].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>

                 <button onClick={initGame} className="w-full md:w-2/3 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-3xl hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transition-all hover:scale-[1.02] border border-white/10 text-white mt-8 mx-auto block">
                    BATTLE START
                 </button>
                 
                 <div className="flex justify-center gap-4 text-sm text-slate-500 font-mono">
                     <button onClick={() => setIsDrillMode(true)} className="hover:text-white underline">Vocabulary Practice</button>
                     <span>|</span>
                     <button onClick={() => setShowRules(true)} className="hover:text-white underline">How to Play</button>
                 </div>
             </div>
          </div>
      )}

      {/* Drill Mode */}
      {isDrillMode && <VocabDrill vocabList={currentTopic.vocabulary || []} onClose={() => setIsDrillMode(false)} />}

      {/* Result / Game Over Screens */}
      {(gameState === 'gameover' || gameState === 'result') && (
           <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl animate-in zoom-in ${gameState === 'gameover' ? 'bg-red-950/90' : 'bg-blue-950/90'}`}>
               <h2 className="text-7xl font-black text-white mb-4 tracking-tighter">{gameState === 'gameover' ? 'DEFEAT' : 'VICTORY'}</h2>
               <div className="text-3xl font-mono text-white/80 mb-8">Score: {score}</div>
               <button onClick={goHome} className="px-12 py-4 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl">PLAY AGAIN</button>
           </div>
      )}

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (
            <div key={p.id} className={`absolute rounded-full ${p.color} animate-particle`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${10 * p.scale}px`, height: `${10 * p.scale}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }}
            />
          ))}
      </div>
      
      {/* Feedback Popup */}
      {feedback && (
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] pointer-events-none w-full flex justify-center">
            <div className={`px-10 py-6 rounded-xl backdrop-blur-md text-white font-black text-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in flex items-center gap-4 ${feedback.type === 'damage' ? 'bg-red-600/90 border-2 border-red-400' : 'bg-blue-600/90 border-2 border-blue-400'}`}>
               {feedback.type === 'damage' ? <AlertTriangle className="w-10 h-10"/> : <CheckCircle2 className="w-10 h-10"/>}
               <span>{feedback.msg}</span>
            </div>
         </div>
      )}

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
      `}</style>
    </div>
  );
}