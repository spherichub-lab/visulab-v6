# Plan: Import Company Colors and Siglas to Purchases Page

## Overview
Implement consistent company icon colors and 2-letter siglas (initials) in the "compras" (Purchases) page, matching the implementation in the "empresas" (Companies) page.

## Current State Analysis

### Companies Page (pages/Companies.tsx)
- **Color Generation**: Uses `getCompanyColor()` function (lines 42-60) that generates consistent colors based on company ID
- **Initials**: Displays 2-letter siglas from company name (line 177): `{value.substring(0, 2).toUpperCase()}`
- **Color Palette**: 10 predefined colors (blue, emerald, purple, rose, amber, cyan, indigo, pink, teal, orange)
- **Algorithm**: Hash-based color selection using company ID for consistency

### Purchases Page (pages/Purchases.tsx)
- **Color Generation**: Hardcoded to `bg-blue-100 text-blue-600` (line 111)
- **Initials**: Only 1 letter from supplier name (line 110): `p.fornecedor.substring(0, 1).toUpperCase()`
- **Issue**: No matching between supplier names and company IDs
- **Issue**: No consistent color generation

## Implementation Plan

### Step 1: Create Shared Utility Function
**File**: `lib/utils/helpers/companyColorHelper.ts` (new file)

Create a reusable utility function that can be imported by both pages:

```typescript
import { useCallback } from 'react';

export interface CompanyColor {
    bg: string;
    darkBg: string;
    text: string;
    darkText: string;
    border: string;
    darkBorder: string;
}

export const getCompanyColor = useCallback((empresaId: string): CompanyColor => {
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
}, {});
```

### Step 2: Update Purchases.tsx

#### 2.1 Import the utility function
```typescript
import { getCompanyColor } from '../lib/utils/helpers/companyColorHelper';
```

#### 2.2 Add state for companies data
```typescript
const [companies, setCompanies] = useState<Empresa[]>([]);
```

#### 2.3 Fetch companies data
Add a new useEffect to fetch all companies:

```typescript
useEffect(() => {
    const fetchCompanies = async () => {
        try {
            const empresas = await empresasService.getAll();
            setCompanies(empresas);
        } catch (e) {
            console.error('Erro ao carregar empresas:', e);
        }
    };
    fetchCompanies();
}, []);
```

#### 2.4 Create helper function to match supplier with company
```typescript
const getCompanyBySupplierName = useCallback((supplierName: string): Empresa | null => {
    return companies.find(c => c.nome === supplierName) || null;
}, [companies]);
```

#### 2.5 Update purchase data mapping
Replace the hardcoded color and initials with dynamic values:

```typescript
const data = await comprasService.getAll();
const mapped: Purchase[] = data.map(p => {
    const company = getCompanyBySupplierName(p.fornecedor);
    const color = company ? getCompanyColor(company.id) : null;
    
    return {
        id: p.id,
        displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
        supplier: p.fornecedor,
        supplierInitials: p.fornecedor.substring(0, 2).toUpperCase(), // Changed to 2 letters
        supplierColorClass: color ? `${color.bg} ${color.text} ${color.border}` : 'bg-slate-100 text-slate-600 border-slate-200',
        supplierDarkColorClass: color ? `${color.darkBg} ${color.darkText} ${color.darkBorder}` : 'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        date: p.data_compra,
        itemsDescription: p.descricao || '-',
        amount: p.valor_total,
        status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
    };
});
```

#### 2.6 Update the Purchase type definition
Update the Purchase type to include the new color properties:

```typescript
type Purchase = {
    id: string;
    displayId: string;
    supplier: string;
    supplierInitials: string;
    supplierColorClass: string;
    supplierDarkColorClass: string;
    date: string;
    itemsDescription: string;
    amount: number;
    status: 'Received' | 'Pending' | 'Cancelled';
};
```

#### 2.7 Update the table rendering
Update the supplier column rendering (around line 441-447):

```typescript
<td className="py-4 px-3">
    <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full ${purchase.supplierColorClass} ${purchase.supplierDarkColorClass} flex items-center justify-center font-bold text-xs border`}>
            {purchase.supplierInitials}
        </div>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{purchase.supplier}</span>
    </div>
</td>
```

### Step 3: Refactor Companies.tsx (Optional but Recommended)
Update Companies.tsx to use the shared utility function instead of having its own copy:

```typescript
import { getCompanyColor } from '../lib/utils/helpers/companyColorHelper';

// Remove the local getCompanyColor function (lines 42-60)
// The component will now use the imported function
```

## Benefits

1. **Consistency**: Same colors and siglas across both pages
2. **Maintainability**: Single source of truth for color generation logic
3. **Reusability**: Utility function can be used in other pages if needed
4. **User Experience**: Users will recognize companies by their consistent colors

## Testing Checklist

- [ ] Verify that supplier colors match company colors in the empresas page
- [ ] Verify that siglas (initials) are 2 letters instead of 1
- [ ] Test with multiple suppliers to ensure different colors
- [ ] Test dark mode compatibility
- [ ] Test with suppliers that don't exist in companies table (should use default gray color)
- [ ] Verify that the same supplier always has the same color across page refreshes

## Files to Modify

1. **Create**: `lib/utils/helpers/companyColorHelper.ts`
2. **Modify**: `pages/Purchases.tsx`
3. **Optional**: `pages/Companies.tsx` (to use shared utility)

## Migration Notes

- No database changes required
- No breaking changes to existing functionality
- The change is purely visual and improves consistency
