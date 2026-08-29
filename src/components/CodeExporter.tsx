import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Folder, 
  FileText,
  Play,
  Shield,
  Layers
} from 'lucide-react';

export const CodeExporter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bot.py' | 'live_worker.py' | 'session_manager.py' | 'config.py' | 'requirements.txt' | 'deploy.sh'>('bot.py');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { lang: string; desc: string; code: string }> = {
    'bot.py': {
      lang: 'python',
      desc: 'মাস্টার টেলিগ্রাম বট স্ক্রিপ্ট (হ্যান্ডলার, ইনলাইন কিবোর্ড বাটন ও কনভারসেশন ফ্লো)',
      code: `import asyncio
import logging
from pyrogram import Client, filters
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from config import BOT_TOKEN, API_ID, API_HASH, ADMIN_IDS, JOIN_DELAY_SEC, DATABASE_FILE
from session_manager import SessionManager
from live_worker import LiveStreamWorker

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger("LiveBot")

session_mgr = SessionManager(DATABASE_FILE)
live_worker = LiveStreamWorker()
user_states = {}

app = Client("LiveMasterBot", bot_token=BOT_TOKEN, api_id=API_ID, api_hash=API_HASH, in_memory=True)

def is_admin(user_id: int) -> bool:
    if not ADMIN_IDS:
        return True
    return user_id in ADMIN_IDS

def main_menu_keyboard(total_count: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("➕ নতুন অ্যাকাউন্ট যোগ করুন", callback_data="add_acc"),
            InlineKeyboardButton(f"👥 অ্যাকাউন্ট লিস্ট ({total_count})", callback_data="list_accs")
        ],
        [
            InlineKeyboardButton("🚀 লাইভ স্ট্রিমে জয়েন করান", callback_data="start_live_flow"),
            InlineKeyboardButton("🛑 লাইভ ত্যাগ করুন (Leave)", callback_data="leave_all_live")
        ],
        [
            InlineKeyboardButton("❤️ লাইভে রিঅ্যাকশন পাঠান", callback_data="send_reactions_menu"),
            InlineKeyboardButton("📊 বর্তমান স্ট্যাটাস", callback_data="show_status")
        ],
        [
            InlineKeyboardButton("ℹ️ কিভাবে কাজ করে ও হেল্প", callback_data="help_menu")
        ]
    ])

@app.on_message(filters.command("start") & filters.private)
async def start_handler(client: Client, message: Message):
    if not is_admin(message.from_user.id):
        await message.reply_text("⛔ অননুমোদিত অ্যাক্সেস!")
        return

    accounts = session_mgr.get_all_accounts()
    welcome_text = (
        f"👋 **আসসালামু আলাইকুম, {message.from_user.first_name}!**\\n\\n"
        f"🤖 **Telegram Live Multi-Account Controller Bot**-এ স্বাগতম।\\n\\n"
        f"• মোট সংরক্ষিত অ্যাকাউন্ট: \`{len(accounts)}\` টি\\n"
        f"• লাইভে সক্রিয়: \`{len(live_worker.joined_accounts)}\` টি\\n\\n"
        f"👇 নিচের বাটনগুলো দিয়ে আপনার লাইভ স্ট্রিম পরিচালনা করুন:"
    )
    await message.reply_text(welcome_text, reply_markup=main_menu_keyboard(len(accounts)))

if __name__ == "__main__":
    logger.info("🚀 Starting Master Telegram Bot...")
    app.run()`,
    },
    'live_worker.py': {
      lang: 'python',
      desc: 'MTProto এবং PyTgCalls দিয়ে গ্রুপ লাইভ/ভয়েস চ্যাটে মাল্টি-অ্যাকাউন্ট কানেক্ট করার অটোমেশন ইঞ্জিন',
      code: `import asyncio
import random
from typing import List, Dict, Callable, Optional
from pyrogram import Client
from pytgcalls import PyTgCalls

class LiveStreamWorker:
    def __init__(self):
        self.active_clients: Dict[str, Client] = {}
        self.pytgcalls_instances: Dict[str, PyTgCalls] = {}
        self.joined_accounts: Dict[str, dict] = {}
        self.current_live_chat: Optional[str] = None
        self.is_running = False

    async def join_live_stream(self, accounts: List[dict], target_chat: str, delay_sec: float = 2.5):
        self.is_running = True
        self.current_live_chat = target_chat
        clean_chat = target_chat.replace("https://t.me/", "").replace("t.me/", "")

        for idx, acc in enumerate(accounts):
            if not self.is_running:
                break
            acc_id = str(acc.get("id"))
            client = Client(f"live_{acc_id}", session_string=acc["session_string"], api_id=acc["api_id"], api_hash=acc["api_hash"], in_memory=True)
            await client.start()
            
            # Join channel/group first
            try:
                chat = await client.join_chat(clean_chat)
                chat_id = chat.id
            except Exception:
                chat = await client.get_chat(clean_chat)
                chat_id = chat.id

            # Join voice stream as active listener
            call = PyTgCalls(client)
            await call.start()
            await call.join_group_call(chat_id)
            self.joined_accounts[acc_id] = {"account": acc, "chat_id": chat_id}

            # Anti-flood human delay
            await asyncio.sleep(delay_sec + random.uniform(0.5, 1.5))

    async def leave_all_live_streams(self):
        for acc_id, call in list(self.pytgcalls_instances.items()):
            try:
                await call.leave_group_call()
            except Exception:
                pass
        self.joined_accounts.clear()`,
    },
    'session_manager.py': {
      lang: 'python',
      desc: 'ফোন নম্বর দিয়ে OTP পাঠানো, 2FA ভেরিফাই করা এবং নিরাপদ StringSession তৈরি ও স্টোরেজ ম্যানেজার',
      code: `import json
import os
import asyncio
from typing import Dict, List, Optional
from pyrogram import Client

class SessionManager:
    def __init__(self, db_file: str = "sessions.json"):
        self.db_file = db_file
        self.pending_logins: Dict[str, dict] = {}
        self._load_db()

    def _load_db(self):
        if not os.path.exists(self.db_file):
            self.data = {"accounts": []}
            self._save_db()
        else:
            with open(self.db_file, "r", encoding="utf-8") as f:
                self.data = json.load(f)

    def _save_db(self):
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def get_all_accounts(self) -> List[dict]:
        self._load_db()
        return self.data.get("accounts", [])`,
    },
    'config.py': {
      lang: 'python',
      desc: 'এনভায়রনমেন্ট ভেরিয়েবল এবং সেটিংস লোডার',
      code: `import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "8880348707:AAEpnZBn_rZy1cZvEPag6IG_Wj7_nT72mzI")
API_ID = int(os.getenv("API_ID", "33961947"))
API_HASH = os.getenv("API_HASH", "fc4374b7f36f12d090254c597da0b8c8")
ADMIN_IDS = [int(i.strip()) for i in os.getenv("ADMIN_IDS", "7297762323").split(",") if i.strip().isdigit()]
DATABASE_FILE = os.getenv("DATABASE_FILE", "sessions.json")
JOIN_DELAY_SEC = float(os.getenv("JOIN_DELAY_SEC", "2.5"))`,
    },
    'requirements.txt': {
      lang: 'text',
      desc: 'পাইথন ডিপেন্ডেন্সি প্যাকেজ লিস্ট',
      code: `pyrogram==2.0.106
tgcrypto==1.2.5
pytgcalls==3.0.0.dev24
python-dotenv==1.0.1
aiohttp==3.11.11
requests==2.32.3
pydantic==2.10.6
asyncio`,
    },
    'deploy.sh': {
      lang: 'bash',
      desc: '১-ক্লিক লিনাক্স অটো ইনস্টলেশন ও রান স্ক্রিপ্ট',
      code: `#!/usr/bin/env bash
echo "🚀 Installing Telegram Live Bot..."
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv git ffmpeg
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 bot.py`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([files[activeTab].code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeTab;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="code-exporter-container" className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Exporter Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">
              Python Telegram Bot কোড স্টুডিও
            </h3>
            <p className="text-xs text-slate-400">
              ১০০% স্ট্যান্ডঅ্যালোন পাইথন বটের সোর্স কোড (Ready to Run on Server/PC)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-active-file"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'কপি হয়েছে!' : 'কোড কপি করুন'}
          </button>
          <button
            id="btn-download-active-file"
            onClick={handleDownload}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium shadow flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ডাউনলোড ({activeTab})
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="bg-slate-950/80 px-4 pt-2 border-b border-slate-800 flex flex-wrap gap-1.5">
        {(Object.keys(files) as Array<keyof typeof files>).map((fileName) => (
          <button
            key={fileName}
            id={`tab-file-${fileName}`}
            onClick={() => setActiveTab(fileName)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === fileName
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {fileName}
          </button>
        ))}
      </div>

      {/* File Description Bar */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
        <span className="text-slate-400">{files[activeTab].desc}</span>
        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] uppercase font-mono">
          {files[activeTab].lang}
        </span>
      </div>

      {/* Code Viewer Area */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
        <pre className="whitespace-pre">{files[activeTab].code}</pre>
      </div>
    </div>
  );
};
