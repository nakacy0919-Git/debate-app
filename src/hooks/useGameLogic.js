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

const getRandomFakeUrl = () => {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    return `/images/fake_${randomNum}.webp`;
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
  const [imageSize, setImageSize] = useState('normal'); 

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

  const [playerName, setPlayerName] = useState('');
  const [playerLocation, setPlayerLocation] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now()); 
  const isResizing = useRef(false);
  const scrollRef = useRef(null);
  const playerHPRef = useRef(MAX_HP);

  useEffect(() => { setTopics(getAllTopics()); }, []);

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

  const triggerExplosion = (count, colorClass, cardId = null) => {
      const newParticles = Array.from({ length: count }).map((_, i) => ({
          id: Date.now() + i,
          x: cardId ? 50 : Math.random() * 100,
          y: cardId ? 50 : Math.random() * 100,
          tx: (Math.random() - 0.5) * 200,
          ty: (Math.random() - 0.5) * 200,
          scale: Math.random() * 1.5 + 0.5,
          color: colorClass
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);
  };

  const takeDamage = (amount, reasonStr, cardId = null) => {
      playSound('damage');
      setShake(true); setTimeout(() => setShake(false), 300);
      setCombo(0); 
      if (cardId) { setShakingCardId(cardId); setTimeout(() => setShakingCardId(null), 500); }
      triggerExplosion(20, 'bg-red-500', cardId);
      setFeedback({ msg: reasonStr, type: 'damage' });
      setTimeout(() => setFeedback(null), 800);
      
      setPlayerHP(prev => {
          const newHP = Math.max(0, prev - amount);
          playerHPRef.current = newHP;
          if (newHP <= 0) setGameState('gameover');
          return newHP;
      });
  };

  const damageOpponent = (amount) => {
      setOpponentHP(prev => Math.max(0, prev - amount));
      triggerExplosion(15, 'bg-orange-400');
  };

  const addScore = (basePoints) => {
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
      const timeBonusObj = Math.max(0, Math.floor((TIME_LIMIT_SEC - timeElapsed) * 10));
      
      const diffMultiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));

      const currentComboBonus = newCombo > 1 ? newCombo * 10 * diffMultiplier : 0;
      const totalAdd = Math.floor((basePoints + timeBonusObj + currentComboBonus) * diffMultiplier);

      setScore(prev => prev + totalAdd);
      setScoreDetails(prev => ({
          ...prev,
          base: prev.base + Math.floor(basePoints * diffMultiplier),
          timeBonus: prev.timeBonus + Math.floor(timeBonusObj * diffMultiplier),
          comboBonus: prev.comboBonus + Math.floor(currentComboBonus)
      }));

      const comboStr = newCombo >= 2 ? `${newCombo} COMBO!` : null;
      const newText = { id: Date.now(), text: `+${totalAdd}`, x: 50 + (Math.random()*20-10), y: 40 + (Math.random()*20-10), comboStr };
      setFloatingTexts(prev => [...prev, newText]);
      setTimeout(() => { setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)); }, 1200);
  };

  useEffect(() => {
      if (!timerEnabled || gameState === 'start' || gameState === 'gameover' || gameState === 'result' || gameState === 'review') {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return;
      }

      timerIntervalRef.current = setInterval(() => {
          if (playerHPRef.current <= 0) {
              clearInterval(timerIntervalRef.current);
              return;
          }
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const progress = (elapsed / TIME_LIMIT_SEC) * 100;
          setTimeProgress(progress);
          
          if (progress >= 100) {
              takeDamage(DAMAGE_TICK, "Time is running out!");
              startTimeRef.current = Date.now();
              setTimeProgress(0);
          }
      }, 100);

      return () => clearInterval(timerIntervalRef.current);
  }, [gameState, timerEnabled]);

  const localizeCard = (card, diff) => {
      if (!card) return card;
      return {
          ...card,
          textJP: typeof card.textJP === 'object' && diff ? card.textJP[diff] : card.textJP
      };
  };

  const setupBattlePhase = (options) => {
    if (!options || options.length === 0) return [];
    const corrects = options.filter(o => o.judgment === 'correct' || o.judgment === 'perfect');
    const weaks = options.filter(o => o.judgment === 'weak').map(o => ({
        ...o,
        image_url: getRandomFakeUrl() 
    }));
    
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
    const fakeCardsAll = myStanceCards.filter(c => c.group === 'fake').map(c => ({
        ...c,
        image_url: getRandomFakeUrl()
    }));
    
    const noiseCount = DIFFICULTIES[difficulty].fakeCount || 4;
    const noiseCards = fakeCardsAll.sort(() => Math.random() - 0.5).slice(0, Math.max(0, noiseCount));
    
    const finalHand = [...validCards, ...noiseCards].map(c => localizeCard(c, difficulty));
    setHand(finalHand.sort(() => Math.random() - 0.5));
    
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
      setGameState('cross_exam'); 
      setRivalCard(localizeCard({ ...currentData.cx.question, type: 'answer', isQuestion: true }, difficulty));
      const processedOptions = currentData.cx.options.map(o => localizeCard(o, difficulty));
      setHand(setupBattlePhase(processedOptions));
    } else { triggerRebuttalPhase(roundIdx); }
  };

  const triggerRebuttalPhase = (roundIdx = currentRoundIndex) => {
    const currentData = battlePlan[roundIdx];
    setGameState('rebuttal_intro'); setRivalCard(null); setHand([]);
    setTimeout(() => {
      if (playerHPRef.current <= 0) return; 
      setGameState('rebuttal_attack');
      if (currentData && currentData.reb) {
        setRivalCard(localizeCard({ ...currentData.reb, type: 'attack' }, difficulty));
        if(timerEnabled) takeDamage(DAMAGE_TICK, "Opponent Attack!");
        setTimeout(() => { 
            if (playerHPRef.current <= 0) return; 
            setGameState('rebuttal_defense'); 
            const processedOptions = currentData.reb.options.map(o => localizeCard(o, difficulty));
            setHand(setupBattlePhase(processedOptions)); 
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
    if(closingOptions) {
        const processedOptions = closingOptions.map(o => localizeCard(o, difficulty));
        setHand(setupBattlePhase(processedOptions));
    }
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
          
          // 💡 激突と粉砕のド派手な演出を追加！
          setShake(true); setTimeout(() => setShake(false), 400); // 画面を揺らす
          triggerExplosion(40, 'bg-blue-400'); // 大爆発
          playSound('damage'); // 激突音としてダメージ音を鳴らす

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
    
    const expectedType = expectedFlow[tower.length];
    return hand.filter(card => {
        const actualType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;
        return actualType === expectedType || card.group === 'fake';
    });
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
    gameMode, setGameMode, langMode, setLangMode, fontSize, setFontSize, 
    imageSize, setImageSize,
    setupStep, setSetupStep,
    showRules, setShowRules, playerHP, opponentHP, gameState, setGameState, tower, hand, score, feedback,
    showJapanese, setShowJapanese, isDrillMode, setIsDrillMode, rivalCard, particles, activeLogicGroup,
    pendingCard, imageHand, sidePanelPos, setSidePanelPos, sidePanelWidth, setSidePanelWidth, timeProgress, shake,
    showSuccessOverlay, shakingCardId, currentRoundIndex, isResizing, scrollRef, currentTopic, canStart, visibleHand,
    isTopicSelected, isStanceSelected, isDifficultySelected, mistakes,
    bgmTrack, setBgmTrack, bgmEnabled, setBgmEnabled, ttsVoiceType, setTtsVoiceType, sfxEnabled, setSfxEnabled,
    combo, maxCombo, floatingTexts, scoreDetails,
    playerName, setPlayerName, playerLocation, setPlayerLocation, leaderboard, fetchLeaderboard, 
    initGame, goHome, handleUndo, handleCardSelect, handleImageSelect
  };
};