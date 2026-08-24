# 🤖 Advanced Tellonym Telegram Bot (With Chat Storage)

## Features

✅ **Store Messages** - All Tellonym messages stored locally in SQLite  
✅ **Chat History** - View all past messages  
✅ **Reply Management** - Save replies to each message  
✅ **Statistics** - Track message counts and statuses  
✅ **Search** - Find messages by content  
✅ **Status Tracking** - NEW, REPLIED, ARCHIVED states  

---

## Database Schema

### `telegram_users`
```sql
telegram_id (PRIMARY KEY)
username
tellonym_token
created_at
```

### `tellonym_chats`
```sql
id (PRIMARY KEY)
telegram_id (FOREIGN KEY)
tellonym_message_id
message_text
reply_text
status (NEW, REPLIED, ARCHIVED)
received_at
replied_at
```

---

## Setup

### 1. **Install Dependencies**
```bash
cd /home/user/django-tellonym-api
pip install python-telegram-bot requests
```

### 2. **Get Bot Token**
- Open Telegram → @BotFather
- Send `/newbot`
- Copy token

### 3. **Run the Bot**
```bash
export TELEGRAM_BOT_TOKEN="your_token_here"
python telegram_bot_advanced.py
```

---

## Commands

### User Commands

```
/start                    - Open main menu
/chats                    - View all stored chats
/reply <id> <message>    - Save reply to a chat
/logout                  - Logout
```

### Menu Buttons

```
💬 View Chats           - Show all messages
📊 Stats                - Display statistics
📝 Reply                - Save responses
🔄 Refresh              - Update messages
```

---

## Usage Examples

### 1. **Login**
```
/start
→ Click "🔐 Login"
→ Enter username
→ Enter password
```

### 2. **View Messages**
```
/chats
Shows:
[Chat #1] (Msg ID: 123)
"What's your biggest dream?"
Status: NEW
```

### 3. **Reply to a Message**
```
/reply 1 "My biggest dream is to travel the world!"
✅ Reply saved to Chat #1!
```

### 4. **View Statistics**
```
📊 Chat Statistics
📬 Total Messages: 15
🆕 New: 3
💬 Replied: 8
📦 Archived: 4
```

---

## Database Operations

### View All Chats
```bash
sqlite3 tellonym_chats.db "SELECT * FROM tellonym_chats;"
```

### View User Data
```bash
sqlite3 tellonym_chats.db "SELECT * FROM telegram_users;"
```

### Export Chats to JSON
```bash
sqlite3 tellonym_chats.db ".mode json" "SELECT * FROM tellonym_chats;" > chats.json
```

### Clear All Data
```bash
sqlite3 tellonym_chats.db "DELETE FROM tellonym_chats; DELETE FROM telegram_users;"
```

---

## Message States

| State | Meaning |
|-------|---------|
| **NEW** | Received, not yet replied |
| **REPLIED** | Reply has been saved |
| **ARCHIVED** | Message archived/processed |

---

## Architecture

```
┌────────────────────────────────┐
│   Telegram User              │
│   (Sends /start, /chats)    │
└────────────────┬──────────────┘
                 │
         ┌───────▼────────┐
         │ Telegram Bot   │
         │ (Advanced)     │
         └───────┬────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
┌───▼────────────┐   ┌──────────▼──────┐
│ API Requests   │   │ SQLite Database │
│ (Login, List)  │   │ (Chat Storage)  │
└───┬────────────┘   └──────────┬──────┘
    │                           │
    │    ┌──────────────────────┘
    │    │
┌───▼────▼──────────────┐
│ django-tellonym-api   │
│ (localhost:8000)      │
└───┬───────────────────┘
    │
┌───▼─────────────────┐
│ Tellonym.me API     │
│ (tellonym.me)       │
└─────────────────────┘
```

---

## Advanced Features

### 1. **Persistent Storage**
- All messages automatically saved
- Never lose chat history
- SQLite database file: `tellonym_chats.db`

### 2. **Multi-User Support**
- Each user has their own token
- Separate message history
- Telegram ID based isolation

### 3. **Status Tracking**
- Track which messages you've replied to
- Timestamp of each reply
- Archive completed conversations

### 4. **Export & Backup**
```bash
# Backup database
cp tellonym_chats.db tellonym_chats.backup.db

# Restore database
cp tellonym_chats.backup.db tellonym_chats.db
```

---

## Troubleshooting

### "Database is locked"
- Close other connections to the database
- Restart the bot

### "Chat not found"
- Make sure chat ID is correct
- Run `/chats` to see all chat IDs

### "API connection error"
- Start Django API: `python manage.py runserver`
- Check localhost:8000 is accessible

---

## Next Steps

- Add message search functionality
- Add automatic notifications for new messages
- Integrate with Django models
- Add webhook for background updates
- Deploy to cloud (AWS, Heroku, etc.)

---

## Security Notes

⚠️ **Keep your bot token private!**

```bash
# ✅ Good
export TELEGRAM_BOT_TOKEN="$(cat ~/.telegram_token)"

# ❌ Bad - Don't hardcode in code!
token = "123456:ABC..."
```

---

## File Structure

```
django-tellonym-api/
├── manage.py
├── telegram_bot.py                 # Basic bot
├── telegram_bot_advanced.py        # Chat storage bot (THIS ONE)
├── chat_models.py                  # Database models
├── TELEGRAM_BOT_SETUP.md          # Basic setup
├── TELEGRAM_BOT_ADVANCED.md       # This file
├── requirements.txt
└── tellonym_chats.db              # SQLite database (auto-created)
```

---

## Support

For issues or questions:
1. Check logs: `tail -f /tmp/bot.log`
2. Test API: `curl http://localhost:8000/api/list/`
3. Check database: `sqlite3 tellonym_chats.db ".tables"`
