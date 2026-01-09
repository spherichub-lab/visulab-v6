# New List Page Developer Checklist

Use this checklist when creating new list-based pages to ensure compliance with architectural standards.

## Pre-Development

### Planning
- [ ] Review the [List Page Architecture Standard](./list-page-architecture-standard.md)
- [ ] Review the [List Page Template](./list-page-template.md)
- [ ] Identify the entity type and its properties
- [ ] Determine required CRUD operations (Create, Read, Update, Delete)
- [ ] Identify any bulk operations needed
- [ ] Plan filters and search requirements
- [ ] Define metrics for page header

### Prerequisites
- [ ] Domain hooks exist in `src/hooks/domain/[entity].ts`
- [ ] Service layer implements required methods
- [ ] Types are defined in `src/types/domain/domain.types.ts`
- [ ] Shared components (DataTable, PageHeader, FormLayout, FeedbackState) are available

## Implementation

### File Setup
- [ ] Create new page file in `pages/[EntityName].tsx`
- [ ] Follow the import order (React → Shared Components → Domain Hooks → Types → Utilities)
- [ ] Add file header comment with description

### Type Definitions
- [ ] Define UI-specific type for entity display
- [ ] Include all fields needed for DataTable rendering
- [ ] Map database types to UI types if necessary

### State Management
- [ ] Define modal states (create, edit, action)
- [ ] Define selection state for bulk operations
- [ ] Define filter state
- [ ] Define search query state
- [ ] Define toast notification state

### Query Hooks
- [ ] Use `useEntityList()` for fetching data
- [ ] Use `useCreateEntity()` for creating
- [ ] Use `useUpdateEntity()` for updating
- [ ] Use `useDeleteEntity()` for deleting
- [ ] Use `useUpdateEntityStatus()` if status changes are needed
- [ ] Use `useBulkEntitiesOperation()` for bulk actions
- [ ] Extract data with optional chaining: `entitiesData?.data || []`

### Event Handlers
- [ ] All event handlers use `useCallback`
- [ ] Implement `handleCreate` with try-catch
- [ ] Implement `handleUpdate` with try-catch
- [ ] Implement `handleDelete` with try-catch
- [ ] Implement `handleToggleStatus` if applicable
- [ ] Implement bulk operation handlers
- [ ] Implement filter change handler
- [ ] Implement search handler
- [ ] Implement selection change handler
- [ ] Implement modal open/close handlers

### DataTable Configuration
- [ ] Define columns array with proper types
- [ ] Implement custom render functions for complex cells
- [ ] Define actions array for row-level actions
- [ ] Implement `renderBulkActions` callback
- [ ] Configure selection with `getRowId` callback

### Page Header Configuration
- [ ] Define header actions array
- [ ] Define metrics array for statistics
- [ ] Configure search with debounce (300ms)
- [ ] Set appropriate title and description

### State Handling (CRITICAL)
- [ ] **MUST** render loading state with `<FeedbackState type="loading" />`
- [ ] **MUST** render error state with `<FeedbackState type="error" onRetry={refetch} />`
- [ ] **MUST** render empty state with `<FeedbackState type="empty" action={{...}} />`
- [ ] **MUST** render DataTable when data exists
- [ ] **NEVER** return null, empty fragments, or blank screens
- [ ] All FeedbackState components use `variant="full"` and `size="lg"`

### Form Layout
- [ ] Use FormLayout for create/edit modals
- [ ] Define all required fields
- [ ] Set appropriate default values
- [ ] Configure validation (required fields)
- [ ] Handle form submission properly

### Confirm Dialog
- [ ] Use ConfirmActionDialog for destructive actions
- [ ] Set appropriate severity level (critical/medium/low)
- [ ] Provide clear description and warning
- [ ] Show loading state during operation

## Code Quality

### TypeScript
- [ ] All types are properly defined
- [ ] No `any` types used (except where explicitly needed)
- [ ] Proper type inference from hooks
- [ ] Type-safe event handlers

### Performance
- [ ] All callbacks use `useCallback`
- [ ] No unnecessary re-renders
- [ ] Memoized expensive calculations
- [ ] Proper dependency arrays

### Error Handling
- [ ] All async operations wrapped in try-catch
- [ ] User-friendly error messages
- [ ] Console.error for debugging
- [ ] Toast notifications for user feedback

### Accessibility
- [ ] DataTable has `ariaLabel` prop
- [ ] DataTable has `testId` prop for testing
- [ ] Icons have descriptive names
- [ ] Form fields have proper labels

## Testing

### Manual Testing
- [ ] Test loading state (slow network)
- [ ] Test error state (network failure)
- [ ] Test empty state (no data)
- [ ] Test data state (normal operation)
- [ ] Test create operation
- [ ] Test update operation
- [ ] Test delete operation
- [ ] Test bulk operations
- [ ] Test search functionality
- [ ] Test filter functionality
- [ ] Test pagination (if applicable)
- [ ] Test modal open/close
- [ ] Test toast notifications

### Edge Cases
- [ ] Test with empty search query
- [ ] Test with special characters in search
- [ ] Test with no selections for bulk operations
- [ ] Test with rapid successive operations
- [ ] Test with network errors during mutations

## Code Review Checklist

Before submitting for review:

### Architecture Compliance
- [ ] Page uses domain hooks (no direct service calls)
- [ ] No business logic in page component
- [ ] Proper separation of concerns
- [ ] Follows folder responsibility guidelines

### State Handling
- [ ] All three states (loading, error, empty) are handled
- [ ] No blank screens or null returns
- [ ] FeedbackState used consistently
- [ ] Retry functionality implemented for errors

### Code Style
- [ ] Consistent naming conventions
- [ ] Proper code organization (sections with comments)
- [ ] No commented-out code
- [ ] No console.log statements (use console.error for errors)

### Documentation
- [ ] File header comment present
- [ ] Complex logic has inline comments
- [ ] Component is self-documenting

## Post-Implementation

### Verification
- [ ] Page loads without errors
- [ ] All CRUD operations work correctly
- [ ] State transitions are smooth
- [ ] Responsive design works on mobile
- [ ] Dark mode works correctly
- [ ] No console warnings or errors

### Performance
- [ ] Page loads quickly
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Smooth scrolling in DataTable
- [ ] Fast search/filter response

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus management correct
- [ ] Color contrast sufficient

## Common Pitfalls to Avoid

### ❌ Don't Do This
- Return null or empty fragments
- Skip loading/error/empty states
- Use direct service calls in pages
- Put business logic in page components
- Forget useCallback for handlers
- Use inline conditional rendering everywhere
- Skip error handling in async operations
- Forget to extract data with optional chaining

### ✅ Do This Instead
- Always render one of the three states with FeedbackState
- Use domain hooks from `src/hooks/domain/`
- Keep pages focused on orchestration
- Use useCallback for all event handlers
- Extract data with `entitiesData?.data || []`
- Wrap all async operations in try-catch
- Provide user-friendly error messages

## References

- [List Page Architecture Standard](./list-page-architecture-standard.md)
- [List Page Template](./list-page-template.md)
- [Users Page Example](../pages/Users.tsx)
- [Companies Page Example](../pages/Companies.tsx)
- [Shortages Page Example](../pages/Shortages.tsx)
- [FeedbackState Component](../src/components/shared/FeedbackState/FeedbackState.tsx)
- [Generic Query Hooks](../src/hooks/queries/useGenericQuery.ts)

## Quick Reference

### Import Order
```typescript
// 1. React and hooks
import React, { useState, useCallback } from 'react';

// 2. Shared components
import { DataTable, PageHeader, FormLayout, ConfirmActionDialog, FeedbackState } from '../src/components/shared';

// 3. Domain hooks
import { useEntityList, useCreateEntity, useUpdateEntity, useDeleteEntity } from '../src/hooks/domain/entities';

// 4. Types
import { EntityFilters, EntityFormData } from '../src/types/domain/domain.types';

// 5. Utilities
import { showSuccess, showWarning, showInfo } from '../src/utils/errorHandler';
```

### State Handling Pattern
```typescript
{isLoading ? (
  <FeedbackState type="loading" variant="full" size="lg" />
) : error ? (
  <FeedbackState type="error" onRetry={refetch} variant="full" size="lg" />
) : entities.length === 0 ? (
  <FeedbackState type="empty" action={{...}} variant="full" size="lg" />
) : (
  <DataTable data={entities} ... />
)}
```

### Data Extraction Pattern
```typescript
const entities = entitiesData?.data || [];
```

### Handler Pattern
```typescript
const handleCreate = useCallback(async (data: EntityFormData) => {
  try {
    await createMutation.mutateAsync(data);
    showSuccess('Entidade criada com sucesso!');
    closeAllModals();
  } catch (error) {
    console.error('Error creating entity:', error);
    showWarning('Erro ao criar entidade. Tente novamente.');
  }
}, [createMutation, closeAllModals]);
```
