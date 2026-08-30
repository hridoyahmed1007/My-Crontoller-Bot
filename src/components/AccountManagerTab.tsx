import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Smartphone, 
  ShieldCheck, 
  KeyRound, 
  ExternalLink,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { TelegramAccount } from '../types';

interface AccountManagerTabProps {
  accounts: TelegramAccount[];
  onAddAccount: (acc: Omit<TelegramAccount, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onToggleSelect: (id: string) => void;
  isLiveActive: boolean;
}

export const AccountManagerTab: React.FC<AccountManagerTabProps> = ({
  accounts,
  onAddAccount,
  onDeleteAccount,
  onToggleSelect,
  isLiveActive,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mtproto' | 'session'>('mtproto');

  // MTProto Live Login States
  const [mtprotoStep, setMtprotoStep] = useState<'phone' | 'otp' | '2fa'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // String Session Import States
  const [sessionString, setSessionString] = useState('');
  const [sessionPhone, setSessionPhone] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionUsername, setSessionUsername] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Handle Send Code via Web MTProto
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setMtprotoStep('otp');
        setSuccessMsg('✅ আপনার টেলিগ্রাম অ্যাপে ৫ সংখ্যার অফিসিয়াল লগইন কোড পাঠানো হয়েছে!');
      } else {
        setErrorMsg(data.error || 'কোড পাঠাতে ব্যর্থ হয়েছে। নম্বর সঠিক কিনা পরীক্ষা করুন।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'সার্ভার সংযোগে ত্রুটি।');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify Code via Web MTProto
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          code: otpCode.trim(),
          password: password2FA.trim() || undefined
        })
      });
      const data = await res.json();

      if (data.requires2FA) {
        setMtprotoStep('2fa');
        setErrorMsg('অ্যাকাউন্টে টু-স্টেপ ভেরিফিকেশন পাসওয়ার্ড রয়েছে। নিচে পাসওয়ার্ড দিন:');
        setIsLoading(false);
        return;
      }

      if (data.success && data.account) {
        const acc = data.account;
        onAddAccount({
          name: acc.name,
          username: acc.username || `user_${phone.slice(-4)}`,
          phone: acc.phone,
          avatarUrl: acc.avatarUrl || `https://t.me/i/userpic/320/${acc.username || 'user'}.jpg`,
          sessionString: acc.sessionString,
          apiId: '33961947',
          apiHash: 'fc4374b7f36f12d090254c597da0b8c8',
          status: 'idle',
          isPremium: false,
          country: 'Bangladesh',
          countryCode: '+880',
          tags: ['MTProto Live', 'Real Profile'],
          selected: true
        });

        setSuccessMsg(`🎉 আসল অ্যাকাউন্ট (${acc.name}) সফলভাবে যুক্ত হয়েছে!`);
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ভেরিফিকেশন ত্রুটি।');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle String Session Import
  const handleImportSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionString.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/import-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionString: sessionString.trim(),
          phone: sessionPhone.trim(),
          name: sessionName.trim(),
          username: sessionUsername.trim()
        })
      });
      const data = await res.json();

      if (data.success && data.account) {
        const acc = data.account;
        onAddAccount({
          name: acc.name,
          username: acc.username || `user_${Date.now().toString().slice(-4)}`,
          phone: acc.phone,
          avatarUrl: acc.avatarUrl || `https://images.unsplash.com/photo-1534528741775?w=150&auto=format&fit=crop&q=80`,
          sessionString: acc.sessionString,
          apiId: '33961947',
          apiHash: 'fc4374b7f36f12d090254c597da0b8c8',
          status: 'idle',
          isPremium: false,
          country: 'Bangladesh',
          countryCode: '+880',
          tags: ['StringSession', 'Verified'],
          selected: true
        });

        setShowAddModal(false);
        resetForm();
      } else {
        setErrorMsg(data.error || 'সেশন ইমপোর্ট ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ত্রুটি ঘটেছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMtprotoStep('phone');
    setPhone('');
    setOtpCode('');
    setPassword2FA('');
    setErrorMsg('');
    setSuccessMsg('');
    setSessionString('');
    setSessionPhone('');
    setSessionName('');
    setSessionUsername('');
  };

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      (a.username && a.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="account-manager-container" className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              স্থায়ীভাবে সংরক্ষিত টেলিগ্রাম অ্যাকাউন্ট ({accounts.length} টি)
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              সারা জীবন পার্মানেন্ট সেভ্ড
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            একবার যুক্ত করলে ডাটাবেস ও ডিস্কে চিরস্থায়ীভাবে সংরক্ষিত থাকবে। সার্ভার রিস্টার্ট হলেও কোনো অ্যাকাউন্ট মুছে যাবে না।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-add-account-modal"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            নতুন অ্যাকাউন্ট কানেক্ট করুন
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            id="search-account-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="আসল নাম, ইউজারনেম বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg">
            সিলেক্টেড: <strong className="text-blue-400">{accounts.filter((a) => a.selected !== false).length}</strong>
          </span>
          <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg">
            লাইভে সক্রিয়: <strong className="text-rose-400">{isLiveActive ? accounts.length : 0}</strong>
          </span>
        </div>
      </div>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filtered.length === 0 ? (
          <div className="p-10 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-400 text-sm space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="font-semibold text-slate-300">কোনো ভেরিফাইড অ্যাকাউন্ট পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1">আপনার মোবাইল নম্বর দিয়ে সরাসরি আসল অ্যাকাউন্ট যুক্ত করুন অথবা টেলিগ্রাম বটে /start দিন।</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow"
            >
              এখনই যুক্ত করুন
            </button>
          </div>
        ) : (
          filtered.map((acc) => (
            <div
              key={acc.id}
              id={`account-item-${acc.id}`}
              className="p-3.5 bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <input
                  type="checkbox"
                  checked={acc.selected !== false}
                  onChange={() => onToggleSelect(acc.id)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <img
                  src={acc.avatarUrl || `https://t.me/i/userpic/320/${acc.username || 'user'}.jpg`}
                  alt={acc.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=1e293b&color=38bdf8`;
                  }}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-semibold text-slate-200 text-sm truncate">{acc.name}</h4>
                    {acc.username ? (
                      <span className="text-[11px] text-sky-400 font-mono bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                        @{acc.username.replace('@', '')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">ইউজারনেম নেই</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono flex-wrap pt-0.5">
                    <span className="text-emerald-400 font-medium">{acc.phone}</span>
                    {acc.telegramId && (
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px] text-slate-300 border border-slate-800">
                        ID: <span className="text-blue-400 font-semibold">{acc.telegramId}</span>
                      </span>
                    )}
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-800 hidden md:inline">
                      Key ID: {acc.id.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      isLiveActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {isLiveActive ? 'Live Connected' : 'MTProto Ready'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">100% Real Account</p>
                </div>

                <button
                  id={`btn-delete-account-${acc.id}`}
                  onClick={() => onDeleteAccount(acc.id)}
                  title="অ্যাকাউন্ট মুছে ফেলুন"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connect Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                টেলিগ্রাম আসল অ্যাকাউন্ট কানেক্ট করুন
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mtproto');
                  setErrorMsg('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'mtproto'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📱 লাইভ ওটিপি লগইন (MTProto)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('session');
                  setErrorMsg('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'session'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔑 সেশন স্ট্রিং ইমপোর্ট
              </button>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: Live MTProto OTP Login */}
            {activeTab === 'mtproto' && (
              <div>
                {mtprotoStep === 'phone' && (
                  <form onSubmit={handleSendCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        মোবাইল নম্বর (কান্ট্রি কোড সহ) *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="যেমন: +8801761623922 বা 01761623922"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        🔒 টেলিগ্রাম অফিসিয়াল সার্ভারের মাধ্যমে আপনার টেলিগ্রাম অ্যাপে একটি ৫ সংখ্যার কোড যাবে।
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        টেলিগ্রাম কোড পাঠান
                      </button>
                    </div>
                  </form>
                )}

                {mtprotoStep === 'otp' && (
                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          ৫ সংখ্যার ভেরিফিকেশন কোড *
                        </label>
                        <span className="text-[11px] text-blue-400 font-mono">{phone}</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="যেমন: 92726"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-center tracking-widest text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500 font-mono font-bold"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        📩 টেলিগ্রাম অ্যাপের অফিসিয়াল চ্যাটে (777000) আসা কোডটি দিন।
                      </p>
                    </div>

                    <div className="pt-2 flex justify-between items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMtprotoStep('phone')}
                        className="text-xs text-slate-400 hover:text-slate-200 underline"
                      >
                        ← নম্বর পরিবর্তন করুন
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        যাচাই করুন ও কানেক্ট করুন
                      </button>
                    </div>
                  </form>
                )}

                {mtprotoStep === '2fa' && (
                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        টেলিগ্রাম টু-স্টেপ পাসওয়ার্ড (2FA Cloud Password) *
                      </label>
                      <input
                        type="password"
                        required
                        value={password2FA}
                        onChange={(e) => setPassword2FA(e.target.value)}
                        placeholder="আপনার টু-স্টেপ পাসওয়ার্ড দিন"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        পাসওয়ার্ড ভেরিফাই করুন
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: String Session Import */}
            {activeTab === 'session' && (
              <form onSubmit={handleImportSession} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telethon / GramJS সেশন স্ট্রিং *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={sessionString}
                    onChange={(e) => setSessionString(e.target.value)}
                    placeholder="1BVtsOK0Bu... আপনার সেশন স্ট্রিং পেস্ট করুন"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      মোবাইল নম্বর
                    </label>
                    <input
                      type="text"
                      value={sessionPhone}
                      onChange={(e) => setSessionPhone(e.target.value)}
                      placeholder="+8801700000000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      নাম
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="যেমন: Tanvir"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    সেশন ইমপোর্ট করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
