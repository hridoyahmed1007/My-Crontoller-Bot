import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  User, 
  AtSign, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Bot, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { AdminController } from '../types';

interface AdminAuthModalProps {
  currentAdmin: AdminController | null;
  onLoginSuccess: (admin: AdminController) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  currentAdmin,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('জিমেইল/ইমেইল এবং পাসওয়ার্ড দেওয়া আবশ্যক!');
      return;
    }

    if (!telegramId.trim() && !username.trim()) {
      setError('টেলিগ্রাম ইউজার আইডি অথবা ইউজারনেম দেওয়া আবশ্যক!');
      return;
    }

    if (password.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: telegramId.trim(),
          username: username.trim().replace(/^@+/, ''),
          name: name.trim() || username.trim() || 'Admin Controller',
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.admin) {
        setSuccessMsg('🎉 অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! এখন স্বয়ংক্রিয়ভাবে লগইন হচ্ছে...');
        localStorage.setItem('live_admin_auth', JSON.stringify(data.admin));
        setTimeout(() => {
          onLoginSuccess(data.admin);
        }, 800);
      } else {
        setError(data.error || 'সাইন আপ করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      setError(err?.message || 'সার্ভার যোগাযোগে ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('আপনার জিমেইল/ইমেইল এবং পাসওয়ার্ড লিখুন!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.admin) {
        setSuccessMsg('✅ লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        localStorage.setItem('live_admin_auth', JSON.stringify(data.admin));
        setTimeout(() => {
          onLoginSuccess(data.admin);
        }, 600);
      } else {
        setError(data.error || 'ভুল ইমেইল বা পাসওয়ার্ড!');
      }
    } catch (err: any) {
      setError(err?.message || 'সার্ভার যোগাযোগে ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/10 relative my-8">
        
        {/* Glow Top Accent */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>লাইভ অ্যাডমিন প্যানেল</span>
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] rounded-full font-semibold">
              Super Admin
            </span>
          </h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] text-amber-300 font-medium">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>প্রাইভেট সিকিউর সিস্টেম: শুধুমাত্র মূল সুপার অ্যাডমিন (@Thebossbd360)</span>
          </div>
        </div>

        {/* Tab Switcher: Login / Signup */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            id="tab-auth-login"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            লগইন (Sign In)
          </button>
          <button
            type="button"
            id="tab-auth-signup"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            সাইন আপ (Sign Up)
          </button>
        </div>

        {/* Alert Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            {/* Step 1: Telegram ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>১. টেলিগ্রাম ইউজার আইডি (Telegram ID) *</span>
                <span className="text-[10px] text-sky-400 font-normal">যেমন: 7983626971</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="signup-input-tg-id"
                  type="text"
                  placeholder="আপনার সংখ্যায় টেলিগ্রাম আইডি দিন"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Step 2: Telegram Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>২. টেলিগ্রাম ইউজারনেম (Username) *</span>
                <span className="text-[10px] text-sky-400 font-normal">যেমন: Thebossbd360</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <AtSign className="w-4 h-4" />
                </span>
                <input
                  id="signup-input-username"
                  type="text"
                  placeholder="ইউজারনেম লিখুন (যেমন: Thebossbd360)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Step 3: Full Name (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আপনার নাম (Name)
              </label>
              <input
                id="signup-input-name"
                type="text"
                placeholder="যেমন: offline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Step 4: Gmail / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>৩. জিমেইল / ইমেইল (Gmail/Email) *</span>
                <span className="text-[10px] text-emerald-400 font-normal">লগইনে কাজে লাগবে</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signup-input-email"
                  type="email"
                  placeholder="anarulislamai1020@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Step 5: Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>৪. পাসওয়ার্ড (Password) *</span>
                <span className="text-[10px] text-slate-400 font-normal">গোপনীয় রাখুন</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="signup-input-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="আপনার পাসওয়ার্ড দিন..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-signup"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
              ) : (
                <>
                  <span>✨ সাইন আপ ও সুপার অ্যাডমিন ক্রিয়েট</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN IN / LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>জিমেইল / ইমেইল (Gmail/Email) *</span>
                <span className="text-[10px] text-sky-400 font-normal">যেটি দিয়ে সাইন আপ করেছেন</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login-input-email"
                  type="email"
                  placeholder="anarulislamai1020@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>পাসওয়ার্ড (Password) *</span>
                <span className="text-[10px] text-slate-400 font-normal">আপনার অ্যাডমিন পাসওয়ার্ড</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="login-input-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="পাসওয়ার্ড দিন..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>যাচাই করা হচ্ছে...</span>
              ) : (
                <>
                  <span>🔐 অ্যাডমিন প্যানেলে লগইন করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-400">
                নতুন অ্যাডমিন?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  এখানে ক্লিক করে সাইন আপ করুন
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>১০০% স্থায়ী ডাটাবেজে আপনার অ্যাডমিন এক্সেস সংরক্ষিত থাকবে</span>
          </p>
        </div>
      </div>
    </div>
  );
};
