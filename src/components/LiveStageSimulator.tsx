import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Users, 
  Heart, 
  Flame, 
  ThumbsUp, 
  PartyPopper, 
  Hand, 
  Sparkles, 
  Send, 
  Volume2, 
  ShieldCheck,
  Zap,
  MessageSquare
} from 'lucide-react';
import { TelegramAccount, LiveComment } from '../types';

interface LiveStageSimulatorProps {
  isLiveActive: boolean;
  liveTarget: string;
  accounts: TelegramAccount[];
  recentReactions: { id: string; emoji: string; x: number }[];
  onSendReaction: (emoji: string) => void;
  onLeaveLive: () => void;
}

export const LiveStageSimulator: React.FC<LiveStageSimulatorProps> = ({
  isLiveActive,
  liveTarget,
  accounts,
  recentReactions,
  onSendReaction,
  onLeaveLive,
}) => {
  const [hostSpeaking, setHostSpeaking] = useState(true);
  const [waveHeights, setWaveHeights] = useState<number[]>([40, 60, 90, 45, 75, 30, 85, 60, 95, 50, 70, 40]);
  const [comments, setComments] = useState<LiveComment[]>([
    {
      id: '1',
      accountId: 'acc1',
      accountName: 'Tanvir Ahmed',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: 'আসসালামু আলাইকুম ভাই! অডিও সাউন্ড এক্কেবারে ক্লিয়ার ❤️',
      timestamp: '10:05 PM',
    },
    {
      id: '2',
      accountId: 'acc2',
      accountName: 'Hasan Mahmud',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      text: 'অনেক তথ্যবহুল লাইভ সেশন হচ্ছে ভাই 🔥🔥',
      timestamp: '10:06 PM',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isGeneratingAiComments, setIsGeneratingAiComments] = useState(false);

  // Audio wave animation
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(25 + Math.random() * 75))
      );
      if (Math.random() > 0.8) {
        setHostSpeaking((s) => !s);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Function to generate realistic Bengali live comments from server API
  const handleGenerateAiComments = async () => {
    setIsGeneratingAiComments(true);
    try {
      const res = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: liveTarget || 'Telegram Channel Live Stream',
          language: 'bengali',
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.comments && Array.isArray(data.comments)) {
        const newItems: LiveComment[] = data.comments.map((txt: string, i: number) => {
          const acc = accounts[i % (accounts.length || 1)] || {
            name: 'Real Listener',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          };
          return {
            id: Date.now() + '-' + i,
            accountId: acc.phone || 'id',
            accountName: acc.name,
            avatarUrl: acc.avatarUrl,
            text: txt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setComments((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiComments(false);
    }
  };

  const handlePostManualComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const activeAcc = accounts[0] || {
      name: 'Admin User',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };
    const c: LiveComment = {
      id: Date.now().toString(),
      accountId: 'manual',
      accountName: activeAcc.name,
      avatarUrl: activeAcc.avatarUrl,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setComments((prev) => [...prev, c]);
    setNewCommentText('');
  };

  return (
    <div id="live-stage-simulator-container" className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Floating Reaction Flying Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {recentReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-20 text-3xl animate-bounce transform -translate-y-64 opacity-0 transition-all duration-1000 ease-out"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Stage Header */}
      <div id="live-stage-header" className="bg-slate-950/90 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm md:text-base">
                {liveTarget || '@tech_bangla_stream'}
              </h3>
              {isLiveActive && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white rounded-md animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Telegram Voice Chat & Video Stream Stage
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-xl text-xs">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium">
              {isLiveActive ? accounts.length + 1 : 1} Listeners
            </span>
          </div>

          {isLiveActive && (
            <button
              id="stage-leave-btn"
              onClick={onLeaveLive}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
            >
              Leave Live
            </button>
          )}
        </div>
      </div>

      {/* Stage Main View */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Host Speaker Card */}
        <div id="host-speaker-card" className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full border-4 ${
                  hostSpeaking
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                    : 'border-slate-700'
                } overflow-hidden transition-all duration-300`}
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  alt="Host"
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 p-1 rounded-full ${
                  hostSpeaking ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {hostSpeaking ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-100 text-base">Host (Streamer)</h4>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Speaking
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLiveActive ? 'Broadcasting live audio & video stream' : 'Stream offline or waiting to start'}
              </p>
            </div>
          </div>

          {/* Audio Wave Visualizer */}
          {isLiveActive ? (
            <div className="flex items-end gap-1 h-10 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
              {waveHeights.map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${hostSpeaking ? h : 15}%` }}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    hostSpeaking ? 'bg-gradient-to-t from-emerald-500 to-teal-300' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 px-3 py-1 bg-slate-900/50 rounded-lg border border-slate-800">
              Waiting for live activation...
            </div>
          )}
        </div>

        {/* Listeners Grid - Active Multi-Accounts */}
        <div id="live-listeners-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              সংযুক্ত লাইভ শ্রোতা অ্যাকাউন্টসমূহ ({isLiveActive ? accounts.length : 0} IDs Active)
            </h4>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Real MTProto Listeners
            </span>
          </div>

          {accounts.length === 0 ? (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-center text-slate-400 text-sm">
              বটের ভেতর কোনো অ্যাকাউন্ট নেই। টেলিগ্রাম বটে গিয়ে অ্যাকাউন্ট যোগ করুন।
            </div>
          ) : !isLiveActive ? (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-center text-slate-400 text-sm space-y-2">
              <p>অ্যাকাউন্টগুলো প্রস্তুত রয়েছে। বটের ভেতর <span className="text-blue-400 font-medium">"লাইভ স্ট্রিমে জয়েন করান"</span> বাটনে চাপলে এখানে সবাই রিয়েল শ্রোতা হিসেবে যোগ দেবে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {accounts.map((acc, index) => (
                <div
                  key={acc.id || index}
                  id={`listener-card-${index}`}
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center space-x-3 transition-all hover:bg-slate-950"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={acc.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{acc.name}</p>
                      {acc.isPremium && <span className="text-[10px] text-amber-400">⭐</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">@{acc.username || 'user'}</p>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5">
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>Listening</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Stream Chat & AI Comments Generator */}
        <div id="live-chat-panel" className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                লাইভ চ্যাট ও রিয়েল কমেন্ট স্ট্রিম
              </span>
            </div>
            <button
              id="btn-generate-ai-comments"
              onClick={handleGenerateAiComments}
              disabled={isGeneratingAiComments}
              className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingAiComments ? 'তৈরি হচ্ছে...' : 'AI দিয়ে অটো কমেন্ট পাঠান'}
            </button>
          </div>

          {/* Comment List */}
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {comments.map((cmt) => (
              <div key={cmt.id} className="flex items-start space-x-2.5 text-xs bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                <img
                  src={cmt.avatarUrl}
                  alt={cmt.accountName}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 text-[11px]">{cmt.accountName}</span>
                    <span className="text-[10px] text-slate-500">{cmt.timestamp}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5 text-xs">{cmt.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Post Comment Input */}
          <form onSubmit={handlePostManualComment} className="flex gap-2 pt-1">
            <input
              id="input-manual-live-comment"
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="লাইভ চ্যাটে মেসেজ লিখুন..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <button
              id="btn-send-manual-comment"
              type="submit"
              disabled={!newCommentText.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Reaction Toolbar */}
      <div id="live-stage-footer-reactions" className="bg-slate-950 border-t border-slate-800 p-3 px-5 flex items-center justify-between">
        <span className="text-xs text-slate-400 hidden sm:inline">
          লাইভে এক ক্লিকে সব আইডি থেকে রিঅ্যাকশন দিন:
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          {[
            { emoji: '❤️', label: 'Love' },
            { emoji: '🔥', label: 'Fire' },
            { emoji: '👍', label: 'Like' },
            { emoji: '👏', label: 'Clap' },
            { emoji: '🎉', label: 'Party' },
          ].map((r, i) => (
            <button
              key={i}
              id={`quick-reaction-${i}`}
              onClick={() => onSendReaction(r.emoji)}
              className="p-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-100 rounded-xl text-base transition-transform active:scale-125 border border-slate-700/60 shadow-sm"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
