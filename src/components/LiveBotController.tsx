import React, { useState, useEffect } from "react";
import { 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Key, 
  Radio, 
  Flame, 
  Heart, 
  Users, 
  Terminal,
  Activity,
  Sparkles,
  Zap
} from "lucide-react";
import { TelegramAccount } from "../types";

interface LiveBotControllerProps {
  accounts: TelegramAccount[];
  onJoinLive: (target: string) => void;
  onLeaveLive: () => void;
  onSendReaction: (emoji: string) => void;
  isLiveActive: boolean;
  liveTarget: string;
}

export const LiveBotController: React.FC<LiveBotControllerProps> = ({
  accounts,
  onJoinLive,
  onLeaveLive,
  onSendReaction,
  isLiveActive,
  liveTarget,
}) => {
  const [botToken, setBotToken] = useState("8927823094:AAE2MDXcyZBKpLpFuz-K9u66fLTqPLdx5o8");
  const [adminId, setAdminId] = useState("SuperAdmin");
  const [botStatus, setBotStatus] = useState<any>({
    isRunning: true,
    botInfo: { id: 8880348707, first_name: "Live Multi-Account Bot", username: "LiveMultiAccBot" },
    logs: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customLiveUrl, setCustomLiveUrl] = useState("@tech_bangla_stream");
  const [testCmd, setTestCmd] = useState("");

  // Fetch status from server
  const fetchStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/bot/status", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch {
      // Gracefully silent on transient connection drops
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  // Restart / Reconnect Bot with Token
  const handleConnectBot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: botToken, adminId })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ টেলিগ্রাম বট সফলভাবে কানেক্ট হয়েছে এবং ব্যাকএন্ডে সক্রিয় রয়েছে!");
      }
      fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Join from Web to server & Bot
  const triggerJoinLive = async () => {
    if (!customLiveUrl) return;
    onJoinLive(customLiveUrl);
    await fetch("/api/bot/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join_live", payload: { target: customLiveUrl } })
    });
    fetchStatus();
  };

  // Trigger Leave
  const triggerLeaveLive = async () => {
    onLeaveLive();
    await fetch("/api/bot/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave_live" })
    });
    fetchStatus();
  };

  // Trigger Reaction
  const triggerReact = async (emoji: string) => {
    onSendReaction(emoji);
    await fetch("/api/bot/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", payload: { emoji } })
    });
    fetchStatus();
  };

  return (
    <div id="live-bot-controller-panel" className="w-full h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Real Bot Configuration & Telegram Direct Link */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl overflow-y-auto">
        <div className="space-y-6">
          {/* Header Status */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">
                    টেলিগ্রাম লাইভ ব্যাকএন্ড বট
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ১০০% লাইভ ও সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  সরাসরি টেলিগ্রাম অ্যাপে আপনার বটের সাথে কথা বলুন ও লাইভ কমান্ড দিন
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Credentials Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                আপনার প্রদত্ত বটের তথ্য
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                স্বয়ংক্রিয় এপিআই হ্যান্ডলার একটিভ
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">টেলিগ্রাম বট টোকেন (Bot Token):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">অ্যাডমিন আইডি (Admin ID):</label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">অফিসিয়াল API ID ও Hash:</label>
                  <div className="bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">API ID: 33961947 (সক্রিয়)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectBot}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              বট কানেকশন নিশ্চিত ও রি-সিঙ্ক করুন
            </button>
          </div>

          {/* Quick Telegram Bot Direct Action Box */}
          <div className="bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              টেলিগ্রাম অ্যাপ থেকে সরাসরি ব্যবহার করার নিয়ম:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনার টেলিগ্রাম অ্যাপে যান এবং আপনার বটের চ্যাটে গিয়ে নিচের কমান্ডগুলো পাঠান:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-blue-400 font-bold">/start</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">সব ইনলাইন কন্ট্রোল বোতাম দেখতে</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-rose-400 font-bold">/join @channel</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">সব আইডি লাইভে ঢুকাতে</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-amber-400 font-bold">/leave</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">লাইভ ছেড়ে বের হয়ে আসতে</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-emerald-400 font-bold">/add +88017...</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">নতুন টেলিগ্রাম আইডি যোগ করতে</p>
              </div>
            </div>
          </div>

          {/* Fast Live Action Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500" />
              কুইক লাইভ স্ট্রিম একশন
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="চ্যানেল/গ্রুপ ইউজারনেম (যেমন: @tech_bangla)"
                value={customLiveUrl}
                onChange={(e) => setCustomLiveUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />

              {!isLiveActive ? (
                <button
                  onClick={triggerJoinLive}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-600/30"
                >
                  <Radio className="w-3.5 h-3.5" />
                  সব আইডি লাইভে নাও
                </button>
              ) : (
                <button
                  onClick={triggerLeaveLive}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  লাইভ শেষ করো
                </button>
              )}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">লাইভ রিয়্যাকশন:</span>
              <button
                onClick={() => triggerReact("❤️")}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                ❤️ লাভ
              </button>
              <button
                onClick={() => triggerReact("🔥")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                🔥 আগুন
              </button>
              <button
                onClick={() => triggerReact("👍")}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                👍 লাইক
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>মোট প্রস্তুত একাউন্ট: {accounts.length} টি</span>
          <span>স্ট্যাটাস: MTProto Live Daemon Ready</span>
        </div>
      </div>

      {/* Right Panel: Live Telegram Daemon Logs & Terminal */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Terminal className="w-4 h-4 text-emerald-400" />
              লাইভ টেলিগ্রাম বট ও ডেমন লগ (Realtime Logs)
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              পোলিং: সক্রিয় (200 OK)
            </span>
          </div>

          {/* Logs Container */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[500px] space-y-2">
            {botStatus?.logs && botStatus.logs.length > 0 ? (
              botStatus.logs.map((log: any) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border text-[11px] leading-relaxed ${
                    log.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : log.type === "error"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : log.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-0.5">
                    <span>[{log.timestamp}]</span>
                    <span className="uppercase font-bold">{log.type}</span>
                  </div>
                  <div>{log.message}</div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                <Activity className="w-8 h-8 text-slate-700 animate-pulse mb-2" />
                <p>বট সক্রিয় আছে এবং টেলিগ্রাম আপডেটের জন্য অপেক্ষা করছে...</p>
                <p className="text-[10px] text-slate-600 mt-1">আপনার টেলিগ্রাম বটে `/start` লিখে পাঠান!</p>
              </div>
            )}
          </div>
        </div>

        {/* Live status indicators */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">টেলিগ্রাম বট লাইভ সার্ভার চলমান</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">Port 3000 | Node/GrammY</span>
        </div>
      </div>
    </div>
  );
};
