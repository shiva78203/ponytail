import os
import json
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    ConversationHandler, ContextTypes
)
from telegram.constants import ParseMode

API_URL = "http://localhost:8000/api"

WAITING_FOR_USERNAME = 1
WAITING_FOR_PASSWORD = 2
MAIN_MENU = 3

user_sessions = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🔐 Login", callback_data="login")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "👋 Welcome to Tellonym Bot!\n\n"
        "I help you manage your anonymous messages on Tellonym.me",
        reply_markup=reply_markup
    )
    return MAIN_MENU

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "login":
        await query.edit_message_text("📝 What's your Tellonym username?")
        return WAITING_FOR_USERNAME

    elif query.data == "help":
        help_text = """
🤖 **Tellonym Bot Commands:**

/start - Main menu
/messages - View new messages
/accept <id> - Accept a message
/discard <id> - Discard a message
/logout - Logout

**How it works:**
1. Login with your Tellonym credentials
2. View your anonymous messages
3. Accept or discard each message
4. Manage everything from Telegram!
        """
        await query.edit_message_text(help_text, parse_mode=ParseMode.MARKDOWN)
        return MAIN_MENU

    elif query.data == "messages":
        user_id = query.from_user.id
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

                text = "📬 **Your Messages:**\n\n"
                for msg in messages:
                    msg_id = msg["pk"]
                    msg_text = msg["fields"]["text"]
                    text += f"**[ID: {msg_id}]**\n{msg_text}\n\n"

                keyboard = [
                    [InlineKeyboardButton("🔄 Refresh", callback_data="messages")],
                    [InlineKeyboardButton("⬅️ Back", callback_data="back")],
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                await query.edit_message_text(text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
                return MAIN_MENU
            else:
                await query.edit_message_text("❌ Failed to fetch messages. Re-login please!")
                return MAIN_MENU
        except Exception as e:
            await query.edit_message_text(f"❌ Error: {str(e)}")
            return MAIN_MENU

    elif query.data == "back":
        keyboard = [
            [InlineKeyboardButton("📬 View Messages", callback_data="messages")],
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
        await query.edit_message_text("👋 Logged out successfully!", reply_markup=reply_markup)
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
                user_sessions[user_id] = {
                    "username": username,
                    "token": data.get("Auth")
                }

                keyboard = [
                    [InlineKeyboardButton("📬 View Messages", callback_data="messages")],
                    [InlineKeyboardButton("🔓 Logout", callback_data="logout")],
                    [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)

                await update.message.reply_text(
                    f"✅ Welcome, {username}!\n\nYou're now logged in.",
                    reply_markup=reply_markup
                )
                return MAIN_MENU
            else:
                await update.message.reply_text(
                    "❌ Login failed. Please try again.\n\nWhat's your username?"
                )
                return WAITING_FOR_USERNAME
        else:
            await update.message.reply_text(
                "❌ Login failed. Please try again.\n\nWhat's your username?"
            )
            return WAITING_FOR_USERNAME
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}\n\nPlease try again.")
        return WAITING_FOR_USERNAME

async def messages_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first with /start")
        return

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
                await update.message.reply_text("📭 No new messages!")
                return

            text = "📬 **Your Messages:**\n\n"
            for msg in messages:
                msg_id = msg["pk"]
                msg_text = msg["fields"]["text"]
                text += f"**[ID: {msg_id}]**\n{msg_text}\n\n"

            await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
        else:
            await update.message.reply_text("❌ Failed to fetch messages. Please re-login with /start")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def accept_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first with /start")
        return

    if not context.args:
        await update.message.reply_text("❌ Usage: /accept <message_id>")
        return

    msg_id = context.args[0]
    session = user_sessions[user_id]

    try:
        response = requests.patch(
            f"{API_URL}/patch/{msg_id}/",
            headers={
                "Username": session["username"],
                "Auth": session["token"]
            },
            json={"state": "ACCEPTED"}
        )

        if response.status_code == 204:
            await update.message.reply_text(f"✅ Message {msg_id} marked as accepted!")
        else:
            await update.message.reply_text(f"❌ Failed to update message {msg_id}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def discard_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first with /start")
        return

    if not context.args:
        await update.message.reply_text("❌ Usage: /discard <message_id>")
        return

    msg_id = context.args[0]
    session = user_sessions[user_id]

    try:
        response = requests.patch(
            f"{API_URL}/patch/{msg_id}/",
            headers={
                "Username": session["username"],
                "Auth": session["token"]
            },
            json={"state": "DISCARDED"}
        )

        if response.status_code == 204:
            await update.message.reply_text(f"🗑️ Message {msg_id} discarded!")
        else:
            await update.message.reply_text(f"❌ Failed to discard message {msg_id}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def logout_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if user_id in user_sessions:
        del user_sessions[user_id]

    keyboard = [
        [InlineKeyboardButton("🔐 Login", callback_data="login")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("👋 Logged out!", reply_markup=reply_markup)

def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        print("❌ Error: TELEGRAM_BOT_TOKEN environment variable not set!")
        print("Get a token from @BotFather on Telegram")
        return

    app = Application.builder().token(token).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            WAITING_FOR_USERNAME: [MessageHandler(None, username_input)],
            WAITING_FOR_PASSWORD: [MessageHandler(None, password_input)],
            MAIN_MENU: [CallbackQueryHandler(button_click)],
        },
        fallbacks=[CommandHandler("start", start)],
    )

    app.add_handler(conv_handler)
    app.add_handler(CommandHandler("messages", messages_command))
    app.add_handler(CommandHandler("accept", accept_command))
    app.add_handler(CommandHandler("discard", discard_command))
    app.add_handler(CommandHandler("logout", logout_command))

    print("🤖 Tellonym Bot is running...")
    print("Press Ctrl+C to stop")
    app.run_polling()

if __name__ == "__main__":
    main()
