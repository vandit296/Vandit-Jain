import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import tikTokSound from './Sound/tiktok.mp3';
import wrongSound from './Sound/wrong.mp3';
import gunshotSound from './Sound/gunshot.mp3';
import gameOverSound from './Sound/gameover.mp3';

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
  const audioRef = useRef(new Audio(tikTokSound));
  const wrongAudioRef = useRef(new Audio(wrongSound));
  const gunshotAudioRef = useRef(new Audio(gunshotSound));
  const gameOverAudioRef = useRef(new Audio(gameOverSound));

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
        audioRef.current.play();
      }
      return () => {
        clearTimeout(timer);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      };
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (gameStarted) {
      setTimeLeft(GAME_DURATION);
    }
  }, [level, gameStarted]);

  const generateBalls = () => {
    const totalBalls = 5 * Math.pow(2, level - 1);
    const greenBalls = Math.ceil(totalBalls * 0.1); // Ensure at least 10% are green
    const newBalls = [];

    for (let i = 0; i < totalBalls; i++) {
      newBalls.push({
        id: i,
        color: i < greenBalls ? GREEN_COLOR : getRandomColor(),
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

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBalls(generateBalls());
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
        setLevel(prev => prev + 1);
        setBalls(generateBalls());
      }
    } else {
      wrongAudioRef.current.play();
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

  const goHome = () => {
    setGameStarted(false);
    setGameOver(false);
    setShowLeaderboard(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const submitToLeaderboard = () => {
    const newEntry = {
      name: playerName,
      twitter: playerTwitter,
      country: playerCountry,
      score: score
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
    gameOverAudioRef.current.play();
  };

  return (
    <div className="App">
      <button 
        onClick={goHome}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Home
      </button>
      <button 
        onClick={startGame}
        style={{
          position: 'absolute',
          top: '10px',
          right: '140px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Restart
      </button>
      <button 
        onClick={() => setShowLeaderboard(true)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '10px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Leaderboard
      </button>
      <h1>Burst Green Balls</h1>
      {!gameStarted && !gameOver && !showLeaderboard ? (
        <>
          <div className="game-rules">
            <h2>Game Rules:</h2>
            <ul>
              <li>Click on the green balls as quickly as possible.</li>
              <li>You have 60 seconds to score as many points as you can.</li>
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
          <button 
            onClick={startGame}
            style={{
              padding: '10px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Start Game
          </button>
          {renderBigGreenBalls()}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            fontSize: '12px',
            color: '#666'
          }}>
            Crafted with 💚 by Vandit Jain (@TheOneDit) | Cursor.ai + Claude = Magic!
          </div>
        </>
      ) : showLeaderboard ? (
        <div className="leaderboard">
          <h2>Leaderboard</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Twitter</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Country</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Score</th>
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
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={startGame} style={{ marginTop: '20px', padding: '10px', fontSize: '16px', cursor: 'pointer' }}>Play Again</button>
        </div>
      ) : (
        <>
          <div>Level: {level}</div>
          <div>Score: {score}</div>
          <div>Time Left: {timeLeft / 1000}s</div>
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
              zIndex: 1000
            }}>
              <h2>Game Over</h2>
              <p>You spotted {score} green balls!</p>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
