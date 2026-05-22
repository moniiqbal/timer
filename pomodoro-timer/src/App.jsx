import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "daily-pomodoro-history";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readStoredHistory() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) return [];

  try {
    const parsed = JSON.parse(savedData);

    if (parsed.date === getTodayKey()) {
      return parsed.sessions || [];
    }

    localStorage.removeItem(STORAGE_KEY);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return [];
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatSessionTime(date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function App() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState(readStoredHistory);
  const [focusCompleteNotice, setFocusCompleteNotice] = useState(false);

  const audioContextRef = useRef(null);

  const currentTotalSeconds = useMemo(() => {
    return mode === "focus" ? focusMinutes * 60 : breakMinutes * 60;
  }, [mode, focusMinutes, breakMinutes]);

  const progress = useMemo(() => {
    if (currentTotalSeconds <= 0) return 0;
    return ((currentTotalSeconds - secondsLeft) / currentTotalSeconds) * 100;
  }, [currentTotalSeconds, secondsLeft]);

  const statusText = isRunning
    ? mode === "focus"
      ? "Focus time"
      : "Break time"
    : secondsLeft === currentTotalSeconds
    ? "Ready"
    : "Paused";

  const modeLabel = mode === "focus" ? "Focus" : "Break";

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        sessions: history,
      })
    );
  }, [history]);

  useEffect(() => {
    if (!focusCompleteNotice) return;

    const timeout = setTimeout(() => setFocusCompleteNotice(false), 2600);
    return () => clearTimeout(timeout);
  }, [focusCompleteNotice]);

  const playSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(720, audioContext.currentTime);

      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.log("Audio cue could not be played.");
    }
  }, []);

  const handleCycleComplete = useCallback(() => {
    playSound();

    if (mode === "focus") {
      setFocusCompleteNotice(true);

      const completedSession = {
        id: crypto.randomUUID(),
        duration: formatTime(focusMinutes * 60),
        completedAt: formatSessionTime(new Date()),
      };

      setHistory((prevHistory) => [completedSession, ...prevHistory]);
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode("focus");
      setSecondsLeft(focusMinutes * 60);
    }
  }, [mode, focusMinutes, breakMinutes, playSound]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds > 1) {
          return prevSeconds - 1;
        }

        handleCycleComplete();
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, handleCycleComplete]);

  function syncSecondsToDuration(nextFocusMinutes, nextBreakMinutes, nextMode) {
    setSecondsLeft(
      nextMode === "focus" ? nextFocusMinutes * 60 : nextBreakMinutes * 60
    );
  }

  function handleStartPause() {
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setMode("focus");
    setSecondsLeft(focusMinutes * 60);
  }

  function handleFocusChange(event) {
    const value = Number(event.target.value);
    const nextFocusMinutes = Math.max(1, Math.min(120, value));
    setFocusMinutes(nextFocusMinutes);

    if (!isRunning) {
      syncSecondsToDuration(nextFocusMinutes, breakMinutes, mode);
    }
  }

  function handleBreakChange(event) {
    const value = Number(event.target.value);
    const nextBreakMinutes = Math.max(1, Math.min(60, value));
    setBreakMinutes(nextBreakMinutes);

    if (!isRunning) {
      syncSecondsToDuration(focusMinutes, nextBreakMinutes, mode);
    }
  }

  return (
    <main className={`app ${mode}`}>
      <section
        className={`timer-card${focusCompleteNotice ? " session-complete" : ""}`}
        aria-label="Pomodoro timer"
      >
        {focusCompleteNotice && (
          <p className="completion-toast" role="status" aria-live="assertive">
            ✓ Focus Session Complete
          </p>
        )}

        <div className="top-row">
          <div>
            <p className="eyebrow">Pomodoro Timer</p>
            <h1>{modeLabel} Session</h1>
          </div>

          <span className={`status-pill ${isRunning ? "active" : "paused"}`}>
            {statusText}
          </span>
        </div>

        <div className="timer-circle" aria-live="polite">
          <div
            className="progress-ring"
            style={{
              background: `conic-gradient(var(--accent) ${progress}%, var(--ring-bg) ${progress}%)`,
            }}
          >
            <div className="timer-inner">
              <span className="mode-label">{modeLabel}</span>
              <strong className="time">{formatTime(secondsLeft)}</strong>
              <span className="hint">
                {mode === "focus"
                  ? "Stay focused. One task only."
                  : "Relax, breathe, reset."}
              </span>
            </div>
          </div>
        </div>

        <div className="controls" aria-label="Timer controls">
          <button className="primary-btn" onClick={handleStartPause}>
            {isRunning ? "Pause" : secondsLeft === currentTotalSeconds ? "Start" : "Resume"}
          </button>

          <button className="secondary-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="settings" aria-label="Timer settings">
          <label>
            Focus minutes
            <input
              type="number"
              min="1"
              max="120"
              value={focusMinutes}
              disabled={isRunning}
              onChange={handleFocusChange}
            />
          </label>

          <label>
            Break minutes
            <input
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              disabled={isRunning}
              onChange={handleBreakChange}
            />
          </label>
        </div>
      </section>

      <section className="history-card" aria-label="Today focus history">
        <div className="history-header">
          <div>
            <p className="eyebrow">Today</p>
            <h2>Completed Focus Sessions</h2>
          </div>

          <span className="count">{history.length}</span>
        </div>

        {history.length === 0 ? (
          <p className="empty-state">
            No sessions completed today.
            <br />
            <span className="empty-state-cta">
              Start your first focus session 🚀
            </span>
          </p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <span className="check">✓</span>
                <span>
                  <strong>{item.duration}</strong> focus — {item.completedAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}