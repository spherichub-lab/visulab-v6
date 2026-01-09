/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary brand color
                'primary': 'var(--brand-accent)',
                'primary-dark': 'var(--brand-accent-dark)',

                // Accent colors
                'accent-purple': '#8b5cf6',
                'accent-orange': '#f97316',
                'accent-green': '#10b981',

                // Background colors for light/dark mode
                'background-light': '#f8fafc',
                'background-dark': '#0f172a',

                // Surface colors for cards and panels
                'surface-dark': '#1e293b',

                // Additional background colors (from CSS variables)
                'brand-accent': 'var(--brand-accent)',
                'brand-accent-dark': 'var(--brand-accent-dark)',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'card': '0 2px 10px rgba(0,0,0,0.02)',
                'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            fontFamily: {
                'display': ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
