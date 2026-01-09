# Shortages Page Timestamp Format Fix Plan

## Objective
Update the "Histórico Recente" modal in the Shortages page to display timestamps using the same "há quanto tempo" format as the "Atividades Recente" modal in the Dashboard page.

## Current State

### Dashboard.tsx (Reference Implementation)
- **Location**: Lines 81-101
- **Function**: `formatTimeAgo(date: Date)`
- **Behavior**: Converts timestamps to relative time format in Portuguese
- **Examples**: "agora", "5 minutos", "2 horas", "3 dias"
- **Usage**: Line 261 - `time: item.created_at ? formatTimeAgo(new Date(item.created_at)) : '-'`

### Shortages.tsx (Current Implementation)
- **Location**: Lines 123-145
- **Function**: `fetchHistory()`
- **Current Behavior**: Line 137 - `time: f.created_at || '-'` displays raw timestamp
- **Missing**: The `formatTimeAgo` utility function

## Required Changes

### 1. Add formatTimeAgo Utility Function
**File**: `pages/Shortages.tsx`
**Location**: After line 37 (after the `getIndexColorClass` function)

```typescript
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};
```

### 2. Update fetchHistory Function
**File**: `pages/Shortages.tsx`
**Location**: Line 137
**Change**: Replace `time: f.created_at || '-'` with:
```typescript
time: f.created_at ? formatTimeAgo(new Date(f.created_at)) : '-',
```

## Implementation Steps

1. ✅ Add the `formatTimeAgo` function to Shortages.tsx
2. ✅ Update the timestamp mapping in `fetchHistory` to use `formatTimeAgo`
3. ✅ Verify the modal displays formatted timestamps correctly

## Expected Outcome

After implementation, the "Histórico Recente" modal will display timestamps in the same relative time format as the Dashboard:
- Less than 1 minute: "agora"
- 1-59 minutes: "X minutos" or "X minuto"
- 1-23 hours: "X horas" or "X hora"
- 24+ hours: "X dias" or "X dia"

## Dependencies

No external dependencies required. The solution uses native JavaScript Date object and math operations.

## Testing Checklist

- [ ] Open Shortages page
- [ ] Click "Histórico Recente" button
- [ ] Verify timestamps display in relative time format (e.g., "5 minutos", "2 horas")
- [ ] Verify recent entries show "agora" for very recent records
- [ ] Verify pluralization is correct (minuto/minutos, hora/horas, dia/dias)
- [ ] Compare with Dashboard "Atividades Recente" modal to ensure consistency

## Notes

- The function uses Portuguese language for all time units
- The logic handles singular/plural forms correctly
- No external libraries needed (date-fns is imported in Dashboard but not required for this specific function)
