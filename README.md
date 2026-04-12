🃏 Poker Tournament Manager

A modern poker tournament manager built with Vite + React + TypeScript + styled-components.
Designed for home games to manage blind structure, players, payouts, bounty, and real-time results.

## 🌐 Live Demo

[![Live Demo](https://img.shields.io/badge/demo-online-green?style=for-the-badge)](https://faranker.github.io/poker-tournament/)

✨ Features
⏱ Tournament Timer
Blind structure (SB / BB / Ante)
Countdown timer per level
Auto level progression
Sound alert on level up
Next / Previous level control
Break mode
👥 Player Management
Add / remove players
Track multiple buy-ins (rebuy)
Click to assign ranking (#1, #2, #3...)
Toggle selection (click again to remove rank)
Visual badges for positions 🥇🥈🥉
💰 Prize Pool System
Dynamic prize pool calculation
Custom payout percentage per position
Add / remove payout slots
Auto distribution based on % input
🎯 Hunter Bounty Mode
Toggle bounty mode
Configurable bounty percentage (default recommended: 25%)
Auto calculate:
Total bounty pool
Bounty per knockout
Manual input: number of kills per player
Combined result:
Rank prize + bounty reward
Profit / loss per player
📊 Result Summary
Full leaderboard
Total buy-in per player
Profit / loss calculation
Highlight winners
Supports bounty + normal mode
📤 Share Results
✅ Share to LINE (auto open)
✅ Send to Telegram Bot
✅ Send to Discord (Webhook)
🛠 Tech Stack
⚡ Vite
⚛️ React
🟦 TypeScript
💅 styled-components
🚀 Getting Started
1. Install dependencies
npm install
2. Run development server
npm run dev
🌐 Deploy to GitHub Pages
1. Install gh-pages
npm install gh-pages --save-dev
2. Add to package.json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
3. Deploy
npm run deploy
🤖 Telegram Integration

Create a bot via Telegram and use:

https://api.telegram.org/bot<TOKEN>/sendMessage

Set:

TOKEN
CHAT_ID (group id must start with -100)
💬 Discord Integration (Recommended)

Use Discord Webhook:

POST https://discord.com/api/webhooks/xxxx
{
  "content": "Your message"
}
⚠️ Security Notes
Do NOT expose Telegram Bot Token publicly
Discord Webhook URL should be kept private
This project is designed for personal / private use
📸 Screenshots

Add your screenshots here

🧠 Future Ideas
Auto track player eliminations (who knocked out who)
PKO (Progressive Knockout) mode
Tournament history
Export results as PDF / image
Mobile UI optimization
👊 Author

Built for fun poker nights ♠️
Feel free to fork and customize!

📄 License

MIT License