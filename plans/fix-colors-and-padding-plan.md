# Fix App Colors, Dark/Light Mode, and Empresas Page Padding

## Overview
This plan addresses three main issues:
1. Fix app colors to restore original appearance
2. Make dark/light mode functional
3. Add proper lateral padding to the Empresas (Companies) page

## Issues Identified

### 1. Missing Tailwind Configuration
- The app uses custom Tailwind classes (`bg-background-light`, `bg-background-dark`, `bg-surface-dark`) that are not defined
- No `tailwind.config.js` file exists in the project
- This causes the color system to not work properly

### 2. Files Using Undefined Custom Colors
- [`App.tsx`](App.tsx:27) - Uses `bg-background-light dark:bg-background-dark`
- [`Login.tsx`](pages/Login.tsx:178) - Uses `bg-[#f2f4f6] dark:bg-background-dark`
- [`AccessDenied.tsx`](src/components/auth/AccessDenied.tsx:99) - Uses `bg-background-light dark:bg-background-dark`
- Multiple pages use `bg-surface-dark` for cards and panels

### 3. Empresas Page Padding Issue
The Companies page lacks the lateral padding that other pages have:
- **Dashboard**: `px-4 md:px-6 py-6` (line 405)
- **Purchases**: `px-4 md:px-6 py-4` (line 143)
- **Users**: `px-4 md:px-6 py-4` (line 189)
- **Companies**: No padding on main container (line 247)

## Solution

### Step 1: Create Tailwind Configuration File
**File**: `tailwind.config.js`

Create a new Tailwind configuration with:
- Custom color definitions for light/dark mode backgrounds
- Surface colors for cards and panels
- Primary brand color
- Accent colors (purple, green)
- Custom shadow utilities (`shadow-soft`, `shadow-hover`)
- Font family configuration
- Dark mode set to 'class' to work with the existing toggle

```javascript
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
        'background-light': '#f8fafc',
        'background-dark': '#0f172a',
        'surface-dark': '#1e293b',
        'primary': '#2563eb',
        'primary-dark': '#1e40af',
        'accent-purple': '#8b5cf6',
        'accent-green': '#10b981',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'hover': '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Step 2: Fix App.tsx Background Colors
**File**: `App.tsx` (line 27)

Current:
```tsx
<div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col font-display antialiased overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
```

The existing code is correct and will work once Tailwind config is created. No changes needed.

### Step 3: Fix Login.tsx Background Colors
**File**: `pages/Login.tsx` (line 178)

Current:
```tsx
<div className="min-h-screen w-full bg-[#f2f4f6] dark:bg-background-dark flex items-center justify-center font-display p-4">
```

The existing code is correct and will work once Tailwind config is created. No changes needed.

### Step 4: Fix AccessDenied.tsx Background Colors
**File**: `src/components/auth/AccessDenied.tsx` (line 99)

Current:
```tsx
<div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
```

The existing code is correct and will work once Tailwind config is created. No changes needed.

### Step 5: Add Padding to Companies Page
**File**: `pages/Companies.tsx` (line 247)

Current:
```tsx
return (
  <div className="h-full flex flex-col overflow-hidden relative">
```

Change to:
```tsx
return (
  <div className="h-full flex flex-col px-4 md:px-6 py-4 overflow-hidden relative">
```

This will match the padding used in other pages (Purchases and Users).

### Step 6: Verify Dark/Light Mode Functionality
The dark/light mode toggle is already implemented in:
- [`App.tsx`](App.tsx:48-66) - Theme state management and localStorage persistence
- [`Navbar.tsx`](Navbar.tsx:123-131) - Toggle button with icon

Once the Tailwind config is created, the toggle should work correctly:
- Light mode: `bg-background-light` (#f8fafc - light slate)
- Dark mode: `bg-background-dark` (#0f172a - dark slate)
- Cards in dark mode: `bg-surface-dark` (#1e293b - lighter dark)

## Implementation Order
1. Create `tailwind.config.js` with custom color definitions
2. Add padding to Companies page main container
3. Test dark/light mode toggle functionality
4. Verify all pages display correctly in both modes

## Expected Results
- ✅ App colors display correctly in both light and dark modes
- ✅ Dark/light mode toggle works properly
- ✅ Companies page has consistent padding with other pages
- ✅ All cards and panels use proper surface colors in dark mode
- ✅ Theme preference persists via localStorage

## Testing Checklist
- [ ] Light mode displays correctly with light gray background (#f8fafc)
- [ ] Dark mode displays correctly with dark slate background (#0f172a)
- [ ] Cards in dark mode use surface-dark color (#1e293b)
- [ ] Toggle button switches between sun and moon icons
- [ ] Theme preference is saved to localStorage
- [ ] Companies page has same padding as other pages
- [ ] All pages maintain consistent styling across modes
