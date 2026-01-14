# Add "Tipo" Filter to "Gerar Relatório" Card

## Overview
Add a "Tipo" dropdown filter to the "Gerar Relatório" card on the Dashboard page with options: "Todos", "Incolor", and "Photo". The filter should work exactly like the existing filters (Índice, Tratamento, Empresa).

## Current State Analysis

### Existing Filters in "Gerar Relatório" Card
- **Date Range**: Start date and End date inputs
- **Índice**: CustomSelect with options from `indexOptions` state
- **Tratamento**: CustomSelect with options from `treatmentOptions` state
- **Empresa**: CustomSelect (only for admins) with options from `companyOptions` state

### Existing State Variables
```typescript
const [companyOptions, setCompanyOptions] = useState<string[]>(['Todas']);
const [indexOptions, setIndexOptions] = useState<string[]>(['Todos']);
const [treatmentOptions, setTreatmentOptions] = useState<string[]>(['Todos']);

const [reportFilters, setReportFilters] = useState({
  startDate: '',
  endDate: '',
  index: 'Todos',
  treatment: 'Todos',
  company: 'Todas'
});
```

### Data Availability
- `tiposService` already exists in [`services/tiposService.ts`](../services/tiposService.ts:1) with `getAllActive()` method
- Dashboard already fetches `tipos` data via `faltasService.getByUserVisibility()` (line 279: `type: item.tipos?.nome || 'N/A'`)
- Database has tipos: 'Incolor', 'Photo', 'Blue Cut' (from [`scripts/seed-database.sql`](../scripts/seed-database.sql:25))

## Implementation Plan

### Step 1: Import tiposService
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:1)

Add import at the top of the file (around line 11):
```typescript
import { tiposService } from '../services/tiposService';
```

### Step 2: Add typeOptions State
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:140)

Add state variable after `treatmentOptions` (around line 142):
```typescript
const [typeOptions, setTypeOptions] = useState<string[]>(['Todos']);
```

### Step 3: Add 'type' Field to reportFilters
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:153)

Update the `reportFilters` state initialization (around line 153):
```typescript
const [reportFilters, setReportFilters] = useState({
  startDate: '',
  endDate: '',
  index: 'Todos',
  treatment: 'Todos',
  type: 'Todos',  // NEW: Add type field
  company: 'Todas'
});
```

### Step 4: Load Tipos Options in fetchDashboardData
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:202)

Update the `fetchDashboardData` function to load tipos options (around line 203):

Add `tipos` to the Promise.all array:
```typescript
const [empresas, indices, tratamentos, tipos] = await Promise.all([
  empresasService.getAll(),
  indicesService.getAllActive(),
  tratamentosService.getAllActive(),
  tiposService.getAllActive()  // NEW: Load tipos
]);
```

Set typeOptions after loading (around line 211):
```typescript
setCompanyOptions(['Todas', ...empresas.filter(e => e.tipo === 'Matriz' || e.tipo === 'Filial').map(e => e.nome)]);
setIndexOptions(['Todos', ...indices.map(i => i.nome)]);
setTreatmentOptions(['Todos', ...tratamentos.map(t => t.nome)]);
setTypeOptions(['Todos', ...tipos.map(t => t.nome)]);  // NEW: Set type options
```

### Step 5: Add "Tipo" CustomSelect to UI
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:864)

Add the Tipo filter in the "Gerar Relatório" card UI (around line 864, after the Tratamento filter):

```typescript
<div className="space-y-1.5">
  <CustomSelect
    label="Tipo"
    value={reportFilters.type}
    onChange={(val) => handleReportFilterChange('type', val)}
    options={typeOptions}
  />
</div>
```

**Placement**: Add this after the Tratamento CustomSelect (after line 881) and before the Empresa filter (before line 882).

### Step 6: Update handleExportTxt Filtering Logic
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:455)

Add type filtering logic in the `handleExportTxt` function (around line 480, after the treatment filter):

```typescript
// Filter by treatment
if (reportFilters.treatment && reportFilters.treatment !== 'Todos') {
  filteredReportData = filteredReportData.filter(item => item.treatment === reportFilters.treatment);
}

// Filter by type (NEW)
if (reportFilters.type && reportFilters.type !== 'Todos') {
  filteredReportData = filteredReportData.filter(item => item.type === reportFilters.type);
}
```

### Step 7: Update generateTxtReport Parameters
**File**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:501)

Update the parameters passed to `generateTxtReport` to include type (around line 503):

```typescript
generateTxtReport(
  {
    company: reportFilters.company,
    startDate: reportFilters.startDate,
    endDate: reportFilters.endDate,
    index: reportFilters.index,
    treatment: reportFilters.treatment,
    type: reportFilters.type,  // NEW: Add type parameter
    groupByLabel: 'ÍNDICE DE REFRAÇÃO'
  },
  filteredReportData
);
```

## Testing Checklist

- [ ] Verify tiposService is imported correctly
- [ ] Verify typeOptions state is initialized and populated
- [ ] Verify "Tipo" dropdown appears in the "Gerar Relatório" card
- [ ] Verify dropdown shows options: "Todos", "Incolor", "Photo", and any other types from database
- [ ] Verify selecting "Todos" shows all records
- [ ] Verify selecting "Incolor" filters to only Incolor records
- [ ] Verify selecting "Photo" filters to only Photo records
- [ ] Verify type filter works in combination with other filters (date, index, treatment, company)
- [ ] Verify TXT report generation respects the type filter
- [ ] Verify no console errors when using the type filter

## Notes

- The `item.type` field is already available in the `mappedData` (line 279), so no changes needed to data mapping
- The filter logic follows the same pattern as existing filters (index, treatment, company)
- The CustomSelect component is already imported and used, so no new dependencies needed
- The `handleReportFilterChange` function already handles dynamic field updates, so it will work for 'type' without modification

## Files Modified

1. [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:1) - Main implementation file

## Related Files (No Changes Required)

- [`services/tiposService.ts`](../services/tiposService.ts:1) - Already provides getAllActive() method
- [`components/CustomSelect.tsx`](../components/CustomSelect.tsx:1) - Already used for other filters
- [`lib/reports/generateTxtReport.ts`](../lib/reports/generateTxtReport.ts:1) - May need to accept type parameter (verify during implementation)
