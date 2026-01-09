# XLSX Export Implementation Plan

## Objective
Add XLSX report generation option next to the TXT button in the dashboard's "Gerar Relatório" section, following the template format from `relatorio/MODELO-RELATORIO-CSV.xlsx`.

## Current State Analysis

### Existing Report Infrastructure
- **Dashboard Component** (`pages/Dashboard.tsx`):
  - Has ExportButtons component with onExportTxt handler
  - Uses reportFilters (startDate, endDate, index, treatment, company)
  - Stores allShortages data for report generation

- **ExportButtons Component** (`components/ExportButtons.tsx`):
  - Already has onExportCsv prop defined but not used in Dashboard
  - Supports TXT, CSV, and PDF export buttons

- **Report Generation Functions**:
  - `generateTxtReport`: Groups data by index, formats with metadata
  - `generateCsvReport`: Simple CSV export (currently unused in Dashboard)
  - `generatePdfReport`: PDF export for dashboard charts

### XLSX Template Structure
Based on `MODELO-RELATORIO-CSV.xlsx`:
- **Sheet naming**: Uses index names (e.g., "1.49", "LENTE PRONTA BLUECUT AZUL")
- **Header row**: Sphere/cylinder values (+0.00, -0.25, -0.50, etc.)
- **Data rows**: Sphere values (0.00, 0.25, 0.50, etc.) with quantity counts
- **Multiple sections**: Left and right sections (likely for different treatments)
- **Total row**: Shows total pieces count

## Implementation Plan

### Step 1: Install XLSX Library
**Action**: Install `xlsx` library for Excel file generation
```bash
npm install xlsx
```

**Reversible**: Can be removed with `npm uninstall xlsx`

### Step 2: Create generateXlsxReport Function
**File**: `lib/reports/generateXlsxReport.ts` (NEW)

**Functionality**:
1. Accept same filter interface as generateTxtReport
2. Group data by index (create separate sheets)
3. For each index sheet:
   - Create header row with cylinder values
   - Create data rows with sphere values and counts
   - Handle multiple treatment sections
   - Add total row
4. Export as XLSX file with timestamp

**Data Structure**:
```typescript
interface ReportFilter {
  startDate?: string;
  endDate?: string;
  company?: string;
  index?: string;
  treatment?: string;
  groupByLabel?: string;
}

interface ReportItem {
  index: string;
  esfCil: string;
  treatment: string;
  quantity: number;
}
```

**Reversible**: Delete file `lib/reports/generateXlsxReport.ts`

### Step 3: Update ExportButtons Component
**File**: `components/ExportButtons.tsx`

**Changes**:
- Add `onExportXlsx` prop to interface
- Add XLSX button with icon (similar to existing buttons)
- Position: Between TXT and PDF buttons

**Reversible**: Remove onExportXlsx prop and XLSX button

### Step 4: Update Dashboard Component
**File**: `pages/Dashboard.tsx`

**Changes**:
1. Import generateXlsxReport function
2. Add handleExportXlsx handler function (similar to handleExportTxt)
3. Pass onExportXlsx prop to ExportButtons component

**Reversible**: Remove import and handler, remove prop from ExportButtons

### Step 5: Test Implementation
**Test Cases**:
1. Generate XLSX with no filters (all data)
2. Generate XLSX with date range filter
3. Generate XLSX with index filter
4. Generate XLSX with treatment filter
5. Generate XLSX with company filter
6. Verify file opens correctly in Excel
7. Verify data matches template format

## Rollback Procedure

To revert all changes and return to current state:

1. **Remove library**:
   ```bash
   npm uninstall xlsx
   ```

2. **Delete new file**:
   ```bash
   rm lib/reports/generateXlsxReport.ts
   ```

3. **Revert ExportButtons.tsx**:
   - Remove `onExportXlsx` from interface
   - Remove XLSX button JSX

4. **Revert Dashboard.tsx**:
   - Remove import of generateXlsxReport
   - Remove handleExportXlsx function
   - Remove onExportXlsx prop from ExportButtons

## Implementation Notes

### Design Decisions
1. **Library Choice**: `xlsx` is lightweight and well-maintained for basic Excel generation
2. **File Naming**: Consistent with existing pattern: `relatorio_yyyyMMdd_HHmm.xlsx`
3. **Sheet Organization**: One sheet per index (matches template structure)
4. **Data Format**: Parse esfCil string to extract sphere and cylinder values for matrix layout

### Technical Considerations
1. **esfCil Parsing**: Need to parse strings like "+1.50 -0.50" to get sphere (1.50) and cylinder (-0.50)
2. **Matrix Construction**: Create 2D array for sphere/cylinder grid
3. **Multiple Treatments**: Template shows two sections - need to handle treatment grouping
4. **Empty Cells**: Handle cases where no data exists for specific sphere/cylinder combinations

### Future Enhancements (Out of Scope)
- Add styling to Excel cells (colors, borders)
- Add metadata sheet with filter information
- Support custom templates
- Add pivot tables for data analysis

## Files to Modify

1. **NEW**: `lib/reports/generateXlsxReport.ts`
2. **MODIFY**: `components/ExportButtons.tsx`
3. **MODIFY**: `pages/Dashboard.tsx`
4. **MODIFY**: `package.json` (dependency)

## Success Criteria

- [x] XLSX button appears next to TXT button
- [x] Clicking button generates XLSX file
- [x] XLSX file opens successfully in Excel
- [x] Data matches template structure
- [x] Filters work correctly
- [x] No errors in console
- [x] Existing TXT functionality unchanged
