import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { Analytics } from "@vercel/analytics/react"
import { getFirestore, collection, getDocs, setDoc, doc, query, orderBy, limit } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-1JspPFG3g2dEvN7hUe2umLOeDvGAZDg",
  authDomain: "complaints-4479c.firebaseapp.com",
  projectId: "complaints-4479c",
  storageBucket: "complaints-4479c.firebasestorage.app",
  messagingSenderId: "935501313337",
  appId: "1:935501313337:web:35b8e54fe7e9dc0be024e8",
  measurementId: "G-3YMCQ7N7EJ"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LEVEL_DATA = [
  { id: 1, target: 1000, time: 20, speed: 1900, bossChance: 0.15, desc: "Sector 1: Easy learning curve." },
  { id: 2, target: 2000, time: 30, speed: 1800, bossChance: 0.18, desc: "Sector 2: Normal tempo pick up." },
  { id: 3, target: 3200, time: 40, speed: 1700, bossChance: 0.20, desc: "Sector 3: Heat waves intensifying." },
  { id: 4, target: 4500, time: 50, speed: 1600, bossChance: 0.22, desc: "Sector 4: Heavy thermal pressure." },
  { id: 5, target: 6000, time: 60, speed: 1500, bossChance: 0.25, desc: "Sector 5: Mid-game endurance test." },
  { id: 6, target: 7800, time: 70, speed: 1400, bossChance: 0.28, desc: "Sector 6: Harder tactical management." },
  { id: 7, target: 9800, time: 80, speed: 1300,  bossChance: 0.30, desc: "Sector 7: Extreme speed chaos." },
  { id: 8, target: 12000, time: 90, speed: 1200, bossChance: 0.32, desc: "Sector 8: Relentless core pressure." },
  { id: 9, target: 14500, time: 100, speed: 1100, bossChance: 0.35, desc: "Sector 9: Insane frenzy mode." },
  { id: 10, target: 18000, time: 115, speed: 1000, bossChance: 0.40, desc: "Sector 10: The ultimate thermal test." }
];

export default function VelocityGrid() {
  const gridRows = 6;
  const gridCols = 6;
  const MAX_COOLER_CAP = 100;
  const MAX_MELTED_LIVES = 10;
  
  // Game Routing States
  const [gameState, setGameState] = useState('menu'); // 'menu', 'tutorial', 'level_select', 'leaderboard', 'playing', 'gameover', 'level_complete'
  const [gameMode, setGameMode] = useState('endless');
  const [activeLevel, setActiveLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({}); 
  
  // Profile & Unique Device ID States
  const [username, setUsername] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [pendingAction, setPendingAction] = useState(null); 
  const [shareStatus, setShareStatus] = useState('');
  
  const [playerId] = useState(() => {
    let id = localStorage.getItem('velocity_player_id');
    if (!id) {
      id = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('velocity_player_id', id);
    }
    return id;
  });
  
  // Live Cloud Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  // Gameplay States
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [gameOverReason, setGameOverReason] = useState(''); 
  const [earnedStars, setEarnedStars] = useState(0);
  
  // Unlimited Ammo
  const [currentCooler, setCurrentCooler] = useState(() => Math.floor(Math.random() * 35) + 15);
  const [nextCooler, setNextCooler] = useState(() => Math.floor(Math.random() * 35) + 15);
  const [boardCells, setBoardCells] = useState({});

  const audioCtxRef = useRef(null);
  const scoreRef = useRef(score);

  useEffect(() => { scoreRef.current = score; }, [score]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playSound = (type) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'match') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {}
  };

  // Load local session data & fetch global leaderboard on mount
  useEffect(() => {
    const savedEndless = localStorage.getItem('velocity_tactical_highscore');
    if (savedEndless) setHighScore(parseInt(savedEndless, 10));
    
    const savedLevels = localStorage.getItem('velocity_levels_progress');
    if (savedLevels) setLevelProgress(JSON.parse(savedLevels));

    const savedName = localStorage.getItem('velocity_username');
    if (savedName) setUsername(savedName);

    fetchGlobalLeaderboard();
  }, []);

  // Function to pull top 50 records from Firebase Firestore[cite: 1]
  const fetchGlobalLeaderboard = async () => {
    try {
      const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const players = [];
      querySnapshot.forEach((doc) => {
        players.push(doc.data());
      });
      setLeaderboardData(players);
    } catch (error) {
      console.error("Error fetching leaderboard: ", error);
    }
  };

  // Function to push or update player high score using persistent unique playerId[cite: 1]
  const submitScoreToCloud = async (finalScore, currentUsername) => {
    if (!currentUsername || finalScore <= 0) return;
    try {
      const userDocRef = doc(db, "leaderboard", playerId);
      await setDoc(userDocRef, {
        id: playerId,
        name: currentUsername,
        score: finalScore,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      fetchGlobalLeaderboard();
    } catch (error) {
      console.error("Error saving score to cloud: ", error);
    }
  };

  // Share score helper - works on Vercel, localhost and inside Itch.io iframe
  const handleShareScore = async (customScore = score) => {
    playSound('click');

    // Share the published Itch.io game.
    const gameUrl = "https://unusual-unique.itch.io/velocity-grid";
    const shareText = `🔥 Can you beat my score of ${customScore.toLocaleString()} in Velocity Grid? Play now and test your thermal defense reflexes! 🚀`;
    const fullShareText = `${shareText}

Play here: ${gameUrl}`;

    const showShareStatus = (message) => {
      setShareStatus(message);
      setTimeout(() => setShareStatus(''), 2500);
    };

    // 1. Native Web Share (best on supported mobile browsers).
    // If Itch.io blocks it inside the iframe, continue to the fallbacks.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Velocity Grid',
          text: shareText,
          url: gameUrl
        });
        showShareStatus('shared');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    // 2. Modern Clipboard API.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullShareText);
        showShareStatus('copied');
        return;
      }
    } catch (error) {
      // Itch.io iframe permissions may reject clipboard access.
    }

    // 3. Legacy copy fallback for embedded iframes.
    try {
      const textArea = document.createElement('textarea');
      textArea.value = fullShareText;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (copied) {
        showShareStatus('copied');
        return;
      }
    } catch (error) {
      // Continue to the manual fallback.
    }

    // 4. Last-resort manual copy dialog so the button never silently fails.
    try {
      window.prompt('Copy your Velocity Grid score message:', fullShareText);
      showShareStatus('manual');
    } catch (error) {
      showShareStatus('failed');
    }
  };

  // Menu Handlers
  const handleEndlessClick = () => {
    playSound('click');
    if (!username) {
      setPendingAction('endless');
      setTempUsername('');
      setShowProfileModal(true);
    } else {
      setGameMode('endless');
      setGameState('tutorial');
    }
  };

  const openProfileEditor = () => {
    playSound('click');
    setTempUsername(username);
    setPendingAction(null);
    setShowProfileModal(true);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    const trimmed = tempUsername.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem('velocity_username', trimmed);
      setShowProfileModal(false);
      playSound('click');
      
      if (highScore > 0) {
        submitScoreToCloud(highScore, trimmed);
      }

      if (pendingAction === 'endless') {
        setGameMode('endless');
        setGameState('tutorial');
      }
      setPendingAction(null);
    }
  };

  const cancelProfile = () => {
    playSound('click');
    setShowProfileModal(false);
    setPendingAction(null);
  };

  // LEVEL MODE: Timer Logic
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'level') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOverReason('timeout');
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // LEVEL MODE: Win Check Logic
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'level') {
      const currentLevelData = LEVEL_DATA.find(l => l.id === activeLevel);
      if (score >= currentLevelData.target) {
        playSound('win');
        const meltedCount = Object.values(boardCells).filter(c => c.type === 'melted').length;
        
        let stars = 1;
        if (meltedCount === 0) stars = 3;
        else if (meltedCount === 1) stars = 2;

        setEarnedStars(stars);
        setGameState('level_complete');

        setLevelProgress(prev => {
          const updated = { ...prev };
          if ((updated[activeLevel] || 0) < stars) {
            updated[activeLevel] = stars;
            localStorage.setItem('velocity_levels_progress', JSON.stringify(updated));
          }
          return updated;
        });
      }
    }
  }, [score, gameState, gameMode, activeLevel, boardCells]);

 // SPAWNER LOGIC (Completely decoupled using persistent ref loop)
  const spawnerTimerRef = useRef(null);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (spawnerTimerRef.current) clearTimeout(spawnerTimerRef.current);
      return;
    }

    const runSpawner = () => {
      const randomRow = Math.floor(Math.random() * gridRows);
      const randomCol = Math.floor(Math.random() * gridCols);
      const cellKey = `${randomRow}-${randomCol}`;

      const currentLevelData = gameMode === 'level' ? LEVEL_DATA.find(l => l.id === activeLevel) : null;
      const bossChance = gameMode === 'level' ? currentLevelData.bossChance : 0.2;
      const isBossHeat = Math.random() < bossChance;
      
      const incomingHeatVal = isBossHeat ? Math.floor(Math.random() * 50) + 180 : Math.floor(Math.random() * 40) + 20;

      setBoardCells((currentBoard) => {
        const cell = currentBoard[cellKey];
        if (cell?.type === 'melted') return currentBoard;

        if (cell?.type === 'heat') {
          return { ...currentBoard, [cellKey]: { ...cell, heatValue: cell.heatValue + incomingHeatVal, timeLeft: 5 }};
        }

        if (cell?.type === 'cooler') {
          playSound('match');
          if (cell.capacity >= incomingHeatVal) {
            const neutralizedAmount = incomingHeatVal;
            setScore(s => {
              const ns = s + neutralizedAmount * 2;
              if (gameMode === 'endless' && ns > highScore) {
                setHighScore(ns);
                localStorage.setItem('velocity_tactical_highscore', ns);
                if (username) {
                  submitScoreToCloud(ns, username);
                }
              }
              return ns;
            });
            const remainingCoolerCap = cell.capacity - incomingHeatVal;
            if (remainingCoolerCap <= 0) {
              const copy = { ...currentBoard };
              delete copy[cellKey];
              return copy;
            }
            return { ...currentBoard, [cellKey]: { type: 'cooler', capacity: remainingCoolerCap } };
          } else {
            const neutralizedAmount = cell.capacity;
            setScore(s => {
              const ns = s + neutralizedAmount * 2;
              if (gameMode === 'endless' && ns > highScore) {
                setHighScore(ns);
                localStorage.setItem('velocity_tactical_highscore', ns);
                if (username) {
                  submitScoreToCloud(ns, username);
                }
              }
              return ns;
            });
            const remainingHeatVal = incomingHeatVal - cell.capacity;
            return { ...currentBoard, [cellKey]: { type: 'heat', heatValue: remainingHeatVal, timeLeft: 5 } };
          }
        }
        return { ...currentBoard, [cellKey]: { type: 'heat', heatValue: incomingHeatVal, timeLeft: 5 } };
      });

      // Calculate next speed dynamically based on live ref score
      let nextSpeed;
      if (gameMode === 'level') {
        nextSpeed = currentLevelData.speed;
      } else {
        const liveScore = scoreRef.current;
        nextSpeed = Math.max(300, 2800 - Math.floor(liveScore / 200) * 100);
      }

      // Schedule the next execution recursively via ref tracker
      spawnerTimerRef.current = setTimeout(runSpawner, nextSpeed);
    };

    const initialDelay = gameMode === 'level' ? LEVEL_DATA.find(l => l.id === activeLevel).speed : 2800;
    spawnerTimerRef.current = setTimeout(runSpawner, initialDelay);

    return () => {
      if (spawnerTimerRef.current) clearTimeout(spawnerTimerRef.current);
    };
  }, [gameState, gameMode, activeLevel]); 

  // 5-Second Explosion Timer Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const explosionTimer = setInterval(() => {
      setBoardCells((currentBoard) => {
        let updatedBoard = { ...currentBoard };
        Object.keys(updatedBoard).forEach((cellKey) => {
          const cell = updatedBoard[cellKey];
          if (cell?.type === 'heat') {
            if (cell.timeLeft > 1) {
              updatedBoard[cellKey] = { ...cell, timeLeft: cell.timeLeft - 1 };
            } else {
              playSound('explode');
              updatedBoard[cellKey] = { type: 'melted' };
            }
          }
        });

        const meltedCount = Object.values(updatedBoard).filter(c => c.type === 'melted').length;
        if (meltedCount >= MAX_MELTED_LIVES) {
          setGameOverReason('meltdown');
          setGameState('gameover');
        }
        return updatedBoard;
      });
    }, 1000);

    return () => clearInterval(explosionTimer);
  }, [gameState]);

  // Cell Interaction
  const handleCellClick = (row, col) => {
    if (gameState !== 'playing') return;
    const cellKey = `${row}-${col}`;
    const cell = boardCells[cellKey];
    if (cell?.type === 'melted') return;

    initAudio();
    playSound('click');

    const activeCoolerCap = currentCooler;
    setCurrentCooler(nextCooler);
    setNextCooler(Math.floor(Math.random() * 35) + 15);

    setBoardCells((currentBoard) => {
      const targetCell = currentBoard[cellKey];

      if (targetCell?.type === 'heat') {
        playSound('match');
        if (activeCoolerCap >= targetCell.heatValue) {
          const neutralizedAmount = targetCell.heatValue;
          const leftoverCooler = Math.min(MAX_COOLER_CAP, activeCoolerCap - targetCell.heatValue);
          setScore(s => {
            const ns = s + neutralizedAmount * 2;
            if (gameMode === 'endless' && ns > highScore) {
              setHighScore(ns);
              localStorage.setItem('velocity_tactical_highscore', ns);
              if (username) {
                submitScoreToCloud(ns, username);
              }
            }
            return ns;
          });

          if (leftoverCooler <= 0) {
            const copy = { ...currentBoard };
            delete copy[cellKey];
            return copy;
          }
          return { ...currentBoard, [cellKey]: { type: 'cooler', capacity: leftoverCooler } };
        } else {
          const neutralizedAmount = activeCoolerCap;
          setScore(s => {
            const ns = s + neutralizedAmount * 2;
            if (gameMode === 'endless' && ns > highScore) {
              setHighScore(ns);
              localStorage.setItem('velocity_tactical_highscore', ns);
              if (username) {
                submitScoreToCloud(ns, username);
              }
            }
            return ns;
          });
          playSound('explode');
          return { ...currentBoard, [cellKey]: { ...targetCell, heatValue: targetCell.heatValue - activeCoolerCap, timeLeft: 5 } };
        }
      } else if (targetCell?.type === 'cooler') {
        const newStackedCap = Math.min(MAX_COOLER_CAP, targetCell.capacity + activeCoolerCap);
        return { ...currentBoard, [cellKey]: { type: 'cooler', capacity: newStackedCap } };
      } else {
        return { ...currentBoard, [cellKey]: { type: 'cooler', capacity: Math.min(MAX_COOLER_CAP, activeCoolerCap) } };
      }
    });
  };

  const startEndless = () => {
    playSound('click');
    setScore(0);
    setBoardCells({});
    setGameState('playing');
  };

  const startLevel = (lvlId) => {
    playSound('click');
    setActiveLevel(lvlId);
    setScore(0);
    setBoardCells({});
    setTimeLeft(LEVEL_DATA.find(l => l.id === lvlId).time);
    setGameState('playing');
  };

  const returnToMenu = () => {
    playSound('click');
    fetchGlobalLeaderboard(); 
    setGameState('menu');
  };

  // ------------------ RENDERERS ------------------ //

  const meltedBlocksCount = Object.values(boardCells).filter(cell => cell.type === 'melted').length;
  const blocksRemaining = Math.max(0, MAX_MELTED_LIVES - meltedBlocksCount);

  if (gameState === 'menu') {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 relative">
        
        {/* Profile Component */}
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-lg">
          <span className="text-slate-400">👤</span>
          <span className="text-sm font-bold text-slate-300">{username ? username : 'Profile'}</span>
          <button onClick={openProfileEditor} className="text-cyan-500 hover:text-cyan-300 ml-2 transition-colors">✎</button>
        </div>

        <h1 className="text-5xl font-black tracking-widest text-cyan-400 mb-2 text-center drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">VELOCITY GRID</h1>
        <p className="text-slate-400 mb-12 uppercase tracking-widest text-sm">Thermal Defense Protocol</p>
        
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <button onClick={() => { playSound('click'); setGameMode('level'); setGameState('tutorial'); }} className="p-4 bg-slate-900 border border-cyan-500/50 hover:bg-cyan-950/50 rounded-xl transition-all font-bold text-xl text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            CAMPAIGN LEVELS
          </button>
          
          <button onClick={handleEndlessClick} className="p-4 bg-slate-900 border border-purple-500/50 hover:bg-purple-950/50 rounded-xl transition-all font-bold text-xl text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            ENDLESS SURVIVAL
          </button>

          <button onClick={() => { playSound('click'); fetchGlobalLeaderboard(); setGameState('leaderboard'); }} className="p-3 bg-slate-950 border border-yellow-500/30 hover:bg-yellow-900/30 rounded-xl transition-all font-bold text-sm text-yellow-500 flex items-center justify-center gap-2 mt-2">
            🏆 TOP 50 LEADERBOARD
          </button>
        </div>

        {/* PROFILE MODAL */}
        {showProfileModal && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl font-black text-white mb-2">{pendingAction === 'endless' ? 'USERNAME REQUIRED' : 'SET PROFILE'}</h2>
              <p className="text-slate-400 text-xs mb-6">
                {pendingAction === 'endless' ? 'You must establish an identity before entering Endless Survival mode.' : 'Enter your operative callsign.'}
              </p>
              
              <form onSubmit={saveProfile} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Enter Username" 
                  maxLength={15}
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500 text-center font-bold"
                />
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={cancelProfile} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                    CANCEL
                  </button>
                  <button type="submit" disabled={!tempUsername.trim()} className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-950 disabled:text-cyan-800 text-slate-950 font-bold rounded-xl transition-all">
                    {pendingAction === 'endless' ? 'SAVE & PLAY' : 'SAVE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center p-6 text-white overflow-hidden relative">
        <div className="w-full max-w-2xl flex justify-between items-center mb-4">
          <button onClick={returnToMenu} className="text-cyan-500 font-bold hover:text-cyan-300">← BACK TO MENU</button>
          
          <button 
            onClick={() => handleShareScore(highScore)} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            {shareStatus === 'shared' ? '✅ SHARED!' : shareStatus === 'copied' ? '✅ COPIED!' : shareStatus === 'manual' ? '📋 COPY THE MESSAGE ABOVE' : '📤 SHARE BEST SCORE'}
          </button>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black tracking-widest text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">GLOBAL TOP 50</h2>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Endless Survival Ranks</p>
        </div>

        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xl">
          <div className="flex bg-slate-950 p-4 border-b border-slate-800 font-bold text-slate-500 text-xs tracking-wider uppercase">
            <div className="w-16 text-center">Rank</div>
            <div className="flex-1">Operative</div>
            <div className="w-32 text-right">Score</div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {leaderboardData.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Loading global records from cloud...</div>
            ) : (
              leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const isPlayer = entry.id === playerId;
                let rowStyle = "text-slate-400 bg-slate-950/50";
                let nameStyle = "font-medium";
                let icon = "";

                if (rank === 1) {
                  rowStyle = "bg-yellow-950/40 border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]";
                  nameStyle = "text-yellow-400 font-black text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]";
                  icon = "👑";
                } else if (rank === 2) {
                  rowStyle = "bg-slate-800/60 border border-slate-300/50";
                  nameStyle = "text-slate-300 font-black text-lg";
                  icon = "🥈";
                } else if (rank === 3) {
                  rowStyle = "bg-amber-950/40 border border-amber-600/50";
                  nameStyle = "text-amber-600 font-black text-lg";
                  icon = "🥉";
                } else if (rank <= 10) {
                  rowStyle = "bg-cyan-950/30";
                  nameStyle = "text-cyan-400 font-bold";
                }

                if (isPlayer) {
                  rowStyle += " outline outline-2 outline-purple-500 animate-pulse";
                }

                return (
                  <div key={index} className={`flex items-center p-3 rounded-lg transition-all ${rowStyle}`}>
                    <div className={`w-16 text-center font-mono ${rank <= 3 ? 'font-black text-lg' : 'text-sm'}`}>
                      #{rank}
                    </div>
                    <div className={`flex-1 flex items-center gap-2 ${nameStyle}`}>
                      <span>{entry.name}</span>
                      <span>{icon}</span>
                      {isPlayer && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full tracking-widest uppercase ml-2">YOU</span>}
                    </div>
                    <div className={`w-32 text-right font-mono font-bold ${rank <= 3 ? 'text-lg' : ''}`}>
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'tutorial') {
    const isEndless = gameMode === 'endless';
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-lg opacity-50 pointer-events-none">
          <span className="text-slate-400">👤</span>
          <span className="text-sm font-bold text-slate-300">{username ? username : 'Profile'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-left relative">
          <button onClick={returnToMenu} className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-xs">✖</button>
          <h2 className="text-2xl font-black text-cyan-400 tracking-wider mb-4 text-center">
            {isEndless ? 'ENDLESS PROTOCOL' : 'CAMPAIGN MISSION'}
          </h2>
          
          <ul className="space-y-4 text-xs text-slate-300 mb-8">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">1.</span> 
              <span><strong>Infinite Ammo:</strong> You have unlimited random coolers. Every click instantly readies a new one.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">2.</span> 
              <span><strong>Stacking:</strong> Tap a grid with an existing cooler to stack values (Max 100° per cell).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">3.</span> 
              <span><strong>5s Panic Reset:</strong> Heat waves explode after 5s. Dropping a cooler directly on a heat wave resets its timer back to 5s!</span>
            </li>
            
            {isEndless ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">4.</span> 
                  <span><strong>Escalation:</strong> Heat waves will spawn faster and hotter as your score rises.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">5.</span> 
                  <span><strong>Game Over:</strong> If 10 blocks melt completely, the grid is destroyed. Survive as long as you can!</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">4.</span> 
                  <span><strong>Objectives:</strong> Hit the Target Score before the countdown timer runs out!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">5.</span> 
                  <span><strong>Star Rating:</strong> 0 Melts = ⭐⭐⭐ | 1 Melt = ⭐⭐ | 2+ Melts = ⭐ (10 Melts = Mission Failed).</span>
                </li>
              </>
            )}
            
            <li className="flex items-start gap-2 pt-3 border-t border-slate-800">
              <span className="text-yellow-400 font-black">🔥</span> <span className="text-yellow-400 font-bold tracking-wide">Fast clicker always wins!!!</span>
            </li>
          </ul>

          <button
            onClick={() => { playSound('click'); isEndless ? startEndless() : setGameState('level_select'); }}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] text-sm tracking-wider"
          >
            {isEndless ? 'BEGIN SURVIVAL 🚀' : 'CHOOSE SECTOR 🚀'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'level_select') {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center p-8 text-white overflow-y-auto relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-lg opacity-50 pointer-events-none">
          <span className="text-slate-400">👤</span>
          <span className="text-sm font-bold text-slate-300">{username ? username : 'Profile'}</span>
        </div>

        <button onClick={returnToMenu} className="self-start text-cyan-500 font-bold mb-8 hover:text-cyan-300">← BACK TO MENU</button>
        <h2 className="text-3xl font-black text-cyan-400 mb-8 tracking-wider">SELECT STAGE</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
          {LEVEL_DATA.map((lvl) => {
            const isUnlocked = lvl.id === 1 || (levelProgress[lvl.id - 1] > 0);
            const stars = levelProgress[lvl.id] || 0;

            return (
              <div key={lvl.id} className={`p-6 rounded-2xl border ${isUnlocked ? 'bg-slate-900 border-cyan-500/50' : 'bg-slate-950 border-slate-800 opacity-50'} flex flex-col`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">Sector {lvl.id}</h3>
                  <div className="text-yellow-400 text-lg">
                    {stars >= 1 ? '★' : '☆'}{stars >= 2 ? '★' : '☆'}{stars === 3 ? '★' : '☆'}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4 h-8">{lvl.desc}</p>
                <div className="bg-slate-950 p-3 rounded-lg mb-4 text-xs font-mono text-slate-300 flex justify-between">
                  <span>🎯 Target: {lvl.target}</span>
                  <span>⏱️ Time: {lvl.time}s</span>
                </div>
                <button 
                  disabled={!isUnlocked}
                  onClick={() => startLevel(lvl.id)}
                  className={`mt-auto py-3 rounded-xl font-bold transition-all ${isUnlocked ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isUnlocked ? 'LAUNCH DEPLOYMENT' : 'LOCKED'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-screen h-screen bg-slate-950 text-white select-none overflow-hidden relative">
      
      {/* OVERLAYS (Game Over / Level Complete) */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-3xl font-black text-red-500 tracking-wider mb-2">
              {gameOverReason === 'timeout' ? "TIME UP!" : "CORE MELTDOWN"}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {gameOverReason === 'timeout' ? "You didn't reach the target score in time." : "10 grid blocks melted completely! System destroyed."}
            </p>
            <div className="bg-slate-950 p-4 rounded-xl mb-6 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Final Score</p>
              <p className="text-3xl font-black text-cyan-400">{score}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleShareScore(score)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] text-xs flex items-center justify-center gap-2"
              >
                {shareStatus === 'shared' ? '✅ SHARED!' : shareStatus === 'copied' ? '✅ COPIED!' : shareStatus === 'manual' ? '📋 COPY THE MESSAGE ABOVE' : '📤 SHARE THIS SCORE'}
              </button>

              <div className="flex gap-3">
                <button onClick={() => gameMode === 'level' ? startLevel(activeLevel) : startEndless()} className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-sm">RETRY</button>
                <button onClick={returnToMenu} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">MENU</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'level_complete' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 p-10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center max-w-md w-full">
            <h2 className="text-4xl font-black text-white tracking-widest mb-2">SECTOR CLEARED</h2>
            <div className="text-5xl text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-widest">
              {earnedStars >= 1 ? '★' : '☆'}{earnedStars >= 2 ? '★' : '☆'}{earnedStars === 3 ? '★' : '☆'}
            </div>
            <p className="text-slate-300 text-sm mb-8">
              {earnedStars === 3 ? "Perfect Defense! Zero Meltdowns!" : earnedStars === 2 ? "Great job! Only 1 block compromised." : "Sector secured, but heavy damages taken."}
            </p>
            
            <div className="flex gap-4">
              <button onClick={returnToMenu} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">MENU</button>
              {activeLevel < LEVEL_DATA.length && (
                <button onClick={() => startLevel(activeLevel + 1)} className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">NEXT SECTOR</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTROL PANEL */}
      <div className="w-full lg:w-1/3 h-auto lg:h-full bg-slate-900 border-b lg:border-r border-slate-800 flex lg:flex-col items-center justify-between p-6 shadow-xl relative">
        <button onClick={returnToMenu} className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-xs">✖ MENU</button>
        
        <div className="w-full mt-4">
          <h1 className="text-xl font-black tracking-wider text-cyan-400 uppercase">
            {gameMode === 'level' ? `SECTOR ${activeLevel}` : 'ENDLESS MODE'}
          </h1>
          
          <div className="flex flex-col gap-2 mt-4 text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span>Score:</span>
              <span className="text-xl font-black text-white">{score}</span>
            </div>
            
            {gameMode === 'level' ? (
              <>
                <div className="flex justify-between items-center">
                  <span>Target:</span>
                  <span className="text-cyan-400 font-bold">{LEVEL_DATA.find(l => l.id === activeLevel).target}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
                  <span>Time Left:</span>
                  <span className={`font-black ${timeLeft <= 15 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>{timeLeft}s</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-xs">
                <span>{username ? `${username}'s Best:` : 'High Score:'}</span>
                <span className="text-yellow-400 font-bold">{highScore}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
              <span>Integrity:</span>
              <span className="text-red-400 font-bold">{blocksRemaining} / 10 💥</span>
            </div>
          </div>
        </div>

        {/* TRULY UNLIMITED AMMO DISPLAY */}
        <div className="w-full my-6 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Ammo: <span className="text-cyan-400 font-bold">∞ UNLIMITED</span></p>
          <div className="flex justify-center items-center gap-6 py-2">
            <div className="p-4 rounded-2xl border border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-black text-3xl">
              ❄️ {currentCooler}°
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase">Next Up</p>
              <p className="text-sm font-bold text-slate-400">❄️ {nextCooler}°</p>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 hidden lg:block text-center px-4">
          🔥 Fast clicker always wins! Spam infinite coolers. Tapping a heat wave resets its 5s timer!
        </div>
      </div>

      {/* CENTER GRID */}
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-950">
        <div 
          className="grid gap-2 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xl relative"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: '450px',
            aspectRatio: '1 / 1'
          }}
        >
          {Array.from({ length: gridRows * gridCols }).map((_, index) => {
            const row = Math.floor(index / gridCols);
            const col = index % gridCols;
            const cellKey = `${row}-${col}`;
            const cell = boardCells[cellKey];

            return (
              <div 
                key={index}
                onClick={() => handleCellClick(row, col)}
                className={`border rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                  cell?.type === 'melted' ? 'bg-red-950/80 border-red-900 opacity-60 cursor-not-allowed'
                  : cell?.type === 'heat' ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : cell?.type === 'cooler' ? 'bg-cyan-950/40 border-cyan-500/50'
                  : 'bg-slate-800/40 hover:bg-slate-700/60 border-slate-700/50'
                }`}
              >
                {cell?.type === 'melted' ? <span className="text-[10px] font-black text-red-500">💥</span>
                : cell?.type === 'heat' ? (
                  <div className="text-center">
                    <span className="text-[10px] text-red-300 font-bold block">💣 {cell.timeLeft}s</span>
                    <span className="text-sm font-black text-red-400">🔥 {cell.heatValue}°</span>
                  </div>
                ) : cell?.type === 'cooler' ? <span className="text-sm font-black text-cyan-400">❄️ {cell.capacity}°</span>
                : null}
              </div>
            );
          })}
        </div>
      </div>
      <Analytics />
    </div>
  );
}