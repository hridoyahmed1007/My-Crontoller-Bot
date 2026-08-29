#!/usr/bin/env bash
# =========================================================
# Telegram Live Multi-Account Bot 1-Click Deployment Script
# =========================================================

echo "🚀 Starting Telegram Live Multi-Account Bot Setup..."

# Update system packages
if command -v apt-get &> /dev/null; then
    echo "📦 Installing system dependencies..."
    sudo apt-get update -y
    sudo apt-get install -y python3 python3-pip python3-venv git ffmpeg
fi

# Create virtualenv
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python Virtual Environment..."
    python3 -m venv venv
fi

# Activate virtualenv
source venv/bin/activate

# Install Python requirements
echo "📥 Installing Python packages (Pyrogram, PyTgCalls, TgCrypto)..."
pip install --upgrade pip
pip install -r requirements.txt

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found! Copying from .env.example..."
    cp .env.example .env
    echo "👉 Please edit the .env file with your BOT_TOKEN, API_ID, and API_HASH."
    echo "👉 Command: nano .env"
    exit 1
fi

echo "✅ Setup Complete! Starting Telegram Live Master Bot..."
python3 bot.py
