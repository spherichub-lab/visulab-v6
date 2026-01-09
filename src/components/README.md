# UI Components for Empresas (Companies)

This directory contains all the UI components for managing empresas (companies) in the VisuLab application.

## Components Overview

### Core Components

#### **EmpresaForm**
- **File**: `EmpresaForm.tsx`
- **Purpose**: Reusable form component for creating and editing empresas
- **Features**:
  - Form validation with real-time error feedback
  - Integration with `useEmpresaForm` hook
  - Support for create and edit modes
  - Loading states during submission
  - Auto-generation of company initials

#### **EmpresaModal**
- **File**: `EmpresaModal.tsx`
- **Purpose**: Modal wrapper for create/edit operations
- **Features**:
  - Integrates with `EmpresaForm`
  - Dynamic title based on mode (create/edit)
  - Success/error handling with toast notifications
  - Integration with domain hooks (`useCreateEmpresa`, `useUpdateEmpresa`)

#### **EmpresaTable**
- **File**: `EmpresaTable.tsx`
- **Purpose**: Table component for displaying empresas list
- **Features**:
  - Loading skeleton states
  - Empty state with call-to-action
  - Error state with retry mechanism
  - Row selection for bulk operations
  - Inline actions (edit, toggle status, delete)
  - Responsive design

#### **EmpresaFilters**
- **File**: `EmpresaFilters.tsx`
- **Purpose**: Filter and search component
- **Features**:
  - Real-time search with debouncing
  - Filter by type (Fornecedor, Filial, Matriz)
  - Filter by status (Ativa, Inativa)
  - Clear filters functionality
  - Mobile-responsive design

#### **EmpresaActionModal**
- **File**: `EmpresaActionModal.tsx`
- **Purpose**: Confirmation modal for destructive actions
- **Features**:
  - Different configurations for delete, deactivate, activate
  - Clear action descriptions and warnings
  - Company information display
  - Loading states during operation

## Integration with Domain Hooks

All components are designed to work seamlessly with the domain hooks:

```typescript
import {
    useEmpresasList,      // For fetching list with filters
    useCreateEmpresa,      // For creating new empresas
    useUpdateEmpresa,      // For updating existing empresas
    useDeleteEmpresa,      // For deleting empresas
    useUpdateEmpresaStatus, // For activating/deactivating
    useBulkEmpresasOperation // For bulk operations
} from '../hooks/domain/empresas';
```

## Usage Example

```typescript
import React from 'react';
import { EmpresaModal, EmpresaTable, EmpresaFilters } from '../components';
import { useEmpresasList, useCreateEmpresa } from '../hooks/domain/empresas';

const CompaniesPage = () => {
    const { data: empresas, isLoading, error } = useEmpresasList({
        filters: { status: 'Ativa' }
    });
    
    const createMutation = useCreateEmpresa();

    return (
        <div>
            <EmpresaFilters
                filters={filters}
                onFiltersChange={setFilters}
                onSearch={handleSearch}
            />
            
            <EmpresaTable
                empresas={empresas?.data || []}
                isLoading={isLoading}
                error={error}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onToggleStatus={handleToggleStatus}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
            />
            
            <EmpresaModal
                isOpen={isModalOpen}
                onClose={closeModal}
                mode="create"
                onSubmit={createMutation.mutateAsync}
            />
        </div>
    );
};
```

## Features Implemented

### ✅ Complete CRUD Operations
- Create new empresas
- Edit existing empresas
- Delete empresas (soft delete)
- Activate/inactivate empresas

### ✅ Bulk Operations
- Select multiple empresas
- Bulk activate/deactivate
- Bulk delete

### ✅ Advanced Filtering
- Search by name (real-time, debounced)
- Filter by type (Fornecedor, Filial, Matriz)
- Filter by status (Ativa, Inativa)
- Filter by date range
- Filter by contact email

### ✅ User Experience
- Loading states with skeletons
- Empty states with helpful messages
- Error states with retry options
- Success/error notifications via Toast
- Responsive design for mobile/desktop
- Keyboard navigation support

### ✅ Form Validation
- Real-time validation
- Field-specific error messages
- Required field indicators
- Email format validation
- Minimum length validation

### ✅ Performance Optimizations
- Debounced search (300ms)
- Efficient re-renders with useCallback
- Optimistic updates where appropriate
- Proper cache invalidation

## Design System Compliance

All components follow the established design system:

- **Colors**: Consistent with Tailwind CSS palette
- **Typography**: Following the font scale and weights
- **Spacing**: Using the defined spacing system
- **Icons**: Material Symbols icons throughout
- **Animations**: Smooth transitions and micro-interactions
- **Dark Mode**: Full dark mode support

## Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management in modals
- Screen reader compatibility
- High contrast support

## Testing Considerations

Components are structured to be easily testable:

- Props are clearly typed with TypeScript
- Business logic is separated in hooks
- Mock data can be easily injected
- Event handlers are isolated
- State management is predictable

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Search**: Add search by contact name, phone, etc.
2. **Export Functionality**: CSV/PDF export of filtered results
3. **Advanced Bulk Actions**: More bulk operations (bulk edit, etc.)
4. **Drag & Drop**: For file uploads or bulk operations
5. **Kanban View**: Alternative to table view
6. **Advanced Analytics**: Charts and statistics integration