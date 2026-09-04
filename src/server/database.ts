import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { cleanTelegramDigits, cleanTelegramUsername, AdminController } from "./storage";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "bot_database.sqlite");
const ADMINS_VAULT_FILE = path.join(DATA_DIR, "permanent_admins_vault.json");
const ADMINS_FILE = path.join(DATA_DIR, "bot_admins.json");

let sqliteDb: DatabaseSync | null = null;

// Initialize and migrate database
export function getDatabase(): DatabaseSync {
  if (sqliteDb) return sqliteDb;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  sqliteDb = new DatabaseSync(DB_FILE);

  // Enable WAL mode for high performance, reliability, and atomic operations
  sqliteDb.exec("PRAGMA journal_mode = WAL;");
  sqliteDb.exec("PRAGMA synchronous = NORMAL;");

  // Create admins table with comprehensive schema matching production requirements
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'controller',
      permission_status TEXT NOT NULL DEFAULT 'ACTIVE',
      permissions TEXT NOT NULL DEFAULT '[]',
      granted_by TEXT NOT NULL DEFAULT 'OWNER',
      granted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      email TEXT,
      password TEXT,
      notes TEXT
    );
  `);

  sqliteDb.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
    CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
    CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
  `);

  // Create table for live stream connection state tracking
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS live_connections (
      account_id TEXT PRIMARY KEY,
      phone TEXT,
      username TEXT,
      state TEXT NOT NULL DEFAULT 'IDLE',
      target_live TEXT,
      connected_at INTEGER,
      last_heartbeat INTEGER,
      reconnect_attempts INTEGER DEFAULT 0,
      last_error TEXT
    );
  `);

  // Seed core permanent admins into database immediately
  seedCoreAdmins(sqliteDb);

  return sqliteDb;
}

// Seed permanent owner and core admins
function seedCoreAdmins(db: DatabaseSync) {
  const defaultPermissions = JSON.stringify([
    "full_access",
    "live_control",
    "manage_accounts",
    "reaction_control",
    "manage_admins",
    "reactions_comments",
    "speaker_stage"
  ]);

  const controllerPermissions = JSON.stringify([
    "live_control",
    "manage_accounts",
    "reactions_comments",
    "speaker_stage"
  ]);

  const coreAdmins = [
    {
      id: "admin-super-owner",
      user_id: "7983626971",
      username: "thebossbd360",
      name: "offline",
      role: "OWNER",
      permission_status: "ACTIVE",
      permissions: defaultPermissions,
      granted_by: "SYSTEM_ROOT",
      granted_at: "২০২৬-০৮-২৯",
      updated_at: new Date().toISOString(),
      is_active: 1,
      email: "anarulislamai1020@gmail.com",
      password: "",
      notes: "প্রধান সুপার অ্যাডমিন ও একমাত্র অনুমোদিত মালিক (অপরিবর্তনীয়)"
    },
    {
      id: "admin_1788192434241_o65g",
      user_id: "7297762323",
      username: "habib20863",
      name: "Habib Hasan",
      role: "CONTROLLER",
      permission_status: "ACTIVE",
      permissions: controllerPermissions,
      granted_by: "7983626971",
      granted_at: "২০২৬-০৮-৩১",
      updated_at: new Date().toISOString(),
      is_active: 1,
      email: "hridoyarmy1007@gmail.com",
      password: "hridoy1007",
      notes: "অনুমোদিত স্থায়ী প্রধান কন্ট্রোলার অ্যাডমিন"
    },
    {
      id: "admin_1788192999123_tahs",
      user_id: "8552972620",
      username: "tahsan_ahmed12",
      name: "Tahsan Ahmed",
      role: "CONTROLLER",
      permission_status: "ACTIVE",
      permissions: controllerPermissions,
      granted_by: "7983626971",
      granted_at: "২০২৬-০৯-০১",
      updated_at: new Date().toISOString(),
      is_active: 1,
      email: "",
      password: "",
      notes: "অনুমোদিত স্থায়ী কন্ট্রোলার অ্যাডমিন"
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO admins (
      id, user_id, username, name, role, permission_status, permissions,
      granted_by, granted_at, updated_at, is_active, email, password, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      name = excluded.name,
      is_active = CASE WHEN admins.user_id = '7983626971' THEN 1 ELSE admins.is_active END,
      role = CASE WHEN admins.user_id = '7983626971' THEN 'OWNER' ELSE admins.role END,
      permission_status = CASE WHEN admins.user_id = '7983626971' THEN 'ACTIVE' ELSE admins.permission_status END
  `);

  for (const a of coreAdmins) {
    try {
      stmt.run(
        a.id,
        a.user_id,
        a.username,
        a.name,
        a.role,
        a.permission_status,
        a.permissions,
        a.granted_by,
        a.granted_at,
        a.updated_at,
        a.is_active,
        a.email,
        a.password,
        a.notes
      );
    } catch (e) {
      console.warn("[Database] Error seeding core admin:", e);
    }
  }

  // Also import any existing admins from permanent_admins_vault.json if available
  try {
    if (fs.existsSync(ADMINS_VAULT_FILE)) {
      const raw = fs.readFileSync(ADMINS_VAULT_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (!item.telegramId && !item.username) continue;
          const cleanId = cleanTelegramDigits(item.telegramId) || `auto_${Date.now()}`;
          const cleanUname = cleanTelegramUsername(item.username);
          try {
            stmt.run(
              item.id || `admin_${Date.now()}`,
              cleanId,
              cleanUname,
              item.name || cleanUname || "Admin",
              item.role === "super_admin" ? "SUPER_ADMIN" : "CONTROLLER",
              item.isActive !== false ? "ACTIVE" : "REVOKED",
              JSON.stringify(item.permissions || ["live_control", "manage_accounts"]),
              "OWNER",
              item.addedAt || new Date().toLocaleDateString("bn-BD"),
              new Date().toISOString(),
              item.isActive !== false ? 1 : 0,
              item.email || null,
              item.password || null,
              item.notes || null
            );
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("[Database] Vault sync notice:", err);
  }
}

// Convert SQLite admin row to AdminController interface
function rowToAdminController(row: any): AdminController {
  let perms: string[] = [];
  try {
    perms = JSON.parse(row.permissions);
  } catch (e) {
    perms = ["live_control", "manage_accounts"];
  }

  const roleMapped: "super_admin" | "controller" =
    row.role === "OWNER" || row.role === "SUPER_ADMIN" || row.role === "super_admin"
      ? "super_admin"
      : "controller";

  return {
    id: row.id,
    name: row.name,
    telegramId: row.user_id,
    username: row.username || undefined,
    email: row.email || undefined,
    password: row.password || undefined,
    role: roleMapped,
    addedAt: row.granted_at,
    isActive: row.is_active === 1 && row.permission_status === "ACTIVE",
    notes: row.notes || undefined,
    permissions: perms
  };
}

// Fetch all active and registered admins from SQLite database
export function dbGetAdmins(): AdminController[] {
  try {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM admins ORDER BY is_active DESC, updated_at DESC").all();
    return rows.map(rowToAdminController);
  } catch (err) {
    console.error("[Database] Error getting admins:", err);
    return [];
  }
}

// Query specific admin by user_id (Telegram ID) or username
export function dbGetAdminByUserIdOrUsername(
  userId?: string | number | null,
  username?: string | null
): AdminController | null {
  try {
    const db = getDatabase();
    const cleanId = cleanTelegramDigits(userId);
    const cleanUname = cleanTelegramUsername(username);

    if (cleanId) {
      const row = db.prepare("SELECT * FROM admins WHERE user_id = ?").get(cleanId);
      if (row) return rowToAdminController(row);
    }

    if (cleanUname) {
      const row = db.prepare("SELECT * FROM admins WHERE LOWER(username) = LOWER(?)").get(cleanUname);
      if (row) return rowToAdminController(row);
    }

    return null;
  } catch (err) {
    console.error("[Database] Error getting admin by id/uname:", err);
    return null;
  }
}

// Upsert admin into database permanently
export function dbUpsertAdmin(admin: AdminController, grantedBy = "OWNER"): boolean {
  try {
    const db = getDatabase();
    const cleanId = cleanTelegramDigits(admin.telegramId);
    const cleanUname = cleanTelegramUsername(admin.username);

    if (!cleanId && !cleanUname) {
      console.warn("[Database] Cannot upsert admin without telegramId or username");
      return false;
    }

    const userId = cleanId || `auto_user_${Date.now()}`;
    const permsJson = JSON.stringify(admin.permissions || ["live_control", "manage_accounts"]);
    const role = admin.role === "super_admin" ? "SUPER_ADMIN" : "CONTROLLER";
    const status = admin.isActive ? "ACTIVE" : "REVOKED";
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO admins (
        id, user_id, username, name, role, permission_status, permissions,
        granted_by, granted_at, updated_at, is_active, email, password, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        name = excluded.name,
        role = CASE WHEN admins.user_id = '7983626971' THEN 'OWNER' ELSE excluded.role END,
        permission_status = CASE WHEN admins.user_id = '7983626971' THEN 'ACTIVE' ELSE excluded.permission_status END,
        permissions = excluded.permissions,
        updated_at = excluded.updated_at,
        is_active = CASE WHEN admins.user_id = '7983626971' THEN 1 ELSE excluded.is_active END,
        email = COALESCE(excluded.email, admins.email),
        password = COALESCE(excluded.password, admins.password),
        notes = COALESCE(excluded.notes, admins.notes)
    `);

    stmt.run(
      admin.id || `admin_${Date.now()}`,
      userId,
      cleanUname || null,
      admin.name || cleanUname || `Admin ${userId}`,
      role,
      status,
      permsJson,
      grantedBy,
      admin.addedAt || now,
      now,
      admin.isActive ? 1 : 0,
      admin.email || null,
      admin.password || null,
      admin.notes || null
    );

    // Sync to file layers for redundancy
    mirrorDatabaseToFileVaults();
    return true;
  } catch (err) {
    console.error("[Database] Failed to upsert admin:", err);
    return false;
  }
}

// Delete admin permanently (Strictly protects the OWNER)
export function dbDeleteAdmin(idOrUserId: string): boolean {
  try {
    const db = getDatabase();
    const cleanDigits = cleanTelegramDigits(idOrUserId);

    // PROTECT OWNER: OWNER CANNOT BE DELETED
    if (cleanDigits === "7983626971" || idOrUserId === "admin-super-owner") {
      console.warn("[Database] Attempt to delete permanent OWNER rejected!");
      return false;
    }

    const stmt = db.prepare(`
      DELETE FROM admins 
      WHERE (id = ? OR user_id = ?) AND user_id != '7983626971'
    `);
    stmt.run(idOrUserId, cleanDigits || idOrUserId);

    mirrorDatabaseToFileVaults();
    return true;
  } catch (err) {
    console.error("[Database] Failed to delete admin:", err);
    return false;
  }
}

// Toggle admin active status permanently (Owner is always active)
export function dbToggleAdminStatus(idOrUserId: string): boolean {
  try {
    const db = getDatabase();
    const cleanDigits = cleanTelegramDigits(idOrUserId);

    // PROTECT OWNER: OWNER CANNOT BE DEACTIVATED
    if (cleanDigits === "7983626971" || idOrUserId === "admin-super-owner") {
      return true;
    }

    const current = db.prepare(`
      SELECT is_active FROM admins WHERE (id = ? OR user_id = ?)
    `).get(idOrUserId, cleanDigits || idOrUserId) as any;

    if (!current) return false;

    const newActive = current.is_active === 1 ? 0 : 1;
    const newStatus = newActive === 1 ? "ACTIVE" : "REVOKED";

    db.prepare(`
      UPDATE admins 
      SET is_active = ?, permission_status = ?, updated_at = ?
      WHERE (id = ? OR user_id = ?) AND user_id != '7983626971'
    `).run(newActive, newStatus, new Date().toISOString(), idOrUserId, cleanDigits || idOrUserId);

    mirrorDatabaseToFileVaults();
    return true;
  } catch (err) {
    console.error("[Database] Failed to toggle admin status:", err);
    return false;
  }
}

// Mirror SQLite database state to all redundant JSON vaults
export function mirrorDatabaseToFileVaults() {
  try {
    const admins = dbGetAdmins();
    const serialized = JSON.stringify(admins, null, 2);

    fs.writeFileSync(ADMINS_VAULT_FILE, serialized, "utf-8");
    fs.writeFileSync(ADMINS_FILE, serialized, "utf-8");
  } catch (err) {
    console.warn("[Database] File mirror warning:", err);
  }
}

// Live stream connection state persistence
export interface LiveConnectionStateRecord {
  account_id: string;
  phone?: string;
  username?: string;
  name?: string;
  joined_voice?: number;
  state: "IDLE" | "JOINING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "MANUAL_LEAVE";
  target_live?: string;
  connected_at?: number;
  last_heartbeat?: number;
  reconnect_attempts?: number;
  last_error?: string;
}

export function dbSetLiveConnectionState(record: LiveConnectionStateRecord) {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO live_connections (
        account_id, phone, username, state, target_live, connected_at,
        last_heartbeat, reconnect_attempts, last_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        state = excluded.state,
        target_live = COALESCE(excluded.target_live, live_connections.target_live),
        connected_at = COALESCE(excluded.connected_at, live_connections.connected_at),
        last_heartbeat = excluded.last_heartbeat,
        reconnect_attempts = excluded.reconnect_attempts,
        last_error = excluded.last_error
    `);

    stmt.run(
      record.account_id,
      record.phone || null,
      record.username || null,
      record.state,
      record.target_live || null,
      record.connected_at || Date.now(),
      record.last_heartbeat || Date.now(),
      record.reconnect_attempts || 0,
      record.last_error || null
    );
  } catch (e) {
    console.warn("[Database] Error setting live connection state:", e);
  }
}

export function dbGetLiveConnectionStates(): LiveConnectionStateRecord[] {
  try {
    const db = getDatabase();
    return db.prepare("SELECT * FROM live_connections").all() as any[];
  } catch (e) {
    return [];
  }
}

export function dbResetLiveConnectionsToManualLeave() {
  try {
    const db = getDatabase();
    db.prepare("UPDATE live_connections SET state = 'MANUAL_LEAVE', last_heartbeat = ?").run(Date.now());
  } catch (e) {}
}
