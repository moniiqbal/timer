# Pomodoro Timer

A focus/break Pomodoro timer with daily session history, built with React and Vite. Features a large circular countdown, glass-style UI, local persistence, and visual feedback when a focus session completes.

## Quick start

**Prerequisites:** Node.js 18+ and npm.

```bash
cd pomodoro-timer
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173/`).

> **Note:** Run these commands inside the `pomodoro-timer` folder, not the parent `timer` directory. If ports are in use, Vite will pick the next available port — use the `Local:` URL from the terminal output.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Features

- Customizable focus and break durations
- Start / pause / resume / reset
- Auto-switch between focus and break when a phase ends
- Conic progress ring with smooth updates
- Today’s completed focus sessions (stored in `localStorage`, resets daily)
- Audio cue and on-screen toast when a focus session completes

## Project structure

```
pomodoro-timer/
├── src/
│   ├── App.jsx      # Timer logic and UI
│   ├── App.css      # Component styles
│   ├── index.css    # Global theme and background
│   └── main.jsx     # Entry point
├── ANSWERS.md       # Submission Q&A
└── package.json
```

## Submission notes

See [ANSWERS.md](./ANSWERS.md) for stack rationale, responsive/accessibility notes, AI usage disclosure, and known gaps.

**Deployed URL:** Not deployed yet.
