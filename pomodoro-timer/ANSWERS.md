# ANSWERS.md — Pomodoro Timer

## 1. How to run

**Requirements:** [Node.js](https://nodejs.org/) 18+ (includes `npm`).

From a fresh machine:

```bash
cd pomodoro-timer
npm install
npm run dev
```

Then open the URL printed in the terminal (usually `http://localhost:5173/`). If that port is busy, Vite picks the next free port — use the `Local:` line from the output, not an old browser tab.

**Production build (optional):**

```bash
npm run build
npm run preview
```

**Lint:**

```bash
npm run lint
```

**Deployed URL:** Not deployed yet. The app is a static Vite build and can be hosted on Vercel, Netlify, or GitHub Pages with no backend.

---

## 2. Stack & design choices

**Stack:** React 19 + Vite 8, plain CSS (no UI library). I chose this because the assignment needs a working browser app with clear state (running / paused / focus / break), and React keeps timer logic readable without a heavy framework. Vite gives fast local dev and a simple `npm run dev` story for reviewers.

**Decision 1 — Large circular timer as the focal point**  
The countdown uses a conic-gradient progress ring and a large tabular-nums display (`clamp(3.2rem, 14vw, 5.5rem)` in `App.css`, markup in `App.jsx` under `.timer-circle`). I sized the ring to `min(78vw, 340px)` so the time stays readable at a glance on a phone without dominating a laptop layout. That directly supports the brief: “readable at a glance.”

**Decision 2 — Two-column layout on desktop, single column on narrow screens**  
At ≥900px, `.app` uses `grid-template-columns: minmax(300px, 1fr) minmax(260px, 380px)` so the timer card and today’s history sit side by side (productivity-dashboard pattern). Below 900px, the grid collapses to one column with `max-width: 520px` so content doesn’t feel stretched on a 360px phone. History stays below the timer instead of squeezed beside it.

**Decision 3 (interaction) — Visual mode switching**  
Focus mode uses cyan accents; break mode switches the whole `.app.break` theme to emerald (`App.css`). Combined with the status pill and progress ring transition (`transition: background 0.5s linear` on `.progress-ring`), the user always sees which phase they’re in without reading small labels only.

---

## 3. Responsive & accessibility

**360px phone:** Single-column stack, reduced padding (`14px`), full-width status pill and control buttons, timer ring scales with viewport width, settings inputs stack vertically.

**1440px laptop:** Centered layout capped at `max-width: 1100px`, timer + history in two columns, more breathing room via `clamp()` padding.

**Accessibility handled:**  
- Landmark labels: `aria-label` on timer, controls, settings, and history sections (`App.jsx`).  
- Live updates: `aria-live="polite"` on the timer display; completion toast uses `role="status"` and `aria-live="assertive"`.  
- Keyboard focus: visible `:focus-visible` outlines on buttons and inputs (`index.css`).  
- Contrast: light text (`#f4f7ff`) on near-black background with accent colors used for emphasis, not body text.

**Knowingly skipped:** I did not add `prefers-reduced-motion` overrides for the `breathe` animation on `.timer-inner` or the card hover lift. With another pass, I’d disable or shorten those animations when the user prefers reduced motion, since decorative motion isn’t required for the timer to work.

---

## 4. AI usage

| Tool | What I asked | What it gave me | What I changed |
|------|----------------|-----------------|----------------|
| **Cursor (Agent)** | Scaffold project: `npm create vite@latest pomodoro-timer -- --template react` | Vite + React app; on Windows the `--template react` flag didn’t apply and I got a vanilla TypeScript template instead | Re-ran with `npx create-vite@latest pomodoro-timer -t react` so React actually scaffolded |
| **Cursor (Agent)** | Fix ESLint `react-hooks/set-state-in-effect` and `exhaustive-deps` | Suggestions to use lazy `useState` for `localStorage`, `useCallback` for cycle handler, remove sync effect | I also removed `isRunning` from the old “reset seconds” effect logic so **pausing no longer resets the countdown to full duration** — the AI’s first fix pattern would have still reset on pause if we kept that dependency |
| **Cursor (Agent)** | Restyle like a glassmorphism reference; black + accent color | `index.css` aurora background, glass cards, cyan focus / emerald break themes in `App.css` | Tuned palette to **black + cyan** (not purple from the reference) and split globals (`index.css`) vs components (`App.css`) |
| **Cursor (Agent)** | Apply reviewer polish (smooth ring, hover, breathe animation, completion toast, empty state copy) | CSS transitions/keyframes, toast markup, updated empty-state text | Kept toast duration at 2.6s and wired `session-complete` class only when a **focus** block finishes, not on break end |
| **Cursor (Agent)** | Why `npm run dev` failed in Git Bash | Diagnosis: wrong working directory (`timer/` vs `pomodoro-timer/`) and port conflicts from multiple dev servers | No code change — documentation only |

**Specific tweak example:** The AI proposed loading history in a `useEffect` with `setHistory(parsed.sessions)`. That triggered the `react-hooks/set-state-in-effect` lint. I replaced it with `useState(readStoredHistory)` so the initial read runs once as lazy state initialization — same behavior, no extra render pass, lint-clean.

---

## 5. Honest gap

**Gap:** No deployed demo URL, and timer controls aren’t optimized for keyboard-only use (e.g. Space to start/pause). The completion sound uses Web Audio but doesn’t expose a mute toggle in the UI.

**With one more day:** Deploy `npm run build` output to Vercel, add keyboard shortcuts + `prefers-reduced-motion`, and a visible “Sound on/off” control stored in `localStorage` so reviewers can test accessibility and audio without digging into code.
