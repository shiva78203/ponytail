# 🤖 Simple Telegram Bot Setup (For Everyone)

## What is This?

Think of it as a **WhatsApp bot** that helps you manage secret messages from Tellonym.me.

**Example:**
- Someone sends you an anonymous message on Tellonym: "You're awesome! 😊"
- The bot stores it safely
- You can reply to it anytime
- Everything is saved forever

---

## Step 1: Get Telegram App (5 minutes)

### On Phone:
1. **Download Telegram** (from App Store or Google Play)
2. **Open it** and create account with phone number
3. **Done!** ✅

### On Computer:
1. Go to https://web.telegram.org
2. Log in with phone number

---

## Step 2: Create Your Bot (10 minutes)

### What to Do:
1. **Open Telegram** (on your phone or computer)
2. **Search for:** `@BotFather`
3. **Click** on the result
4. **Send:** `/start`
5. **Send:** `/newbot`

### Answer Questions:
```
BotFather: What would you like to call your bot?
You: TellonymBot
(or any name you want)

BotFather: Give it a username (must end with 'bot')
You: tellonym_bot_123
(or your_name_bot, etc.)
```

### Get Your Token:
After creating, BotFather will show:

```
🎉 Done! Here's your bot:
@tellonym_bot_123
Use this token to access the HTTP API:
123456789:ABCdefGHIjklmnoPQRstuvWXYZ
```

**⭐ SAVE THIS TOKEN!** Copy it to a text file.

---

## Step 3: Set Up Computer (15 minutes)

### Open Terminal/Command Prompt:

#### On Mac/Linux:
```bash
# Copy-paste this one line:
export TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklmnoPQRstuvWXYZ"
```

#### On Windows:
```
# Copy-paste this one line:
set TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ
```

**Replace:** `123456789:ABCdefGHIjklmnoPQRstuvWXYZ` with your actual token

---

## Step 4: Download Files (5 minutes)

Download these 2 files:
- `telegram_bot_advanced.py`
- `TELEGRAM_BOT_ADVANCED.md`

Save them in a folder (like `Desktop/TellonymBot/`)

---

## Step 5: Install Software (10 minutes)

### Open Terminal again and copy-paste:

#### Mac/Linux:
```bash
pip install python-telegram-bot requests
```

#### Windows:
```
py -m pip install python-telegram-bot requests
```

**Wait** for it to finish (should say "Successfully installed")

---

## Step 6: Run the Bot (2 minutes)

### In Terminal, go to your folder:

#### Mac/Linux:
```bash
cd Desktop/TellonymBot
python telegram_bot_advanced.py
```

#### Windows:
```
cd Desktop\TellonymBot
python telegram_bot_advanced.py
```

### You should see:
```
🤖 Advanced Tellonym Bot is running...
```

**✅ Bot is LIVE!** Don't close this window!

---

## Step 7: Use Your Bot (2 minutes)

### On Telegram:

1. **Search:** `@tellonym_bot_123` (your bot name)
2. **Click** on it
3. **Send:** `/start`

### You'll see buttons:
```
🔐 Login
💬 View Chats
📊 Stats
ℹ️ Help
```

---

## Step 8: Login to Tellonym (2 minutes)

1. **Click:** 🔐 Login
2. **Type:** Your Tellonym username
3. **Send**
4. **Type:** Your Tellonym password
5. **Send**

### Success!
```
✅ Welcome, username!
You're now logged in.
```

---

## Step 9: View Your Messages (1 minute)

1. **Click:** 💬 View Chats
2. **See:** All your anonymous messages stored!

Example:
```
📬 Your Chats (3 new)

[Chat #1] (Msg ID: 123)
"What's your biggest dream?"
Status: NEW

[Chat #2] (Msg ID: 124)
"You're an awesome person!"
Status: NEW
```

---

## Step 10: Reply to Messages (1 minute)

### In Telegram:

**Type:**
```
/reply 1 "Thank you! My dream is to travel the world!"
```

**Bot replies:**
```
✅ Reply saved to Chat #1!
Reply: Thank you! My dream is to travel the world!
```

---

## All Commands (Cheat Sheet)

```
/start              Open menu
/chats              See all messages
/reply 1 Hello      Reply to message #1
/stats              Show numbers (how many messages)
/logout             Stop using bot
```

---

## What Gets Saved?

✅ All your secret messages  
✅ Your replies  
✅ When you received them  
✅ Everything forever!

---

## Troubleshooting

### "Bot doesn't respond"
- Check if terminal window still shows 🤖 message
- If closed, run Step 6 again

### "Login failed"
- Check spelling of username/password
- Make sure you have Tellonym account (tellonym.me)

### "API connection error"
- Check internet connection
- Restart terminal and run again

---

## Need Help?

**Common Issues:**

| Problem | Solution |
|---------|----------|
| Token doesn't work | Copy exact token from BotFather |
| "Command not found" | Try `python3` instead of `python` |
| Bot offline | Keep terminal window open |
| Can't find bot | Search exact bot name from BotFather |

---

## Summary

**What You Did:**
1. ✅ Installed Telegram
2. ✅ Created bot with BotFather
3. ✅ Got bot token
4. ✅ Set up computer
5. ✅ Downloaded bot files
6. ✅ Installed software
7. ✅ Started bot
8. ✅ Logged in
9. ✅ Viewed messages
10. ✅ Replied to messages

---

## Next Time (Easy!)

Just:
1. Open terminal
2. Go to folder: `cd Desktop/TellonymBot`
3. Run: `python telegram_bot_advanced.py`
4. Open Telegram
5. Search bot and start using!

---

## Keep This Saved!

Save this guide somewhere so you remember steps next time 📝

Congratulations! 🎉 You have a working Telegram bot!
