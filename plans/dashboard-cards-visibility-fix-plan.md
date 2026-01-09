# Dashboard Cards Visibility Fix Plan (FINAL – AUTHORITATIVE)

## Problem Analysis

### Current Issues

The Dashboard cards are currently calculated from **analytics-filtered data** (company and date range), which produces incorrect values in the cards:

1. **"Total de Faltas"**
   - Regular users see totals affected by analytics filters (incorrect).

2. **"Faltas Hoje"**
   - Calculated from date-filtered analytics data instead of all-time company data (incorrect).

3. **"Maior Falta"**
   - Derived from analytics bar data instead of complete company data (incorrect).

4. **"Última Compra"**
   - Already correct and must remain **global and unfiltered**.

### Root Cause

The `fetchDashboardData` function applies **analytics filters before card calculations**.  
Cards must be calculated from a **company-scoped dataset**, independent of analytics filters.

---

## Requirements (Do Not Interpret)

1. **All dashboard cards must be visible to all users**
2. **Regular users**
   - Must see data **ONLY from their own company**
   - Cards **must NOT** be affected by date range filters
   - No concept of “Todas” exists for regular users
3. **Admins**
   - May see data from all companies
   - When a specific company is selected, cards must reflect **only that company**
   - When “Todas” is selected, cards must reflect **all companies**
4. **"Última Compra"**
   - Must always show the most recent purchase across **ALL companies**
   - Must never be filtered by company or date
5. **Analytics charts**
   - Must continue using company and date range filters
   - Must remain fully independent from card calculations

---

## Implementation Plan

### Step 1: Create a Raw Dataset State

**File:** `pages/Dashboard.tsx`

Create a single state to store the raw, unfiltered dataset returned from the backend:

```ts
// Raw, unfiltered dataset used as the source of truth
const [rawShortages, setRawShortages] = useState<any[]>([]);
```

This dataset **must never be filtered** by analytics logic.

---

### Step 2: Store Raw Data Before Any Filtering

Inside `fetchDashboardData`, store the mapped backend response immediately:

```ts
setRawShortages(mappedData);
```

`mappedData` represents **all records the user is allowed to access** (RLS already enforced).

---

### Step 3: Define the Card Dataset Scope (Authoritative Logic)

Create a helper function that receives a dataset and returns the correct scope **based only on user role and company selection**.

⚠️ **This function must NOT read from React state directly.**  
It must receive the dataset as a parameter.

```ts
const getCardBaseData = (data: any[]) => {
  // REGULAR USERS: always restricted to their own company
  if (!isAdmin(currentUser)) {
    return data.filter(
      item => item.company === currentUser.company
    );
  }

  // ADMINS with a specific company selected
  if (analyticsFilters.company !== 'Todas') {
    return data.filter(
      item => item.company === analyticsFilters.company
    );
  }

  // ADMINS with "Todas"
  return data;
};
```

---

### Step 4: Calculate Card Metrics from Card Base Data

Use the dataset returned by `getCardBaseData(mappedData)` to calculate **all card values**.

```ts
const cardData = getCardBaseData(mappedData);
```

#### "Total de Faltas"

```ts
const totalShortages = cardData.reduce(
  (sum, item) => sum + (item.quantity || 1),
  0
);
setTotalShortages(totalShortages);
```

#### "Faltas Hoje"

```ts
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const shortagesToday = cardData.filter(
  item => item.rawDate >= startOfToday
).length;

setShortagesToday(shortagesToday);
```

#### "Maior Falta"

```ts
const indexCounts: Record<string, number> = {};

cardData.forEach(item => {
  const index = item.index || 'Outros';
  const qty = item.quantity || 1;
  indexCounts[index] = (indexCounts[index] || 0) + qty;
});

const maiorFalta =
  Object.entries(indexCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

setBarData(
  Object.entries(indexCounts)
    .map(([key, value]) => ({
      name: key,
      value,
      color: INDEX_COLORS[key] || '#94a3b8'
    }))
);
```

---

### Step 5: Card Rendering (No Role Logic in JSX)

The JSX must only render calculated values.  
**No role or company logic is allowed in the UI layer.**

```tsx
<CardValue>{totalShortages}</CardValue>
<CardValue>{shortagesToday}</CardValue>
<CardValue>{maiorFalta}</CardValue>
<CardValue>{lastPurchaseDate}</CardValue>
```

---

### Step 6: Keep Analytics Logic Separate

Analytics charts must continue to use **date range and company filters**:

```ts
let analyticsData = mappedData;

if (isAdmin(currentUser) && analyticsFilters.company !== 'Todas') {
  analyticsData = analyticsData.filter(
    item => item.company === analyticsFilters.company
  );
}

analyticsData = analyticsData.filter(
  item => item.rawDate >= startDate && item.rawDate <= endDate
);
```

This data is used **only** for charts and recent activity.

---

## Expected Behavior After Implementation

### Regular Users
- "Total de Faltas": own company only (all time)
- "Faltas Hoje": own company only
- "Maior Falta": own company only
- "Última Compra": global

### Admins – "Todas"
- "Total de Faltas": all companies
- "Faltas Hoje": all companies
- "Maior Falta": all companies
- "Última Compra": global

### Admins – Specific Company
- "Total de Faltas": selected company
- "Faltas Hoje": selected company
- "Maior Falta": selected company
- "Última Compra": global

---

## Notes (Non-Negotiable)

- No changes to backend services
- No changes to RLS policies
- No card logic may depend on analytics filters
- Company scoping must always use `item.company` (company name), NOT `company_id`
- `currentUser.company` contains the company name (not ID)
- `analyticsFilters.company` contains the company name (not ID)
- React state must never be read immediately after `setState`

---

## Outcome

This plan guarantees:
- Correct data isolation
- Zero analytics interference with cards
- No role leakage
- Deterministic, testable behavior

**Follow this plan exactly. Do not infer additional logic.**
