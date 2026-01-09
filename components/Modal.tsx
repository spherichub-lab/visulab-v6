import React from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" data-testid="modal" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );
};