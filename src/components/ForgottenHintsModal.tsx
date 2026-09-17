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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Что вы забыли заполнить</h3>
              <p className="text-[11px] text-zinc-400">
                {issues.length > 0
                  ? `Найдено ${issues.length} рекомендаций по безопасности`
                  : 'Все данные и кошельки заполнены идеально'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of issues */}
        <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1">
          {issues.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">Ничего не забыто!</h4>
              <p className="text-xs text-zinc-400 max-w-xs">
                Все логины, пароли, адреса криптокошельков и ключи безопасности в вашем сейфе полностью заполнены.
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onResolveIssue(issue)}
                className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 mt-0.5 group-hover:border-zinc-600 transition-colors">
                    {issue.type === 'crypto_incomplete' ? (
                      <Coins className="w-4 h-4 text-white" />
                    ) : issue.type === 'backup_needed' ? (
                      <Download className="w-4 h-4 text-white" />
                    ) : issue.type === 'missing_password' || issue.type === 'short_password' ? (
                      <Key className="w-4 h-4 text-white" />
                    ) : (
                      <FileText className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {issue.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-zinc-400 border border-zinc-800 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-white" />
                        Забыто
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                      {issue.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-white font-medium flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>{issue.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 flex-shrink-0">
          <span>Регулярная проверка безопасности сейфа</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
