# Plan: Remove Mock Data from Compras Page

## Overview
Remove mock/fallback data from the Purchases (Compras) page and prepare it for proper purchase registration with real data validation.

## Current State Analysis

### What Was Found
1. **Data Layer**: The page is already using real Supabase data via [`comprasService.ts`](../services/comprasService.ts:1) and [`empresasService.ts`](../services/empresasService.ts:1)
2. **No Mock Data Arrays**: No hardcoded mock purchase data arrays were found
3. **Fallback Value Issue**: Line 119 in [`Purchases.tsx`](../pages/Purchases.tsx:119) contains a fallback value that allows saving purchases without selecting a supplier

### Issue Identified
```typescript
// Line 119 in Purchases.tsx
fornecedor: newPurchaseSupplier || 'Fornecedor',
```

This fallback allows creating purchases with a generic "Fornecedor" value instead of requiring a real supplier to be selected from the database.

## Implementation Plan

### Step 1: Remove Fallback Value
**File**: [`pages/Purchases.tsx`](../pages/Purchases.tsx:119)

**Change**: Remove the fallback 'Fornecedor' value and require supplier selection.

**Before**:
```typescript
await comprasService.create({
    fornecedor: newPurchaseSupplier || 'Fornecedor',
    data_compra: newPurchaseData.date,
    descricao: newPurchaseData.itemsDescription,
    valor_total: parseFloat(newPurchaseData.amount || '0'),
    status: newPurchaseData.status === 'Received' ? 'Pago' : 'Pendente'
});
```

**After**:
```typescript
await comprasService.create({
    fornecedor: newPurchaseSupplier,
    data_compra: newPurchaseData.date,
    descricao: newPurchaseData.itemsDescription,
    valor_total: parseFloat(newPurchaseData.amount || '0'),
    status: newPurchaseData.status === 'Received' ? 'Pago' : 'Pendente'
});
```

### Step 2: Add Validation
**File**: [`pages/Purchases.tsx`](../pages/Purchases.tsx:116)

**Change**: Add validation to ensure supplier is selected before saving.

**Implementation**:
```typescript
const handleSavePurchase = async () => {
    // Validate supplier selection
    if (!newPurchaseSupplier) {
        showToast('Por favor, selecione um fornecedor.', 'error');
        return;
    }

    // Validate amount
    if (!newPurchaseData.amount || parseFloat(newPurchaseData.amount) <= 0) {
        showToast('Por favor, insira um valor válido.', 'error');
        return;
    }

    // Validate description
    if (!newPurchaseData.itemsDescription.trim()) {
        showToast('Por favor, insira uma descrição.', 'error');
        return;
    }

    try {
        await comprasService.create({
            fornecedor: newPurchaseSupplier,
            data_compra: newPurchaseData.date,
            descricao: newPurchaseData.itemsDescription,
            valor_total: parseFloat(newPurchaseData.amount || '0'),
            status: newPurchaseData.status === 'Received' ? 'Pago' : 'Pendente'
        });

        // Refresh data
        const data = await comprasService.getAll();
        const mapped: Purchase[] = data.map(p => ({
            id: p.id,
            displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
            supplier: p.fornecedor,
            supplierInitials: p.fornecedor.substring(0, 1).toUpperCase(),
            supplierColorClass: 'bg-blue-100 text-blue-600',
            date: p.data_compra,
            itemsDescription: p.descricao || '-',
            amount: p.valor_total,
            status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
        }));
        setPurchases(mapped);

        showToast('Compra registrada com sucesso!', 'success');

        setNewPurchaseSupplier('');
        setNewPurchaseData({
            date: new Date().toISOString().split('T')[0],
            itemsDescription: '',
            amount: '',
            status: 'Pendente'
        });

    } catch (e) {
        console.error(e);
        showToast('Erro ao salvar compra.', 'error');
    }
};
```

### Step 3: Improve User Feedback
**File**: [`pages/Purchases.tsx`](../pages/Purchases.tsx:314-322)

**Change**: Add visual indication for required fields.

**Implementation**:
- Add asterisk (*) to required field labels
- Add helper text indicating supplier is required

### Step 4: Test the Changes
1. Verify that purchases cannot be saved without selecting a supplier
2. Verify that validation messages display correctly
3. Verify that purchases save successfully when all required fields are filled
4. Verify that the purchase list refreshes after saving
5. Verify that supplier dropdown populates correctly from database

## Expected Outcomes

### Before Changes
- Users could save purchases without selecting a supplier
- Generic "Fornecedor" value would be used
- No validation for required fields

### After Changes
- Users must select a supplier from the dropdown
- Validation prevents saving incomplete purchases
- Clear error messages guide users
- All purchases are linked to real suppliers from the database
- Data integrity is maintained

## Dependencies
- [`comprasService.ts`](../services/comprasService.ts:1) - Already implemented, no changes needed
- [`empresasService.ts`](../services/empresasService.ts:1) - Already implemented, no changes needed
- Supabase database - Must have suppliers registered in the empresas table

## Risk Assessment
- **Low Risk**: Changes are localized to validation logic
- **No Breaking Changes**: Existing data remains unaffected
- **User Impact**: Positive - improves data quality and user experience

## Success Criteria
1. ✓ Fallback 'Fornecedor' value removed
2. ✓ Validation added for supplier selection
3. ✓ Validation added for amount and description
4. ✓ Clear error messages displayed
5. ✓ Purchase creation works correctly with all required fields
6. ✓ No mock/fallback data in the codebase
