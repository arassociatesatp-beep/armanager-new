import React, { useContext } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ThemeContext } from '../App';
import { THEMES } from '../types';

type DeleteConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteConfirmModal({
  open,
  title = 'Delete item?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { isDarkMode, theme } = useContext(ThemeContext);
  const themeConfig = THEMES[theme];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-xl border shadow-2xl ${
          isDarkMode ? 'bg-[#0b0b0f] border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {title}
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {description}
            </p>
          </div>
          <button
            onClick={onCancel}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-4 pb-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
              isDarkMode
                ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white shadow-sm hover:opacity-90 ${themeConfig.twBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
