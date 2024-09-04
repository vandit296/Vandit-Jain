import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import tikTokSound from './Sound/tiktok.mp3';
import wrongSound from './Sound/wrong.mp3';
import gunshotSound from './Sound/gunshot.mp3';
import gameOverSound from './Sound/gameover.mp3';
import slytherinSound from './Sound/Slytherin.mp3';

// Made by Vandit Jain (@Theonedit) - Crafted on cursor.ai, powered by claude-3.5-sonnet, and fueled by green ball bursting enthusiasm!

const GREEN_COLOR = '#eaff0c';
const GAME_DURATION = 60000; // 1 minute in milliseconds
const BALL_SIZE = 20; // Assuming the ball size is 20px as per CSS
const BIG_BALL_SIZE = 50; // Size for the big green balls

function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [balls, setBalls] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerTwitter, setPlayerTwitter] = useState('');
  const [playerCountry, setPlayerCountry] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [gameMode, setGameMode] = useState('normal');
  const [backgroundColor, setBackgroundColor] = useState('white');
  const audioRef = useRef(new Audio(tikTokSound));
  const wrongAudioRef = useRef(new Audio(wrongSound));
  const gunshotAudioRef = useRef(new Audio(gunshotSound));
  const gameOverAudioRef = useRef(new Audio(gameOverSound));
  const slytherinAudioRef = useRef(new Audio(slytherinSound));
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // Load leaderboard from localStorage when component mounts
    const savedLeaderboard = localStorage.getItem('leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1000), 1000);
      if (timeLeft > 0) {
        if (gameMode === 'slytherin') {
          slytherinAudioRef.current.play();
        } else {
          audioRef.current.play();
        }
      }
      return () => {
        clearTimeout(timer);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        slytherinAudioRef.current.pause();
        slytherinAudioRef.current.currentTime = 0;
      };
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [gameStarted, timeLeft, gameMode]);

  useEffect(() => {
    if (gameStarted) {
      setTimeLeft(GAME_DURATION);
    }
  }, [level, gameStarted]);

  useEffect(() => {
    let intervalId;
    if ((gameMode === 'beast' || gameMode === 'slytherin') && gameStarted) {
      intervalId = setInterval(() => {
        setBackgroundColor(gameMode === 'slytherin' ? getRandomGreenShade() : getRandomColor());
      }, 250);
    } else {
      // Restore default background color when not in Beast or Slytherin mode or game is not started
      setBackgroundColor(darkMode ? 'black' : 'white');
    }
    return () => clearInterval(intervalId);
  }, [gameMode, gameStarted, darkMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateBalls = (mode, currentLevel) => {
    const baseBalls = mode === 'beast' || mode === 'slytherin' ? 10 : 5;
    const totalBalls = baseBalls * Math.pow(2, currentLevel - 1); // Double the number of balls each level
    const greenBalls = Math.max(1, Math.ceil(totalBalls * 0.1)); // Ensure at least 1 green ball, but no more than 10% of total
    const newBalls = [];

    for (let i = 0; i < totalBalls; i++) {
      newBalls.push({
        id: i,
        color: i < greenBalls ? GREEN_COLOR : (mode === 'slytherin' ? getRandomYellowGreenShade() : getRandomColor()),
        x: Math.random() * (100 - (BALL_SIZE / 5)), // Adjust for ball size (5% of game area width)
        y: Math.random() * (100 - (BALL_SIZE / 5)), // Adjust for ball size (5% of game area height)
      });
    }

    return shuffleArray(newBalls);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color;
    do {
      color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
    } while (color === GREEN_COLOR);
    return color;
  };

  const getRandomGreenShade = () => {
    const r = Math.floor(Math.random() * 100);
    const g = Math.floor(Math.random() * 156) + 100; // 100-255
    const b = Math.floor(Math.random() * 100);
    return `rgb(${r},${g},${b})`;
  };

  const getRandomYellowGreenShade = () => {
    const r = Math.floor(Math.random() * 156) + 100; // 100-255
    const g = Math.floor(Math.random() * 156) + 100; // 100-255
    const b = Math.floor(Math.random() * 100);
    return `rgb(${r},${g},${b})`;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startGame = (mode = 'normal') => {
    setGameMode(mode);
    setLevel(1);
    setScore(0);
    setTimeLeft(mode === 'beast' || mode === 'slytherin' ? GAME_DURATION / 2 : GAME_DURATION);
    setBalls(generateBalls(mode, 1)); // Pass 1 as the initial level
    setGameStarted(true);
    setGameOver(false);
    setShowLeaderboard(false);
  };

  const handleBallClick = (id, color) => {
    if (color === GREEN_COLOR) {
      gunshotAudioRef.current.play();
      setScore(prev => prev + 1);
      setBalls(prev => prev.filter(ball => ball.id !== id));

      if (balls.filter(ball => ball.color === GREEN_COLOR).length === 1) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setBalls(generateBalls(gameMode, newLevel)); // Pass the new level
      }
    } else {
      wrongAudioRef.current.play();
    }

    // In God Mode, Beast Mode, or Slytherin Mode, always reshuffle all balls after any click
    if (gameMode === 'god' || gameMode === 'beast' || gameMode === 'slytherin') {
      setBalls(prev => prev.map(ball => ({
        ...ball,
        x: Math.random() * (100 - (BALL_SIZE / 5)),
        y: Math.random() * (100 - (BALL_SIZE / 5)),
      })));
    }
  };

  const renderBigGreenBalls = () => {
    const bigBalls = [];
    for (let i = 0; i < 5; i++) {
      bigBalls.push(
        <div
          key={`big-ball-${i}`}
          style={{
            width: `${BIG_BALL_SIZE}px`,
            height: `${BIG_BALL_SIZE}px`,
            borderRadius: '50%',
            backgroundColor: GREEN_COLOR,
            position: 'absolute',
            bottom: '20px',
            left: `${i * 20 + 5}%`,
          }}
        />
      );
    }
    return bigBalls;
  };

  const renderScoreBalls = () => {
    const scoreBalls = [];
    for (let i = 0; i < score; i++) {
      scoreBalls.push(
        <div
          key={`score-ball-${i}`}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: GREEN_COLOR,
            display: 'inline-block',
            margin: '0 2px',
          }}
        />
      );
    }
    return (
      <div style={{ backgroundColor: darkMode ? 'white' : 'black', padding: '5px', borderRadius: '5px' }}>
        {scoreBalls}
      </div>
    );
  };

  const renderFinalScoreBalls = () => {
    const rows = Math.ceil(score / 20);
    const finalScoreBalls = [];
    for (let i = 0; i < rows; i++) {
      const ballsInRow = i === rows - 1 ? score % 20 || 20 : 20;
      finalScoreBalls.push(
        <div key={`row-${i}`} style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
          {[...Array(ballsInRow)].map((_, j) => (
            <div
              key={`final-score-ball-${i * 20 + j}`}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: GREEN_COLOR,
                margin: '0 2px',
              }}
            />
          ))}
        </div>
      );
    }
    return finalScoreBalls;
  };

  const goHome = () => {
    setGameStarted(false);
    setGameOver(false);
    setShowLeaderboard(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    slytherinAudioRef.current.pause();
    slytherinAudioRef.current.currentTime = 0;
    setGameMode('normal');
    setBackgroundColor(darkMode ? 'black' : 'white');
  };

  const submitToLeaderboard = () => {
    const newEntry = {
      name: playerName,
      twitter: playerTwitter,
      country: playerCountry,
      score: score,
      gameMode: gameMode
    };
    const updatedLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.score - a.score);
    setLeaderboard(updatedLeaderboard);
    // Save updated leaderboard to localStorage
    localStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
    setShowLeaderboard(true);
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    slytherinAudioRef.current.pause();
    slytherinAudioRef.current.currentTime = 0;
    gameOverAudioRef.current.play();
    setBackgroundColor('white');
    setDarkMode(false);
  };

  const renderLeaderboardBalls = (score) => {
    const rows = Math.ceil(score / 20);
    return (
      <div style={{ backgroundColor: darkMode ? 'white' : 'black', padding: '5px', borderRadius: '5px' }}>
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
            {[...Array(rowIndex === rows - 1 ? score % 20 || 20 : 20)].map((_, ballIndex) => (
              <div
                key={`ball-${rowIndex}-${ballIndex}`}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: GREEN_COLOR,
                  margin: '0 1px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    setBackgroundColor(!darkMode ? 'black' : 'white');
  };

  const showLeaderboardAndEndGame = () => {
    if (gameStarted) {
      endGame();
      gameOverAudioRef.current.pause();
      gameOverAudioRef.current.currentTime = 0;
    }
    setShowLeaderboard(true);
  };

  const getGameModeIcon = (mode) => {
    switch (mode) {
      case 'normal': return '🟢';
      case 'god': return '👑';
      case 'beast': return '👹';
      case 'slytherin': return '🐍';
      default: return '❓';
    }
  };

  const openSharePopup = () => {
    setShowSharePopup(true);
  };

  const closeSharePopup = () => {
    setShowSharePopup(false);
  };

  const shareToSocialMedia = (platform) => {
    let shareUrl = '';
    const message = `I just spotted ${score} green balls in ${gameMode} mode on BGB - Burst Green Balls! Can you beat my score?`;
    const url = 'https://vandit296.github.io/Vandit-Jain/'; // Replace with your actual game URL

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent('BGB - Burst Green Balls')}&summary=${encodeURIComponent(message)}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    closeSharePopup();
  };

  return (
    <div className="App" style={{ backgroundColor: (gameMode === 'beast' || gameMode === 'slytherin') ? backgroundColor : (darkMode ? 'black' : 'white'), color: darkMode ? 'white' : 'black', fontFamily: 'Lato, sans-serif' }}>
      <button 
        onClick={goHome}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid black'
        }}
      >
        Home
      </button>
      <button 
        onClick={toggleDarkMode}
        style={{
          position: 'absolute',
          top: '10px',
          left: '100px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: darkMode ? 'white' : 'black',
          color: darkMode ? 'black' : 'white',
          border: '1px solid black',
          fontFamily: "'Dracula', sans-serif"
        }}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      {gameStarted && (
        <button 
          onClick={startGame}
          style={{
            position: 'absolute',
            top: '10px',
            right: '140px',
            padding: '10px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid black'
          }}
        >
          Restart
        </button>
      )}
      <button 
        onClick={showLeaderboardAndEndGame}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid black'
        }}
      >
        Leaderboard
      </button>
      <h1 style={{ fontFamily: 'Bungee Shade, cursive', fontSize: '3rem' }}>BGB - Burst Green Balls</h1>
      {!gameStarted && !gameOver && !showLeaderboard ? (
        <>
          <div className="game-rules" style={{ backgroundColor: darkMode ? '#333' : '#f2f2f2', color: darkMode ? 'white' : 'black', fontFamily: 'Poppins, sans-serif' }}>
            <h2 style={{ fontFamily: 'Permanent Marker, cursive' }}>Game Rules:</h2>
            <ul>
              <li>Click on the green balls as quickly as possible.</li>
              <li>You have 60 seconds to score as many points as you can in one level.</li>
              <li>Each green ball clicked adds 1 point to your score.</li>
              <li>As you progress, the number of balls will increase, making it more challenging.</li>
              <li>The game ends when the timer reaches zero.</li>
              <li>Try to achieve the highest score possible!</li>
            </ul>
            <div>This is what we mean by a green ball:</div>
            <div 
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: GREEN_COLOR,
                margin: '10px auto'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button 
              onClick={() => startGame('normal')}
              style={{
                padding: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid black',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Normal Mode
            </button>
            <button 
              onClick={() => startGame('god')}
              style={{
                padding: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#8B0000',
                color: 'white',
                border: 'none',
                fontFamily: 'Cinzel, serif'
              }}
            >
              God Mode
            </button>
            <button 
              onClick={() => startGame('beast')}
              style={{
                padding: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#8A2BE2',
                color: 'white',
                border: 'none',
                fontFamily: 'Creepster, cursive'
              }}
            >
              Beast Mode
            </button>
            <button 
              onClick={() => startGame('slytherin')}
              style={{
                padding: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#2A623D',
                color: '#740001',
                border: 'none',
                fontFamily: "'Slytherin', cursive",
                fontStyle: 'italic',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Slytherin Mode
            </button>
          </div>
          {renderBigGreenBalls()}
          <div className="credits">
            {isMobile ? (
              <>Made with 💚 by @Theonedit</>
            ) : (
              <>Made with 💚 by Vandit Jain @Theonedit, powered by Cursor + Claude = Magic</>
            )}
          </div>
        </>
      ) : showLeaderboard ? (
        <div className="leaderboard" style={{ backgroundColor: darkMode ? '#333' : 'white', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
          <h2 style={{ fontFamily: 'Permanent Marker, cursive' }}>Leaderboard</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#444' : '#f2f2f2' }}>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Rank</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Name</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Twitter</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Country</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Score</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Game Mode</th>
                <th style={{ padding: '12px', borderBottom: `1px solid ${darkMode ? 'white' : '#ddd'}` }}>Green Balls</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f8f8' : 'white' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{index + 1}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{entry.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{entry.twitter}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{entry.country}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{entry.score}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {getGameModeIcon(entry.gameMode)} {entry.gameMode}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{renderLeaderboardBalls(entry.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={startGame} style={{ marginTop: '20px', padding: '10px', fontSize: '16px', cursor: 'pointer' }}>Play Again</button>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem' }}>Level: {level}</div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem' }}>Score: {score}</div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem' }}>Time Left: {timeLeft / 1000}s</div>
          <div className="game-area">
            {balls.map(ball => (
              <div
                key={ball.id}
                className="ball"
                style={{
                  backgroundColor: ball.color,
                  left: `${ball.x}%`,
                  top: `${ball.y}%`,
                }}
                onClick={() => handleBallClick(ball.id, ball.color)}
              />
            ))}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}>
            {renderScoreBalls()}
          </div>
          <button 
            onClick={endGame}
            style={{
              marginTop: '20px',
              padding: '10px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            End Game
          </button>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            fontSize: '14px',
            color: '#333',
            zIndex: 10,
            textShadow: '1px 1px 2px white',
          }}>
            With 💚 Vandit Jain @Theonedit, Cursor + Claude = Magic
          </div>
          {gameOver && (
            <div className="game-over-popup" style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              zIndex: 1000,
              fontFamily: 'Poppins, sans-serif'
            }}>
              <h2 style={{ fontFamily: 'Permanent Marker, cursive' }}>Game Over</h2>
              <p>You spotted {score} green balls!</p>
              <div style={{ marginBottom: '10px' }}>
                {renderFinalScoreBalls()}
              </div>
              <p>Game Mode: {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}</p>
              <input 
                type="text" 
                placeholder="Name" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="X (Twitter) handle" 
                value={playerTwitter} 
                onChange={(e) => setPlayerTwitter(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Country" 
                value={playerCountry} 
                onChange={(e) => setPlayerCountry(e.target.value)}
              />
              <button onClick={startGame}>Play Again</button>
              <button onClick={submitToLeaderboard}>Submit to Leaderboard</button>
              <button onClick={openSharePopup}>Share</button>
            </div>
          )}
        </>
      )}
      {showSharePopup && (
        <div className="share-popup" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          zIndex: 1001,
          fontFamily: 'Poppins, sans-serif'
        }}>
          <h3>Share your score</h3>
          <button onClick={() => shareToSocialMedia('twitter')}>Share on Twitter</button>
          <button onClick={() => shareToSocialMedia('facebook')}>Share on Facebook</button>
          <button onClick={() => shareToSocialMedia('linkedin')}>Share on LinkedIn</button>
          <button onClick={closeSharePopup}>Close</button>
        </div>
      )}
    </div>
  );
}

export default App;
