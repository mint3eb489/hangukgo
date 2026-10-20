import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang?: AppLanguage;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lang = 'de',
}) => {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center safe-modal-overlay z-50">
      <div className="bg-hanji border border-border-card rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-pop safe-modal-panel overflow-y-auto">
        <div className="flex items-center gap-2.5 text-dancheong">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base text-ink">{t.resetModal.title}</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {t.resetModal.desc}
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-card">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink text-xs font-semibold transition"
          >
            {t.resetModal.cancel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-dancheong hover:bg-dancheong/90 text-white text-xs font-semibold shadow-sm transition"
          >
            {t.resetModal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
