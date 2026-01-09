import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string; // Container class
  triggerClassName?: string; // Override for trigger button
  icon?: string; // Optional icon name
  required?: boolean;
  'data-testid'?: string; // Test ID for the select
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled,
  className = "",
  triggerClassName = "",
  icon,
  required,
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Normalize options to ensure they are always objects
  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside trigger AND dropdown
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Optional: Update coords on scroll/resize to keep attached
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6, // 6px gap
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    updateCoords();
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div
        onClick={handleOpen}
        data-testid={testId}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm font-bold cursor-pointer transition-all select-none
          ${isOpen ? 'ring-2 ring-primary/20 border-primary' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
          ${triggerClassName}
          text-slate-900 dark:text-white
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <Icon name={icon} className="!text-lg text-slate-400" />}
          <span className={`${!selectedOption && placeholder ? "text-slate-400 font-normal" : ""} truncate`}>
            {selectedOption ? selectedOption.label : (placeholder || "Selecione")}
          </span>
        </div>
        <Icon name="expand_more" className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999
          }}
          className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-down transform origin-top"
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                // Generate testId for option if parent has testId
                const optionTestId = testId ? `${testId}-option-${option.value.toLowerCase().replace(/\s+/g, '-')}` : undefined;

                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    data-testid={optionTestId}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-between transition-colors
                            ${option.value === value
                        ? 'bg-primary/10 text-primary dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                            `}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === value && <Icon name="check" className="!text-lg text-primary flex-shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                Nenhuma opção disponível
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};