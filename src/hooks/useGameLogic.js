import { useState, useEffect, useRef } from 'react';
import { getAllTopics } from '../utils/dataLoader';
import { MAX_HP, DAMAGE_BIG, DAMAGE_SMALL, DAMAGE_TICK, TIME_LIMIT_SEC, DIFFICULTIES, FLOWS } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
            urls.add(item.image_url);
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

export const useGameLogic = (playSound) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userStance, setUserStance] = useState(null); 
  const [difficulty, setDifficulty] = useState(null);
  const [timerEnabled, setTimerEnabled] = useState(true); 
  const [imageMatchEnabled, setImageMatchEnabled] = useState(true);
  const [battleRounds, setBattleRounds] = useState(3);
  const [gameMode, setGameMode] = useState('area'); 
  const [langMode, setLangMode] = useState('en'); 
  const [fontSize, setFontSize] = useState('normal'); 
  const [setupStep, setSetupStep] = useState(1);
  const [showRules, setShowRules] = useState(false);
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
  const [battlePlan, setBattlePlan] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [pendingCard, setPendingCard] = useState(null);
  const [imageHand, setImageHand] = useState([]);
  const [sidePanelPos, setSidePanelPos] = useState('right'); 
  const [sidePanelWidth, setSidePanelWidth] = useState(30); 
  const [timeProgress, setTimeProgress] = useState(0); 
  const [shake, setShake] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [shakingCardId, setShakingCardId] = useState(null);
  const [mistakes, setMistakes] = useState([]);

  const [bgmTrack, setBgmTrack] = useState('bgm1');
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [ttsVoiceType, setTtsVoiceType] = useState('female');
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [scoreDetails, setScoreDetails] = useState({ base: 0, timeBonus: 0, comboBonus: 0, perfect: 0 });

  const [playerName, setPlayerName] = useState(localStorage.getItem('debate_playerName') || '');
  // 🌍 修正：国旗コードから自由入力の Location に変更
  const [playerLocation, setPlayerLocation] = useState(localStorage.getItem('debate_playerLocation') || '');
  const [leaderboard, setLeaderboard] = useState([]);
  
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now()); 
  const isResizing = useRef(false);
  const scrollRef = useRef(null);
  const playerHPRef = useRef(MAX_HP);

  useEffect(() => { setTopics(getAllTopics()); }, []);

  // 🌍 修正：名前とLocationが変更されたらブラウザに記憶
  useEffect(() => {
      localStorage.setItem('debate_playerName', playerName);
      localStorage.setItem('debate_playerLocation', playerLocation);
  }, [playerName, playerLocation]);

  const fetchLeaderboard = async (topicId, diff) => {
      if (!topicId || !diff) return;
      try {
          const collectionPath = `leaderboards/${topicId}_${diff}/scores`;
          const q = query(collection(db, collectionPath), orderBy("score", "desc"), limit(10));
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
              data.push({ id: doc.id, ...doc.data() });
          });
          setLeaderboard(data);
      } catch (e) {
          console.error("Firebase fetch error: ", e);
      }
  };

  useEffect(() => {
      const saveScoreToFirebase = async () => {
          if (gameState === 'result' && selectedTopicId && difficulty && gameMode !== 'review') {
              try {
                  const collectionPath = `leaderboards/${selectedTopicId}_${difficulty}/scores`;
                  // 🌍 修正：Firebaseにlocationを保存する
                  await addDoc(collection(db, collectionPath), {
                      name: playerName || 'Anonymous',
                      location: playerLocation || 'Earth',
                      score: score,
                      date: new Date().toLocaleDateString('ja-JP')
                  });
                  await fetchLeaderboard(selectedTopicId, difficulty);
              } catch (e) {
                  console.error("Firebase save error: ", e);
              }
          }
      };
      saveScoreToFirebase();
  }, [gameState]);

  useEffect(() => {
    if (!timerEnabled) { setTimeProgress(0); clearInterval(timerIntervalRef.current); return; }
    const activeTimerStates = ['construct', 'cross_exam', 'rebuttal_defense', 'construct_image', 'cross_exam_image', 'rebuttal_defense_image', 'closing', 'closing_image'];
    if (!activeTimerStates.includes(gameState)) { clearInterval(timerIntervalRef.current); return; }
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / (TIME_LIMIT_SEC * 1000)) * 100, 100);
      setTimeProgress(progress);
      if (progress >= 100) { startTimeRef.current = Date.now(); takeDamage(DAMAGE_TICK, "Time Penalty"); }
    }, 100);
    return () => clearInterval(timerIntervalRef.current);
  }, [gameState, timerEnabled]); 

  useEffect(() => {
    const handleMove = (e) => {
      if (!isResizing.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const widthPercent = sidePanelPos === 'right' ? ((window.innerWidth - clientX) / window.innerWidth) * 100 : (clientX / window.innerWidth) * 100;
      setSidePanelWidth(Math.max(20, Math.min(50, widthPercent)));
    };
    const handleUp = () => isResizing.current = false;
    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); };
  }, [sidePanelPos]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [tower]);

  const addScore = (basePoint) => {
    const timeBns = timerEnabled ? Math.max(0, 50 - Math.floor(timeProgress / 2)) : 0;
    const currentCombo = combo + 1;
    setCombo(currentCombo);
    if (currentCombo > maxCombo) setMaxCombo(currentCombo);
    const comboMultiplier = 1.0 + (currentCombo - 1) * 0.1; 
    const diffMultiplier = difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0;

    const rawScore = basePoint + timeBns;
    const comboExtra = rawScore * (comboMultiplier - 1.0);
    const totalGained = Math.floor((rawScore + comboExtra) * diffMultiplier);

    setScore(prev => prev + totalGained);
    setScoreDetails(prev => ({
        base: prev.base + Math.floor(basePoint * diffMultiplier),
        timeBonus: prev.timeBonus + Math.floor(timeBns * diffMultiplier),
        comboBonus: prev.comboBonus + Math.floor(comboExtra * diffMultiplier),
        perfect: prev.perfect
    }));

    const newText = {
        id: Date.now(),
        text: `+${totalGained}`,
        comboStr: currentCombo > 1 ? `${currentCombo} COMBO!` : null,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20
    };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => { setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)); }, 1200);
  };

  const takeDamage = (amount, reason = "", cardId = null) => {
    playSound('wrong'); 
    const newHP = Math.max(0, playerHPRef.current - amount);
    playerHPRef.current = newHP;
    setPlayerHP(newHP);
    setCombo(0); 
    setShake(true); setTimeout(() => setShake(false), 300);
    setFeedback({ msg: `-${amount} HP (${reason})`, type: 'damage', judgment: 'weak' });
    setTimeout(() => setFeedback(null), 1500); 
    if (cardId) { setShakingCardId(cardId); setTimeout(() => setShakingCardId(null), 500); }

    if (newHP <= 0) {
        playSound('gameover');
        setGameState('gameover');
    }
  };

  const damageOpponent = (amount) => {
    setOpponentHP(prev => Math.max(0, prev - amount));
    triggerExplosion(10, 'bg-red-500');
  };

  const triggerExplosion = (count = 15, color = 'bg-yellow-400') => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i, x: 50 + (Math.random() - 0.5) * 40, y: 40 + (Math.random() - 0.5) * 20, tx: (Math.random() - 0.5) * 200, ty: (Math.random() - 0.5) * 200, scale: Math.random() * 1.5, color
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
    if (gameMode === 'review') { setGameState('review'); return; }
    setTower([]); setPlayerHP(MAX_HP); playerHPRef.current = MAX_HP; 
    setOpponentHP(MAX_HP); setScore(0);
    setActiveLogicGroup(null); setRivalCard(null); setGameState('construct');
    setFeedback(null); setTimeProgress(0); startTimeRef.current = Date.now(); 
    setMistakes([]); 
    setCombo(0); setMaxCombo(0); setScoreDetails({ base: 0, timeBonus: 0, comboBonus: 0, perfect: 0 }); 
    
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    let myStanceCards = currentTopic.deck.filter(c => c.stance === userStance);
    if (gameMode === 'logic_link') myStanceCards = myStanceCards.filter(c => c.type === 'reason' || c.type === 'example');
    
    const validCards = myStanceCards.filter(c => c.group !== 'fake');
    const fakeCardsAll = myStanceCards.filter(c => c.group === 'fake');
    const noiseCount = DIFFICULTIES[difficulty].fakeCount || 4;
    const noiseCards = fakeCardsAll.sort(() => Math.random() - 0.5).slice(0, Math.max(0, noiseCount));
    setHand([...validCards, ...noiseCards].sort(() => Math.random() - 0.5));
    
    const cxList = currentTopic.crossExam?.[userStance] || [];
    const rebList = currentTopic.rebuttal?.[userStance] || [];
    const plan = [];
    const shuffledCx = [...cxList].sort(() => Math.random() - 0.5);
    const shuffledReb = [...rebList].sort(() => Math.random() - 0.5);
    
    for(let i=0; i < battleRounds; i++) {
        plan.push({ cx: shuffledCx[i % Math.max(1, shuffledCx.length)], reb: shuffledReb[i % Math.max(1, shuffledReb.length)] });
    }
    setBattlePlan(plan); setCurrentRoundIndex(0);
  };

  const goHome = () => {
    setGameState('start'); setSetupStep(1); setSelectedTopicId(null);
    setUserStance(null); setDifficulty(null); setPlayerHP(MAX_HP); playerHPRef.current = MAX_HP;
    setTower([]); setIsDrillMode(false);
  };

  const handleUndo = () => {
    if (tower.length === 0) return;
    const newTower = [...tower];
    const removedCard = newTower.pop();
    setTower(newTower); setHand(prev => [...prev, removedCard]);
    if (newTower.length === 0) setActiveLogicGroup(null);
  };

  const triggerCrossExam = (roundIdx = currentRoundIndex) => {
    if (gameMode === 'logic_link' || roundIdx >= battlePlan.length) { triggerClosingPhase(); return; }
    const currentData = battlePlan[roundIdx];
    if (currentData && currentData.cx) {
      setGameState('cross_exam'); setRivalCard({ ...currentData.cx.question, type: 'answer', isQuestion: true });
      setHand(setupBattlePhase(currentData.cx.options));
    } else { triggerRebuttalPhase(roundIdx); }
  };

  const triggerRebuttalPhase = (roundIdx = currentRoundIndex) => {
    const currentData = battlePlan[roundIdx];
    setGameState('rebuttal_intro'); setRivalCard(null); setHand([]);
    setTimeout(() => {
      if (playerHPRef.current <= 0) return; 
      setGameState('rebuttal_attack');
      if (currentData && currentData.reb) {
        setRivalCard({ ...currentData.reb, type: 'attack' });
        if(timerEnabled) takeDamage(DAMAGE_TICK, "Opponent Attack!");
        setTimeout(() => { 
            if (playerHPRef.current <= 0) return; 
            setGameState('rebuttal_defense'); setHand(setupBattlePhase(currentData.reb.options)); 
        }, 800);
      } else { nextRound(roundIdx); }
    }, 500);
  };

  const nextRound = (currentIdx) => {
      const nextIdx = currentIdx + 1;
      setCurrentRoundIndex(nextIdx);
      if (nextIdx < battlePlan.length) triggerCrossExam(nextIdx); else triggerClosingPhase();
  };

  const triggerClosingPhase = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
    setGameState('closing'); setRivalCard(null);
    const closingOptions = currentTopic.closing?.[userStance];
    if(closingOptions) setHand(setupBattlePhase(closingOptions));
    else setTimeout(() => {
        if (playerHPRef.current <= 0) return;
        setGameState('result');
    }, 1500);
  };

  const launchImageMatch = (card, baseState) => {
      setPendingCard(card);
      const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
      const allFakes = getAllFakeImages(currentTopic);
      const randomFakes = allFakes.filter(url => url !== card.image_url).sort(() => Math.random() - 0.5).slice(0, 3);
      const grid = [...randomFakes];
      if (card.image_url) grid.push(card.image_url);
      
      const fallbacks = ["/images/fake_1.webp", "/images/fake_2.webp", "/images/fake_3.webp", "/images/fake_4.webp"];
      let f_idx = 0;
      while(grid.length < 4) {
          if (!grid.includes(fallbacks[f_idx])) grid.push(fallbacks[f_idx]);
          f_idx++;
      }

      setImageHand(grid.sort(() => Math.random() - 0.5));
      setGameState(baseState + '_image');
      startTimeRef.current = Date.now(); setTimeProgress(0);
  };

  const finalizeCardSuccess = (card, baseState) => {
      const newTower = [...tower, { ...card, judgment: 'perfect' }];
      setTower(newTower);
      setHand(gameState.startsWith('construct') ? hand.filter(c => c.id !== card.id) : []);
      setShowSuccessOverlay(true); setTimeout(() => setShowSuccessOverlay(false), 800); 
      if (baseState === 'closing') { playSound('clear'); } else { playSound('correct'); }

      if (baseState === 'construct') {
          const expectedFlow = FLOWS[gameMode] || FLOWS.area;
          if (newTower.length >= expectedFlow.length) {
              setFeedback({ msg: "PERFECT COMPLETE!", type: 'success', judgment: 'perfect' }); setTimeout(() => setFeedback(null), 800);
              triggerExplosion(30, 'bg-blue-400'); 
              setTimeout(() => {
                  if (playerHPRef.current <= 0) return; 
                  triggerCrossExam(currentRoundIndex);
              }, 800);
          } else { setGameState('construct'); }
      } else if (baseState === 'cross_exam' || baseState === 'rebuttal_defense') {
          setFeedback({ msg: "NICE COUNTER!", type: 'success', judgment: 'perfect' }); setTimeout(() => setFeedback(null), 800);
          setTimeout(() => {
              if (playerHPRef.current <= 0) return; 
              baseState === 'cross_exam' ? triggerRebuttalPhase(currentRoundIndex) : nextRound(currentRoundIndex);
          }, 800);
      } else if (baseState === 'closing') {
          if (playerHPRef.current === MAX_HP && mistakes.length === 0) {
              const diffMulti = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
              const perfectBns = 1500 * diffMulti;
              setScore(prev => prev + perfectBns);
              setScoreDetails(prev => ({ ...prev, perfect: perfectBns }));
              setFeedback({ msg: "PERFECT CLEAR BONUS!!", type: 'success', judgment: 'perfect' });
          } else {
              setFeedback({ msg: "DEBATE FINISHED!", type: 'success', judgment: 'perfect' });
          }
          setTimeout(() => setFeedback(null), 1500);
          setTimeout(() => {
              if (playerHPRef.current <= 0) return; 
              setGameState('result');
          }, 1500);
      }
  };

  const handleCardSelect = (card) => {
    startTimeRef.current = Date.now(); setTimeProgress(0);
    const baseState = gameState.replace('_image', '');

    if (baseState === 'construct') {
      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
      const expectedType = expectedFlow[tower.length];
      const cardType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;
      if (cardType !== expectedType) { takeDamage(DAMAGE_BIG, "Wrong Structure!", card.id); return; }
      if (tower.length === 0) {
        if (card.group === 'fake') { 
            takeDamage(DAMAGE_SMALL, "Weak Argument!", card.id); 
            if (!mistakes.find(m => m.id === card.id)) setMistakes(prev => [...prev, { ...card, reasonStr: "論点が不明確、または感情的で根拠に欠ける意見です。" }]);
            return; 
        } else { setActiveLogicGroup(card.group); }
      } else {
        if (card.group !== activeLogicGroup) { 
            takeDamage(DAMAGE_SMALL, "Logic Mismatch!", card.id); 
            if (!mistakes.find(m => m.id === card.id)) setMistakes(prev => [...prev, { ...card, reasonStr: "直前に選んだカードと論点(話題)がズレています。" }]);
            return; 
        } 
      }
      addScore(100); damageOpponent(25); 
      if (imageMatchEnabled && card.image_url) launchImageMatch(card, baseState); else finalizeCardSuccess(card, baseState);
    } else { 
        if (card.judgment === 'weak') { 
            takeDamage(DAMAGE_SMALL, "Weak Argument!", card.id); setHand([]);
            setTower([...tower, { ...card, judgment: 'weak' }]);
            
            if (!mistakes.find(m => m.id === card.id)) {
                setMistakes(prev => [...prev, { ...card, reasonStr: "相手の主張を論理的に覆すための反論として不十分です。" }]);
            }
            setTimeout(() => {
                if (playerHPRef.current <= 0) return; 
                if (baseState === 'cross_exam') triggerRebuttalPhase(currentRoundIndex);
                else if (baseState === 'rebuttal_defense') nextRound(currentRoundIndex);
                else if (baseState === 'closing') setGameState('result');
            }, 1500);
        } else { 
            addScore(150); damageOpponent(20); 
            if (imageMatchEnabled && card.image_url && baseState !== 'closing') {
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
          addScore(50); 
          finalizeCardSuccess(pendingCard, gameState.replace('_image', ''));
      } else { takeDamage(DAMAGE_SMALL, "Wrong Image!", url); }
  };

  const getVisibleHand = () => {
    if (gameState.endsWith('_image')) return [];
    if (gameState !== 'construct') return hand; 
    const expectedFlow = FLOWS[gameMode] || FLOWS.area;
    if (tower.length >= expectedFlow.length) return hand;
    return hand.filter(card => (card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type) === expectedFlow[tower.length]);
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const isTopicSelected = selectedTopicId !== null;
  const isStanceSelected = userStance !== null;
  const isDifficultySelected = difficulty !== null;
  const canStart = isTopicSelected && isStanceSelected && isDifficultySelected;
  const visibleHand = getVisibleHand();

  return {
    topics, selectedTopicId, setSelectedTopicId, userStance, setUserStance, difficulty, setDifficulty,
    timerEnabled, setTimerEnabled, imageMatchEnabled, setImageMatchEnabled, battleRounds, setBattleRounds,
    gameMode, setGameMode, langMode, setLangMode, fontSize, setFontSize, setupStep, setSetupStep,
    showRules, setShowRules, playerHP, opponentHP, gameState, setGameState, tower, hand, score, feedback,
    showJapanese, setShowJapanese, isDrillMode, setIsDrillMode, rivalCard, particles, activeLogicGroup,
    pendingCard, imageHand, sidePanelPos, setSidePanelPos, sidePanelWidth, timeProgress, shake,
    showSuccessOverlay, shakingCardId, currentRoundIndex, isResizing, scrollRef, currentTopic, canStart, visibleHand,
    isTopicSelected, isStanceSelected, isDifficultySelected, mistakes,
    bgmTrack, setBgmTrack, bgmEnabled, setBgmEnabled, ttsVoiceType, setTtsVoiceType, sfxEnabled, setSfxEnabled,
    combo, maxCombo, floatingTexts, scoreDetails,
    playerName, setPlayerName, playerLocation, setPlayerLocation, leaderboard, fetchLeaderboard, // 🌍
    initGame, goHome, handleUndo, handleCardSelect, handleImageSelect
  };
};