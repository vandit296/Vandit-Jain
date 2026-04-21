import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WordGame.css';
import { createClient } from '@supabase/supabase-js';

const WORD_BANK = [
  'horse', 'ocean', 'fire', 'cloud', 'mirror',
  'shadow', 'clock', 'bridge', 'mountain', 'dream',
  'coin', 'window', 'forest', 'storm', 'diamond',
  'river', 'anchor', 'feather', 'maze', 'thunder',
  'lantern', 'compass', 'telescope', 'violin', 'marble',
  'candle', 'atlas', 'sphinx', 'labyrinth', 'prism',
  'needle', 'ladder', 'tide', 'echo', 'veil',
  'frost', 'ember', 'cradle', 'gate', 'dusk',
  'ink', 'salt', 'iron', 'silk', 'dust',
];

const ROUNDS = 10;
const TIME_LIMIT = 5; // seconds

const DEPTH_LEVELS = [
  { min: 0.85, label: 'VISIONARY', color: '#a855f7' },
  { min: 0.70, label: 'DEEP',      color: '#7c3aed' },
  { min: 0.55, label: 'CREATIVE',  color: '#3b82f6' },
  { min: 0.40, label: 'CURIOUS',   color: '#10b981' },
  { min: 0,    label: 'SURFACE',   color: '#6b7280' },
];

const MAX_SCORE = ROUNDS * 150; // 100 uniqueness + 50 speed per round

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDepthLevel(score) {
  const pct = score / MAX_SCORE;
  return DEPTH_LEVELS.find(d => pct >= d.min) || DEPTH_LEVELS[DEPTH_LEVELS.length - 1];
}

function getSpeedBonus(responseTime) {
  if (responseTime >= TIME_LIMIT) return 0;
  return Math.round(50 * (1 - responseTime / TIME_LIMIT));
}

// ── Supabase client (shared from env) ──
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function judgeAssociation(promptWord, playerWord) {
  if (!playerWord) {
    return { related: false, uniqueness: 0, reasoning: 'No answer given.' };
  }
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('judge-word', {
        body: { promptWord, playerWord },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('AI judge unavailable, using heuristic:', err.message);
    }
  }
  // Heuristic fallback (runs until edge function is deployed)
  return heuristicJudge(promptWord, playerWord);
}

function heuristicJudge(promptWord, playerWord) {
  const word = playerWord.toLowerCase().trim();
  // Very short or identical = low score
  if (word === promptWord.toLowerCase() || word.length < 2) {
    return { related: false, uniqueness: 0, reasoning: 'Too similar or too short.' };
  }
  // Length-based proxy for uniqueness (longer, more specific words score higher)
  const baseUniqueness = Math.min(85, 20 + word.length * 4 + Math.random() * 15);
  return {
    related: true,
    uniqueness: Math.round(baseUniqueness),
    reasoning: '(AI judge not yet deployed — heuristic score based on word specificity)',
  };
}

function shareScore(score, label, rounds) {
  const top3 = [...rounds]
    .sort((a, b) => b.roundScore - a.roundScore)
    .slice(0, 3)
    .map(r => `${r.promptWord}→${r.playerWord} (${r.roundScore}pts)`)
    .join(', ');
  const text =
    `🧠 WordDepth: ${score}/${MAX_SCORE}\n` +
    `Thinking depth: ${label}\n` +
    `Best: ${top3}\n` +
    `Play at https://vandit296.github.io/Vandit-Jain/`;

  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => alert('Score copied to clipboard!'))
      .catch(() => alert(text));
  }
}

// ── Component ──

const PHASE = {
  HOME:    'home',
  PLAYING: 'playing',
  JUDGING: 'judging',
  RESULT:  'result',
  DONE:    'done',
};

export default function WordGame({ onBack }) {
  const [phase,       setPhase]       = useState(PHASE.HOME);
  const [words,       setWords]       = useState([]);
  const [round,       setRound]       = useState(0);
  const [input,       setInput]       = useState('');
  const [timeLeft,    setTimeLeft]    = useState(TIME_LIMIT);
  const [results,     setResults]     = useState([]);
  const [lastResult,  setLastResult]  = useState(null);

  const startTimeRef  = useRef(null);
  const phaseRef      = useRef(PHASE.HOME);
  const submitRef     = useRef(null);
  const inputRef      = useRef(null);

  // Keep phaseRef in sync so the timer callback always sees latest phase
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Submit answer ──
  const handleSubmit = useCallback(async (answer) => {
    if (phaseRef.current !== PHASE.PLAYING) return;
    phaseRef.current = PHASE.JUDGING; // guard against double-fire
    setPhase(PHASE.JUDGING);

    const responseTime = startTimeRef.current
      ? Math.min((Date.now() - startTimeRef.current) / 1000, TIME_LIMIT)
      : TIME_LIMIT;

    const promptWord = words[round];
    const judgment   = await judgeAssociation(promptWord, answer);
    const speedBonus = answer && judgment.related ? getSpeedBonus(responseTime) : 0;
    const roundScore = judgment.related && answer ? judgment.uniqueness + speedBonus : 0;

    const result = {
      promptWord,
      playerWord:   answer || '(no answer)',
      related:      judgment.related,
      uniqueness:   judgment.uniqueness,
      reasoning:    judgment.reasoning,
      speedBonus,
      roundScore,
      responseTime,
    };

    setLastResult(result);
    setResults(prev => [...prev, result]);
    setPhase(PHASE.RESULT);
  }, [words, round]);

  // Keep submitRef current for the timer callback
  useEffect(() => { submitRef.current = handleSubmit; });

  // ── Timer ──
  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;

    const start = Date.now();
    startTimeRef.current = start;
    setTimeLeft(TIME_LIMIT);

    const id = setInterval(() => {
      const elapsed   = (Date.now() - start) / 1000;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(Math.round(remaining * 10) / 10);

      if (remaining <= 0) {
        clearInterval(id);
        submitRef.current('');
      }
    }, 100);

    return () => clearInterval(id);
  }, [phase, round]); // re-runs on new round

  // ── Auto-advance after result ──
  useEffect(() => {
    if (phase !== PHASE.RESULT) return;
    const t = setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setPhase(PHASE.DONE);
      } else {
        setRound(r => r + 1);
        setInput('');
        setPhase(PHASE.PLAYING);
      }
    }, 2600);
    return () => clearTimeout(t);
  }, [phase, round]);

  // ── Focus input on play ──
  useEffect(() => {
    if (phase === PHASE.PLAYING) inputRef.current?.focus();
  }, [phase, round]);

  const startGame = useCallback(() => {
    setWords(shuffleArray(WORD_BANK).slice(0, ROUNDS));
    setRound(0);
    setResults([]);
    setLastResult(null);
    setInput('');
    setTimeLeft(TIME_LIMIT);
    setPhase(PHASE.PLAYING);
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      handleSubmit(input.trim().toLowerCase());
    }
  };

  const totalScore = results.reduce((s, r) => s + r.roundScore, 0);

  // ── Timer ring geometry ──
  const R            = 45;
  const circumference = 2 * Math.PI * R;
  const timerPct     = timeLeft / TIME_LIMIT;
  const strokeColor  = timeLeft > 3 ? '#10b981' : timeLeft > 1.5 ? '#f59e0b' : '#ef4444';

  // ── HOME ──
  if (phase === PHASE.HOME) {
    return (
      <div className="wg-screen wg-home">
        <button className="wg-back-btn" onClick={onBack}>← Back</button>
        <div className="wg-home-content">
          <h1 className="wg-title">WordDepth</h1>
          <p className="wg-subtitle">How deep is your thinking?</p>
          <div className="wg-how-it-works">
            <div className="wg-rule">A word appears. Type the first <strong>related word</strong> that comes to mind.</div>
            <div className="wg-rule">The more <strong>unique</strong> your association, the higher your score.</div>
            <div className="wg-rule">The <strong>faster</strong> you answer, the bigger the speed bonus (+50 max).</div>
            <div className="wg-rule"><strong>10 rounds.</strong> Max score: <strong>{MAX_SCORE} pts.</strong></div>
          </div>
          <button className="wg-start-btn" onClick={startGame}>Start Game</button>
        </div>
      </div>
    );
  }

  // ── PLAYING / JUDGING ──
  if (phase === PHASE.PLAYING || phase === PHASE.JUDGING) {
    return (
      <div className="wg-screen wg-game">
        <div className="wg-top-bar">
          <span className="wg-round-counter">Round {round + 1} / {ROUNDS}</span>
          <span className="wg-score-live">{totalScore} pts</span>
        </div>

        {/* Circular timer */}
        <div className="wg-timer-container">
          <svg className="wg-timer-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - timerPct)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
            />
            <text x="50" y="57" textAnchor="middle" className="wg-timer-text">
              {Math.ceil(timeLeft)}
            </text>
          </svg>
        </div>

        <div className="wg-prompt-word">{words[round]}</div>

        {phase === PHASE.PLAYING ? (
          <div className="wg-input-container">
            <input
              ref={inputRef}
              className="wg-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="type your word…"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="wg-input-hint">Press Enter to submit</div>
          </div>
        ) : (
          <div className="wg-judging">
            Judging
            <span className="wg-dot">.</span>
            <span className="wg-dot">.</span>
            <span className="wg-dot">.</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="wg-history">
            {results.slice(-3).map((r, i) => (
              <div key={i} className={`wg-history-item ${!r.related ? 'missed' : ''}`}>
                <span className="wg-history-words">{r.promptWord} → {r.playerWord}</span>
                <span className="wg-history-score">{r.roundScore} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ROUND RESULT ──
  if (phase === PHASE.RESULT && lastResult) {
    const { promptWord, playerWord, related, uniqueness, reasoning, speedBonus, roundScore } = lastResult;
    return (
      <div className="wg-screen wg-result">
        <div className="wg-result-words">
          <span className="wg-result-prompt">{promptWord}</span>
          <span className="wg-result-arrow">→</span>
          <span className="wg-result-answer">{playerWord}</span>
        </div>

        {related ? (
          <>
            <div className="wg-result-uniqueness">
              <div className="wg-score-label">Uniqueness</div>
              <div className="wg-score-bar">
                <div className="wg-score-fill" style={{ width: `${uniqueness}%` }} />
              </div>
              <div className="wg-score-number">{uniqueness}<span style={{ fontSize: '1rem', color: '#555', fontWeight: 400 }}>/100</span></div>
            </div>
            <div className="wg-result-breakdown">
              <span>+{uniqueness} uniqueness</span>
              <span>+{speedBonus} speed</span>
            </div>
            <div className="wg-result-total">= {roundScore} pts</div>
            <div className="wg-result-reasoning">{reasoning}</div>
          </>
        ) : (
          <div className="wg-result-unrelated">
            Not related — 0 points
            <div className="wg-result-reasoning" style={{ color: '#444', marginTop: 8 }}>{reasoning}</div>
          </div>
        )}

        <div className="wg-result-next">Next word in a moment…</div>
      </div>
    );
  }

  // ── GAME OVER ──
  if (phase === PHASE.DONE) {
    const depth = getDepthLevel(totalScore);
    return (
      <div className="wg-screen wg-gameover">
        <p className="wg-gameover-title">Game Over</p>
        <div className="wg-final-score">{totalScore}</div>
        <div className="wg-final-max">out of {MAX_SCORE}</div>
        <div className="wg-depth-label" style={{ color: depth.color }}>
          {depth.label}
        </div>

        <div className="wg-rounds-breakdown">
          {results.map((r, i) => (
            <div key={i} className={`wg-round-row ${!r.related ? 'missed' : ''}`}>
              <span className="wg-round-num">{i + 1}</span>
              <span className="wg-round-words">
                <strong>{r.promptWord}</strong> → {r.playerWord}
              </span>
              <span className="wg-round-pts">{r.roundScore} pts</span>
            </div>
          ))}
        </div>

        <div className="wg-gameover-actions">
          <button className="wg-start-btn" onClick={startGame}>Play Again</button>
          <button className="wg-share-btn" onClick={() => shareScore(totalScore, depth.label, results)}>
            Share Score
          </button>
          <button className="wg-back-link" onClick={onBack}>← Back to Games</button>
        </div>
      </div>
    );
  }

  return null;
}
