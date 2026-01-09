# XLSX Export Rollback Procedure

This document provides step-by-step instructions to revert all changes made for the XLSX export feature and return the project to its original state.

## Overview

The XLSX export feature added the following changes:
1. Installed `xlsx` npm package
2. Created `lib/reports/generateXlsxReport.ts` file
3. Modified `components/ExportButtons.tsx` to add XLSX button
4. Modified `pages/Dashboard.tsx` to add XLSX export handler

## Rollback Steps

### Step 1: Remove XLSX Library

Run the following command to uninstall the xlsx package:

```bash
npm uninstall xlsx
```

**Verification**: Check `package.json` to ensure `xlsx` is no longer in the dependencies list.

### Step 2: Delete generateXlsxReport File

Delete the new report generation file:

```bash
rm lib/reports/generateXlsxReport.ts
```

Or manually delete: `lib/reports/generateXlsxReport.ts`

### Step 3: Revert ExportButtons Component

Restore `components/ExportButtons.tsx` to its original state by removing the XLSX-related changes:

**Remove from interface (line 7):**
```typescript
onExportXlsx?: () => void;
```

**Remove from function parameters (line 10):**
```typescript
export const ExportButtons: React.FC<ExportButtonsProps> = ({ onExportTxt, onExportPdf, onExportCsv, onExportXlsx, isLoading }) => {
```
Change to:
```typescript
export const ExportButtons: React.FC<ExportButtonsProps> = ({ onExportTxt, onExportPdf, onExportCsv, isLoading }) => {
```

**Remove XLSX button JSX (lines 36-47):**
```typescript
{onExportXlsx && (
    <button
      onClick={onExportXlsx}
      disabled={isLoading}
      aria-label="Exportar para XLSX"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-primary border border-transparent rounded-xl text-sm font-bold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <Icon name="grid_on" className="!text-lg" />
      XLSX
    </button>
)}
```

### Step 4: Revert Dashboard Component

Restore `pages/Dashboard.tsx` to its original state:

**Remove import statement (line 9):**
```typescript
import { generateXlsxReport } from '../lib/reports/generateXlsxReport';
```

**Remove handleExportXlsx function (lines 467-507):**
```typescript
const handleExportXlsx = () => {
  setIsExporting(true);

  // Filter all shortages based on report filters
  let filteredReportData = allShortages;

  // Filter by company
  if (reportFilters.company && reportFilters.company !== 'Todas') {
    filteredReportData = filteredReportData.filter(item => item.company === reportFilters.company);
  }

  // Filter by index
  if (reportFilters.index && reportFilters.index !== 'Todos') {
    filteredReportData = filteredReportData.filter(item => item.index === reportFilters.index);
  }

  // Filter by treatment
  if (reportFilters.treatment && reportFilters.treatment !== 'Todos') {
    filteredReportData = filteredReportData.filter(item => item.treatment === reportFilters.treatment);
  }

  // Filter by date range
  if (reportFilters.startDate && reportFilters.endDate) {
    const startDate = new Date(reportFilters.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportFilters.endDate);
    endDate.setHours(23, 59, 59, 999);

    filteredReportData = filteredReportData.filter(item => {
      return item.rawDate >= startDate && item.rawDate <= endDate;
    });
  }

  generateXlsxReport(
    {
      company: reportFilters.company,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      index: reportFilters.index,
      treatment: reportFilters.treatment,
      groupByLabel: 'ÍNDICE DE REFRAÇÃO'
    },
    filteredReportData
  );
  setIsExporting(false);
};
```

**Remove onExportXlsx prop from ExportButtons (line 853):**
```typescript
<ExportButtons
  onExportTxt={handleExportTxt}
  onExportXlsx={handleExportXlsx}
  isLoading={isExporting}
/>
```
Change to:
```typescript
<ExportButtons
  onExportTxt={handleExportTxt}
  isLoading={isExporting}
/>
```

## Quick Rollback Script

For a complete rollback, you can use these commands:

```bash
# Step 1: Uninstall package
npm uninstall xlsx

# Step 2: Delete file
rm lib/reports/generateXlsxReport.ts

# Step 3: Restore ExportButtons.tsx (manual or via git)
# Step 4: Restore Dashboard.tsx (manual or via git)
```

## Git-Based Rollback (Recommended)

If you have Git version control, the easiest way to rollback is:

```bash
# Check what files were modified
git status

# Revert specific files
git checkout HEAD -- components/ExportButtons.tsx
git checkout HEAD -- pages/Dashboard.tsx

# Delete new file
git rm lib/reports/generateXlsxReport.ts

# Remove from package.json and node_modules
npm uninstall xlsx

# Commit the rollback
git add .
git commit -m "Rollback: Remove XLSX export feature"
```

## Verification Steps

After rollback, verify:

1. ✅ `xlsx` is not in `package.json` dependencies
2. ✅ `lib/reports/generateXlsxReport.ts` file does not exist
3. ✅ `components/ExportButtons.tsx` has no `onExportXlsx` prop or button
4. ✅ `pages/Dashboard.tsx` has no `generateXlsxReport` import or `handleExportXlsx` function
5. ✅ Application runs without errors: `npm run dev`
6. ✅ Dashboard loads correctly
7. ✅ TXT export still works
8. ✅ No XLSX button appears in the export section

## Files Changed Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `package.json` | Remove dependency | 1 line |
| `lib/reports/generateXlsxReport.ts` | Delete entire file | 229 lines |
| `components/ExportButtons.tsx` | Revert changes | ~15 lines |
| `pages/Dashboard.tsx` | Revert changes | ~45 lines |

## Notes

- This rollback is completely reversible - you can re-implement the feature by following the implementation plan in `plans/xlsx-export-implementation-plan.md`
- All existing functionality (TXT export, PDF export, etc.) remains unchanged
- No database changes were made, so no data migration is needed
- The rollback does not affect any other parts of the application

## Support

If you encounter any issues during rollback:
1. Check the console for error messages
2. Verify all files were properly reverted
3. Ensure the development server is restarted: `npm run dev`
4. Check that all imports are correct and no broken references exist
