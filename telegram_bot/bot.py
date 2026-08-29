"""
Telegram Multi-Account Live Stream Automation Master Bot
Developed for real multi-account live stream listener automation.
"""
import asyncio
import logging
from pyrogram import Client, filters
from pyrogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    CallbackQuery
)
from config import BOT_TOKEN, API_ID, API_HASH, ADMIN_IDS, JOIN_DELAY_SEC, DATABASE_FILE
from session_manager import SessionManager
from live_worker import LiveStreamWorker

# Logging setup
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger("LiveBot")

if not BOT_TOKEN:
    logger.error("❌ BOT_TOKEN is missing! Please configure .env file.")

# Initialize components
session_mgr = SessionManager(DATABASE_FILE)
live_worker = LiveStreamWorker()

# Temporary conversation state for users
# user_id -> { "step": "waiting_phone" | "waiting_otp" | "waiting_2fa" | "waiting_live_link", ... }
user_states = {}

app = Client(
    "LiveMasterBot",
    bot_token=BOT_TOKEN,
    api_id=API_ID,
    api_hash=API_HASH,
    in_memory=True
)

def is_admin(user_id: int) -> bool:
    if not ADMIN_IDS:
        return True # If no admin specified, first user or all allowed
    return user_id in ADMIN_IDS

def main_menu_keyboard(selected_count: int, total_count: int) -> InlineKeyboardMarkup:
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
            InlineKeyboardButton("ℹ️ কিভাবে কাজ করে ও হেল্প", callback_data="help_menu"),
            InlineKeyboardButton("⚙️ সেটিংস", callback_data="settings_menu")
        ]
    ])

@app.on_message(filters.command("start") & filters.private)
async def start_handler(client: Client, message: Message):
    user_id = message.from_user.id
    if not is_admin(user_id):
        await message.reply_text("⛔ দুঃখিত! এই বটটি শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য সংরক্ষিত।")
        return

    accounts = session_mgr.get_all_accounts()
    joined = len(live_worker.joined_accounts)
    
    welcome_text = (
        f"👋 **আসসালামু আলাইকুম, {message.from_user.first_name}!**\n\n"
        f"🤖 **Telegram Live Multi-Account Controller Bot**-এ স্বাগতম।\n\n"
        f"📌 **সিস্টেম সারসংক্ষেপ:**\n"
        f"• মোট সংরক্ষিত অ্যাকাউন্ট: `{len(accounts)}` টি\n"
        f"• বর্তমানে লাইভে সক্রিয়: `{joined}` টি\n"
        f"• লাইভ টার্গেট: `{live_worker.current_live_chat or 'কোনোটি নয়'}`\n\n"
        f"👇 নিচের বাটনগুলো দিয়ে আপনার অ্যাকাউন্ট ম্যানেজ করুন এবং লাইভে জয়েন করান:"
    )
    await message.reply_text(welcome_text, reply_markup=main_menu_keyboard(len(accounts), len(accounts)))

@app.on_callback_query()
async def callback_router(client: Client, query: CallbackQuery):
    user_id = query.from_user.id
    if not is_admin(user_id):
        await query.answer("⛔ অনুমোদিত নয়!", show_alert=True)
        return

    data = query.data

    if data == "main_menu":
        user_states.pop(user_id, None)
        accounts = session_mgr.get_all_accounts()
        joined = len(live_worker.joined_accounts)
        text = (
            f"🏠 **প্রধান মেনু**\n\n"
            f"• মোট অ্যাকাউন্ট: `{len(accounts)}` টি\n"
            f"• লাইভে সক্রিয়: `{joined}` টি"
        )
        await query.message.edit_text(text, reply_markup=main_menu_keyboard(len(accounts), len(accounts)))
        await query.answer()

    elif data == "add_acc":
        user_states[user_id] = {"step": "waiting_phone"}
        text = (
            "📱 **নতুন Telegram অ্যাকাউন্ট যোগ করার পদ্ধতি:**\n\n"
            "অনুগ্রহ করে যে অ্যাকাউন্টটি যুক্ত করতে চান তার **আন্তর্জাতিক কান্ট্রি কোড সহ ফোন নম্বরটি পাঠান**।\n\n"
            "👉 উদাহরণ: `+8801700000000` অথবা `+1234567890`\n\n"
            "_নম্বর পাঠানোর পর আপনার টেলিগ্রাম অ্যাপে একটি ওটিপি (OTP) কোড যাবে।_"
        )
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 বাতিল ও ফিরে যান", callback_data="main_menu")]
        ])
        await query.message.edit_text(text, reply_markup=keyboard)
        await query.answer()

    elif data == "list_accs":
        accounts = session_mgr.get_all_accounts()
        if not accounts:
            text = "📭 বর্তমানে কোনো অ্যাকাউন্ট সেভ করা নেই। প্রথমে 'নতুন অ্যাকাউন্ট যোগ করুন' বাটনে চাপুন।"
            kb = InlineKeyboardMarkup([
                [InlineKeyboardButton("➕ নতুন অ্যাকাউন্ট যোগ করুন", callback_data="add_acc")],
                [InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]
            ])
            await query.message.edit_text(text, reply_markup=kb)
            await query.answer()
            return

        text = f"📋 **সংরক্ষিত অ্যাকাউন্টের তালিকা ({len(accounts)} টি):**\n\n"
        buttons = []
        for idx, acc in enumerate(accounts):
            name = acc.get("name", "অজানা")
            phone = acc.get("phone", "")
            is_live = str(acc.get("id")) in live_worker.joined_accounts
            status_icon = "🔴 লাইভে আছে" if is_live else "🟢 প্রস্তুত"
            text += f"{idx+1}. **{name}** (`{phone}`) - {status_icon}\n"
            buttons.append([InlineKeyboardButton(f"❌ ডিলিট: {name}", callback_data=f"del_{acc.get('id')}")])

        buttons.append([InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")])
        await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(buttons))
        await query.answer()

    elif data.startswith("del_"):
        acc_id = data.replace("del_", "")
        deleted = session_mgr.remove_account(acc_id)
        if deleted:
            await query.answer("✅ অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে!", show_alert=True)
        else:
            await query.answer("❌ অ্যাকাউন্ট পাওয়া যায়নি!", show_alert=True)
        # Refresh list
        accounts = session_mgr.get_all_accounts()
        text = f"📋 **সংরক্ষিত অ্যাকাউন্টের তালিকা ({len(accounts)} টি):**\n"
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]])
        await query.message.edit_text(text, reply_markup=kb)

    elif data == "start_live_flow":
        accounts = session_mgr.get_all_accounts()
        if not accounts:
            await query.answer("❌ কোনো অ্যাকাউন্ট যুক্ত করা নেই! আগে অ্যাকাউন্ট যোগ করুন।", show_alert=True)
            return

        user_states[user_id] = {"step": "waiting_live_link"}
        text = (
            "🚀 **লাইভ স্ট্রিমে যুক্ত করার জন্য লিংক দিন:**\n\n"
            "যে টেলিগ্রাম চ্যানেল বা গ্রুপের লাইভ স্ট্রিমে অ্যাকাউন্টগুলো পাঠাতে চান, সেটির ইউজারনেম বা লিংক পাঠান।\n\n"
            "👉 উদাহরণ:\n"
            "• `@mychannelusername`\n"
            "• `https://t.me/mygroupname`\n"
            "• `https://t.me/+AbCdEfGhIjK123` (Private Group Link)"
        )
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 বাতিল", callback_data="main_menu")]])
        await query.message.edit_text(text, reply_markup=kb)
        await query.answer()

    elif data == "leave_all_live":
        left = await live_worker.leave_all_live_streams()
        await query.answer(f"🛑 লাইভ থেকে {left} টি অ্যাকাউন্ট সফলভাবে বের করে আনা হয়েছে!", show_alert=True)
        accounts = session_mgr.get_all_accounts()
        await query.message.edit_text(
            f"🛑 সব অ্যাকাউন্ট লাইভ থেকে সফলভাবে ডিসকানেক্ট করা হয়েছে।\nমোট ডিসকানেক্টেড: `{left}` টি।",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]])
        )

    elif data == "send_reactions_menu":
        if not live_worker.joined_accounts:
            await query.answer("⚠️ বর্তমানে কোনো অ্যাকাউন্ট লাইভে নেই!", show_alert=True)
            return

        kb = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("❤️ লাভ", callback_data="react_heart"),
                InlineKeyboardButton("🔥 আগুন", callback_data="react_fire"),
                InlineKeyboardButton("👍 লাইক", callback_data="react_thumbs")
            ],
            [
                InlineKeyboardButton("👏 তালি", callback_data="react_clap"),
                InlineKeyboardButton("🎉 পার্টি", callback_data="react_party")
            ],
            [InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]
        ])
        await query.message.edit_text("✨ লাইভে সবগুলো অ্যাকাউন্ট থেকে কী রিঅ্যাকশন পাঠাতে চান?", reply_markup=kb)
        await query.answer()

    elif data.startswith("react_"):
        emoji_map = {
            "react_heart": "❤️",
            "react_fire": "🔥",
            "react_thumbs": "👍",
            "react_clap": "👏",
            "react_party": "🎉"
        }
        emoji = emoji_map.get(data, "❤️")
        await live_worker.send_live_reaction(emoji)
        await query.answer(f"✅ {emoji} রিঅ্যাকশন লাইভে পাঠানো হয়েছে!", show_alert=True)

    elif data == "show_status":
        accounts = session_mgr.get_all_accounts()
        joined = len(live_worker.joined_accounts)
        text = (
            "📊 **সিস্টেম লাইভ স্ট্যাটাস:**\n\n"
            f"• মোট অ্যাকাউন্ট সংখ্যা: `{len(accounts)}`\n"
            f"• লাইভে সংযুক্ত অ্যাকাউন্ট: `{joined}`\n"
            f"• বর্তমান লাইভ রুম: `{live_worker.current_live_chat or 'কোনোটি নয়'}`\n"
            f"• লাইভ অটোমেশন ইঞ্জিন: `PyTgCalls + MTProto Active`\n"
            f"• অ্যান্ট্রি-ব্যান ডিলে: `{JOIN_DELAY_SEC} সেকেন্ড`\n"
        )
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]])
        await query.message.edit_text(text, reply_markup=kb)
        await query.answer()

    elif data == "help_menu":
        help_text = (
            "ℹ️ **ব্যবহার নির্দেশিকা ও প্রশ্নোত্তর:**\n\n"
            "১. **অ্যাকাউন্ট যোগ:** 'নতুন অ্যাকাউন্ট যোগ করুন' এ চাপুন -> ফোন নম্বর দিন -> টেলিগ্রাম অ্যাপে আসা ৫ সংখ্যার কোড পাঠান।\n\n"
            "২. **লাইভে নিয়ে যাওয়া:** 'লাইভ স্ট্রিমে জয়েন করান' এ চাপুন -> আপনার গ্রুপ বা চ্যানেলের লিংক দিন -> সবগুলো আইডি অটোমেটিক লাইভে প্রবেশ করবে।\n\n"
            "৩. **রিয়েল মেম্বারদের মতো থাকা:** আইডিগুলো লাইভে ঢুকে লাইভ অডিও শুনবে এবং লাইভ চ্যাট বক্সে রিঅ্যাকশন দিতে পারবে।\n\n"
            "৪. **লাইভ শেষ করা:** 'লাইভ ত্যাগ করুন' চাপলে সব আইডি এক ক্লিকে লাইভ ছেড়ে বেরিয়ে আসবে।"
        )
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]])
        await query.message.edit_text(help_text, reply_markup=kb)
        await query.answer()

@app.on_message(filters.text & filters.private)
async def message_input_handler(client: Client, message: Message):
    user_id = message.from_user.id
    if not is_admin(user_id):
        return

    state = user_states.get(user_id)
    if not state:
        return

    step = state.get("step")

    # Step 1: Receiving Phone Number
    if step == "waiting_phone":
        phone = message.text.strip().replace(" ", "")
        if not phone.startswith("+") or len(phone) < 8:
            await message.reply_text("❌ ভুল ফোন নম্বর ফরম্যাট! অনুগ্রহ করে কান্ট্রি কোড সহ পাঠান (যেমন: `+8801700000000`)।")
            return

        status_msg = await message.reply_text(f"⏳ `{phone}` নম্বরে লগইন ওটিপি (OTP) পাঠানো হচ্ছে...")
        res = await session_mgr.start_phone_login(phone, API_ID, API_HASH)

        if res.get("status") == "otp_sent":
            user_states[user_id] = {
                "step": "waiting_otp",
                "phone": phone
            }
            await status_msg.edit_text(
                f"📩 `{phone}` নম্বরে টেলিগ্রাম থেকে ৫ সংখ্যার একটি লগইন কোড পাঠানো হয়েছে।\n\n"
                f"দয়া করে কোডটি এখানে মেসেজ করুন (যেমন: `1 2 3 4 5` বা `12345`):"
            )
        else:
            await status_msg.edit_text(f"❌ লগইন শুরু করতে ত্রুটি হয়েছে:\n`{res.get('error')}`")
            user_states.pop(user_id, None)

    # Step 2: Receiving OTP Code
    elif step == "waiting_otp":
        otp = message.text.strip().replace(" ", "").replace("-", "")
        phone = state.get("phone")
        status_msg = await message.reply_text(f"⏳ কোড যাচাই করা হচ্ছে...")

        res = await session_mgr.verify_phone_code(phone, otp)
        if res.get("status") == "success":
            acc = res.get("account", {})
            user_states.pop(user_id, None)
            accounts = session_mgr.get_all_accounts()
            await status_msg.edit_text(
                f"🎉 **অভিনন্দন! অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে!**\n\n"
                f"👤 নাম: `{acc.get('name')}`\n"
                f"📱 নম্বর: `{acc.get('phone')}`\n"
                f"🆔 আইডি: `{acc.get('id')}`\n"
                f"✨ প্রিমিয়াম: `{'হ্যাঁ' if acc.get('is_premium') else 'না'}`",
                reply_markup=main_menu_keyboard(len(accounts), len(accounts))
            )
        elif res.get("status") == "2fa_required":
            user_states[user_id] = {
                "step": "waiting_2fa",
                "phone": phone,
                "otp": otp
            }
            await status_msg.edit_text("🔐 এই অ্যাকাউন্টে Two-Step Verification পাসওয়ার্ড চালু আছে। দয়া করে আপনার টেলিগ্রাম ২-স্টেপ পাসওয়ার্ডটি লিখুন:")
        else:
            await status_msg.edit_text(f"❌ ওটিপি যাচাই ব্যর্থ হয়েছে:\n`{res.get('error')}`")

    # Step 3: Receiving 2FA Password
    elif step == "waiting_2fa":
        password = message.text.strip()
        phone = state.get("phone")
        otp = state.get("otp")
        status_msg = await message.reply_text(f"⏳ পাসওয়ার্ড যাচাই করা হচ্ছে...")
        res = await session_mgr.verify_phone_code(phone, otp, two_step_password=password)
        if res.get("status") == "success":
            acc = res.get("account", {})
            user_states.pop(user_id, None)
            accounts = session_mgr.get_all_accounts()
            await status_msg.edit_text(
                f"🎉 **অভিনন্দন! ২-স্টেপ পাসওয়ার্ড ভেরিফাই করে অ্যাকাউন্ট যুক্ত হয়েছে!**\n\n"
                f"👤 নাম: `{acc.get('name')}`\n"
                f"📱 নম্বর: `{acc.get('phone')}`",
                reply_markup=main_menu_keyboard(len(accounts), len(accounts))
            )
        else:
            await status_msg.edit_text(f"❌ পাসওয়ার্ড ভুল হয়েছে:\n`{res.get('error')}`")

    # Step 4: Receiving Target Live Link
    elif step == "waiting_live_link":
        target = message.text.strip()
        user_states.pop(user_id, None)
        accounts = session_mgr.get_all_accounts()
        
        status_msg = await message.reply_text(
            f"🚀 **লাইভ স্ট্রিমে জয়েনিং শুরু হয়েছে...**\n\n"
            f"🎯 টার্গেট: `{target}`\n"
            f"👥 মোট অ্যাকাউন্ট: `{len(accounts)}` টি\n"
            f"⏳ একে একে জয়েন করানো হচ্ছে..."
        )

        def log_cb(level: str, text: str):
            logger.info(f"[{level.upper()}] {text}")

        res = await live_worker.join_live_stream(
            accounts=accounts,
            target_chat=target,
            delay_sec=JOIN_DELAY_SEC,
            log_callback=log_cb
        )

        text = (
            f"🏁 **লাইভ স্ট্রিমে জয়েনিং সম্পন্ন!**\n\n"
            f"🎯 রুম: `{res.get('target')}`\n"
            f"✅ সফলভাবে যুক্ত হয়েছে: `{res.get('success')}` টি\n"
            f"❌ ব্যর্থ হয়েছে: `{res.get('failed')}` টি\n\n"
            f"এখন সব আইডি লাইভের ভেতরে আসল শ্রোতা হিসেবে অবস্থান করছে।"
        )
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("❤️ রিঅ্যাকশন পাঠান", callback_data="send_reactions_menu")],
            [InlineKeyboardButton("🛑 লাইভ ত্যাগ করান", callback_data="leave_all_live")],
            [InlineKeyboardButton("🔙 প্রধান মেনু", callback_data="main_menu")]
        ])
        await status_msg.edit_text(text, reply_markup=kb)

if __name__ == "__main__":
    logger.info("🚀 Starting Telegram Live Multi-Account Master Bot...")
    app.run()
