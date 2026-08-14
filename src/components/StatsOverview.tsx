import React from 'react';
import { Key, Lock, FileCode, Ticket, ShieldCheck, Sparkles, Command } from 'lucide-react';
import { SecretItem } from '../types';

interface StatsOverviewProps {
  secrets: SecretItem[];
  onOpenQuickCapture: () => void;
  lang: 'ar' | 'en';
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  secrets,
  onOpenQuickCapture,
  lang
}) => {
  const isAr = lang === 'ar';

  const apiKeysCount = secrets.filter(s => s.type === 'api_key').length;
  const passwordsCount = secrets.filter(s => s.type === 'password').length;
  const envVarsCount = secrets.filter(s => s.type === 'env_var').length;
  const tokensCount = secrets.filter(s => s.type === 'token' || s.type === 'database_url').length;

  const stats = [
    {
      title: isAr ? 'إجمالي السجلات' : 'Total Vault Items',
      value: secrets.length,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: isAr ? 'مفاتيح API Keys' : 'API Keys',
      value: apiKeysCount,
      icon: Key,
      color: 'text-zinc-200',
      bg: 'bg-[#141414] border-white/[0.08]'
    },
    {
      title: isAr ? 'كلمات المرور' : 'Passwords',
      value: passwordsCount,
      icon: Lock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: isAr ? 'متغيرات .env والرموز' : 'Env Vars & Tokens',
      value: envVarsCount + tokensCount,
      icon: FileCode,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-white/[0.15] transition"
          >
            <div>
              <p className="text-xs text-zinc-400 font-medium">{stat.title}</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{stat.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.bg} ${stat.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
