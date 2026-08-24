# 🤖 Tellonym Telegram Bot Setup Guide

## Prerequisites
- Django API running on `http://localhost:8000`
- Telegram account
- Python 3.7+

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/start` command
3. Send `/newbot` command
4. Follow the prompts:
   - Give your bot a name (e.g., "Tellonym Manager")
   - Give your bot a username (must end with "bot", e.g., "tellonym_manager_bot")
5. Copy the **API token** provided by BotFather

Example token: `123456789:ABCdefGHIjklmnoPQRstuvWXYZ`

## Step 2: Set Environment Variable

On Linux/Mac:
```bash
export TELEGRAM_BOT_TOKEN="your_token_here"
```

On Windows (PowerShell):
```powershell
$env:TELEGRAM_BOT_TOKEN="your_token_here"
```

## Step 3: Run the Bot

```bash
cd /home/user/django-tellonym-api
python telegram_bot.py
```

You should see:
```
🤖 Tellonym Bot is running...
Press Ctrl+C to stop
```

## Step 4: Use the Bot

1. Find your bot on Telegram (search by username)
2. Send `/start`
3. Click "🔐 Login" button
4. Enter your Tellonym username and password
5. Manage your messages!

---

## Bot Features

### Commands
- `/start` - Main menu
- `/messages` - View all new messages
- `/accept <id>` - Mark message as accepted
- `/discard <id>` - Discard a message
- `/logout` - Logout

### Inline Buttons
- 📬 View Messages
- 🔄 Refresh
- 🔐 Login
- 🔓 Logout
- ℹ️ Help

---

## Example Usage

**View Messages:**
```
/messages
```

**Accept Message ID 5:**
```
/accept 5
```

**Discard Message ID 3:**
```
/discard 3
```

---

## Troubleshooting

### Bot doesn't respond
- ❌ Check TELEGRAM_BOT_TOKEN is set correctly
- ❌ Verify Django API is running on port 8000
- ❌ Check internet connection

### Login fails
- ❌ Verify Tellonym username and password are correct
- ❌ Check Django API is accessible

### API connection error
- ❌ Start Django API first: `python manage.py runserver`

---

## Security Notes

⚠️ **Never commit your bot token to git!**

Store it safely:
- Use environment variables
- Use `.env` file with `python-dotenv`
- Use your system's secret manager

---

## Architecture

```
┌─────────────────────────────────────────┐
│      Telegram Bot (telegram_bot.py)     │
│  - Handles user interactions            │
│  - Manages login sessions               │
└─────────────────────────────────────────┘
              ↓ HTTP Requests ↓
┌─────────────────────────────────────────┐
│  Django Tellonym API (localhost:8000)   │
│  - /api/login/   (authenticate)         │
│  - /api/list/    (fetch messages)       │
│  - /api/patch/   (update messages)      │
└─────────────────────────────────────────┘
              ↓ API Calls ↓
┌─────────────────────────────────────────┐
│     Tellonym.me (tellonym.me)           │
│  - Provides SDK for authentication      │
│  - Stores anonymous messages            │
└─────────────────────────────────────────┘
```

---

## Next Steps

- Add notifications for new messages
- Add rich message formatting
- Add inline keyboards for quick actions
- Deploy to a server (AWS Lambda, Heroku, etc.)
- Add database to track user preferences
