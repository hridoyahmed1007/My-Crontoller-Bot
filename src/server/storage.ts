import fs from "fs";
import path from "path";

export interface AdminController {
  id: string;
  name: string;
  telegramId: string;
  username?: string;
  email?: string;
  password?: string;
  role: "super_admin" | "controller";
  addedAt: string;
  isActive: boolean;
  notes?: string;
  permissions?: string[];
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
const ADMINS_BACKUP_FILE = path.join(DATA_DIR, "bot_admins.bak.json");

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
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

export function cleanTelegramDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  for (let i = 0; i < 10; i++) {
    str = str.split(bnDigits[i]).join(String(i));
  }
  return str.replace(/\D/g, "");
}

export function cleanTelegramUsername(val: string | undefined | null): string {
  if (!val) return "";
  let str = String(val).trim();
  str = str.replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "");
  return str.replace(/^@+/, "").toLowerCase().trim();
}

const MASTER_SUPER_ADMIN_RECORD: AdminController = {
  id: "admin-super-owner",
  name: "offline",
  telegramId: "7983626971",
  username: "thebossbd360",
  email: "anarulislamai1020@gmail.com",
  role: "super_admin",
  addedAt: "২৯ আগস্ট, ২০২৬",
  isActive: true,
  notes: "প্রধান সুপার অ্যাডমিন ও একমাত্র অনুমোদিত মালিক",
  permissions: ["full_access", "live_control", "manage_accounts", "reaction_control", "manage_admins"]
};

// Helper to sanitize admin records without filtering out valid controllers
function sanitizeAdminRecords(list: any[]): AdminController[] {
  if (!Array.isArray(list)) return [];
  const valid = list.filter(
    (a) =>
      a &&
      typeof a === "object" &&
      (Boolean(a.telegramId) || Boolean(a.username) || Boolean(a.id))
  );
  return valid;
}

// Load saved Admin Controllers from disk cleanly and reliably
export function loadPersistedAdmins(): AdminController[] {
  ensureDataDir();

  // Try primary ADMINS_FILE first
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const raw = fs.readFileSync(ADMINS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeAdminRecords(parsed);
        const hasMaster = sanitized.some(
          (a) =>
            cleanTelegramDigits(a.telegramId) === "7983626971" ||
            cleanTelegramUsername(a.username) === "thebossbd360"
        );
        const finalAdmins = hasMaster ? sanitized : [MASTER_SUPER_ADMIN_RECORD, ...sanitized];
        return finalAdmins;
      }
    }
  } catch (err) {
    console.warn("[Storage] Warning loading primary admins file:", err);
  }

  // Backup fallback
  try {
    if (fs.existsSync(ADMINS_BACKUP_FILE)) {
      const rawBak = fs.readFileSync(ADMINS_BACKUP_FILE, "utf-8");
      const parsedBak = JSON.parse(rawBak);
      if (Array.isArray(parsedBak) && parsedBak.length > 0) {
        const sanitizedBak = sanitizeAdminRecords(parsedBak);
        const hasMaster = sanitizedBak.some(
          (a) =>
            cleanTelegramDigits(a.telegramId) === "7983626971" ||
            cleanTelegramUsername(a.username) === "thebossbd360"
        );
        const finalBak = hasMaster ? sanitizedBak : [MASTER_SUPER_ADMIN_RECORD, ...sanitizedBak];
        savePersistedAdmins(finalBak);
        return finalBak;
      }
    }
  } catch (err) {
    console.error("[Storage] Error loading backup admins file:", err);
  }

  // Default seed
  const defaultList = [MASTER_SUPER_ADMIN_RECORD];
  savePersistedAdmins(defaultList);
  return defaultList;
}

// Save Admin Controllers permanently to disk
export function savePersistedAdmins(admins: AdminController[]): boolean {
  ensureDataDir();
  try {
    const hasMaster = admins.some(
      (a) =>
        cleanTelegramDigits(a.telegramId) === "7983626971" ||
        cleanTelegramUsername(a.username) === "thebossbd360"
    );
    const fullList = hasMaster ? admins : [MASTER_SUPER_ADMIN_RECORD, ...admins];
    const serialized = JSON.stringify(fullList, null, 2);

    const success1 = atomicWriteFileSync(ADMINS_FILE, serialized);
    try {
      atomicWriteFileSync(ADMINS_BACKUP_FILE, serialized);
    } catch (e) {}

    return success1;
  } catch (err) {
    console.error("[Storage] Failed to save admins to file:", err);
    return false;
  }
}

// Add or update admin permanently
export function upsertAdminPermanently(admin: AdminController, currentAdmins: AdminController[]): AdminController[] {
  const cleanTgId = cleanTelegramDigits(admin.telegramId);
  const cleanUname = cleanTelegramUsername(admin.username);

  const cleanedAdmin: AdminController = {
    ...admin,
    id: admin.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    telegramId: cleanTgId || admin.telegramId,
    username: cleanUname || admin.username,
    isActive: admin.isActive ?? true
  };

  const freshList = currentAdmins && currentAdmins.length > 0 ? currentAdmins : loadPersistedAdmins();
  const index = freshList.findIndex((a) => {
    const aId = cleanTelegramDigits(a.telegramId);
    const aUname = cleanTelegramUsername(a.username);
    return (
      a.id === cleanedAdmin.id ||
      (cleanTgId && aId === cleanTgId) ||
      (cleanUname && aUname === cleanUname)
    );
  });

  let updatedList: AdminController[];
  if (index >= 0) {
    updatedList = [...freshList];
    updatedList[index] = {
      ...updatedList[index],
      ...cleanedAdmin,
      id: updatedList[index].id || cleanedAdmin.id
    };
  } else {
    updatedList = [cleanedAdmin, ...freshList];
  }

  savePersistedAdmins(updatedList);
  return updatedList;
}

// Sync multiple admins permanently
export function syncAdminsPermanently(incomingAdmins: AdminController[], currentAdmins: AdminController[]): AdminController[] {
  const baseList = currentAdmins && currentAdmins.length > 0 ? currentAdmins : loadPersistedAdmins();
  let merged = [...baseList];

  for (const inc of incomingAdmins) {
    if (!inc.telegramId && !inc.username) continue;
    const cleanTgId = cleanTelegramDigits(inc.telegramId);
    const cleanUname = cleanTelegramUsername(inc.username);

    const exists = merged.findIndex((a) => {
      const aId = cleanTelegramDigits(a.telegramId);
      const aUname = cleanTelegramUsername(a.username);
      return a.id === inc.id || (cleanTgId && aId === cleanTgId) || (cleanUname && aUname === cleanUname);
    });

    const sanitizedInc: AdminController = {
      ...inc,
      telegramId: cleanTgId || inc.telegramId,
      username: cleanUname || inc.username,
      isActive: inc.isActive ?? true
    };

    if (exists >= 0) {
      merged[exists] = {
        ...merged[exists],
        ...sanitizedInc,
        id: merged[exists].id || inc.id
      };
    } else {
      merged.push(sanitizedInc);
    }
  }

  savePersistedAdmins(merged);
  return merged;
}

// Delete admin permanently (Master super admin is protected)
export function deleteAdminPermanently(idOrTgId: string, currentAdmins: AdminController[]): AdminController[] {
  const cleanQueryId = cleanTelegramDigits(idOrTgId);
  const cleanQueryUname = cleanTelegramUsername(idOrTgId);
  const baseList = currentAdmins && currentAdmins.length > 0 ? currentAdmins : loadPersistedAdmins();

  const updatedList = baseList.filter((a) => {
    // Master super admin is untouchable
    if (cleanTelegramDigits(a.telegramId) === "7983626971" || cleanTelegramUsername(a.username) === "thebossbd360") {
      return true;
    }
    const aId = cleanTelegramDigits(a.telegramId);
    const aUname = cleanTelegramUsername(a.username);

    if (a.id === idOrTgId) return false;
    if (cleanQueryId && aId === cleanQueryId) return false;
    if (cleanQueryUname && aUname === cleanQueryUname) return false;
    return true;
  });

  savePersistedAdmins(updatedList);
  return updatedList;
}

// Toggle admin active status
export function toggleAdminStatusPermanently(id: string, currentAdmins: AdminController[]): AdminController[] {
  const baseList = currentAdmins && currentAdmins.length > 0 ? currentAdmins : loadPersistedAdmins();
  const updatedList = baseList.map((a) =>
    a.id === id ? { ...a, isActive: !a.isActive } : a
  );
  savePersistedAdmins(updatedList);
  return updatedList;
}

// Helper to generate a collision-free account ID
export function generateUniqueAccountId(accounts: AccountSession[]): string {
  let uniqueId = `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  while (accounts.some((a) => a.id === uniqueId)) {
    uniqueId = `acc_${Date.now() + Math.floor(Math.random() * 10000)}_${Math.floor(Math.random() * 1000)}`;
  }
  return uniqueId;
}

// Default Permanent Telegram Accounts with full MTProto Production Sessions
const DEFAULT_PERMANENT_ACCOUNTS: AccountSession[] = [
  {
    id: "1",
    phone: "+8801917691524",
    name: "offline",
    username: "Thebossbd360",
    telegramId: 7983626971,
    avatarUrl: "https://t.me/i/userpic/320/Thebossbd360.jpg",
    sessionString: "1BQANOTEuMTA4LjU2LjEyNAG7blUG2qR3lxmqmVy0bRulv1flTYMWZgZZ+PH9Sj5xT5cX6PVJi/Zck67r5s0J6qWB1kElQ9/ooJxV5v286lXtSfOvvjOTR7AJD8wOePQm4Opt/iodnrBpcjodoB57ZmmsDGhKGmlACk40Wo3ZNXROMfU+zQNjrps+KkqoLry9J6R17iFNfAnBIBKAD0QAtq8irJ91o98Yv9An1RVpkF72gf+oiPb33chcNYAbebzIvfen97MQYCujE/YLtv688aAfBqWIfbc84RFoW8sIt+e3FxjMv60n8JdKBMBAhtQ8qX6lOX21cT+9+Z1/hCT5JLRiaVCv8PA4UFZGo+9O4fRDkw==",
    status: "idle",
    verifiedAt: "MTProto Live Verified"
  },
  {
    id: "2",
    phone: "+8801891969352",
    name: "Mariya Akter",
    username: "moriom12308",
    telegramId: 7277720986,
    avatarUrl: "https://t.me/i/userpic/320/moriom12308.jpg",
    sessionString: "1BQANOTEuMTA4LjU2LjEyNAG7mRR5eWW2J1KXOShlAlX0AKG/jDfhG6WWF7iaM4Qq1mQw9EmWdNfzIelbdxgda+Mo0VuU4ZAe4jQYbMabrsgOtaAf96MhvxHnlZZ2gnNjl26Ie+OcPcj2qSl4LKWt9t/aNltdAFNeBIxjXAxhX5iwSY9Vnvn98lJZWa/6gc2AuLptXpeIIibp48Kye99U5619jjIz7WwPTKWPBldf3rrMsf2uFal594towpOS4Kg0p+LBB7Vph8+4ZcfySCwbp+fTVHiHWf2Q7sKzqcAoIeRHelCW5cr3HxhDWSxuyH6j8XGg68c6o0uCmF32LiotfI7VuuhKeEfUz+vsZCnPnbcNjw==",
    status: "idle",
    verifiedAt: "MTProto Live Verified"
  },
  {
    id: "3",
    phone: "+8801712345678",
    name: "Tahsan Ahmed",
    username: "Tahsan_Ahmed12",
    telegramId: 8552972620,
    avatarUrl: "https://t.me/i/userpic/320/Tahsan_Ahmed12.jpg",
    sessionString: "1BQANOTEuMTA4LjU2LjEyNAG7QqmiZU6mtkgnZejpf14DS/kgzRCVoLFv0nIr/Pma6KwWF/ScqYp+yJf0eRMFgm7cfqzt6AjPaLOA/pyCrsw6FW0uNcpkeKnXVd+Tcg9x+je7RG9g4wO3lnjr9H89NeOVs0NOiy+21VkqCe8eKbOfXMYjnVCV2RO8GW8614I2RuHm1rfAdyeghrBTua1DTPUjuv1Ab7tTX7lynPF8rmpQ4KJgByCTWNHAqwir4roN3mYq1mJSIy5euX1yqZtTTYpf3hxBU9vNwHA9738pbjMhjwE4QohY5jx6JeWuMQPTYGHgPFAz51NXNV28gaE6pCUd+Th4dyGxH8zBnfyWho6/WQ==",
    status: "idle",
    verifiedAt: "MTProto Live Verified"
  }
];

// Load saved Telegram accounts from disk
export function loadPersistedAccounts(): AccountSession[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter(a => a && typeof a === "object");

        if (cleaned.length > 0) {
          console.log(`[Storage] Loaded ${cleaned.length} permanent Telegram accounts from disk.`);
          return cleaned.map((acc) => ({
            ...acc,
            status: "idle",
            connectedLive: undefined
          }));
        }
      }
    }

    // Fallback: check backup file if primary file was missing or empty
    if (fs.existsSync(ACCOUNTS_BACKUP_FILE)) {
      const rawBak = fs.readFileSync(ACCOUNTS_BACKUP_FILE, "utf-8");
      const parsedBak = JSON.parse(rawBak);
      if (Array.isArray(parsedBak) && parsedBak.length > 0) {
        const cleanedBak = parsedBak.filter(a => a && typeof a === "object");
        if (cleanedBak.length > 0) {
          console.log(`[Storage] Loaded ${cleanedBak.length} permanent Telegram accounts from backup file.`);
          savePersistedAccounts(cleanedBak);
          return cleanedBak.map((acc) => ({
            ...acc,
            status: "idle",
            connectedLive: undefined
          }));
        }
      }
    }
  } catch (err) {
    console.error("[Storage] Error loading accounts from file:", err);
  }

  // Seed default permanent accounts and write to disk
  console.log(`[Storage] Initializing ${DEFAULT_PERMANENT_ACCOUNTS.length} permanent seed accounts.`);
  savePersistedAccounts(DEFAULT_PERMANENT_ACCOUNTS);
  return DEFAULT_PERMANENT_ACCOUNTS;
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

// Upsert a single account permanently with NO COLLISION and UNLIMITED CAPACITY
export function upsertAccountPermanently(account: AccountSession, currentAccounts: AccountSession[]): AccountSession[] {
  const cleanPhone = account.phone ? account.phone.replace(/\D/g, "") : "";
  
  // 1. Check if an account already exists with this exact phone number
  let index = -1;
  if (cleanPhone) {
    index = currentAccounts.findIndex((a) => a.phone && a.phone.replace(/\D/g, "") === cleanPhone);
  }

  // 2. If not found by phone, only check by ID if ID is explicitly set and matches
  if (index === -1 && account.id) {
    index = currentAccounts.findIndex((a) => a.id === account.id);
  }

  let updatedList: AccountSession[];
  if (index >= 0) {
    // Update existing account
    const existing = currentAccounts[index];
    const updatedAccount: AccountSession = {
      ...existing,
      ...account,
      id: existing.id, // Retain existing unique ID
      sessionString: account.sessionString || existing.sessionString,
      phone: account.phone || existing.phone,
      name: account.name || existing.name,
      username: account.username !== undefined ? account.username : existing.username,
      telegramId: account.telegramId || existing.telegramId,
      avatarUrl: account.avatarUrl || existing.avatarUrl,
      verifiedAt: account.verifiedAt || existing.verifiedAt || "MTProto Live Verified",
      status: "idle"
    };
    updatedList = [...currentAccounts];
    updatedList[index] = updatedAccount;
  } else {
    // Add brand new account with guaranteed unique ID
    const uniqueId = account.id && !currentAccounts.some((a) => a.id === account.id)
      ? account.id
      : generateUniqueAccountId(currentAccounts);

    const newAccount: AccountSession = {
      ...account,
      id: uniqueId,
      status: "idle",
      verifiedAt: account.verifiedAt || "MTProto Live Verified"
    };
    updatedList = [newAccount, ...currentAccounts];
  }

  savePersistedAccounts(updatedList);
  return updatedList;
}

// Delete an account permanently - ONLY called upon explicit user/admin command
export function deleteAccountPermanently(idOrPhone: string, currentAccounts: AccountSession[]): AccountSession[] {
  const clean = idOrPhone.replace(/\D/g, "");
  const updatedList = currentAccounts.filter(
    (a) => a.id !== idOrPhone && (!clean || a.phone.replace(/\D/g, "") !== clean)
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
