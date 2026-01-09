/**
 * Company Color Helper
 * 
 * Provides consistent color generation for companies across the application.
 * Uses a hash-based algorithm to ensure the same company always gets the same color.
 */

export interface CompanyColor {
    bg: string;
    darkBg: string;
    text: string;
    darkText: string;
    border: string;
    darkBorder: string;
}

/**
 * Get a consistent color for a company based on its ID.
 * 
 * @param empresaId - The unique identifier of the company
 * @returns A CompanyColor object with all color variants (light/dark mode)
 */
export const getCompanyColor = (empresaId: string): CompanyColor => {
    const colors: CompanyColor[] = [
        { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-600', darkText: 'dark:text-blue-400', border: 'border-blue-200', darkBorder: 'dark:border-blue-800' },
        { bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-600', darkText: 'dark:text-emerald-400', border: 'border-emerald-200', darkBorder: 'dark:border-emerald-800' },
        { bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', text: 'text-purple-600', darkText: 'dark:text-purple-400', border: 'border-purple-200', darkBorder: 'dark:border-purple-800' },
        { bg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', text: 'text-rose-600', darkText: 'dark:text-rose-400', border: 'border-rose-200', darkBorder: 'dark:border-rose-800' },
        { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-600', darkText: 'dark:text-amber-400', border: 'border-amber-200', darkBorder: 'dark:border-amber-800' },
        { bg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', text: 'text-cyan-600', darkText: 'dark:text-cyan-400', border: 'border-cyan-200', darkBorder: 'dark:border-cyan-800' },
        { bg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', text: 'text-indigo-600', darkText: 'dark:text-indigo-400', border: 'border-indigo-200', darkBorder: 'dark:border-indigo-800' },
        { bg: 'bg-pink-100', darkBg: 'dark:bg-pink-900/30', text: 'text-pink-600', darkText: 'dark:text-pink-400', border: 'border-pink-200', darkBorder: 'dark:border-pink-800' },
        { bg: 'bg-teal-100', darkBg: 'dark:bg-teal-900/30', text: 'text-teal-600', darkText: 'dark:text-teal-400', border: 'border-teal-200', darkBorder: 'dark:border-teal-800' },
        { bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-600', darkText: 'dark:text-orange-400', border: 'border-orange-200', darkBorder: 'dark:border-orange-800' },
    ];

    // Use the company ID to generate a consistent index
    const hash = empresaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
};

/**
 * Get default color for companies that don't exist in the database
 */
export const getDefaultCompanyColor = (): CompanyColor => {
    return {
        bg: 'bg-slate-100',
        darkBg: 'dark:bg-slate-800',
        text: 'text-slate-600',
        darkText: 'dark:text-slate-400',
        border: 'border-slate-200',
        darkBorder: 'dark:border-slate-700'
    };
};
