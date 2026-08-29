import React, { useState } from 'react';
import { 
  Key, 
  Terminal, 
  ShieldCheck, 
  Server, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(0);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      title: '১. Telegram Bot Token সংগ্রহ করা (@BotFather)',
      icon: <Key className="w-5 h-5 text-amber-400" />,
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>টেলিগ্রাম অ্যাপের মধ্যে একটি মাস্টার কন্ট্রোলার বট তৈরি করতে হবে:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-1">
            <li>আপনার Telegram অ্যাপে সার্চ বারে গিয়ে খুঁজুন: <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-3 h-3 inline" /></a></li>
            <li>সেখানে <code className="bg-slate-800 text-sky-300 px-2 py-0.5 rounded">/newbot</code> লিখে মেসেজ পাঠান।</li>
            <li>আপনার বটের একটি সুন্দর নাম দিন (যেমন: <code className="text-slate-200">My Live Master Bot</code>)।</li>
            <li>একটি ইউনিক ইউজারনেম দিন যার শেষে <code>bot</code> থাকবে (যেমন: <code className="text-slate-200">my_live_stream_bot</code>)।</li>
            <li>BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে (যেমন: <code className="text-amber-300">7123456789:AAEjklmnopq...</code>)। এই টোকেনটি কপি করে রাখুন।</li>
          </ol>
        </div>
      ),
    },
    {
      title: '২. Telegram API_ID এবং API_HASH তৈরি করা (my.telegram.org)',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>UserBot বা আসল আইডি লাইভে প্রবেশ করানোর জন্য টেলিগ্রামের অফিশিয়াল API ক্রেডেনশিয়াল লাগে:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-1">
            <li>যেকোনো ব্রাউজারে যান: <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold underline inline-flex items-center gap-0.5">https://my.telegram.org <ExternalLink className="w-3 h-3 inline" /></a></li>
            <li>আপনার টেলিগ্রাম ফোন নম্বর দিয়ে লগইন করুন এবং টেলিগ্রাম অ্যাপে আসা কোডটি দিন।</li>
            <li>লগইন করার পর <strong>"API development tools"</strong> অপশনে ক্লিক করুন।</li>
            <li>App title এবং Short name-এ যেকোনো নাম দিন (যেমন: <code>LiveStreamer</code>) এবং Create-এ চাপুন।</li>
            <li>আপনি একটি <strong>App api_id</strong> (যেমন: <code className="text-emerald-300">28491023</code>) এবং <strong>App api_hash</strong> (যেমন: <code className="text-emerald-300">b871c890123...</code>) পাবেন।</li>
          </ol>
        </div>
      ),
    },
    {
      title: '৩. আপনার Telegram Numeric ID (ADMIN_ID) জানা',
      icon: <Smartphone className="w-5 h-5 text-sky-400" />,
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>বটটি যাতে অন্য কেউ ব্যবহার করতে না পারে, শুধু আপনি কন্ট্রোল করতে পারেন, সেজন্য আপনার ইউজার আইডি প্রয়োজন:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-1">
            <li>টেলিগ্রামে গিয়ে মেসেজ পাঠান: <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="w-3 h-3 inline" /></a> অথবা <a href="https://t.me/missrose_bot" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold underline inline-flex items-center gap-0.5">@missrose_bot <ExternalLink className="w-3 h-3 inline" /></a></li>
            <li>বট আপনাকে আপনার সংখ্যাযুক্ত আইডি (যেমন: <code className="text-sky-300">123456789</code>) দিয়ে দেবে।</li>
          </ol>
        </div>
      ),
    },
    {
      title: '৪. VPS বা পিসিতে বট রান করার কমান্ড (Ubuntu/Linux)',
      icon: <Server className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>আপনার সার্ভার বা কম্পিউটারের টার্মিনালে নিচের কমান্ডগুলো রান করলেই বট চালু হয়ে যাবে:</p>
          
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 relative">
            <button
              onClick={() =>
                copyToClipboard(
                  `git clone <repository_url>\ncd telegram_bot\nchmod +x deploy.sh\n./deploy.sh`,
                  'deploy_cmd'
                )
              }
              className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 text-[11px]"
            >
              {copiedKey === 'deploy_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              কপি
            </button>
            <p className="text-slate-500"># 1-Click Auto Install & Run:</p>
            <p className="text-emerald-400">chmod +x deploy.sh</p>
            <p className="text-emerald-400">./deploy.sh</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div id="setup-guide-container" className="h-full overflow-y-auto p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
      {/* Title & Summary */}
      <div className="space-y-2 border-b border-slate-800 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          A to Z সম্পূর্ণ গাইড ও প্রস্তুতি
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-100">
          টেলিগ্রাম লাইভ মাল্টি-অ্যাকাউন্ট বট চালু করতে কী কী লাগবে?
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          এই সিস্টেমে কোনো থার্ড-পার্টি প্ল্যাটফর্মের প্রয়োজন নেই। সম্পূর্ণ প্রক্রিয়াটি আপনার নিজের টেলিগ্রাম বট এবং সার্ভারের মধ্যে সুরক্ষিতভাবে ঘটবে।
        </p>
      </div>

      {/* Accordion Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="border border-slate-800 bg-slate-950/60 rounded-xl overflow-hidden transition-all"
          >
            <button
              id={`guide-step-${idx}`}
              onClick={() => setOpenSection(openSection === idx ? null : idx)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 text-left transition-colors"
            >
              <div className="flex items-center space-x-3">
                {step.icon}
                <span className="font-semibold text-slate-200 text-sm md:text-base">{step.title}</span>
              </div>
              {openSection === idx ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {openSection === idx && (
              <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/90">
                {step.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Anti-Ban & Best Practices Box */}
      <div className="p-4 md:p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <AlertTriangle className="w-4 h-4" />
          টেলিগ্রাম আইডি সুরক্ষিত রাখার জরুরি টিপস (Anti-Ban Safety)
        </div>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
          <li><strong>এলোমেলো জয়েন ডিলে (Jitter):</strong> আমাদের কোডে প্রতিটি আইডি জয়েনের মাঝে ২.৫ থেকে ৩.৫ সেকেন্ডের র‍্যান্ডম ডিলে দেওয়া আছে যাতে টেলিগ্রাম সার্ভার বটের মতো সন্দেহ না করে।</li>
          <li><strong>আইডি ওটিপি সেভ:</strong> একবার কোড দিয়ে ভেরিফাই করলে এনক্রিপ্টেড সেশন সেভ থাকে, তাই বারবার পাসওয়ার্ড বা ওটিপি দিতে হয় না।</li>
          <li><strong>সবার জন্য একই IP পরিহার:</strong> ৫০+ আইডি একসাথে চালালে প্রতি ১০টি আইডির জন্য আলাদা SOCKS5 প্রক্সি ব্যবহার করা সবচেয়ে নিরাপদ।</li>
        </ul>
      </div>
    </div>
  );
};
