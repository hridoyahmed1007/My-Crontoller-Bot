import fs from "fs";
import path from "path";

export interface AdminController {
  id: string;
  name: string;
  telegramId: string;
  username?: string;
  role: "super_admin" | "controller";
  addedAt: string;
  isActive: boolean;
  notes?: string;
}

export type AccountConnectionState =
  | "idle"
  | "in_live"
  | "connecting"
  | "recovering"
  | "reconnecting"
  | "authentication_required"
  | "manually_stopped"
  | "error";

export interface AccountSession {
  id: string;
  phone: string;
  name: string;
  username?: string;
  telegramId?: number | string;
  avatarUrl?: string;
  sessionString: string;
  status: AccountConnectionState;
  connectionState?: "ONLINE" | "CONNECTING" | "RECOVERING" | "RECONNECTING" | "AUTH_REQUIRED" | "IDLE";
  recoveryAttempts?: number;
  lastSuccessfulConnection?: number;
  lastError?: string;
  connectedLive?: string;
  verifiedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "telegram_accounts.json");
const ACCOUNTS_BACKUP_FILE = path.join(DATA_DIR, "telegram_accounts.bak.json");
const BOT_CONFIG_FILE = path.join(DATA_DIR, "bot_config.json");
const ADMINS_FILE = path.join(DATA_DIR, "bot_admins.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[Storage] Failed to create data dir:", err);
  }
}

// Atomic file write to avoid corrupted files on sudden shutdown or crash
function atomicWriteFileSync(filePath: string, data: string): boolean {
  ensureDataDir();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, data, "utf-8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[Storage] Atomic write failed for ${filePath}, falling back to direct write:`, err);
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      fs.writeFileSync(filePath, data, "utf-8");
      return true;
    } catch (fallbackErr) {
      console.error(`[Storage] Direct write failed for ${filePath}:`, fallbackErr);
      return false;
    }
  }
}

// Load saved Admin Controllers from disk
export function loadPersistedAdmins(): AdminController[] {
  ensureDataDir();
  const defaultAdmins: AdminController[] = [
    {
      id: "admin-1",
      name: "Habib Hasan",
      telegramId: "7297762323",
      username: "habib20863",
      role: "super_admin",
      addedAt: "স্থায়ী মাস্টার অ্যাডমিন",
      isActive: true,
      notes: "প্রধান সুপার অ্যাডমিন ও বট নিয়ন্ত্রক"
    }
  ];

  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const raw = fs.readFileSync(ADMINS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[Storage] Error loading admins from file:", err);
  }

  // Seed default admin and save
  savePersistedAdmins(defaultAdmins);
  return defaultAdmins;
}

// Save Admin Controllers to disk
export function savePersistedAdmins(admins: AdminController[]): boolean {
  ensureDataDir();
  try {
    const serialized = JSON.stringify(admins, null, 2);
    const success = atomicWriteFileSync(ADMINS_FILE, serialized);
    if (success) {
      console.log(`[Storage] Permanently saved ${admins.length} admins to ${ADMINS_FILE}`);
    }
    return success;
  } catch (err) {
    console.error("[Storage] Failed to save admins to file:", err);
    return false;
  }
}

// Add or update admin permanently
export function upsertAdminPermanently(admin: AdminController, currentAdmins: AdminController[]): AdminController[] {
  const cleanTgId = admin.telegramId.trim();
  const cleanUsername = (admin.username || "").trim().replace(/^@/, "").toLowerCase();

  const index = currentAdmins.findIndex(
    (a) => a.id === admin.id || (cleanTgId && a.telegramId === cleanTgId) || (cleanUsername && a.username?.toLowerCase() === cleanUsername)
  );

  let updatedList: AdminController[];
  if (index >= 0) {
    updatedList = [...currentAdmins];
    updatedList[index] = {
      ...updatedList[index],
      ...admin,
      id: updatedList[index].id || admin.id
    };
  } else {
    updatedList = [admin, ...currentAdmins];
  }

  savePersistedAdmins(updatedList);
  return updatedList;
}

// Delete admin permanently
export function deleteAdminPermanently(idOrTgId: string, currentAdmins: AdminController[]): AdminController[] {
  const updatedList = currentAdmins.filter(
    (a) => a.id !== idOrTgId && a.telegramId !== idOrTgId
  );
  savePersistedAdmins(updatedList);
  return updatedList;
}

// Toggle admin active status
export function toggleAdminStatusPermanently(id: string, currentAdmins: AdminController[]): AdminController[] {
  const updatedList = currentAdmins.map((a) =>
    a.id === id ? { ...a, isActive: !a.isActive } : a
  );
  savePersistedAdmins(updatedList);
  return updatedList;
}

// Load saved Telegram accounts from disk
export function loadPersistedAccounts(): AccountSession[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Storage] Loaded ${parsed.length} permanent Telegram accounts from disk.`);
        return parsed.map((acc) => ({
          ...acc,
          status: "idle", // Reset transient live status to idle on startup
          connectedLive: undefined
        }));
      }
    }

    // Fallback: check backup file if primary file was missing or empty
    if (fs.existsSync(ACCOUNTS_BACKUP_FILE)) {
      const rawBak = fs.readFileSync(ACCOUNTS_BACKUP_FILE, "utf-8");
      const parsedBak = JSON.parse(rawBak);
      if (Array.isArray(parsedBak) && parsedBak.length > 0) {
        console.log(`[Storage] Loaded ${parsedBak.length} permanent Telegram accounts from backup file.`);
        // Restore to primary file
        savePersistedAccounts(parsedBak);
        return parsedBak.map((acc) => ({
          ...acc,
          status: "idle",
          connectedLive: undefined
        }));
      }
    }
  } catch (err) {
    console.error("[Storage] Error loading accounts from file:", err);
  }
  return [];
}

// Save all accounts safely to disk with backup redundancy
export function savePersistedAccounts(accounts: AccountSession[]): boolean {
  ensureDataDir();
  try {
    const serialized = JSON.stringify(accounts, null, 2);
    const success = atomicWriteFileSync(ACCOUNTS_FILE, serialized);
    if (success && accounts.length > 0) {
      // Also maintain backup copy for zero data loss
      try {
        fs.writeFileSync(ACCOUNTS_BACKUP_FILE, serialized, "utf-8");
      } catch (bakErr) {
        // ignore backup error
      }
      console.log(`[Storage] Permanently saved ${accounts.length} accounts to ${ACCOUNTS_FILE}`);
    }
    return success;
  } catch (err) {
    console.error("[Storage] Failed to save accounts to file:", err);
    return false;
  }
}

// Upsert a single account permanently
export function upsertAccountPermanently(account: AccountSession, currentAccounts: AccountSession[]): AccountSession[] {
  const cleanPhone = account.phone.replace(/\D/g, "");
  const index = currentAccounts.findIndex(
    (a) => (cleanPhone && a.phone.replace(/\D/g, "") === cleanPhone) || (account.id && a.id === account.id)
  );

  let updatedList: AccountSession[];
  if (index >= 0) {
    updatedList = [...currentAccounts];
    updatedList[index] = {
      ...updatedList[index],
      ...account,
      id: updatedList[index].id || account.id,
      sessionString: account.sessionString || updatedList[index].sessionString
    };
  } else {
    updatedList = [account, ...currentAccounts];
  }

  savePersistedAccounts(updatedList);
  return updatedList;
}

// Delete an account permanently - ONLY called upon explicit user/admin command
export function deleteAccountPermanently(idOrPhone: string, currentAccounts: AccountSession[]): AccountSession[] {
  const clean = idOrPhone.replace(/\D/g, "");
  const updatedList = currentAccounts.filter(
    (a) => a.id !== idOrPhone && a.phone.replace(/\D/g, "") !== clean
  );
  savePersistedAccounts(updatedList);
  return updatedList;
}

// Load Bot Config (Token, Admin ID & Active Live Session)
export interface PersistedBotConfig {
  botToken: string;
  adminId: string;
  activeLive?: {
    target: string;
    startedAt: string;
    participantCount: number;
  } | null;
}

export function loadPersistedBotConfig(defaultToken: string, defaultAdminId: string): PersistedBotConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(BOT_CONFIG_FILE)) {
      const raw = fs.readFileSync(BOT_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.botToken) {
        return {
          botToken: parsed.botToken || defaultToken,
          adminId: parsed.adminId || defaultAdminId,
          activeLive: parsed.activeLive || null
        };
      }
    }
  } catch (e) {
    console.error("[Storage] Error loading bot config:", e);
  }
  return { botToken: defaultToken, adminId: defaultAdminId, activeLive: null };
}

export function savePersistedBotConfig(config: PersistedBotConfig) {
  ensureDataDir();
  try {
    const serialized = JSON.stringify(config, null, 2);
    atomicWriteFileSync(BOT_CONFIG_FILE, serialized);
  } catch (e) {
    console.error("[Storage] Error saving bot config:", e);
  }
}
