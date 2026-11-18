import { useState, useEffect, useRef, useEffectEvent } from 'react';
import { getAllTopics } from '../utils/dataLoader';
import { MAX_HP, DAMAGE_BIG, DAMAGE_SMALL, DAMAGE_TICK, TIME_LIMIT_SEC, DIFFICULTIES, FLOWS } from '../constants';
import { calculateAward, readScores, saveLocalScore, scoreKey } from '../utils/gameSafety.js';

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
    const randomNum = Math.floor(Math.random() * 28) + 1;
    return `/images/fake_${randomNum}.webp`;
};

export const useGameLogic = (playSound) => {
  const [topics] = useState(getAllTopics);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [userStance, setUserStance] = useState(null); 
  const [difficulty, setDifficulty] = useState(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [imageMatchEnabled, setImageMatchEnabled] = useState(false);
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
  const [bgmEnabled, setBgmEnabled] = useState(false);
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
  const startTimeRef = useRef(0);
  const isResizing = useRef(false);
  const scrollRef = useRef(null);
  const playerHPRef = useRef(MAX_HP);


  // Remember animation delays so an iPad can safely suspend and resume a round.
  const pendingTimers = useRef(new Set());
  const armPendingTimer = (job) => {
    job.deadline = Date.now() + job.remaining;
    job.id = setTimeout(() => {
      job.id = null;
      if (pausedAtRef.current !== null) {
        job.remaining = 0;
        return;
      }
      pendingTimers.current.delete(job);
      job.callback();
    }, job.remaining);
  };
  const actionLocked = useRef(false);
  const savedSession = useRef(false);
  const awardedCards = useRef(new Set());
  const [storageNotice, setStorageNotice] = useState('');
  const [resultRecordId, setResultRecordId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const pausedAtRef = useRef(null);
  const pauseGame = () => {
    if (pausedAtRef.current !== null || ['start', 'review', 'gameover', 'result'].includes(gameState)) return;
    pausedAtRef.current = Date.now();
    for (const job of pendingTimers.current) {
      if (job.id !== null) {
        clearTimeout(job.id);
        job.remaining = Math.max(0, job.deadline - Date.now());
        job.id = null;
      }
    }
    setIsPaused(true);
  };
  const resumeGame = () => {
    if (pausedAtRef.current === null) return;
    startTimeRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
    for (const job of pendingTimers.current) {
      if (job.id === null) armPendingTimer(job);
    }
    setIsPaused(false);
  };
  const recordKey = scoreKey({ topic: selectedTopicId, difficulty, stance: userStance,
      mode: gameMode, rounds: battleRounds, timer: timerEnabled, images: imageMatchEnabled, language: langMode });

  const later = (callback, delay) => {
      const job = { callback, remaining: delay, deadline: 0, id: null };
      pendingTimers.current.add(job);
      if (pausedAtRef.current === null) armPendingTimer(job);
      return job;
  };
  const cancelPending = () => {
      pendingTimers.current.forEach(job => { if (job.id !== null) clearTimeout(job.id); });
      pendingTimers.current.clear();
      clearInterval(timerIntervalRef.current);
      actionLocked.current = false;
  };
  useEffect(() => () => {
      pendingTimers.current.forEach(job => { if (job.id !== null) clearTimeout(job.id); });
      clearInterval(timerIntervalRef.current);
  }, []);

  const fetchLeaderboard = () => {
      setLeaderboard(readScores(recordKey));
  };

  useEffect(() => {
      if (gameState !== 'result' || savedSession.current) return;
      savedSession.current = true;
      const recordId = crypto.randomUUID();
      const result = saveLocalScore(recordKey, { id: recordId,
          name: playerName.trim().slice(0, 15) || 'Anonymous',
          location: playerLocation.trim().slice(0, 20), score,
          date: new Date().toLocaleDateString('ja-JP') });
      setResultRecordId(recordId);
      setLeaderboard(result.records);
      setStorageNotice(result.saved ? '' : 'このブラウザでは記録を保存できません。今回の結果は画面で確認できます。');
  }, [gameState, recordKey, playerName, playerLocation, score]);

  useEffect(() => {
      const selectable = ['construct', 'cross_exam', 'rebuttal_defense', 'closing'].includes(gameState);
      const constructingDone = gameState === 'construct' && tower.length >= (FLOWS[gameMode] || FLOWS.area).length;
      if ((selectable && hand.length > 0 && !constructingDone) || (gameState.endsWith('_image') && pendingCard)) {
          actionLocked.current = false;
      }
  }, [gameState, hand, tower, gameMode, pendingCard]);

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
      later(() => setParticles([]), 800);
  };

  const takeDamage = (amount, reasonStr, cardId = null) => {
      playSound('damage');
      setShake(true); later(() => setShake(false), 300);
      setCombo(0); 
      if (cardId) { setShakingCardId(cardId); later(() => setShakingCardId(null), 500); }
      triggerExplosion(20, 'bg-red-500', cardId);
      setFeedback({ msg: reasonStr, type: 'damage' });
      later(() => setFeedback(null), 800);
      
      const newHP = Math.max(0, playerHPRef.current - amount);
      playerHPRef.current = newHP;
      setPlayerHP(newHP);
      if (newHP <= 0) { cancelPending(); setGameState('gameover'); }

  };

  const damageOpponent = (amount) => {
      setOpponentHP(prev => Math.max(0, prev - amount));
      triggerExplosion(15, 'bg-orange-400');
  };

  const addScore = (basePoints) => {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      const award = calculateAward({ basePoints, elapsed: (Date.now() - startTimeRef.current) / 1000,
          limit: TIME_LIMIT_SEC, difficulty, combo: newCombo, timerEnabled });
      const totalAdd = award.base + award.timeBonus + award.comboBonus;
      setScore(prev => prev + totalAdd);
      setScoreDetails(prev => ({ ...prev, base: prev.base + award.base,
          timeBonus: prev.timeBonus + award.timeBonus, comboBonus: prev.comboBonus + award.comboBonus }));

      const comboStr = newCombo >= 2 ? `${newCombo} COMBO!` : null;
      const newText = { id: Date.now(), text: `+${totalAdd}`, x: 50 + (Math.random()*20-10), y: 40 + (Math.random()*20-10), comboStr };
      setFloatingTexts(prev => [...prev, newText]);
      later(() => { setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)); }, 1200);
  };

  const onTimerDamage = useEffectEvent(() => takeDamage(DAMAGE_TICK, 'Time is running out!'));
  const pauseWhenHidden = useEffectEvent(() => { pauseGame(); });
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pauseWhenHidden();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
      if (!timerEnabled || isPaused || !['construct', 'cross_exam', 'rebuttal_defense', 'closing', 'construct_image', 'cross_exam_image', 'rebuttal_defense_image'].includes(gameState)) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return;
      }

      timerIntervalRef.current = setInterval(() => {
          if (actionLocked.current) return;
          if (playerHPRef.current <= 0) {
              clearInterval(timerIntervalRef.current);
              return;
          }
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const progress = (elapsed / TIME_LIMIT_SEC) * 100;
          setTimeProgress(progress);
          
          if (progress >= 100) {
              onTimerDamage();
              startTimeRef.current = Date.now();
              setTimeProgress(0);
          }
      }, 100);

      return () => clearInterval(timerIntervalRef.current);
  }, [gameState, timerEnabled, isPaused]);

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
    if (!canStart) return;
    cancelPending(); savedSession.current = false; awardedCards.current.clear();
    pausedAtRef.current = null; setIsPaused(false); setResultRecordId(null);
    setLeaderboard([]); setStorageNotice('');
    setPendingCard(null); setImageHand([]); setShowSuccessOverlay(false);
    setShake(false); setShakingCardId(null); setParticles([]); setFloatingTexts([]);
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
    cancelPending();
    pausedAtRef.current = null; setIsPaused(false);
    window.speechSynthesis?.cancel();
    setFeedback(null); setPendingCard(null); setImageHand([]);
    setShowSuccessOverlay(false); setShake(false); setShakingCardId(null);
    setParticles([]); setFloatingTexts([]); setShowRules(false);
    setGameState('start'); setSetupStep(1); setSelectedTopicId(null);
    setUserStance(null); setDifficulty(null); setPlayerHP(MAX_HP); playerHPRef.current = MAX_HP;
    setTower([]); setIsDrillMode(false);
  };

  // Return to the topic picker without forcing a fresh language and mode setup.
  const goToSetup = () => {
    cancelPending();
    pausedAtRef.current = null; setIsPaused(false);
    window.speechSynthesis?.cancel();
    setFeedback(null);
    setPendingCard(null);
    setImageHand([]);
    setShowSuccessOverlay(false);
    setShake(false);
    setShakingCardId(null);
    setParticles([]);
    setFloatingTexts([]);
    setShowRules(false);
    setTower([]);
    setSelectedTopicId(null);
    setActiveLogicGroup(null);
    setIsDrillMode(false);
    setSetupStep(3);
    setGameState('start');
  };

  const handleUndo = () => {
    if (pausedAtRef.current !== null || gameState !== 'construct' || actionLocked.current || tower.length === 0) return;
    const newTower = [...tower];
    const removedCard = newTower.pop();
    setTower(newTower); setHand(prev => [...prev, removedCard]);
    if (newTower.length === 0) setActiveLogicGroup(null);
  };

  const triggerCrossExam = (roundIdx = currentRoundIndex) => {
    // This clock read runs only in user actions or scheduled phase transitions.
    // eslint-disable-next-line react-hooks/purity
    actionLocked.current = false; startTimeRef.current = Date.now(); setTimeProgress(0);
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
    actionLocked.current = true;
    const currentData = battlePlan[roundIdx];
    setGameState('rebuttal_intro'); setRivalCard(null); setHand([]);
    later(() => {
      if (playerHPRef.current <= 0) return; 
      setGameState('rebuttal_attack');
      if (currentData && currentData.reb) {
        setRivalCard(localizeCard({ ...currentData.reb, type: 'attack' }, difficulty));

        later(() => {
            if (playerHPRef.current <= 0) return; 
            actionLocked.current = false; startTimeRef.current = Date.now(); setTimeProgress(0);
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
    actionLocked.current = false; startTimeRef.current = Date.now(); setTimeProgress(0);
    setGameState('closing'); setRivalCard(null); setHand([]);
    const closingOptions = currentTopic.closing?.[userStance];
    if(closingOptions?.length) {
        const processedOptions = closingOptions.map(o => localizeCard(o, difficulty));
        setHand(setupBattlePhase(processedOptions));
    }
    else later(() => {
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
      setShowSuccessOverlay(true); later(() => setShowSuccessOverlay(false), 800);
      if (baseState === 'closing') { playSound('clear'); } else { playSound('correct'); }

      if (baseState === 'construct') {
          const expectedFlow = FLOWS[gameMode] || FLOWS.area;
          if (newTower.length >= expectedFlow.length) {
              setFeedback({ msg: "PERFECT COMPLETE!", type: 'success', judgment: 'perfect' }); later(() => setFeedback(null), 800);
              triggerExplosion(30, 'bg-blue-400'); 
              later(() => {
                  if (playerHPRef.current <= 0) return; 
                  triggerCrossExam(currentRoundIndex);
              }, 800);
          } else { startTimeRef.current = Date.now(); setTimeProgress(0); setGameState('construct'); }
      } else if (baseState === 'cross_exam' || baseState === 'rebuttal_defense') {
          
          // 💡 激突と粉砕のド派手な演出を追加！
          setShake(true); later(() => setShake(false), 400); // 画面を揺らす
          triggerExplosion(40, 'bg-blue-400'); // 大爆発
          playSound('damage'); // 激突音としてダメージ音を鳴らす

          setFeedback({ msg: "NICE COUNTER!", type: 'success', judgment: 'perfect' }); later(() => setFeedback(null), 800);
          later(() => {
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
          later(() => setFeedback(null), 1500);
          later(() => {
              if (playerHPRef.current <= 0) return; 
              setGameState('result');
          }, 1500);
      }
  };

  const handleCardSelect = (card) => {
    if (pausedAtRef.current !== null || actionLocked.current || !['construct', 'cross_exam', 'rebuttal_defense', 'closing'].includes(gameState) || !hand.includes(card)) return;
    const baseState = gameState;
    // Lock immediately, including wrong selections. Otherwise rapid taps can
    // deduct HP multiple times before the damage animation finishes.
    actionLocked.current = true;
    const retryAfterMistake = () => {
      if (playerHPRef.current > 0) later(() => {
        if (playerHPRef.current > 0) actionLocked.current = false;
      }, 650);
    };

    if (baseState === 'construct') {
      if (tower.length >= (FLOWS[gameMode] || FLOWS.area).length) return;
      const expectedFlow = FLOWS[gameMode] || FLOWS.area;
      const expectedType = expectedFlow[tower.length];
      const cardType = card.type === 'mini_conclusion' ? 'mini_conclusion' : card.type;
      if (cardType !== expectedType) { takeDamage(DAMAGE_BIG, "Wrong Structure!", card.id); retryAfterMistake(); return; }
      if (tower.length === 0) {
        if (card.group === 'fake') { 
            takeDamage(DAMAGE_SMALL, "Weak Argument!", card.id); 
            if (!mistakes.find(m => m.id === card.id)) setMistakes(prev => [...prev, { ...card, reasonStr: "論点が不明確、または感情的で根拠に欠ける意見です。" }]);
            retryAfterMistake();
            return; 
        } else { setActiveLogicGroup(card.group); }
      } else {
        if (card.group !== activeLogicGroup) { 
            takeDamage(DAMAGE_SMALL, "Logic Mismatch!", card.id); 
            if (!mistakes.find(m => m.id === card.id)) setMistakes(prev => [...prev, { ...card, reasonStr: "直前に選んだカードと論点(話題)がズレています。" }]);
            retryAfterMistake();
            return; 
        } 
      }
      actionLocked.current = true;
      if (!awardedCards.current.has(card.id)) {
          addScore(100); damageOpponent(25); awardedCards.current.add(card.id);
      }
      if (imageMatchEnabled && card.image_url) launchImageMatch(card, baseState); else finalizeCardSuccess(card, baseState);
    } else { 
        actionLocked.current = true;
        if (card.judgment === 'weak') { 
            takeDamage(DAMAGE_SMALL, "Weak Argument!", card.id); setHand([]);

            
            if (!mistakes.find(m => m.id === card.id)) {
                setMistakes(prev => [...prev, { ...card, reasonStr: card.explanationJP || "相手の主張を論理的に覆すための反論として不十分です。" }]);
            }
            if (playerHPRef.current <= 0) return;
            later(() => {
                if (playerHPRef.current <= 0) return; 
                setHand(hand.filter(option => option !== card));
                startTimeRef.current = Date.now(); setTimeProgress(0);
            }, 1500);
        } else if (['correct', 'perfect'].includes(card.judgment)) {
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
      if (pausedAtRef.current !== null || actionLocked.current || !gameState.endsWith('_image') || !pendingCard || !imageHand.includes(url)) return;
      // A wrong image must also lock the input during its feedback animation.
      actionLocked.current = true;
      if (url === pendingCard.image_url) {
          const imageKey = `image:${pendingCard.id}`;
          if (!gameState.startsWith('construct') || !awardedCards.current.has(imageKey)) {
              addScore(50); awardedCards.current.add(imageKey);
          }
          finalizeCardSuccess(pendingCard, gameState.replace('_image', ''));
      } else {
          takeDamage(DAMAGE_SMALL, "Wrong Image!", url);
          if (playerHPRef.current > 0) later(() => {
              if (playerHPRef.current > 0) actionLocked.current = false;
          }, 650);
      }
  };

  const getVisibleHand = () => {
    if (gameState.endsWith('_image')) return [];
    if (gameState !== 'construct') return hand; 
    
    const expectedFlow = FLOWS[gameMode] || FLOWS.area;
    if (tower.length >= expectedFlow.length) return [];
    
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
  const canStart = topics.some(t => t.id === selectedTopicId) && (
    gameMode === 'review' || (
      ['affirmative', 'negative'].includes(userStance) &&
      Object.hasOwn(DIFFICULTIES, difficulty) &&
      ['area', 'logic_link'].includes(gameMode) &&
      Number.isInteger(battleRounds) && battleRounds >= 1 && battleRounds <= 6
    )
  );
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
    storageNotice, resultRecordId, isPaused, pauseGame, resumeGame,
    playerName, setPlayerName, playerLocation, setPlayerLocation, leaderboard, fetchLeaderboard,
    initGame, goHome, goToSetup, handleUndo, handleCardSelect, handleImageSelect
  };
};
