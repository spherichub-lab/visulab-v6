# Plan: Remove Filters from Dashboard, Users, Companies, and Purchases Pages

## Overview
Remove all filter UI elements and related logic from the Dashboard, Users, Companies, and Purchases pages as requested.

---

## 1. Dashboard Page (`pages/Dashboard.tsx`)

### Changes Required:

#### A. Remove State Variables
- Remove `analyticsFilters` state (lines 138-142):
  ```typescript
  const [analyticsFilters, setAnalyticsFilters] = useState({
    range: '7 Dias',
    customStartDate: '',
    customEndDate: ''
  });
  ```

#### B. Remove Handler Functions
- Remove `handleAnalyticsChange` function (lines 153-155)

#### C. Remove Date Filtering Logic
- Remove date range calculation logic (lines 242-269)
- Remove date range filter application (lines 267-269)
- Update `fetchDashboardData` to show ALL data without date filtering

#### D. Remove useEffect Dependencies
- Update useEffect (lines 362-365) to remove dependencies on `analyticsFilters.range`, `analyticsFilters.customStartDate`, `analyticsFilters.customEndDate`

#### E. Remove Filter UI
- Remove the entire filter section (lines 595-637) containing:
  - Period buttons: Hoje, 7 Dias, 30 Dias, Personalizado
  - Custom date inputs (when Personalizado is selected)

#### F. Update Data Display
- Keep "Faltas Hoje" card showing today's data (this is a KPI, not a filter)
- Show ALL data in charts and recent activity (no date restriction)

---

## 2. Users Page (`pages/Users.tsx`)

### Changes Required:

#### A. Remove Filter Button
- Remove the "Filtros" button (lines 285-288):
  ```tsx
  <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-1 md:flex-none">
    <Icon name="filter_list" className="!text-lg" />
    <span>Filtros</span>
  </button>
  ```

#### B. Keep Search Input
- Keep the search input (lines 278-283) as it's a search feature, not a filter

---

## 3. Companies Page (`pages/Companies.tsx`)

### Changes Required:

#### A. Remove Imports
- Remove `EmpresaFiltersComponent` import (line 29):
  ```typescript
  import EmpresaFiltersComponent from '../src/components/EmpresaFilters';
  ```

#### B. Remove Filter State
- Remove `filters` state (line 71):
  ```typescript
  const [filters, setFilters] = useState<EmpresaFilters>({});
  ```

#### C. Remove Filter Handlers
- Remove `handleFiltersChange` function (lines 238-240)

#### D. Update Data Fetching
- Remove filters from `useEmpresasList` hook (lines 80-85):
  ```typescript
  // Before:
  const { data: empresasData, isLoading, error, refetch } = useEmpresasList({
    filters: {
      ...filters,
      ...(searchQuery && { nome: { contains: searchQuery } })
    }
  });

  // After:
  const { data: empresasData, isLoading, error, refetch } = useEmpresasList({
    filters: {
      ...(searchQuery && { nome: { contains: searchQuery } })
    }
  });
  ```

#### E. Remove Filter UI Component
- Remove `EmpresaFiltersComponent` from the UI (lines 322-327):
  ```tsx
  <EmpresaFiltersComponent
    filters={filters}
    onFiltersChange={handleFiltersChange}
    onSearch={handleSearch}
    isLoading={isLoading}
  />
  ```

---

## 4. Purchases Page (`pages/Purchases.tsx`)

### Changes Required:

#### A. Remove Status Filter State
- Remove `statusFilter` state (line 16):
  ```typescript
  const [statusFilter, setStatusFilter] = useState('Todos Status');
  ```

#### B. Remove Status Filter UI
- Remove the CustomSelect for status filter (lines 402-409):
  ```tsx
  <div className="w-full sm:w-auto min-w-[160px]">
    <CustomSelect
      value={statusFilter}
      onChange={setStatusFilter}
      options={['Todos Status', 'Recebido', 'Pendente', 'Cancelado']}
      triggerClassName="bg-white dark:bg-surface-dark border-none shadow-sm py-2"
    />
  </div>
  ```

#### C. Remove Filter Button
- Remove the "Filtrar" button (lines 389-391):
  ```tsx
  <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-primary text-white rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition-opacity">
    <Icon name="filter_list" className="!text-lg" />
    Filtrar
  </button>
  ```

#### D. Keep Search Input
- Keep the search input (lines 396-401) as it's a search feature, not a filter

---

## Summary of Changes

| Page | What to Remove | What to Keep |
|------|----------------|--------------|
| Dashboard | Date period filters (Hoje, 7 Dias, 30 Dias, Personalizado) and custom date inputs | Report filters (for export), search, all other functionality |
| Users | "Filtros" button | Search input, all other functionality |
| Companies | EmpresaFiltersComponent, filter state, filter handlers | Search input, all other functionality |
| Purchases | Status filter dropdown, "Filtrar" button | Search input, all other functionality |

---

## Implementation Order

1. **Dashboard.tsx** - Remove date period filters and related logic
2. **Users.tsx** - Remove filter button
3. **Companies.tsx** - Remove EmpresaFiltersComponent and filter state
4. **Purchases.tsx** - Remove status filter and filter button

---

## Testing Checklist

After implementation, verify:

- [ ] Dashboard shows all data without date restrictions
- [ ] Dashboard charts display complete dataset
- [ ] Users page has no filter button, search still works
- [ ] Companies page has no filter component, search still works
- [ ] Purchases page has no status filter or filter button, search still works
- [ ] All pages load data correctly
- [ ] No console errors related to removed filters
- [ ] UI looks clean and consistent without filter elements
