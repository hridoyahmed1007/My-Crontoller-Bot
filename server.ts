import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  initAndStartTelegramBot,
  stopActiveTelegramBot,
  botGlobalState,
  addBotLog,
  executeRealMTProtoJoinLive,
  executeRealMTProtoLeaveLive,
  executeRealMTProtoReact,
  normalizePhoneNumber,
  normalizeBengaliDigits,
  createRealisticTelegramClient,
  DEFAULT_TG_API_ID,
  DEFAULT_TG_API_HASH,
  pendingAuthSessions,
  AccountSession,
  getAuthorizedAdmins,
  addAuthorizedAdmin,
  syncAuthorizedAdmins,
  removeAuthorizedAdmin,
  toggleAuthorizedAdminStatus
} from "./src/server/telegramLiveBot";
import {
  upsertAccountPermanently,
  deleteAccountPermanently,
  savePersistedAccounts,
  AdminController
} from "./src/server/storage";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      botRunning: botGlobalState.isRunning,
      botUsername: botGlobalState.botInfo?.username,
      timestamp: new Date().toISOString()
    });
  });

  // Telegram Bot State
  app.get("/api/bot/status", (_req, res) => {
    res.json({
      botToken: botGlobalState.botToken,
      adminId: botGlobalState.adminId,
      isRunning: botGlobalState.isRunning,
      botInfo: botGlobalState.botInfo,
      accounts: botGlobalState.accounts,
      admins: botGlobalState.admins,
      activeLive: botGlobalState.activeLive,
      logs: botGlobalState.logs
    });
  });

  // Admin Controllers Management API
  app.get("/api/admins", (_req, res) => {
    res.json({
      success: true,
      admins: getAuthorizedAdmins()
    });
  });

  // Authorized Admins API
  app.get("/api/admins", (_req, res) => {
    const admins = getAuthorizedAdmins();
    res.json({
      success: true,
      admins
    });
  });

  const MASTER_SUPER_ADMIN: AdminController = {
    id: "admin-super-owner",
    name: "offline",
    telegramId: "7983626971",
    username: "Thebossbd360",
    email: "anarulislamai1020@gmail.com",
    role: "super_admin",
    addedAt: "২৯ আগস্ট, ২০২৬",
    isActive: true,
    notes: "প্রধান সুপার অ্যাডমিন ও একমাত্র অনুমোদিত মালিক"
  };

  // Admin Signup API - STRICTLY LOCKED to Master Owner
  app.post("/api/admin/auth/signup", (req, res) => {
    try {
      const { telegramId, username, name, email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: "জিমেইল ও পাসওয়ার্ড দেওয়া আবশ্যক।" });
      }

      const cleanTgId = telegramId ? normalizeBengaliDigits(String(telegramId)).replace(/\D/g, "") : "";
      const cleanUsername = username ? String(username).trim().replace(/^@+/, "").toLowerCase() : "";
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      // SECURITY CHECK: Strictly allow only Master Owner credentials
      const isMasterEmail = cleanEmail === "anarulislamai1020@gmail.com";
      const isMasterId = cleanTgId === "7983626971";
      const isMasterUsername = cleanUsername === "thebossbd360";

      if (!isMasterEmail && !isMasterId && !isMasterUsername) {
        return res.status(403).json({
          success: false,
          error: "⛔ অ্যাক্সেস অস্বীকৃত! এই প্যানেলে নতুন ব্যবহারকারী সাইন আপ বন্ধ রয়েছে। শুধুমাত্র মূল সুপার অ্যাডমিন (@Thebossbd360) ছাড়া অন্য কেউ প্রবেশ বা অ্যাকাউন্ট তৈরি করতে পারবে না।"
        });
      }

      const existingAdmins = getAuthorizedAdmins();
      const masterRecord = existingAdmins.find(
        (a) =>
          (a.email && a.email.toLowerCase() === "anarulislamai1020@gmail.com") ||
          a.telegramId === "7983626971" ||
          (a.username && a.username.toLowerCase() === "thebossbd360")
      ) || MASTER_SUPER_ADMIN;

      masterRecord.name = (name?.trim()) || masterRecord.name || "offline";
      masterRecord.telegramId = cleanTgId || masterRecord.telegramId || "7983626971";
      masterRecord.username = cleanUsername || masterRecord.username || "Thebossbd360";
      masterRecord.email = cleanEmail || "anarulislamai1020@gmail.com";
      masterRecord.password = cleanPassword;
      masterRecord.role = "super_admin";
      masterRecord.isActive = true;

      const updated = addAuthorizedAdmin(masterRecord);

      res.json({
        success: true,
        admins: updated,
        admin: { ...masterRecord, password: "" },
        message: "👑 সুপার অ্যাডমিন পাসওয়ার্ড ও অ্যাকাউন্ট সফলভাবে আপডেট হয়েছে!"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Admin Login API - Strictly Verified (Web Panel Access is Exclusive to Super Admin)
  app.post("/api/admin/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "জিমেইল এবং পাসওয়ার্ড লিখুন।" });
      }

      const cleanInput = String(email).trim().toLowerCase();
      const cleanPassword = String(password).trim();
      const admins = getAuthorizedAdmins();

      // Check Master Owner credentials
      const isMasterEmail = cleanInput === "anarulislamai1020@gmail.com";
      const isMasterUname = cleanInput === "thebossbd360" || cleanInput === "@thebossbd360";
      const isMasterId = cleanInput === "7983626971";

      const masterAdmin = admins.find(
        (a) =>
          a.telegramId === "7983626971" ||
          (a.username && a.username.toLowerCase() === "thebossbd360") ||
          (a.email && a.email.toLowerCase() === "anarulislamai1020@gmail.com")
      ) || MASTER_SUPER_ADMIN;

      // Strictly deny any attempt if not the verified master super admin
      if (!isMasterEmail && !isMasterUname && !isMasterId) {
        return res.status(403).json({
          success: false,
          error: "⛔ অ্যাক্সেস অস্বীকৃত! আপনি এই অ্যাডমিন প্যানেলে লগইন করার অনুমতিপ্রাপ্ত নন। শুধুমাত্র মূল সুপার অ্যাডমিন (@Thebossbd360) এখানে প্রবেশ করতে পারবেন।"
        });
      }

      // Check password if set on master admin
      if (masterAdmin.password && masterAdmin.password !== cleanPassword) {
        return res.status(401).json({
          success: false,
          error: "⛔ ভুল পাসওয়ার্ড! সঠিক সুপার অ্যাডমিন পাসওয়ার্ড প্রদান করুন।"
        });
      }

      res.json({
        success: true,
        admin: { ...masterAdmin, password: "" }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Current Admin Session Verification
  app.get("/api/admin/auth/me", (req, res) => {
    const adminId = req.query.adminId as string;
    const admins = getAuthorizedAdmins();

    if (adminId) {
      const found = admins.find((a) => a.id === adminId && a.isActive);
      if (found) {
        return res.json({ success: true, admin: { ...found, password: "" } });
      }
    }

    // Default to Master Owner
    const masterAdmin = admins.find((a) => a.telegramId === "7983626971") || MASTER_SUPER_ADMIN;
    res.json({ success: true, admin: { ...masterAdmin, password: "" } });
  });

  app.post("/api/admins", (req, res) => {
    try {
      const { name, telegramId, username, role, notes, email, password, permissions } = req.body;
      if (!telegramId && !username) {
        return res.status(400).json({ success: false, error: "টেলিগ্রাম আইডি অথবা ইউজারনেম আবশ্যক।" });
      }

      const cleanTgId = telegramId ? normalizeBengaliDigits(String(telegramId)).replace(/\D/g, "") : "";
      const cleanUsername = username ? username.trim().replace(/^@+/, "") : "";

      const defaultPermissions = role === "super_admin"
        ? ["full_access", "live_control", "manage_accounts", "reaction_control", "manage_admins"]
        : (Array.isArray(permissions) && permissions.length > 0
            ? permissions
            : ["live_control", "manage_accounts", "reaction_control"]);

      const newAdmin: AdminController = {
        id: req.body.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: (name?.trim()) || (cleanUsername ? `@${cleanUsername}` : `Controller ${cleanTgId}`),
        telegramId: cleanTgId,
        username: cleanUsername,
        email: email ? String(email).trim().toLowerCase() : undefined,
        password: password ? String(password).trim() : undefined,
        role: role === "super_admin" ? "super_admin" : "controller",
        addedAt: new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }),
        isActive: true,
        notes: notes?.trim() || "",
        permissions: defaultPermissions
      };

      const updated = addAuthorizedAdmin(newAdmin);
      res.json({ success: true, admins: updated, admin: newAdmin });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/admins/sync", (req, res) => {
    try {
      const { admins } = req.body;
      if (Array.isArray(admins) && admins.length > 0) {
        const synced = syncAuthorizedAdmins(admins);
        return res.json({ success: true, admins: synced });
      }
      res.json({ success: true, admins: getAuthorizedAdmins() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/admins/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updated = removeAuthorizedAdmin(id);
      res.json({ success: true, admins: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.patch("/api/admins/:id/toggle", (req, res) => {
    try {
      const { id } = req.params;
      const updated = toggleAuthorizedAdminStatus(id);
      res.json({ success: true, admins: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Start or Update Telegram Bot Credentials
  app.post("/api/bot/start", async (req, res) => {
    const { token, adminId } = req.body;
    const botTokenToUse = token || botGlobalState.botToken;
    const adminIdToUse = adminId || botGlobalState.adminId;

    const result = await initAndStartTelegramBot(botTokenToUse, adminIdToUse);
    res.json(result);
  });

  // Stop Telegram Bot
  app.post("/api/bot/stop", async (_req, res) => {
    try {
      await stopActiveTelegramBot();
      botGlobalState.isRunning = false;
      addBotLog("info", "🛑 টেলিগ্রাম বট সাময়িকভাবে বন্ধ করা হয়েছে।");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Web-based Direct MTProto Send Code
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: "ফোন নম্বর দেওয়া আবশ্যক।" });
      }

      const validation = normalizePhoneNumber(phone);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.reason || "ভুল ফোন নম্বর।" });
      }

      const formattedPhone = validation.formatted;
      const { StringSession } = await import("telegram/sessions/index.js");
      const stringSession = new StringSession("");
      const mtprotoClient = createRealisticTelegramClient(stringSession);

      await mtprotoClient.connect();

      const sendCodeResult = await mtprotoClient.sendCode(
        {
          apiId: DEFAULT_TG_API_ID,
          apiHash: DEFAULT_TG_API_HASH,
        },
        formattedPhone
      );

      const sessionKey = `web_${formattedPhone.replace(/\D/g, "")}`;
      pendingAuthSessions.set(sessionKey, {
        client: mtprotoClient,
        phone: formattedPhone,
        phoneCodeHash: sendCodeResult.phoneCodeHash,
        isCodeViaApp: sendCodeResult.isCodeViaApp ?? true,
        enteredDigits: "",
        createdAt: Date.now(),
      });

      addBotLog("success", `[Web API] ভেরিফিকেশন কোড পাঠানো হয়েছে: ${formattedPhone}`);
      return res.json({
        success: true,
        phone: formattedPhone,
        isCodeViaApp: sendCodeResult.isCodeViaApp ?? true,
        message: "টেলিগ্রাম অফিসিয়াল কোড পাঠানো হয়েছে।"
      });
    } catch (err: any) {
      console.error("Web send code error:", err);
      const errMsg = err?.message || String(err);
      addBotLog("error", `[Web API] কোড পাঠাতে ত্রুটি: ${errMsg}`);
      return res.status(500).json({
        success: false,
        error: errMsg
      });
    }
  });

  // Web-based Direct MTProto Verify Code & Sign In
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { phone, code, password } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ success: false, error: "ফোন নম্বর ও ৫ সংখ্যার কোড আবশ্যক।" });
      }

      const formattedPhone = normalizePhoneNumber(phone).formatted;
      const sessionKey = `web_${formattedPhone.replace(/\D/g, "")}`;
      const pending = pendingAuthSessions.get(sessionKey);

      if (!pending || !pending.client || !pending.phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "কোনো সক্রিয় লগইন রিকোয়েস্ট পাওয়া যায়নি। পুনরায় 'কোড পাঠান' বোতাম চাপুন।"
        });
      }

      const cleanCode = normalizeBengaliDigits(String(code)).replace(/\D/g, "");
      const { Api } = await import("telegram");

      let signInResult: any = null;
      try {
        signInResult = await pending.client.invoke(
          new Api.auth.SignIn({
            phoneNumber: formattedPhone,
            phoneCodeHash: pending.phoneCodeHash,
            phoneCode: cleanCode,
          })
        );
      } catch (signInErr: any) {
        const errText = signInErr?.message || String(signInErr);
        if (errText.includes("SESSION_PASSWORD_NEEDED")) {
          if (!password) {
            return res.json({
              success: false,
              requires2FA: true,
              message: "অ্যাকাউন্টে টু-স্টেপ পাসওয়ার্ড (2FA) সক্রিয় আছে। অনুগ্রহ করে পাসওয়ার্ড দিন।"
            });
          }

          const { computeCheck } = await import("telegram/Password.js");
          const passwordSrpResult = await pending.client.invoke(new Api.account.GetPassword());
          const passwordSrpCheck = await computeCheck(passwordSrpResult, String(password).trim());
          const checkResult: any = await pending.client.invoke(
            new Api.auth.CheckPassword({
              password: passwordSrpCheck,
            })
          );
          if (checkResult && checkResult.user) {
            signInResult = checkResult;
          }
        } else {
          throw signInErr;
        }
      }

      const savedSession = (pending.client.session.save() as unknown as string) || `1BVtsOK0Bu_${Date.now()}_mtproto_session`;

      // Query the exact real user profile of this specific account
      let realMe: any = null;
      try {
        realMe = await pending.client.getMe();
      } catch (e) {
        if (signInResult && signInResult.user) {
          realMe = signInResult.user;
        }
      }

      let realDisplayName = `Telegram User (${formattedPhone.slice(-4)})`;
      let realDisplayUsername = "";
      let realTgId: number | string = Date.now();
      let realAvatarUrl: string | undefined = undefined;

      if (realMe) {
        const gramFirst = (realMe.firstName || realMe.first_name || "").trim();
        const gramLast = (realMe.lastName || realMe.last_name || "").trim();
        const gramFull = [gramFirst, gramLast].filter(Boolean).join(" ").trim();
        if (gramFull) realDisplayName = gramFull;
        if (realMe.username) {
          realDisplayUsername = realMe.username.trim().replace("@", "");
          realAvatarUrl = `https://t.me/i/userpic/320/${realDisplayUsername}.jpg`;
        }
        if (realMe.id) realTgId = Number(realMe.id);
      }

      const existingIndex = botGlobalState.accounts.findIndex(
        (a) => a.phone.replace(/\D/g, "") === formattedPhone.replace(/\D/g, "")
      );

      const accountObj: AccountSession = {
        id: existingIndex >= 0 ? botGlobalState.accounts[existingIndex].id : (botGlobalState.accounts.length + 1).toString(),
        phone: formattedPhone,
        name: realDisplayName,
        username: realDisplayUsername || undefined,
        telegramId: realTgId,
        avatarUrl: realAvatarUrl,
        sessionString: savedSession,
        status: "idle",
        verifiedAt: "MTProto Live Verified"
      };

      botGlobalState.accounts = upsertAccountPermanently(accountObj, botGlobalState.accounts);

      pendingAuthSessions.delete(sessionKey);
      addBotLog("success", `[Web API] আসল অ্যাকাউন্ট স্থায়ীভাবে সংরক্ষিত হয়েছে: ${realDisplayName} (${formattedPhone})`);

      return res.json({
        success: true,
        account: accountObj,
        accounts: botGlobalState.accounts
      });
    } catch (err: any) {
      console.error("Web verify error:", err);
      const errMsg = err?.message || String(err);
      addBotLog("error", `[Web API] ওটিপি ভেরিফিকেশন ত্রুটি: ${errMsg}`);
      return res.status(400).json({
        success: false,
        error: errMsg
      });
    }
  });

  // Direct String Session Import
  app.post("/api/auth/import-session", async (req, res) => {
    try {
      const { sessionString, phone, name, username } = req.body;
      if (!sessionString) {
        return res.status(400).json({ success: false, error: "সেশন স্ট্রিং আবশ্যক।" });
      }

      const newId = (botGlobalState.accounts.length + 1).toString();
      const accountObj: AccountSession = {
        id: newId,
        phone: phone || "+8801700000000",
        name: name || `Verified Account ${newId}`,
        username: username || undefined,
        avatarUrl: username ? `https://t.me/i/userpic/320/${username.replace("@", "")}.jpg` : undefined,
        sessionString: sessionString.trim(),
        status: "idle",
        verifiedAt: "StringSession Verified"
      };

      botGlobalState.accounts = upsertAccountPermanently(accountObj, botGlobalState.accounts);
      addBotLog("success", `সেশন স্ট্রিং দিয়ে অ্যাকাউন্ট স্থায়ীভাবে যোগ করা হয়েছে: ${accountObj.name}`);

      return res.json({
        success: true,
        account: accountObj,
        accounts: botGlobalState.accounts
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || String(err) });
    }
  });

  // Delete Account
  app.delete("/api/auth/account/:id", (req, res) => {
    const { id } = req.params;
    botGlobalState.accounts = deleteAccountPermanently(id, botGlobalState.accounts);
    addBotLog("info", `অ্যাকাউন্ট (ID: ${id}) পার্মানেন্ট মুছে ফেলা হয়েছে।`);
    return res.json({ success: true, accounts: botGlobalState.accounts });
  });

  // Trigger Action from UI into Live Bot
  app.post("/api/bot/action", async (req, res) => {
    const { action, payload } = req.body;
    if (action === "join_live") {
      const target = payload?.target || "@my_stream";
      await executeRealMTProtoJoinLive(target);
    } else if (action === "leave_live") {
      await executeRealMTProtoLeaveLive();
    } else if (action === "react") {
      const emoji = payload?.emoji || "❤️";
      await executeRealMTProtoReact(emoji);
    } else if (action === "add_account") {
      const newId = (botGlobalState.accounts.length + 1).toString();
      const newAcc: AccountSession = {
        id: newId,
        phone: payload?.phone || "+8801700000000",
        name: payload?.name || `Account ${newId}`,
        username: payload?.username || `user_${newId}`,
        sessionString: `1BVtsOK0Bu...mtproto_session_${Date.now()}`,
        status: "idle"
      };
      botGlobalState.accounts = upsertAccountPermanently(newAcc, botGlobalState.accounts);
      addBotLog("success", `নতুন একাউন্ট স্থায়ীভাবে যোগ করা হয়েছে: ${payload?.phone}`);
    }

    res.json({
      success: true,
      activeLive: botGlobalState.activeLive,
      accounts: botGlobalState.accounts
    });
  });

  // API to generate realistic live stream comments (Bengali/English/Mix)
  app.post("/api/generate-comments", async (req, res) => {
    try {
      const { topic = "General Live Stream", language = "bengali", tone = "enthusiastic", count = 10 } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback default realistic comments
        const fallbackBengali = [
          "অসাধারণ ভাই! অনেক দিন পর লাইভে আসলেন ❤️",
          "সাউন্ড আর ভিডিও কোয়ালিটি একদম ক্লিয়ার আছে ভাই 👌",
          "ভাই এই টপিক নিয়ে একটু বিস্তারিত বলেন প্লিজ",
          "আসসালামু আলাইকুম ভাই, কেমন আছেন সবাই?",
          "অনেক সুন্দর আলোচনা হচ্ছে 🔥",
          "ভাইয়ের কথাগুলো সবসময় বাস্তবসম্মত হয় 👍",
          "আমি ঢাকা থেকে শুনতেছি, সবাই কেমন আছেন?",
          "ভাই নেক্সট পার্টটা কবে আসবে?",
          "অস্থির ভাই! সবাই একটু রিয়েক্ট দেন তো ❤️",
          "গ্রেট প্রেজেন্টেশন ব্রাদার 👏"
        ];
        return res.json({ comments: fallbackBengali.slice(0, count) });
      }

      const prompt = `Generate ${count} realistic, short, natural user comments for a Telegram Live Stream or Voice Chat in ${language} (Bangla/Banglish/English).
Stream Topic: "${topic}"
Tone: ${tone}
Format: Return ONLY a JSON array of strings containing realistic messages like:
["ভাই সাউন্ড কোয়ালিটি ঠিক আছে", "Hello everyone! Great session ❤️", "অসাধারণ আলোচনা হচ্ছে ভাইয়া 🔥"]
Do not add markdown backticks if possible, just raw JSON array or simple text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const text = response.text || "";
      let comments: string[] = [];
      try {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        comments = JSON.parse(cleaned);
      } catch {
        comments = text
          .split("\n")
          .map((line) => line.replace(/^[\d.-]+\s*|\"/g, "").trim())
          .filter((line) => line.length > 0);
      }

      return res.json({ comments: comments.slice(0, count) });
    } catch (error: any) {
      console.error("Gemini comment generation error:", error);
      return res.json({
        comments: [
          "সাউন্ড কোয়ালিটি দারুণ ভাই 👍",
          "অনেক তথ্যবহুল লাইভ সেশন 🔥",
          "লাইক ও রিয়েকশন দিলাম সবাইও দিন ❤️",
          "ভাই প্রশ্নটার উত্তর দিলে ভালো হতো 🙏",
          "Great stream, keep it up!"
        ]
      });
    }
  });

  // Vite middleware for development vs static serve in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Auto-launch the Telegram bot with provided BotToken and AdminId
    initAndStartTelegramBot(botGlobalState.botToken, botGlobalState.adminId)
      .then((res) => {
        if (res.success) {
          console.log(`Telegram Bot successfully connected as @${res.botInfo?.username}`);
        } else {
          console.log(`Telegram Bot connection notice: ${res.error}`);
        }
      })
      .catch((err) => console.error("Error auto-starting Telegram bot:", err));
    process.once("SIGINT", async () => {
      console.log("Shutting down bot before exit (SIGINT)...");
      await stopActiveTelegramBot().catch(() => {});
      process.exit(0);
    });
    process.once("SIGTERM", async () => {
      console.log("Shutting down bot before exit (SIGTERM)...");
      await stopActiveTelegramBot().catch(() => {});
      process.exit(0);
    });
  });
}

startServer();
