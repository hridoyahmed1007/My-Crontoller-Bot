import json
import os
import asyncio
from typing import Dict, List, Optional
from pyrogram import Client
from pyrogram.errors import SessionPasswordNeeded, PhoneCodeInvalid, PhoneCodeExpired

class SessionManager:
    def __init__(self, db_file: str = "sessions.json"):
        self.db_file = db_file
        self.active_clients: Dict[str, Client] = {}
        self.pending_logins: Dict[str, dict] = {}
        self._load_db()

    def _load_db(self):
        if not os.path.exists(self.db_file):
            self.data = {"accounts": []}
            self._save_db()
        else:
            try:
                with open(self.db_file, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {"accounts": []}

    def _save_db(self):
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def get_all_accounts(self) -> List[dict]:
        self._load_db()
        return self.data.get("accounts", [])

    def get_account_by_id(self, account_id: str) -> Optional[dict]:
        for acc in self.get_all_accounts():
            if str(acc.get("id")) == str(account_id) or acc.get("phone") == account_id:
                return acc
        return None

    def add_or_update_account(self, account_dict: dict):
        self._load_db()
        accounts = self.data.get("accounts", [])
        existing_idx = next((i for i, a in enumerate(accounts) if a.get("phone") == account_dict.get("phone")), -1)
        if existing_idx >= 0:
            accounts[existing_idx] = account_dict
        else:
            accounts.append(account_dict)
        self.data["accounts"] = accounts
        self._save_db()

    def remove_account(self, phone_or_id: str) -> bool:
        self._load_db()
        accounts = self.data.get("accounts", [])
        new_accs = [a for a in accounts if str(a.get("id")) != str(phone_or_id) and a.get("phone") != phone_or_id]
        if len(new_accs) != len(accounts):
            self.data["accounts"] = new_accs
            self._save_db()
            return True
        return False

    async def start_phone_login(self, phone: str, api_id: int, api_hash: str) -> dict:
        """Sends OTP to the user's phone number via Pyrogram Client"""
        temp_client = Client(
            name=f"temp_{phone.replace('+', '')}",
            api_id=api_id,
            api_hash=api_hash,
            in_memory=True
        )
        await temp_client.connect()
        try:
            sent_code = await temp_client.send_code(phone)
            self.pending_logins[phone] = {
                "client": temp_client,
                "phone_code_hash": sent_code.phone_code_hash,
                "api_id": api_id,
                "api_hash": api_hash,
                "phone": phone
            }
            return {"status": "otp_sent", "phone_code_hash": sent_code.phone_code_hash}
        except Exception as e:
            await temp_client.disconnect()
            return {"status": "error", "error": str(e)}

    async def verify_phone_code(self, phone: str, otp_code: str, two_step_password: Optional[str] = None) -> dict:
        """Verifies OTP, exports StringSession and saves account"""
        login_data = self.pending_logins.get(phone)
        if not login_data:
            return {"status": "error", "error": "No pending login found for this phone number."}

        client: Client = login_data["client"]
        phone_code_hash = login_data["phone_code_hash"]

        try:
            try:
                signed_in_user = await client.sign_in(phone, phone_code_hash, otp_code)
            except SessionPasswordNeeded:
                if not two_step_password:
                    return {"status": "2fa_required", "message": "Two-Step Verification Password Required."}
                signed_in_user = await client.check_password(two_step_password)

            # Export session string
            session_string = await client.export_session_string()
            me = await client.get_me()

            acc_info = {
                "id": str(me.id),
                "name": f"{me.first_name or ''} {me.last_name or ''}".strip(),
                "username": me.username or "",
                "phone": phone,
                "is_premium": getattr(me, "is_premium", False),
                "session_string": session_string,
                "api_id": login_data["api_id"],
                "api_hash": login_data["api_hash"],
                "added_at": asyncio.get_event_loop().time(),
                "status": "ready"
            }

            self.add_or_update_account(acc_info)
            await client.disconnect()
            del self.pending_logins[phone]

            return {"status": "success", "account": acc_info}

        except PhoneCodeInvalid:
            return {"status": "error", "error": "Invalid OTP code provided."}
        except PhoneCodeExpired:
            return {"status": "error", "error": "OTP Code has expired. Please request again."}
        except Exception as e:
            return {"status": "error", "error": str(e)}
