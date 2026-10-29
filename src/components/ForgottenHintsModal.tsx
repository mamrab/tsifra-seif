import React from 'react';
import {
  X,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Download,
  Key,
  Coins,
  FileText,
} from 'lucide-react';
import { VaultItem } from '../types/vault';

export interface ForgottenIssue {
  id: string;
  item?: VaultItem;
  type: 'missing_password' | 'short_password' | 'missing_login' | 'crypto_incomplete' | 'backup_needed';
  title: string;
  description: string;
  actionText: string;
}

interface ForgottenHintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: ForgottenIssue[];
  onResolveIssue: (issue: ForgottenIssue) => void;
}

export const ForgottenHintsModal: React.FC<ForgottenHintsModalProps> = ({
  isOpen,
  onClose,
  issues,
  onResolveIssue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xl p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg liquid-glass rounded-[32px] p-6 sm:p-7 relative max-h-[85vh] flex flex-col animate-scale-in border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Что вы забыли заполнить</h3>
              <p className="text-[11px] text-white/50">
                {issues.length > 0
                  ? `Найдено ${issues.length} рекомендаций по безопасности`
                  : 'Все данные и кошельки заполнены идеально'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of issues */}
        <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1">
          {issues.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">Ничего не забыто!</h4>
              <p className="text-xs text-white/50 max-w-xs leading-relaxed">
                Все логины, пароли, адреса криптокошельков и ключи безопасности в вашем сейфе полностью заполнены.
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onResolveIssue(issue)}
                className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white/70 flex-shrink-0 mt-0.5 group-hover:border-cyan-400/50 transition-colors">
                    {issue.type === 'crypto_incomplete' ? (
                      <Coins className="w-4 h-4 text-cyan-400" />
                    ) : issue.type === 'backup_needed' ? (
                      <Download className="w-4 h-4 text-white" />
                    ) : issue.type === 'missing_password' || issue.type === 'short_password' ? (
                      <Key className="w-4 h-4 text-amber-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                        {issue.title}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                        Забыто
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">
                      {issue.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-white/80 group-hover:text-white font-semibold flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>{issue.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/40 flex-shrink-0">
          <span>Регулярная проверка безопасности сейфа</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
