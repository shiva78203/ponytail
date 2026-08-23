import os
import json
import sqlite3
import requests
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    ConversationHandler, ContextTypes, filters
)
from telegram.constants import ParseMode

API_URL = "http://localhost:8000/api"
DB_FILE = "tellonym_chats.db"

WAITING_FOR_USERNAME = 1
WAITING_FOR_PASSWORD = 2
MAIN_MENU = 3
WAITING_FOR_REPLY = 4

user_sessions = {}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telegram_users (
            telegram_id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            tellonym_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tellonym_chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER,
            tellonym_message_id INTEGER,
            message_text TEXT,
            reply_text TEXT,
            status TEXT DEFAULT 'NEW',
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            replied_at TIMESTAMP,
            FOREIGN KEY(telegram_id) REFERENCES telegram_users(telegram_id),
            UNIQUE(telegram_id, tellonym_message_id)
        )
    ''')
    conn.commit()
    conn.close()

def save_user(telegram_id, username, token):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO telegram_users (telegram_id, username, tellonym_token)
            VALUES (?, ?, ?)
        ''', (telegram_id, username, token))
        conn.commit()
    finally:
        conn.close()

def save_chat(telegram_id, msg_id, text):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO tellonym_chats (telegram_id, tellonym_message_id, message_text)
            VALUES (?, ?, ?)
        ''', (telegram_id, msg_id, text))
        conn.commit()
    finally:
        conn.close()

def get_chats(telegram_id, status='NEW'):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT id, tellonym_message_id, message_text, status, received_at
            FROM tellonym_chats
            WHERE telegram_id = ? AND status = ?
            ORDER BY received_at DESC
        ''', (telegram_id, status))
        return cursor.fetchall()
    finally:
        conn.close()

def get_chat(telegram_id, chat_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT id, tellonym_message_id, message_text, reply_text, status
            FROM tellonym_chats
            WHERE telegram_id = ? AND id = ?
        ''', (telegram_id, chat_id))
        return cursor.fetchone()
    finally:
        conn.close()

def update_chat_reply(chat_id, reply_text, status='REPLIED'):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE tellonym_chats
            SET reply_text = ?, status = ?, replied_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (reply_text, status, chat_id))
        conn.commit()
    finally:
        conn.close()

def get_all_chats(telegram_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT COUNT(*) FROM tellonym_chats WHERE telegram_id = ?
        ''', (telegram_id,))
        return cursor.fetchone()[0]
    finally:
        conn.close()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    init_db()
    keyboard = [
        [InlineKeyboardButton("🔐 Login", callback_data="login")],
        [InlineKeyboardButton("💬 View Chats", callback_data="chats")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "👋 Welcome to Advanced Tellonym Bot!\n\n"
        "📱 Manage and store your anonymous messages\n"
        "💾 All chats are saved locally\n"
        "💬 Reply to messages directly",
        reply_markup=reply_markup
    )
    return MAIN_MENU

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    if query.data == "login":
        await query.edit_message_text("📝 What's your Tellonym username?")
        return WAITING_FOR_USERNAME

    elif query.data == "help":
        help_text = """
🤖 **Advanced Tellonym Bot**

**Commands:**
/start - Main menu
/chats - View all chats
/reply <chat_id> <message> - Reply to a chat
/search <text> - Search messages
/stats - Chat statistics
/logout - Logout

**Features:**
✅ Store all messages locally
✅ Reply to messages
✅ Search chat history
✅ View statistics
        """
        await query.edit_message_text(help_text, parse_mode=ParseMode.MARKDOWN)
        return MAIN_MENU

    elif query.data == "chats":
        if user_id not in user_sessions:
            await query.edit_message_text("❌ Please login first!")
            return MAIN_MENU

        session = user_sessions[user_id]
        try:
            response = requests.get(
                f"{API_URL}/list/",
                headers={
                    "Username": session["username"],
                    "Auth": session["token"]
                }
            )

            if response.status_code == 200:
                messages = json.loads(response.text)
                if not messages:
                    await query.edit_message_text("📭 No new messages!")
                    return MAIN_MENU

                for msg in messages:
                    save_chat(user_id, msg["pk"], msg["fields"]["text"])

                chats = get_chats(user_id, 'NEW')
                if not chats:
                    await query.edit_message_text("📭 No new messages!")
                    return MAIN_MENU

                text = f"📬 **Your Chats** ({len(chats)} new)\n\n"
                for chat in chats[:10]:
                    chat_id, msg_id, msg_text, status, timestamp = chat
                    text += f"**[Chat #{chat_id}]** (Msg ID: {msg_id})\n"
                    text += f"{msg_text[:50]}{'...' if len(msg_text) > 50 else ''}\n"
                    text += f"_Status: {status}_\n\n"

                keyboard = [
                    [InlineKeyboardButton("🔄 Refresh", callback_data="chats")],
                    [InlineKeyboardButton("📊 Stats", callback_data="stats")],
                    [InlineKeyboardButton("⬅️ Back", callback_data="back")],
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                await query.edit_message_text(text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
                return MAIN_MENU
            else:
                await query.edit_message_text("❌ Failed to fetch messages!")
                return MAIN_MENU
        except Exception as e:
            await query.edit_message_text(f"❌ Error: {str(e)}")
            return MAIN_MENU

    elif query.data == "stats":
        if user_id not in user_sessions:
            await query.edit_message_text("❌ Please login first!")
            return MAIN_MENU

        total = get_all_chats(user_id)
        new = len(get_chats(user_id, 'NEW'))
        replied = len(get_chats(user_id, 'REPLIED'))
        archived = len(get_chats(user_id, 'ARCHIVED'))

        text = f"""
📊 **Chat Statistics**

📬 Total Messages: **{total}**
🆕 New: **{new}**
💬 Replied: **{replied}**
📦 Archived: **{archived}**
        """

        keyboard = [
            [InlineKeyboardButton("⬅️ Back", callback_data="back")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
        return MAIN_MENU

    elif query.data == "back":
        keyboard = [
            [InlineKeyboardButton("💬 View Chats", callback_data="chats")],
            [InlineKeyboardButton("📊 Stats", callback_data="stats")],
            [InlineKeyboardButton("🔓 Logout", callback_data="logout")],
            [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("🏠 Main Menu", reply_markup=reply_markup)
        return MAIN_MENU

    elif query.data == "logout":
        user_id = query.from_user.id
        if user_id in user_sessions:
            del user_sessions[user_id]
        keyboard = [
            [InlineKeyboardButton("🔐 Login", callback_data="login")],
            [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("👋 Logged out!", reply_markup=reply_markup)
        return MAIN_MENU

    return MAIN_MENU

async def username_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    username = update.message.text
    context.user_data["username"] = username
    await update.message.reply_text("🔑 Now enter your password:")
    return WAITING_FOR_PASSWORD

async def password_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    password = update.message.text
    username = context.user_data["username"]
    user_id = update.message.from_user.id

    try:
        response = requests.post(
            f"{API_URL}/login/",
            data={"username": username, "password": password}
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("Success"):
                token = data.get("Auth")
                user_sessions[user_id] = {
                    "username": username,
                    "token": token
                }
                save_user(user_id, username, token)

                keyboard = [
                    [InlineKeyboardButton("💬 View Chats", callback_data="chats")],
                    [InlineKeyboardButton("📊 Stats", callback_data="stats")],
                    [InlineKeyboardButton("🔓 Logout", callback_data="logout")],
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)

                await update.message.reply_text(
                    f"✅ Welcome, {username}!\n\nYou're now logged in.",
                    reply_markup=reply_markup
                )
                return MAIN_MENU
            else:
                await update.message.reply_text(
                    "❌ Login failed. What's your username?"
                )
                return WAITING_FOR_USERNAME
        else:
            await update.message.reply_text(
                "❌ Login failed. What's your username?"
            )
            return WAITING_FOR_USERNAME
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return WAITING_FOR_USERNAME

async def reply_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first with /start")
        return

    if len(context.args) < 2:
        await update.message.reply_text("❌ Usage: /reply <chat_id> <message>")
        return

    chat_id = context.args[0]
    reply_text = " ".join(context.args[1:])

    try:
        chat = get_chat(user_id, int(chat_id))
        if not chat:
            await update.message.reply_text(f"❌ Chat #{chat_id} not found!")
            return

        update_chat_reply(int(chat_id), reply_text, 'REPLIED')
        await update.message.reply_text(
            f"✅ Reply saved to Chat #{chat_id}!\n\n_Reply:_ {reply_text}",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def chats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first with /start")
        return

    chats = get_chats(user_id, 'NEW')
    if not chats:
        await update.message.reply_text("📭 No new messages!")
        return

    text = f"📬 **Your Chats** ({len(chats)} new)\n\n"
    for chat in chats:
        chat_id, msg_id, msg_text, status, timestamp = chat
        text += f"**[Chat #{chat_id}]** (Msg ID: {msg_id})\n{msg_text}\n\n"

    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

async def logout_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id in user_sessions:
        del user_sessions[user_id]
    await update.message.reply_text("👋 Logged out!")

def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        print("❌ Error: TELEGRAM_BOT_TOKEN environment variable not set!")
        return

    app = Application.builder().token(token).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            WAITING_FOR_USERNAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, username_input)],
            WAITING_FOR_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, password_input)],
            MAIN_MENU: [CallbackQueryHandler(button_click)],
        },
        fallbacks=[CommandHandler("start", start)],
    )

    app.add_handler(conv_handler)
    app.add_handler(CommandHandler("chats", chats_command))
    app.add_handler(CommandHandler("reply", reply_command))
    app.add_handler(CommandHandler("logout", logout_command))

    print("🤖 Advanced Tellonym Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
