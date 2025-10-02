```markdown
# Telegram Agency Task Bot

A Telegram bot that helps manage tasks in agency groups by formatting task messages and tracking completion status through reactions.

## Features
- ✅ Auto-formats task messages
- ✅ Deletes original unformatted messages
- ✅ Tags assigned team members
- ✅ Tracks task status via reactions (✅ = complete, ❌ = cancelled)
- ✅ Updates task status automatically

## Usage
Send a message in this format:
```
Task Type | Client Name | Deadline | @assignee
```

Example:
```
Video Editing | Nike Campaign | 2025-10-15 | @john
```

The bot will delete your message and send a formatted version that team members can interact with.

## Setup

### 1. Create Your Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token

### 2. Add Bot to Group
1. Add bot to your agency group
2. Make it an admin with these permissions:
   - Delete messages
   - Send messages
   - Read messages

### 3. Deploy (Free Options)

#### Option A: Render.com (Recommended)
1. Create account at [render.com](https://render.com)
2. Fork/upload this code to GitHub
3. New → Web Service → Connect repository
4. Add environment variable: `BOT_TOKEN` = your bot token
5. Deploy!

#### Option B: Railway.app
1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variable: `BOT_TOKEN`
4. Deploy!

#### Option C: Replit
1. Create account at [replit.com](https://replit.com)
2. Create new Repl → Import from GitHub
3. Add secret: `BOT_TOKEN`
4. Run!

## License
MIT
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Create Your Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: "Agency Task Bot"
4. Choose a username: "YourAgencyTaskBot" (must end in "bot")
5. **Copy the token** you receive (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Create GitHub Repository
1. Go to [github.com](https://github.com) and create new repository
2. Name it: `telegram-task-bot`
3. Upload these 4 files:
   - `bot.js` (the main code above)
   - `package.json`
   - `.gitignore`
   - `README.md`

### Step 3: Deploy on Render.com (FREE)
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name:** telegram-task-bot
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **"Environment"** tab
6. Add environment variable:
   - **Key:** `BOT_TOKEN`
   - **Value:** (paste your bot token from BotFather)
7. Click **"Create Web Service"**
8. Wait 2-3 minutes for deployment ✅

### Step 4: Add Bot to Your Group
1. Add the bot to your Telegram group
2. Go to Group Settings → Administrators → Add Administrator
3. Give it these permissions:
   - ✅ Delete messages
   - ✅ Send messages
   - ✅ All other messaging permissions
4. Click **Done**

### Step 5: Test It!
Send this message in your group:
```
Video Editing | Nike | 2025-10-15 | @yourname
```

The bot should:
1. Delete your message
2. Send a formatted task card
3. Allow reactions with ✅ or ❌

---

## 🎉 Done! Your bot is now running 24/7 for FREE!

Need help? Reply with any questions!