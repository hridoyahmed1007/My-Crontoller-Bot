import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Users,
  Search,
  KeyRound,
  Sparkles,
  ExternalLink,
  Lock,
  Eye,
  RefreshCw,
  Info,
  BadgeAlert
} from 'lucide-react';
import { AdminController } from '../types';

export function AdminManagerTab() {
  const [admins, setAdmins] = useState<AdminController[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form inputs
  const [newName, setNewName] = useState('');
  const [newTelegramId, setNewTelegramId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'controller'>('controller');
  const [newNotes, setNewNotes] = useState('');

  // Access test checker
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ checked: boolean; authorized: boolean; match?: AdminController } | null>(null);

  // Fetch admin controllers list from server
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admins');
      if (res.ok) {
        const data = await res.json();
        if (data.admins && Array.isArray(data.admins)) {
          setAdmins(data.admins);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    const interval = setInterval(fetchAdmins, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add new controller
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTelegramId && !newUsername) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে টেলিগ্রাম আইডি অথবা ইউজারনেম দিন।' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          telegramId: newTelegramId,
          username: newUsername,
          role: newRole,
          notes: newNotes,
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
        setNewName('');
        setNewTelegramId('');
        setNewUsername('');
        setNewNotes('');
        setStatusMessage({
          type: 'success',
          text: `✅ "${data.admin?.name || 'কন্ট্রোলার'}" সফলভাবে যুক্ত হয়েছে! এখন এই ইউজার টেলিগ্রাম বটে পূর্ণ এক্সেস পাবেন।`
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'যুক্ত করতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  // Delete controller
  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${name}"-এর বট এক্সেস বাতিল করতে চান?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
        setStatusMessage({
          type: 'success',
          text: `🗑️ "${name}"-এর এক্সেস সফলভাবে বাতিল করা হয়েছে। এখন সে আর বট চালাতে পারবে না।`
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'মুছতে ব্যর্থ হয়েছে।' });
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admins/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Test access checker
  const handleCheckAccess = () => {
    if (!testInput.trim()) {
      setTestResult(null);
      return;
    }

    const clean = testInput.trim().replace(/^@/, '').toLowerCase();
    const cleanDigits = testInput.replace(/\D/g, '');

    const match = admins.find(a => {
      if (!a.isActive) return false;
      const matchTgId = cleanDigits && a.telegramId && a.telegramId.replace(/\D/g, '') === cleanDigits;
      const matchUname = clean && a.username && a.username.trim().replace(/^@/, '').toLowerCase() === clean;
      return matchTgId || matchUname;
    });

    if (match) {
      setTestResult({ checked: true, authorized: true, match });
    } else {
      setTestResult({ checked: true, authorized: false });
    }
  };

  const activeCount = admins.filter(a => a.isActive).length;

  return (
    <div id="admin-manager-tab-container" className="h-full flex flex-col space-y-5 overflow-y-auto pr-1 pb-10">
      {/* Top Banner / System Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">অনুমোদিত কন্ট্রোলার</span>
            <div className="text-2xl font-bold text-slate-100 mt-1 flex items-baseline gap-2">
              <span>{admins.length} জন</span>
              <span className="text-xs font-medium text-emerald-400">({activeCount} সক্রিয়)</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">এক্সেস কন্ট্রোল সিকিউরিটি</span>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>১০০% সুরক্ষিত গার্ড সক্রিয়</span>
            </div>
            <span className="text-[11px] text-slate-400">তালিকাবহির্ভূতদের কমান্ড ব্লকড</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ডাটাবেস ও বট সিংক</span>
            <div className="text-sm font-bold text-sky-400 mt-1 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>রিয়েলটাইম ইনস্ট্যান্ট সিংক</span>
            </div>
            <span className="text-[11px] text-slate-400">সেভ হওয়ার সাথে সাথে বট আপডেট</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Status feedback banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-0.5 rounded bg-slate-800"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Main Grid: Add Controller Form & Controllers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Add Controller Form (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">নতুন কন্ট্রোলার নিয়োগ / এক্সেস প্রদান</h3>
                <p className="text-xs text-slate-400">ইউজারনেম বা টেলিগ্রাম আইডি দিয়ে সহজে ফুল এক্সেস দিন</p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-3.5">
              {/* Telegram ID input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>টেলিগ্রাম ইউজার আইডি (Telegram ID) *</span>
                  <span className="text-[10px] text-sky-400 font-normal">যেমন: 7297762323</span>
                </label>
                <input
                  id="input-admin-tg-id"
                  type="text"
                  placeholder="সংখ্যায় টেলিগ্রাম আইডি দিন (যেমন: 7297762323)"
                  value={newTelegramId}
                  onChange={(e) => setNewTelegramId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Telegram Username input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>টেলিগ্রাম ইউজারনেম (Username)</span>
                  <span className="text-[10px] text-sky-400 font-normal">যেমন: habib20863</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">@</span>
                  <input
                    id="input-admin-username"
                    type="text"
                    placeholder="ইউজারনেম লিখুন (যেমন: habib20863)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Name / Identifier */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  কন্ট্রোলারের নাম বা লেবেল
                </label>
                <input
                  id="input-admin-name"
                  type="text"
                  placeholder="যেমন: রহিম আহমেদ (অপারেটর)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Role selection */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="btn-role-controller"
                  onClick={() => setNewRole('controller')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                    newRole === 'controller'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 ring-1 ring-blue-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🛡️ অপারেটর কন্ট্রোলার
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">লাইভে আইডি যুক্ত ও রিমুভ</span>
                </button>

                <button
                  type="button"
                  id="btn-role-superadmin"
                  onClick={() => setNewRole('super_admin')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                    newRole === 'super_admin'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    👑 সুপার অ্যাডমিন
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">পূর্ণ কর্তৃত্ব ও ক্ষমতা</span>
                </button>
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  নোট বা বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  id="input-admin-notes"
                  type="text"
                  placeholder="যেমন: রাতের লাইভ স্ট্রিম দেখভাল করবেন"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit button */}
              <button
                id="btn-submit-add-admin"
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>➕ এক্সেস অনুমোদন দিন</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Access Simulator / Tester Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                এক্সেস ভেরিফিকেশন টেস্ট (লাইভ সিমুলেটর)
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              যেকোনো টেলিগ্রাম আইডি বা ইউজারনেম দিয়ে টেস্ট করুন সে বটের এক্সেস পাবে কিনা:
            </p>

            <div className="flex gap-1.5">
              <input
                id="input-test-access"
                type="text"
                placeholder="আইডি বা @username দিন..."
                value={testInput}
                onChange={(e) => {
                  setTestInput(e.target.value);
                  if (!e.target.value) setTestResult(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckAccess()}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                id="btn-run-test-access"
                type="button"
                onClick={handleCheckAccess}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                টেস্ট
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2.5 p-2.5 rounded-xl border text-xs ${
                  testResult.authorized
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.authorized ? (
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400 block font-bold">
                        ✅ পূর্ণ এক্সেস পাবে! ({testResult.match?.name})
                      </strong>
                      <span className="text-[11px] text-slate-300">
                        বটে /start পাঠালে সব কন্ট্রোল বাটন ও পূর্ণ অ্যাডমিন সুবিধা দেখতে পাবে।
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <BadgeAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-400 block font-bold">
                        ⛔ কোনো এক্সেস পাবে না (ব্লকড)
                      </strong>
                      <span className="text-[11px] text-slate-300">
                        বটে মেসেজ দিলে কোনো বাটন আসবে না, সরাসরি <i>"আপনার এক্সেস নাই"</i> বার্তা যাবে।
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authorized Controllers List (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    অনুমোদিত কন্ট্রোলার ও অ্যাডমিন তালিকা ({admins.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    এদের সবার টেলিগ্রাম অ্যাকাউন্টে বটের পূর্ণ পরিচালনা এক্সেস রয়েছে
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAdmins}
                title="রিফ্রেশ"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            {loading && admins.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs">কন্ট্রোলার তালিকা লোড হচ্ছে...</span>
              </div>
            ) : admins.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-3">
                <Users className="w-10 h-10 text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-300">কোনো অতিরিক্ত কন্ট্রোলার যুক্ত নেই</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  বামপাশের ফর্ম থেকে আপনার সহকর্মী বা পরিচালকের টেলিগ্রাম আইডি ও ইউজারনেম যুক্ত করে এক্সেস দিন।
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
                {admins.map((admin, idx) => {
                  const isSuper = admin.role === 'super_admin';
                  const cleanUname = admin.username ? admin.username.replace(/^@/, '') : '';

                  return (
                    <div
                      key={admin.id || idx}
                      id={`admin-card-${admin.id}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        admin.isActive
                          ? isSuper
                            ? 'bg-slate-950/90 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Avatar Circle */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isSuper
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-700 text-white border-amber-400/40 shadow-sm shadow-amber-500/20'
                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-blue-400/30'
                            }`}
                          >
                            {isSuper ? '👑' : admin.name.charAt(0).toUpperCase() || '👤'}
                          </div>

                          {/* Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-100">{admin.name}</h4>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${
                                  isSuper
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {isSuper ? 'Super Admin' : 'Controller'}
                              </span>

                              <span
                                className={`px-1.5 py-0.2 text-[10px] rounded-md font-medium flex items-center gap-1 ${
                                  admin.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                {admin.isActive ? 'সক্রিয় এক্সেস' : 'সাময়িক স্থগিত'}
                              </span>
                            </div>

                            {/* Details row */}
                            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                              {admin.telegramId && (
                                <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                  <span className="text-[10px] text-slate-400">ID:</span>
                                  <code className="font-mono text-sky-400 font-semibold">{admin.telegramId}</code>
                                  <button
                                    onClick={() => handleCopy(admin.telegramId, `id-${admin.id}`)}
                                    title="কপি করুন"
                                    className="text-slate-400 hover:text-slate-200 ml-0.5"
                                  >
                                    {copiedId === `id-${admin.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {cleanUname && (
                                <a
                                  href={`https://t.me/${cleanUname}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <span className="text-[10px] text-slate-400">User:</span>
                                  <span className="font-mono">@{cleanUname}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              )}

                              {admin.addedAt && (
                                <span className="text-[10px] text-slate-400">
                                  যুক্ত: {admin.addedAt}
                                </span>
                              )}
                            </div>

                            {admin.notes && (
                              <p className="text-[11px] text-slate-400 italic pt-0.5">
                                💬 {admin.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Toggle Active Status */}
                          <button
                            id={`btn-toggle-admin-${admin.id}`}
                            onClick={() => handleToggleStatus(admin.id)}
                            title={admin.isActive ? 'এক্সেস সাময়িক বন্ধ করুন' : 'এক্সেস সক্রিয় করুন'}
                            className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                              admin.isActive
                                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            {admin.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                          </button>

                          {/* Delete Button (Super admin protected if first) */}
                          {idx !== 0 && (
                            <button
                              id={`btn-delete-admin-${admin.id}`}
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              title="এক্সেস চিরতরে মুছুন"
                              className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info Footer */}
            <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  এখানে যেকোনো নতুন আইডি যুক্ত করলেই সে সাথে সাথে টেলিগ্রাম বটে লাইভ কন্ট্রোলার মেনু দেখতে পাবে।
                </span>
              </div>
              <span className="font-mono text-emerald-400 text-[10px] hidden sm:inline">
                Disk Persisted: /data/bot_admins.json
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
