🃏 Poker Tournament Manager

A modern poker tournament manager built with Vite + React + TypeScript + styled-components.<br />
Designed for home games to manage blind structure, players, payouts, bounty, and real-time results.

_____________________________________________________________________________________________________________________________________

## 🌐 Live Demo

[![Live Demo](https://img.shields.io/badge/demo-online-green?style=for-the-badge)](https://faranker.github.io/poker-tournament/)

✨ Features<br />
⏱ Tournament Timer<br />
Blind structure (SB / BB / Ante)<br />
Countdown timer per level<br />
Auto level progression<br />
Sound alert on level up<br />
Next / Previous level control<br />
Break mode<br />

_____________________________________________________________________________________________________________________________________

👥 Player Management<br />
Add / remove players<br />
Track multiple buy-ins (rebuy)<br />
Click to assign ranking (#1, #2, #3...)<br />
Toggle selection (click again to remove rank)<br />
Visual badges for positions 🥇🥈🥉<br />

_____________________________________________________________________________________________________________________________________


💰 Prize Pool System<br />
Dynamic prize pool calculation<br />
Custom payout percentage per position<br />
Add / remove payout slots<br />
Auto distribution based on % input<br />

_____________________________________________________________________________________________________________________________________


🎯 Hunter Bounty Mode<br />
Toggle bounty mode<br />
Configurable bounty percentage (default recommended: 25%)<br />
Auto calculate:<br />
Total bounty pool<br />
Bounty per knockout<br />
Manual input: number of kills per player<br />
Combined result:<br />
Rank prize + bounty reward<br />
Profit / loss per player<br />

_____________________________________________________________________________________________________________________________________


📊 Result Summary<br />
Full leaderboard<br />
Total buy-in per player<br />
Profit / loss calculation<br />
Highlight winners<br />
Supports bounty + normal mode<br />

_____________________________________________________________________________________________________________________________________


📤 Share Results<br />
✅ Share to LINE (auto open)<br />
✅ Send to Telegram Bot<br />
✅ Send to Discord (Webhook)<br />

_____________________________________________________________________________________________________________________________________


🛠 Tech Stack<br />
⚡ Vite<br />
⚛️ React<br />
🟦 TypeScript<br />
💅 styled-components<br />

_____________________________________________________________________________________________________________________________________


🚀 Getting Started<br />
1. Install dependencies<br />
npm install<br />
2. Run development server<br />
npm run dev<br />

_____________________________________________________________________________________________________________________________________


🌐 Deploy to GitHub Pages<br />
1. Install gh-pages<br />
npm install gh-pages --save-dev<br />
2. Add to package.json<br />
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO",<br />
"scripts": {<br />
  "predeploy": "npm run build",<br />
  "deploy": "gh-pages -d dist"<br />
}<br />
3. Deploy<br />
npm run deploy<br />

_____________________________________________________________________________________________________________________________________


🤖 Telegram Integration<br />

Create a bot via Telegram and use:<br />

https://api.telegram.org/bot<TOKEN>/sendMessage<br />

Set:<br />

TOKEN<br />
CHAT_ID (group id must start with -100)<br />

_____________________________________________________________________________________________________________________________________


💬 Discord Integration (Recommended)<br />

Use Discord Webhook:<br />

POST https://discord.com/api/webhooks/xxxx<br />
{<br />
  "content": "Your message"<br />
}<br />

_____________________________________________________________________________________________________________________________________


⚠️ Security Notes<br />
Do NOT expose Telegram Bot Token publicly<br />
Discord Webhook URL should be kept private<br />
This project is designed for personal / private use<br />

_____________________________________________________________________________________________________________________________________

🧠 Future Ideas<br />
Auto track player eliminations (who knocked out who)<br />
PKO (Progressive Knockout) mode<br />
Tournament history<br />
Export results as PDF / image<br />
Mobile UI optimization<br />

_____________________________________________________________________________________________________________________________________


👊 Author<br />

Built for fun poker nights ♠️<br />
Feel free to fork and customize!<br />

_____________________________________________________________________________________________________________________________________

📄 License

MIT License