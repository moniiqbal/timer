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
  const [phaseNotice, setPhaseNotice] = useState(null);

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
    if (!phaseNotice) return;

    const timeout = setTimeout(() => setPhaseNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [phaseNotice]);

  const ensureAudioReady = useCallback(async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current.state === "running";
  }, []);

  const playTone = useCallback((frequency, startAt, duration = 0.35) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.45, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }, []);

  const playPhaseChime = useCallback(
    async (phase) => {
      try {
        const ready = await ensureAudioReady();
        if (!ready) return;

        const audioContext = audioContextRef.current;
        const now = audioContext.currentTime;

        if (phase === "focus-done") {
          playTone(880, now, 0.28);
          playTone(660, now + 0.32, 0.35);
          playTone(880, now + 0.72, 0.4);
        } else {
          playTone(520, now, 0.5);
          playTone(390, now + 0.55, 0.55);
        }
      } catch {
        console.log("Audio cue could not be played.");
      }
    },
    [ensureAudioReady, playTone]
  );

  const showBrowserNotification = useCallback((title, body) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        tag: "pomodoro-phase",
        icon: "/favicon.svg",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      console.log("Browser notification could not be shown.");
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds > 1) {
          return prevSeconds - 1;
        }

        if (mode === "focus") {
          const completedSession = {
            id: crypto.randomUUID(),
            duration: formatTime(focusMinutes * 60),
            completedAt: formatSessionTime(new Date()),
          };

          setHistory((prevHistory) => [completedSession, ...prevHistory]);
          setMode("break");

          const breakMessage =
            "Focus session complete! Time for a break.";
          setPhaseNotice({ kind: "focus-done", message: breakMessage });
          document.title = `Break · ${formatTime(breakMinutes * 60)} — Pomodoro`;
          playPhaseChime("focus-done");
          showBrowserNotification("Break time!", breakMessage);

          return breakMinutes * 60;
        }

        setMode("focus");

        const focusMessage = "Break finished! Back to focus.";
        setPhaseNotice({ kind: "break-done", message: focusMessage });
        document.title = `Focus · ${formatTime(focusMinutes * 60)} — Pomodoro`;
        playPhaseChime("break-done");
        showBrowserNotification("Focus time", focusMessage);

        return focusMinutes * 60;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isRunning,
    mode,
    focusMinutes,
    breakMinutes,
    playPhaseChime,
    showBrowserNotification,
  ]);

  function syncSecondsToDuration(nextFocusMinutes, nextBreakMinutes, nextMode) {
    setSecondsLeft(
      nextMode === "focus" ? nextFocusMinutes * 60 : nextBreakMinutes * 60
    );
  }

  async function handleStartPause() {
    const willStart = !isRunning;

    if (willStart) {
      await ensureAudioReady();

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    setIsRunning(willStart);
  }

  function handleReset() {
    setIsRunning(false);
    setMode("focus");
    setSecondsLeft(focusMinutes * 60);
    setPhaseNotice(null);
    document.title = "Pomodoro Timer";
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
        className={`timer-card${
          phaseNotice?.kind === "focus-done" ? " session-complete" : ""
        }${phaseNotice?.kind === "break-done" ? " session-break-done" : ""}`}
        aria-label="Pomodoro timer"
      >
        {phaseNotice && (
          <p
            className={`completion-toast${
              phaseNotice.kind === "break-done" ? " completion-toast--focus" : ""
            }`}
            role="status"
            aria-live="assertive"
          >
            {phaseNotice.kind === "focus-done" ? "✓ " : "→ "}
            {phaseNotice.message}
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