import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgClass = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const iconName = type === 'success' ? 'check_circle' : 'error';

  return (
    <div className="fixed top-6 right-6 z-[60] animate-fade-in-down">
      <div className={`${bgClass} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[300px]`} data-testid={`toast-${type}`}>
        <Icon name={iconName} className="!text-2xl" />
        <div className="flex-1">
          <h4 className="font-bold text-sm">{type === 'success' ? 'Sucesso' : 'Erro'}</h4>
          <p className="text-xs opacity-90 font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
          <Icon name="close" className="!text-lg" />
        </button>
      </div>
    </div>
  );
};