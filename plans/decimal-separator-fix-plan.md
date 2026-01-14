# Decimal Separator Fix Plan

## Summary
Fix the "esf" and "cil" inputs to accept comma (",") as decimal separator, converting it to dot (".") for proper formatting.

## Problem
Currently, the inputs only work with "." as decimal separator (e.g., "1.25"). When users type "1,25", the `parseFloat()` function fails to parse it correctly.

## Solution
Replace commas with dots before parsing the values in the `handleBlur` functions.

## Files to Modify

### 1. pages/Shortages.tsx
**Location:** Lines 184-230 (handleBlur function)

**Changes needed:**
- In the `handleBlur` function, before calling `parseFloat(value)`, replace all commas with dots
- Apply this to both 'sphere' and 'cylinder' fields

### 2. components/EditFaltaModal.tsx
**Location:** Lines 104-150 (handleBlur function)

**Changes needed:**
- In the `handleBlur` function, before calling `parseFloat(value)`, replace all commas with dots
- Apply this to both 'esf' and 'cil' fields

## Implementation Details

### Code Change Pattern
```typescript
// Before:
let num = parseFloat(value);

// After:
let num = parseFloat(value.replace(',', '.'));
```

### Examples
- Input: "1,25" → Parsed as: 1.25 → Formatted as: "+1.25"
- Input: "3,50" → Parsed as: 3.50 → Formatted as: "+3.50"
- Input: "3,5" → Parsed as: 3.5 → Formatted as: "+3.50"
- Input: "-0,75" → Parsed as: -0.75 → Formatted as: "-0.75"

## Testing Checklist
- [ ] Test entering "1,25" in ESF field → should format to "+1.25"
- [ ] Test entering "3,50" in ESF field → should format to "+3.50"
- [ ] Test entering "3,5" in ESF field → should format to "+3.50"
- [ ] Test entering "1,25" in CIL field → should format to "-1.25"
- [ ] Test entering "3,50" in CIL field → should format to "-3.50"
- [ ] Test entering "3,5" in CIL field → should format to "-3.50"
- [ ] Verify existing functionality with "." still works
- [ ] Test in both Shortages page and EditFaltaModal
