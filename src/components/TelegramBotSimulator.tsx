import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Heart, 
  Flame, 
  ThumbsUp, 
  PartyPopper, 
  LogOut, 
  RotateCcw,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { TelegramAccount } from '../types';

interface TelegramBotSimulatorProps {
  accounts: TelegramAccount[];
  onAddAccount: (acc: Omit<TelegramAccount, 'id'>) => void;
  onJoinLive: (target: string) => void;
  onLeaveLive: () => void;
  onSendReaction: (emoji: string) => void;
  isLiveActive: boolean;
  liveTarget: string;
  activeLiveCount: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  buttons?: { label: string; action: string; style?: 'primary' | 'danger' | 'secondary' }[][];
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  accounts,
  onAddAccount,
  onJoinLive,
  onLeaveLive,
  onSendReaction,
  isLiveActive,
  liveTarget,
  activeLiveCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [simulatedUserType, setSimulatedUserType] = useState<'admin' | 'unauthorized'>('admin');
  const [currentStep, setCurrentStep] = useState<
    'idle' | 'waiting_phone' | 'waiting_otp' | 'waiting_2fa' | 'waiting_live_link'
  >('idle');
  const [tempPhone, setTempPhone] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      if (simulatedUserType === 'admin') {
        sendBotWelcome();
      } else {
        sendUnauthorizedDenial();
      }
    }
  }, [simulatedUserType]);

  const sendUnauthorizedDenial = () => {
    const denyMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `⛔ **অ্যাক্সেস অনুমোদিত নয়!**\n━━━━━━━━━━━━━━━━━━━━━━━━\n👋 দুঃখিত **ব্যবহারকারী**, আপনার টেলিগ্রাম অ্যাকাউন্টটি এই বটের অ্যাডমিন বা কন্ট্রোলার হিসেবে নিবন্ধিত নয়।\n\n⚠️ **অ্যাডমিন প্যানেল থেকে আপনাকে কোনো এক্সেস দেওয়া হয়নি।**\n\n📋 **আপনার টেলিগ্রাম তথ্য:**\n├ 🆔 **আপনার টেলিগ্রাম আইডি:** \`9876543210\`\n└ 👤 **ইউজারনেম:** _(কোনো ইউজারনেম সেট করা নেই)_\n\n💡 _বটটি ব্যবহারের জন্য এক্সেস প্রয়োজন হলে মূল অ্যাডমিনের সাথে যোগাযোগ করে আপনার টেলিগ্রাম আইডিটি অ্যাডমিন প্যানেলে যুক্ত করিয়ে নিন।_`,
      buttons: [] // NO buttons for unauthorized users!
    };
    setMessages((prev) => [...prev, denyMsg]);
  };

  const sendBotWelcome = () => {
    const welcomeMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `👑 **লাইভ কন্ট্রোলার — অ্যাডমিন ড্যাশবোর্ড**\n━━━━━━━━━━━━━━━━━━━━━━━━\n👋 স্বাগতম, **Habib Hasan** _(অনলি অ্যাডমিন অ্যাক্সেস)_\n\n📊 **সিস্টেম ও ক্লাস্টার স্ট্যাটাস:**\n├ 📡 **ইঞ্জিন:** MTProto Real Android Client\n├ 👥 **সংরক্ষিত অ্যাকাউন্ট:** **${accounts.length} টি** (১০০% স্থায়ী ও সুরক্ষিত)\n├ ⏱️ **অ্যান্টি-ব্যান ডিলে:** ২.৫ – ৫.০ সেকেন্ড মানবীয় ব্যবধান\n└ 🛡️ **অ্যাডমিন গার্ড:** 🟢 ভেরিফায়েড ও সক্রিয়\n\n${
        isLiveActive
          ? `🔴 **চলমান লাইভ:** \`${liveTarget || 'Active Room'}\` (👥 **${accounts.length} টি আইডি লাইভে যুক্ত**)`
          : `⚪ **লাইভ স্থিতি:** আইডল (কোনো লাইভ চলমান নেই, সব আইডি প্রস্তুত)`
      }\n\n⚙️ **কুইক অ্যাকশন নির্দেশিকা:**\n• **লাইভে প্রবেশ:** \`🔴 লাইভে আইডি যুক্ত করুন\` চেপে চ্যানেল ইউজারনেম দিন।\n• **আইডি পর্যবেক্ষণ:** \`👥 যুক্ত অ্যাকাউন্ট তালিকা\` তে সব আইডির প্রোফাইল দেখুন।\n• **নতুন আইডি যোগ:** \`➕ নতুন অ্যাকাউন্ট যোগ\` চেপে সহজে আইডি যুক্ত করুন।\n• **লাইভ সমাপ্ত:** \`⏹️ লাইভ ছেড়ে আসুন\` চেপে সব আইডি একসাথে বের করুন।\n━━━━━━━━━━━━━━━━━━━━━━━━\n👇 **নিয়ন্ত্রণ করতে নিচের মেনু থেকে কমান্ড নির্বাচন করুন:**`,
      buttons: [
        [
          { label: '➕ নতুন অ্যাকাউন্ট যোগ', action: 'add_acc', style: 'primary' },
          { label: `👥 যুক্ত অ্যাকাউন্ট তালিকা (${accounts.length})`, action: 'list_accs' },
        ],
        [
          { label: '🔴 লাইভে আইডি যুক্ত করুন', action: 'start_live_flow', style: 'primary' },
          { label: '⏹️ লাইভ ছেড়ে আসুন', action: 'leave_all_live', style: 'danger' },
        ],
        [
          { label: '📊 বট হেলথ ও স্ট্যাটাস', action: 'show_status' },
          { label: '💡 সাহায্য ও ব্যবহারের নিয়ম', action: 'help_menu' },
        ],
      ],
    };
    setMessages((prev) => [...prev, welcomeMsg]);
  };

  const handleButtonClick = (action: string) => {
    if (simulatedUserType === 'unauthorized') {
      sendUnauthorizedDenial();
      return;
    }
    // Add user click representation
    if (action === 'add_acc') {
      setCurrentStep('waiting_phone');
      addBotMessage(
        '📱 **নতুন Telegram অ্যাকাউন্ট যোগ করার পদ্ধতি:**\n\nঅনুগ্রহ করে যে অ্যাকাউন্টটি যুক্ত করতে চান তার **আন্তর্জাতিক কান্ট্রি কোড সহ ফোন নম্বরটি লিখুন**।\n\n👉 উদাহরণ: `+8801712345678` অথবা `+1234567890`\n\n_নম্বর পাঠানোর পর আপনার টেলিগ্রাম অ্যাপে একটি ৫ সংখ্যার ওটিপি (OTP) কোড যাবে।_',
        [[{ label: '🔙 বাতিল ও ফিরে যান', action: 'main_menu', style: 'secondary' }]]
      );
    } else if (action === 'main_menu') {
      setCurrentStep('idle');
      sendBotWelcome();
    } else if (action === 'list_accs') {
      if (accounts.length === 0) {
        addBotMessage(
          '📭 বর্তমানে কোনো অ্যাকাউন্ট সেভ করা নেই। প্রথমে **নতুন অ্যাকাউন্ট যোগ করুন** বাটনে চাপুন।',
          [
            [
              { label: '➕ নতুন অ্যাকাউন্ট যোগ করুন', action: 'add_acc', style: 'primary' },
              { label: '🔙 প্রধান মেনু', action: 'main_menu' },
            ],
          ]
        );
      } else {
        const listText =
          `📋 **সংরক্ষিত অ্যাকাউন্টের তালিকা (${accounts.length} টি):**\n\n` +
          accounts
            .map(
              (acc, idx) =>
                `${idx + 1}. **${acc.name}** (\`${acc.phone}\`)\n   └ স্ট্যাটাস: ${
                  acc.status === 'in_live' ? '🔴 লাইভে সংযুক্ত' : '🟢 প্রস্তুত'
                } | ${acc.isPremium ? '⭐ Premium' : '👤 Standard'}`
            )
            .join('\n\n');

        addBotMessage(listText, [
          [
            { label: '➕ আরও অ্যাকাউন্ট যোগ করুন', action: 'add_acc', style: 'primary' },
            { label: '🚀 লাইভে পাঠান', action: 'start_live_flow' },
          ],
          [{ label: '🔙 প্রধান মেনু', action: 'main_menu' }],
        ]);
      }
    } else if (action === 'start_live_flow') {
      if (accounts.length === 0) {
        addBotMessage('❌ কোনো অ্যাকাউন্ট যুক্ত করা নেই! আগে অন্তত একটি অ্যাকাউন্ট যোগ করুন।', [
          [{ label: '➕ অ্যাকাউন্ট যোগ করুন', action: 'add_acc', style: 'primary' }],
        ]);
        return;
      }
      setCurrentStep('waiting_live_link');
      addBotMessage(
        '🚀 **লাইভ স্ট্রিমে যুক্ত করার জন্য লিংক বা ইউজারনেম দিন:**\n\nযে টেলিগ্রাম চ্যানেল বা গ্রুপের লাইভ স্ট্রিমে অ্যাকাউন্টগুলো পাঠাতে চান, সেটির লিংক পাঠান।\n\n👉 উদাহরণ:\n• `@bangla_tech_channel`\n• `https://t.me/cryptolive_bd`\n• `https://t.me/+AbCdEfGhIjK123`',
        [
          [
            { label: '⚡ ডেমো লাইভ নির্বাচন করুন (@tech_voice_live)', action: 'use_demo_live' },
          ],
          [{ label: '🔙 বাতিল', action: 'main_menu' }],
        ]
      );
    } else if (action === 'use_demo_live') {
      executeLiveJoin('@tech_voice_live');
    } else if (action === 'leave_all_live') {
      onLeaveLive();
      addBotMessage(
        `🛑 **সব অ্যাকাউন্ট লাইভ স্ট্রিম থেকে সফলভাবে ডিসকানেক্ট করা হয়েছে!**\n\nমোট ডিসকানেক্টেড আইডি: **${activeLiveCount || accounts.length}** টি।`,
        [[{ label: '🔙 প্রধান মেনু', action: 'main_menu', style: 'primary' }]]
      );
    } else if (action === 'send_reactions_menu') {
      addBotMessage('✨ লাইভে সবগুলো অ্যাকাউন্ট থেকে কী রিঅ্যাকশন পাঠাতে চান?', [
        [
          { label: '❤️ লাভ', action: 'react_heart' },
          { label: '🔥 আগুন', action: 'react_fire' },
          { label: '👍 লাইক', action: 'react_thumbs' },
        ],
        [
          { label: '👏 তালি', action: 'react_clap' },
          { label: '🎉 পার্টি', action: 'react_party' },
        ],
        [{ label: '🔙 প্রধান মেনু', action: 'main_menu' }],
      ]);
    } else if (action.startsWith('react_')) {
      const emojiMap: Record<string, string> = {
        react_heart: '❤️',
        react_fire: '🔥',
        react_thumbs: '👍',
        react_clap: '👏',
        react_party: '🎉',
      };
      const emoji = emojiMap[action] || '❤️';
      onSendReaction(emoji);
      addBotMessage(`✅ **${emoji}** রিঅ্যাকশনটি লাইভের সকল সংযুক্ত অ্যাকাউন্টের মাধ্যমে পাঠানো হয়েছে!`, [
        [
          { label: '✨ আরও রিঅ্যাকশন', action: 'send_reactions_menu' },
          { label: '🔙 প্রধান মেনু', action: 'main_menu' },
        ],
      ]);
    } else if (action === 'show_status') {
      addBotMessage(
        `📊 **সিস্টেম লাইভ স্ট্যাটাস:**\n\n• মোট অ্যাকাউন্ট সংখ্যা: **${accounts.length}**\n• লাইভে সক্রিয় অ্যাকাউন্ট: **${activeLiveCount}**\n• বর্তমান লাইভ রুম: **${
          liveTarget || 'কোনোটি নয়'
        }**\n• লাইভ অডিও ইঞ্জিন: **PyTgCalls MTProto Live Listener**\n• অ্যান্টি-ব্যান ডিলে: **2.5 সেকেন্ড (Jittering Active)**\n• প্রক্সি স্ট্যাটাস: **🟢 All Good**`,
        [[{ label: '🔙 প্রধান মেনু', action: 'main_menu', style: 'primary' }]]
      );
    } else if (action === 'help_menu') {
      addBotMessage(
        'ℹ️ **টেলিগ্রাম বট ব্যবহার নির্দেশিকা:**\n\n১. **অ্যাকাউন্ট যোগ:** `➕ নতুন অ্যাকাউন্ট যোগ করুন` এ চাপুন -> ফোন নম্বর দিন -> আপনার টেলিগ্রামে আসা কোডটি পাঠিয়ে দিন।\n\n২. **লাইভে পাঠানো:** `🚀 লাইভ স্ট্রিমে জয়েন করান` এ চাপুন -> আপনার বা যেকারো চ্যানেলের লাইভ লিংক দিন -> নিমেষেই আইডিগুলো শ্রোতা হিসেবে জয়েন করবে।\n\n৩. **রিয়েল মেম্বারদের মতো অ্যাক্টিভিটি:** আইডিগুলো লাইভে জয়েন করে অডিও স্ট্রিম শুনবে এবং চাইলে লাইভে হার্ট/ফায়ার রিঅ্যাকশন ও কমেন্ট করবে।\n\n৪. **লাইভ ত্যাগ:** `🛑 লাইভ ত্যাগ করুন` এ চাপলেই সব আইডি সাথে সাথে ডিসকানেক্ট হয়ে যাবে।',
        [[{ label: '🔙 প্রধান মেনু', action: 'main_menu', style: 'primary' }]]
      );
    }
  };

  const addBotMessage = (text: string, buttons?: ChatMessage['buttons']) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      buttons,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const addUserMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const executeLiveJoin = (target: string) => {
    setCurrentStep('idle');
    addBotMessage(
      `🚀 **লাইভ স্ট্রিমে জয়েনিং প্রক্রিয়া শুরু হয়েছে...**\n\n🎯 টার্গেট: \`${target}\`\n👥 মোট অ্যাকাউন্ট: **${accounts.length}** টি\n⏳ অ্যান্টি-ফ্লাড সেফটি ডিলে সহ একে একে যুক্ত করা হচ্ছে...`
    );

    setTimeout(() => {
      onJoinLive(target);
      addBotMessage(
        `🏁 **লাইভ স্ট্রিমে সফলভাবে জয়েন সম্পন্ন হয়েছে!**\n\n🎯 রুম: \`${target}\`\n✅ সফলভাবে যুক্ত হয়েছে: **${accounts.length}** টি আসল আইডি\n🔴 স্ট্যাটাস: **Active Voice/Video Stream Listener**\n\nএখন আইডিগুলো লাইভের ভেতরে আসল শ্রোতা হিসেবে অবস্থান করছে।`,
        [
          [
            { label: '❤️ রিঅ্যাকশন পাঠান', action: 'send_reactions_menu', style: 'primary' },
            { label: '🛑 লাইভ ত্যাগ করান', action: 'leave_all_live', style: 'danger' },
          ],
          [{ label: '🔙 প্রধান মেনু', action: 'main_menu' }],
        ]
      );
    }, 1200);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    addUserMessage(text);
    setInputVal('');

    if (simulatedUserType === 'unauthorized') {
      setTimeout(sendUnauthorizedDenial, 300);
      return;
    }

    if (text === '/start') {
      setCurrentStep('idle');
      sendBotWelcome();
      return;
    }

    if (currentStep === 'waiting_phone') {
      if (!text.startsWith('+') || text.length < 8) {
        addBotMessage('❌ অনুগ্রহ করে কান্ট্রি কোড সহ সঠিক নম্বর দিন (যেমন: `+8801700000000`)।');
        return;
      }
      setTempPhone(text);
      const generatedOtp = Math.floor(10000 + Math.random() * 90000).toString();
      setMockOtp(generatedOtp);
      setCurrentStep('waiting_otp');

      setTimeout(() => {
        addBotMessage(
          `📩 \`${text}\` নম্বরে টেলিগ্রাম অ্যাপের ভেতর থেকে একটি ৫ সংখ্যার লগইন ওটিপি (OTP) পাঠানো হয়েছে।\n\n🔒 **টেস্টিং ওটিপি কোড:** \`${generatedOtp}\`\n\nদয়া করে নিচের ঘরে কোডটি লিখে পাঠিয়ে দিন:`,
          [[{ label: `⚡ অটো কোড পেস্ট করুন (${generatedOtp})`, action: `paste_otp_${generatedOtp}` }]]
        );
      }, 600);
    } else if (currentStep === 'waiting_otp') {
      setCurrentStep('idle');
      const randomNames = [
        'Hasan Mahmud',
        'Tanvir Ahmed',
        'Shakil Khan',
        'Md. Rakib',
        'Kamrul Islam',
        'Farhan Kabir',
      ];
      const selectedName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const username = selectedName.toLowerCase().replace(/[^a-z]/g, '') + Math.floor(100 + Math.random() * 900);

      setTimeout(() => {
        onAddAccount({
          name: selectedName,
          username: username,
          phone: tempPhone,
          avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + accounts.length}?w=150&auto=format&fit=crop&q=80`,
          sessionString: '1BVtsOK0Bu...encrypted_mtproto_string_session...',
          apiId: '28491023',
          apiHash: 'b871c89012345678abcdef0123456789',
          status: 'idle',
          isPremium: Math.random() > 0.6,
          country: 'Bangladesh',
          countryCode: '+880',
          tags: ['Bangla', 'Real ID', 'Live Ready'],
          selected: true,
        });

        addBotMessage(
          `🎉 **অভিনন্দন! অ্যাকাউন্ট সফলভাবে ভেরিফাই ও সেভ হয়েছে!**\n\n👤 নাম: **${selectedName}**\n📱 নম্বর: \`${tempPhone}\`\n🆔 ইউজারনেম: @${username}\n🔐 সেশন: **StringSession Encrypted & Stored**\n✨ মোট সক্রিয় অ্যাকাউন্ট: **${accounts.length + 1}** টি`,
          [
            [
              { label: '➕ আরও অ্যাকাউন্ট যোগ করুন', action: 'add_acc' },
              { label: '🚀 লাইভ স্ট্রিমে জয়েন করান', action: 'start_live_flow', style: 'primary' },
            ],
            [{ label: '🔙 প্রধান মেনু', action: 'main_menu' }],
          ]
        );
      }, 700);
    } else if (currentStep === 'waiting_live_link') {
      executeLiveJoin(text);
    } else {
      // General command fallback
      addBotMessage(
        `🤖 আমি আপনার কমান্ডটি পেয়েছি। নিচের অপশনগুলো থেকে আপনার পছন্দমতো বাটন সিলেক্ট করুন:`,
        [
          [
            { label: '🚀 লাইভে জয়েন করান', action: 'start_live_flow', style: 'primary' },
            { label: '👥 অ্যাকাউন্ট লিস্ট', action: 'list_accs' },
          ],
          [{ label: '🏠 প্রধান মেনু', action: 'main_menu' }],
        ]
      );
    }
  };

  return (
    <div id="telegram-bot-simulator-container" className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Bot Chat Header */}
      <div id="bot-header" className="bg-slate-950/80 backdrop-blur-md px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-100 text-sm md:text-base">Telegram Live Stream Bot</h3>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-sky-500/20 text-sky-400 rounded-full border border-sky-500/30">
                bot
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Multi-Client Master Active
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Persona selector */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => {
                setSimulatedUserType('admin');
                setMessages([]);
                setTimeout(sendBotWelcome, 50);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                simulatedUserType === 'admin'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👑 অ্যাডমিন ভিউ
            </button>
            <button
              onClick={() => {
                setSimulatedUserType('unauthorized');
                setMessages([]);
                setTimeout(sendUnauthorizedDenial, 50);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                simulatedUserType === 'unauthorized'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⛔ অননুমোদিত ইউজার ভিউ
            </button>
          </div>

          {isLiveActive ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-medium animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE: {activeLiveCount} Accounts</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-medium">
              {accounts.length} IDs Ready
            </div>
          )}
          <button
            id="btn-restart-bot-session"
            onClick={() => {
              setMessages([]);
              setTimeout(sendBotWelcome, 50);
            }}
            title="রিস্টার্ট বা ক্লিয়ার চ্যাট"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telegram Chat Message History */}
      <div id="bot-messages-area" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%] ${
              msg.sender === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-md ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
              }`}
            >
              {msg.text}
              <div
                className={`text-[10px] mt-2 text-right ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {/* Telegram Inline Keyboard Buttons */}
            {msg.buttons && msg.buttons.length > 0 && (
              <div className="mt-2.5 w-full space-y-1.5">
                {msg.buttons.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex flex-wrap gap-1.5">
                    {row.map((btn, btnIdx) => {
                      if (btn.action.startsWith('paste_otp_')) {
                        const code = btn.action.replace('paste_otp_', '');
                        return (
                          <button
                            key={btnIdx}
                            id={`btn-otp-${code}`}
                            onClick={() => {
                              addUserMessage(code);
                              setInputVal('');
                              setCurrentStep('waiting_otp');
                              handleSend();
                            }}
                            className="flex-1 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {btn.label}
                          </button>
                        );
                      }

                      let bgClass = 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700';
                      if (btn.style === 'primary') {
                        bgClass = 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border-blue-500/40 font-medium';
                      } else if (btn.style === 'danger') {
                        bgClass = 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40';
                      }

                      return (
                        <button
                          key={btnIdx}
                          id={`inline-btn-${btn.action}`}
                          onClick={() => handleButtonClick(btn.action)}
                          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl border text-xs text-center transition-all duration-150 active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 ${bgClass}`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Telegram Message Input Bar */}
      <div id="bot-input-bar" className="p-3 md:p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="telegram-chat-input-field"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              currentStep === 'waiting_phone'
                ? 'ফোন নম্বর দিন (যেমন: +8801700000000)...'
                : currentStep === 'waiting_otp'
                ? '৫ সংখ্যার টেলিগ্রাম ওটিপি (OTP) লিখুন...'
                : currentStep === 'waiting_live_link'
                ? 'লাইভের লিংক দিন (যেমন: @mychannel)...'
                : 'বটে মেসেজ বা কমান্ড লিখুন (যেমন: /start)...'
            }
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 outline-none transition-all"
          />
          <button
            id="telegram-chat-send-btn"
            type="submit"
            disabled={!inputVal.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors shadow-md flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <span>টাইপ করুন: <code className="text-slate-400">/start</code>, <code className="text-slate-400">/add_account</code>, <code className="text-slate-400">/join_live</code></span>
          <span className="flex items-center gap-1 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" /> MTProto Ready
          </span>
        </div>
      </div>
    </div>
  );
};
