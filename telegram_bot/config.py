import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Token from @BotFather
BOT_TOKEN = os.getenv("BOT_TOKEN", "")

# Telegram API ID and API HASH from https://my.telegram.org
API_ID = int(os.getenv("API_ID", "0")) if os.getenv("API_ID") and os.getenv("API_ID").isdigit() else 0
API_HASH = os.getenv("API_HASH", "")

# Admin Telegram User ID (Only this user can control the bot)
ADMIN_IDS = [int(i.strip()) for i in os.getenv("ADMIN_IDS", "").split(",") if i.strip().isdigit()]

# Database File
DATABASE_FILE = os.getenv("DATABASE_FILE", "sessions.json")

# Default Join Delay between accounts (in seconds to prevent floodwait)
JOIN_DELAY_SEC = float(os.getenv("JOIN_DELAY_SEC", "2.5"))
