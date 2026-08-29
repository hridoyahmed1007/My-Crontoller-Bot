import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Radio, 
  Users, 
  BookOpen, 
  FileCode, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  Activity,
  Send,
  Zap,
  Volume2,
  LogOut,
  UserCheck
} from 'lucide-react';
import { TelegramAccount, AdminController } from './types';
import { LiveBotController } from './components/LiveBotController';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { LiveStageSimulator } from './components/LiveStageSimulator';
import { SetupGuide } from './components/SetupGuide';
import { CodeExporter } from './components/CodeExporter';
import { AccountManagerTab } from './components/AccountManagerTab';
import { AdminManagerTab } from './components/AdminManagerTab';
import { AdminAuthModal } from './components/AdminAuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'realbot' | 'admins' | 'bot' | 'stage' | 'accounts' | 'guide' | 'code'>('realbot');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTarget, setLiveTarget] = useState('@tech_bangla_stream');
  
  // Admin Authentication State
  const [currentAdmin, setCurrentAdmin] = useState<AdminController | null>(() => {
    try {
      const saved = localStorage.getItem('live_admin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [accounts, setAccounts] = useState<TelegramAccount[]>([
    {
      id: '1',
      name: 'Hridoy',
      username: 'hridoyarmy1007',
      phone: '+8801917691524',
      avatarUrl: 'https://t.me/i/userpic/320/hridoyarmy1007.jpg',
      sessionString: '1BVtsOK0Bu...encrypted_mtproto_string_session...',
      apiId: '33961947',
      apiHash: 'fc4374b7f36f12d090254c597da0b8c8',
      status: 'idle',
      isPremium: true,
      country: 'Bangladesh',
      countryCode: '+880',
      tags: ['Verified Account', 'Admin Controller'],
      selected: true,
    }
  ]);

  // Sync real accounts from bot server
  React.useEffect(() => {
    const syncAccountsFromServer = async () => {
      try {
        const res = await fetch("/api/bot/status");
        if (res.ok) {
          const data = await res.json();
          if (data.accounts && Array.isArray(data.accounts)) {
            const mapped: TelegramAccount[] = data.accounts.map((acc: any) => ({
              id: acc.id || String(Date.now()),
              name: acc.name || "Telegram User",
              username: acc.username || "",
              phone: acc.phone || "",
              avatarUrl: acc.avatarUrl || (acc.username ? `https://t.me/i/userpic/320/${acc.username.replace('@','')}.jpg` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
              sessionString: acc.sessionString || '1BVtsOK0Bu...encrypted_mtproto_string_session...',
              apiId: '33961947',
              apiHash: 'fc4374b7f36f12d090254c597da0b8c8',
              status: acc.status === 'in_live' ? 'in_live' : 'idle',
              isPremium: true,
              country: 'Bangladesh',
              countryCode: '+880',
              tags: ['100% Real Account', 'MTProto Verified', 'Permanent Storage'],
              selected: true,
            }));
            setAccounts(mapped);
          }
          if (data.activeLive?.target) {
            setIsLiveActive(true);
            setLiveTarget(data.activeLive.target);
          }
        }
      } catch (err) {
        // silent
      }
    };
    syncAccountsFromServer();
    const interval = setInterval(syncAccountsFromServer, 3000);
    return () => clearInterval(interval);
  }, []);

  const [recentReactions, setRecentReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Add Account
  const handleAddAccount = async (acc: Omit<TelegramAccount, 'id'>) => {
    const newId = Date.now().toString();
    const newAcc: TelegramAccount = {
      ...acc,
      id: newId,
    };
    setAccounts((prev) => [...prev, newAcc]);

    try {
      await fetch('/api/bot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_account',
          payload: {
            phone: acc.phone,
            name: acc.name,
            username: acc.username,
            sessionString: acc.sessionString
          }
        })
      });
    } catch (err) {
      console.warn('Failed to sync add account to server:', err);
    }
  };

  // Delete Account - Explicit User Action
  const handleDeleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/auth/account/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to sync delete account to server:', err);
    }
  };

  // Toggle Account selection
  const handleToggleSelect = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  // Join Live
  const handleJoinLive = (target: string) => {
    setLiveTarget(target);
    setIsLiveActive(true);
    setAccounts((prev) =>
      prev.map((a) => ({ ...a, status: 'in_live' }))
    );
  };

  // Leave Live
  const handleLeaveLive = () => {
    setIsLiveActive(false);
    setAccounts((prev) =>
      prev.map((a) => ({ ...a, status: 'idle' }))
    );
  };

  // Send Reaction
  const handleSendReaction = (emoji: string) => {
    const newReactions = Array.from({ length: 4 }).map((_, i) => ({
      id: Math.random().toString(),
      emoji,
      x: 30 + Math.random() * 40,
    }));
    setRecentReactions((prev) => [...prev, ...newReactions]);
    setTimeout(() => {
      setRecentReactions((prev) => prev.filter((r) => !newReactions.includes(r)));
    }, 1500);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Header */}
      <header id="main-navigation-header" className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                  Telegram Live Multi-Account Bot
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
                  100% Real MTProto
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                স্বয়ংক্রিয় মাল্টি-আইডি লাইভ স্ট্রিম ও ভয়েস চ্যাট কন্ট্রোলার
              </p>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isLiveActive ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold animate-pulse">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">LIVE ON:</span>
                <span>{liveTarget}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{accounts.length} টি আইডি প্রস্তুত</span>
              </div>
            )}

            {/* Admin Profile & Logout Button */}
            {currentAdmin ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-semibold text-slate-200 truncate max-w-[120px]">{currentAdmin.name || currentAdmin.username}</span>
                  <span className="text-[10px] text-emerald-400">👑 সুপার অ্যাডমিন</span>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('live_admin_auth');
                    setCurrentAdmin(null);
                  }}
                  title="লগআউট করুন"
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentAdmin(null)}
                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>লগইন</span>
              </button>
            )}

            <button
              id="btn-nav-code"
              onClick={() => setActiveTab('code')}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Python Bot Code</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-slate-900 pt-1">
          <button
            id="tab-btn-realbot"
            onClick={() => setActiveTab('realbot')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'realbot'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            লাইভ ব্যাকএন্ড বট কন্ট্রোলার
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-admins"
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            অ্যাডমিন ও কন্ট্রোলার প্যানেল
            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-md font-bold">New</span>
          </button>

          <button
            id="tab-btn-bot"
            onClick={() => setActiveTab('bot')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'bot'
                ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Bot className="w-4 h-4" />
            বট সিমুলেটর
          </button>

          <button
            id="tab-btn-stage"
            onClick={() => setActiveTab('stage')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'stage'
                ? 'border-rose-500 text-rose-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Radio className="w-4 h-4" />
            লাইভ স্ট্রিম স্টেজ {isLiveActive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
          </button>

          <button
            id="tab-btn-accounts"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            অ্যাকাউন্ট ভল্ট ({accounts.length})
          </button>

          <button
            id="tab-btn-guide"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-amber-500 text-amber-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            কি কি লাগবে ও গাইড
          </button>

          <button
            id="tab-btn-code-tab"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-purple-500 text-purple-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Python সোর্স কোড
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col">
        {/* Render Login / Signup Modal if not authenticated */}
        {!currentAdmin && (
          <AdminAuthModal
            currentAdmin={currentAdmin}
            onLoginSuccess={(admin) => setCurrentAdmin(admin)}
          />
        )}
        {activeTab === 'realbot' && (
          <div className="h-[750px] w-full">
            <LiveBotController
              accounts={accounts}
              onJoinLive={handleJoinLive}
              onLeaveLive={handleLeaveLive}
              onSendReaction={handleSendReaction}
              isLiveActive={isLiveActive}
              liveTarget={liveTarget}
            />
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="h-[750px] w-full">
            <AdminManagerTab />
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="h-[750px] w-full">
            <TelegramBotSimulator
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onJoinLive={handleJoinLive}
              onLeaveLive={handleLeaveLive}
              onSendReaction={handleSendReaction}
              isLiveActive={isLiveActive}
              liveTarget={liveTarget}
              activeLiveCount={isLiveActive ? accounts.length : 0}
            />
          </div>
        )}

        {activeTab === 'stage' && (
          <div className="h-[750px] w-full">
            <LiveStageSimulator
              isLiveActive={isLiveActive}
              liveTarget={liveTarget}
              accounts={accounts}
              recentReactions={recentReactions}
              onSendReaction={handleSendReaction}
              onLeaveLive={handleLeaveLive}
            />
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="h-[750px] w-full">
            <AccountManagerTab
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onDeleteAccount={handleDeleteAccount}
              onToggleSelect={handleToggleSelect}
              isLiveActive={isLiveActive}
            />
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="h-[750px] w-full">
            <SetupGuide />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-[750px] w-full">
            <CodeExporter />
          </div>
        )}
      </main>
    </div>
  );
}
