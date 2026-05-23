# Pomodoro Timer

A modern, focus/break Pomodoro timer with daily session history and beautiful glass-style UI. Built with **React** and **Vite**, this application helps you manage your work sessions and breaks effectively while tracking your daily productivity.

## 📋 About

The Pomodoro Technique is a time management method that breaks work into focused intervals separated by short breaks. This implementation provides:

- **Customizable Intervals:** Set your own focus and break durations
- **Session Tracking:** Monitor how many focus sessions you've completed today
- **Visual Feedback:** Smooth circular progress ring with conic gradient animation
- **Audio & Notifications:** Get notified with sound and on-screen toast when sessions complete
- **Persistent State:** All data is saved locally and resets daily
- **Responsive Design:** Works seamlessly on desktop and mobile devices
- **Accessibility:** Built with accessibility best practices in mind
- **Modern UI:** Glass-morphism styling for a contemporary look and feel

Perfect for developers, students, and professionals looking to boost productivity and maintain focus.

## 🚀 Quick start

**Prerequisites:** Node.js 18+ and npm.

```bash
cd pomodoro-timer
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173/`).

> **Note:** Run these commands inside the `pomodoro-timer` folder, not the parent `timer` directory. If ports are in use, Vite will pick the next available port — use the `Local:` URL from the terminal output.

## 📦 Tech Stack

- **Frontend Framework:** React
- **Build Tool:** Vite
- **Styling:** CSS (51.1% of codebase)
- **JavaScript:** 47.4% of codebase
- **Markup:** HTML (1.5% of codebase)

## 🛠 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## ✨ Features

- ⏱️ Customizable focus and break durations
- ▶️ Start / pause / resume / reset controls
- 🔄 Auto-switch between focus and break when a phase ends
- 🎨 Conic progress ring with smooth, animated updates
- 📊 Today's completed focus sessions counter (stored in `localStorage`, resets daily)
- 🔊 Audio cue and on-screen toast notification when focus session completes
- 🎯 Clean, intuitive user interface
- 📱 Fully responsive design
- ♿ Accessibility-friendly

## 📁 Project Structure

```
pomodoro-timer/
├── src/
│   ├── App.jsx      # Main timer component with logic and UI
│   ├── App.css      # Component-specific styles
│   ├── index.css    # Global theme, color palette, and background
│   └── main.jsx     # React entry point
├── ANSWERS.md       # Submission Q&A, design decisions, and technical notes
└── package.json     # Project dependencies and scripts
```

## 📝 Documentation

See [ANSWERS.md](./ANSWERS.md) for:
- Stack rationale and technology choices
- Responsive design and mobile considerations
- Accessibility implementation details
- AI usage disclosure
- Known limitations and future improvements

## 🚢 Deployment

**Deployed URL:** Coming soon!

## 💡 Usage Tips

1. **Set Your Intervals:** Configure focus duration (typically 25 minutes) and break duration (typically 5 minutes)
2. **Start Focusing:** Click the play button to begin a focus session
3. **Take Breaks:** The timer automatically switches to break mode when focus time ends
4. **Track Progress:** Monitor completed sessions in the daily counter
5. **Reset as Needed:** Use the reset button to stop the current session

## 📄 License

[Add your license here]

## 👤 Author

Created by [moniiqbal](https://github.com/moniiqbal)

---

Happy focusing! 🎯
