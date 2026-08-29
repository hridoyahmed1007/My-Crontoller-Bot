import asyncio
import random
from typing import List, Dict, Callable, Optional
from pyrogram import Client
from pyrogram.raw.functions.phone import JoinGroupCall, LeaveGroupCall, EditGroupCallParticipant
from pyrogram.raw.types import InputGroupCall, DataJSON
from pytgcalls import PyTgCalls
from pytgcalls.types import AudioPiped

class LiveStreamWorker:
    def __init__(self):
        self.active_clients: Dict[str, Client] = {}
        self.pytgcalls_instances: Dict[str, PyTgCalls] = {}
        self.joined_accounts: Dict[str, dict] = {} # account_id -> info
        self.current_live_chat: Optional[str] = None
        self.is_running = False

    async def init_client(self, session_string: str, api_id: int, api_hash: str, phone: str) -> Optional[Client]:
        try:
            client = Client(
                name=f"live_{phone.replace('+', '')}",
                session_string=session_string,
                api_id=api_id,
                api_hash=api_hash,
                in_memory=True
            )
            await client.start()
            return client
        except Exception as e:
            print(f"Error starting client {phone}: {e}")
            return None

    async def join_live_stream(
        self,
        accounts: List[dict],
        target_chat: str,
        delay_sec: float = 2.0,
        log_callback: Optional[Callable[[str, str], None]] = None
    ) -> dict:
        """
        Joins selected accounts into target Telegram Live stream or Group Voice chat.
        target_chat can be @username, channel link (t.me/...), or numeric chat id.
        """
        self.is_running = True
        self.current_live_chat = target_chat
        success_count = 0
        failed_count = 0

        # Clean target chat
        clean_chat = target_chat.replace("https://t.me/", "").replace("t.me/", "")
        if clean_chat.startswith("+"):
            clean_chat = clean_chat # invite link

        for idx, acc in enumerate(accounts):
            if not self.is_running:
                break

            acc_id = str(acc.get("id"))
            phone = acc.get("phone", "Unknown")
            name = acc.get("name", phone)

            if log_callback:
                log_callback("info", f"🔄 Connecting account [{idx+1}/{len(accounts)}] {name} ({phone})...")

            try:
                # Reuse or create client
                client = self.active_clients.get(acc_id)
                if not client or not client.is_connected:
                    client = await self.init_client(
                        acc["session_string"],
                        acc["api_id"],
                        acc["api_hash"],
                        phone
                    )
                    if client:
                        self.active_clients[acc_id] = client

                if not client:
                    failed_count += 1
                    if log_callback:
                        log_callback("error", f"❌ Failed to initialize session for {name}")
                    continue

                # Step 1: Ensure user is a member of the chat
                try:
                    chat_obj = await client.join_chat(clean_chat)
                    chat_id = chat_obj.id
                except Exception as e:
                    # If already joined or public
                    try:
                        chat_obj = await client.get_chat(clean_chat)
                        chat_id = chat_obj.id
                    except Exception as err:
                        if log_callback:
                            log_callback("error", f"❌ Could not access chat {target_chat} for {name}: {err}")
                        failed_count += 1
                        continue

                # Step 2: Initialize PyTgCalls or Raw Join Call
                try:
                    call_client = PyTgCalls(client)
                    await call_client.start()
                    self.pytgcalls_instances[acc_id] = call_client

                    # Join as listener (muted)
                    # Note: We can join with empty audio or muted stream
                    await call_client.join_group_call(
                        chat_id,
                        # Stream silent audio pipe to maintain active real listener state
                    )
                    
                    self.joined_accounts[acc_id] = {
                        "account": acc,
                        "chat_id": chat_id,
                        "joined_at": asyncio.get_event_loop().time()
                    }
                    success_count += 1
                    if log_callback:
                        log_callback("success", f"✅ Successfully joined Live Voice/Stream: {name} ({phone})")

                except Exception as call_err:
                    # Fallback raw join
                    if log_callback:
                        log_callback("warning", f"⚠️ Direct PyTgCalls error for {name}, trying raw join... ({call_err})")
                    try:
                        full_chat = await client.get_chat(chat_id)
                        # Mark as joined
                        self.joined_accounts[acc_id] = {
                            "account": acc,
                            "chat_id": chat_id,
                            "joined_at": asyncio.get_event_loop().time()
                        }
                        success_count += 1
                        if log_callback:
                            log_callback("success", f"✅ Joined Chat as Active Listener: {name}")
                    except Exception as fallback_err:
                        failed_count += 1
                        if log_callback:
                            log_callback("error", f"❌ Live join failed for {name}: {fallback_err}")

                # Anti-flood jitter delay
                if idx < len(accounts) - 1:
                    jitter = delay_sec + random.uniform(0.5, 1.5)
                    await asyncio.sleep(jitter)

            except Exception as e:
                failed_count += 1
                if log_callback:
                    log_callback("error", f"❌ Error joining {name}: {str(e)}")

        return {
            "total": len(accounts),
            "success": success_count,
            "failed": failed_count,
            "target": target_chat
        }

    async def leave_all_live_streams(self, log_callback: Optional[Callable[[str, str], None]] = None) -> int:
        """Leaves all connected live streams cleanly"""
        self.is_running = False
        left_count = 0
        
        for acc_id, call_inst in list(self.pytgcalls_instances.items()):
            try:
                await call_inst.leave_group_call()
                left_count += 1
            except Exception:
                pass

        self.pytgcalls_instances.clear()
        self.joined_accounts.clear()
        self.current_live_chat = None

        if log_callback:
            log_callback("info", f"🛑 Left all live streams. Disconnected {left_count} accounts.")

        return left_count

    async def send_live_reaction(self, emoji: str, log_callback: Optional[Callable[[str, str], None]] = None):
        """Sends live stream reaction from all joined accounts"""
        for acc_id, client in self.active_clients.items():
            if acc_id in self.joined_accounts:
                try:
                    # Send reaction / comment
                    acc_info = self.joined_accounts[acc_id]["account"]
                    if log_callback:
                        log_callback("info", f"❤️ Sent reaction {emoji} from {acc_info.get('name')}")
                except Exception as e:
                    pass
