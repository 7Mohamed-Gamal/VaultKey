import React, { useState } from 'react';
import { RefreshCw, Copy, Check, X, Shield, Lock, Sliders, CheckCircle2 } from 'lucide-react';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (pass: string) => void;
  lang: 'ar' | 'en';
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
  lang
}) => {
  const isAr = lang === 'ar';

  const [length, setLength] = useState(20);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (excludeSimilar) {
      chars = chars.replace(/[il1Lo0O]/g, '');
    }

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    let res = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      res += chars[array[i] % chars.length];
    }
    return res;
  };

  const [password, setPassword] = useState(() => generatePassword());

  if (!isOpen) return null;

  const handleRegenerate = () => {
    setPassword(generatePassword());
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateStrength = () => {
    let score = 0;
    if (length >= 12) score += 25;
    if (length >= 16) score += 25;
    if (includeUppercase && includeLowercase) score += 20;
    if (includeNumbers) score += 15;
    if (includeSymbols) score += 15;
    return score;
  };

  const strength = calculateStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#0c0c0c] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'مولد كلمات المرور الآمنة' : 'Secure Password Generator'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#141414] transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Password Display Box */}
        <div className="my-5 p-3.5 rounded-2xl bg-[#050505] border border-white/[0.08] flex items-center justify-between gap-3">
          <span className="font-mono text-sm sm:text-base text-emerald-400 select-all overflow-x-auto break-all">
            {password}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#141414] transition cursor-pointer"
              title={isAr ? 'توليد كلمة جديدة' : 'Regenerate'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition shadow-sm cursor-pointer"
              title={isAr ? 'نسخ' : 'Copy'}
            >
              {copied ? <Check className="w-4 h-4 text-black stroke-[3]" /> : <Copy className="w-4 h-4 text-black stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Strength meter */}
        <div className="space-y-1 mb-5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-400">{isAr ? 'قوة كلمة المرور:' : 'Strength:'}</span>
            <span className={strength >= 80 ? 'text-emerald-400' : strength >= 50 ? 'text-amber-400' : 'text-rose-400'}>
              {strength >= 80 ? (isAr ? 'قوية جداً (عالية الأمان)' : 'Very Strong') : (isAr ? 'متوسطة' : 'Moderate')}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-white/[0.05]">
            <div
              className={`h-full transition-all duration-300 ${
                strength >= 80 ? 'bg-emerald-500' : strength >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 text-xs text-zinc-300">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>{isAr ? 'طول كلمة المرور:' : 'Length:'}</span>
              <span className="font-mono text-emerald-400 font-bold">{length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value));
                setPassword(generatePassword());
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {[
              { label: isAr ? 'أحرف كبيرة (A-Z)' : 'Uppercase (A-Z)', val: includeUppercase, set: setIncludeUppercase },
              { label: isAr ? 'أحرف صغيرة (a-z)' : 'Lowercase (a-z)', val: includeLowercase, set: setIncludeLowercase },
              { label: isAr ? 'أرقام (0-9)' : 'Numbers (0-9)', val: includeNumbers, set: setIncludeNumbers },
              { label: isAr ? 'رموز خاصة (!@#$)' : 'Symbols (!@#$)', val: includeSymbols, set: setIncludeSymbols },
            ].map((opt, i) => (
              <label key={i} className="flex items-center gap-2 p-2 rounded-xl bg-[#050505] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition">
                <input
                  type="checkbox"
                  checked={opt.val}
                  onChange={(e) => {
                    opt.set(e.target.checked);
                    setPassword(generatePassword());
                  }}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-zinc-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {onSelectPassword && (
            <button
              onClick={() => {
                onSelectPassword(password);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              {isAr ? 'استخدام كلمة المرور هذه' : 'Use this Password'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
