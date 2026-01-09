/**
 * PageHeaderSearch - Search input component for PageHeader
 * Provides debounced search with clear functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { PageHeaderSearchProps } from './types';

/**
 * Search input component with debouncing
 */
export const PageHeaderSearch: React.FC<PageHeaderSearchProps> = ({
    placeholder = 'Buscar...',
    value: controlledValue,
    onChange,
    onClear,
    debounce = 300,
    showClear = true,
    className,
}) => {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use controlled or uncontrolled value
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Debounced change handler
    const debouncedOnChange = (newValue: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (onChange) {
                onChange(newValue);
            }
        }, debounce);
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }

        debouncedOnChange(newValue);
    };

    // Handle clear
    const handleClear = () => {
        if (controlledValue === undefined) {
            setInternalValue('');
        }

        if (onClear) {
            onClear();
        }

        if (onChange) {
            onChange('');
        }

        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Handle keydown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const containerClasses = cn(
        'relative flex items-center',
        className
    );

    const inputClasses = cn(
        'w-full pl-10 pr-10 py-2 text-sm',
        'border border-slate-200 dark:border-slate-600 rounded-lg',
        'bg-white dark:bg-slate-800',
        'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'transition-all duration-200',
        {
            'ring-2 ring-primary-500 border-transparent': isFocused,
        }
    );

    return (
        <div className={containerClasses}>
            <div className="relative flex-1">
                {/* Search icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Icon name="search" className="!text-lg" />
                </div>

                {/* Search input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className={inputClasses}
                    aria-label={placeholder}
                    data-testid="search-input"
                />

                {/* Clear button */}
                {showClear && value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1"
                        aria-label="Limpar busca"
                    >
                        <Icon name="close" className="!text-sm" />
                    </Button>
                )}
            </div>
        </div>
    );
};

PageHeaderSearch.displayName = 'PageHeaderSearch';

export default PageHeaderSearch;