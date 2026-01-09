# RLS (Row Level Security) Utilities Module

This module provides frontend-side RLS enforcement to ensure the UI respects RLS expectations. It includes validation, error handling, audit logging, and form validation.

## Overview

The RLS utilities module helps enforce Row Level Security policies at the frontend level by:

1. **Validating RLS expectations before data operations** - Ensures users only access data they're authorized to see/modify
2. **Implementing role-based query filtering** - Automatically applies filters based on user role and company
3. **Adding RLS policy status checking functions** - Checks if RLS policies are being enforced
4. **Creating audit logging for RLS enforcement** - Logs all RLS operations for security auditing

## Key Components

### 1. RLS Validator (`rlsValidator.ts`)

The core validation engine that:
- Validates RLS expectations before data operations (read, create, update, delete)
- Implements role-based query filtering helpers
- Checks RLS policy status
- Creates audit logs for RLS enforcement

**Key Functions:**
- `validateReadAccess()` - Validate before read operations
- `validateCreateAccess()` - Validate before create operations
- `validateUpdateAccess()` - Validate before update operations
- `validateDeleteAccess()` - Validate before delete operations
- `applyRlsFilters()` - Apply role-based filters to queries
- `checkRlsStatus()` - Check RLS policy status
- `getRlsAuditLogs()` - Retrieve audit logs
- `getRlsAuditStats()` - Get audit statistics

### 2. RLS Error Handler (`rlsErrorHandler.ts`)

Handles RLS policy violation errors and provides user-friendly messages:
- Handles RLS policy violation errors (403 responses)
- Provides user-friendly messages for RLS violations
- Logs RLS violations for audit purposes
- Implements retry logic for transient RLS errors

**Key Functions:**
- `handleRlsError()` - Handle RLS errors with retry logic
- `handleRlsValidationResult()` - Handle validation results
- `createRlsUserMessage()` - Create user-friendly error messages
- `createRlsAuthorizationError()` - Create AuthorizationError from RLS details
- `isRlsErrorRetryable()` - Check if error should be retried

### 3. RLS Form Validator (`rlsFormValidator.ts`)

Validates form submissions against RLS policies:
- Validates that form submissions respect RLS policies
- Shows warnings when attempting to modify restricted data
- Disables fields that violate RLS policies
- Provides feedback on RLS restrictions

**Key Functions:**
- `validateFormWithRls()` - Validate entire form against RLS
- `isFormFieldDisabled()` - Check if field should be disabled
- `getFieldRestrictionMessage()` - Get restriction message for a field
- `sanitizeFormData()` - Remove restricted fields from form data
- `applyRlsToFormFields()` - Apply restrictions to form field array

### 4. RLS Status Indicator Component (`../components/rls/RlsStatusIndicator.tsx`)

React components for displaying RLS status:
- `RlsStatusIndicator` - Displays RLS status badge
- `RlsStatusBadge` - Compact RLS status indicator
- `RlsContextDisplay` - Shows user's access context (role, company)

### 5. RLS-Aware Repository (`lib/dal/base/rlsAwareRepository.ts`)

Base repository class that extends `BaseRepository` with RLS support:
- Validates RLS before CRUD operations
- Applies automatic role-based query filtering
- Checks RLS status before operations
- Handles RLS policy violations gracefully

## Usage Examples

### Basic RLS Validation

```typescript
import { validateReadAccess, validateCreateAccess } from '@/utils/rls';

// Validate read access
const result = validateReadAccess(
    'usuarios',
    userId,
    'user',
    empresaId
);

if (!result.isValid) {
    console.error('RLS violation:', result.violations);
}

// Validate create access
const createResult = validateCreateAccess(
    'faltas',
    userId,
    'user',
    empresaId,
    { usuario_id: userId, empresa_id: empresaId }
);
```

### Using RLS-Aware Repository

```typescript
import { RlsAwareRepository } from '@/lib/dal/base';
import { UsuariosRepository } from './usuariosRepository';

class RlsUsuariosRepository extends RlsAwareRepository<Usuario> {
    constructor() {
        super({
            table: TABLE_NAMES.USUARIOS,
            enableRlsValidation: true,
            enableRlsFiltering: true
        });
    }
}

// Set user context before operations
repository.setUserContext({
    userId: 'user-123',
    userRole: 'user',
    empresaId: 'empresa-456'
});

// Now all operations will have RLS validation and filtering applied
const users = await repository.findAll();
```

### Form Validation with RLS

```typescript
import { validateFormWithRls, isFormFieldDisabled } from '@/utils/rls';

// Validate form submission
const validationResult = validateFormWithRls(formData, {
    tableName: 'usuarios',
    userId: 'user-123',
    userRole: 'user',
    empresaId: 'empresa-456',
    isUpdate: true
});

if (!validationResult.isValid) {
    // Show errors to user
    console.error('RLS violations:', validationResult.errors);
}

// Check if field should be disabled
const isRoleDisabled = isFormFieldDisabled('role', {
    tableName: 'usuarios',
    userId: 'user-123',
    userRole: 'user',
    empresaId: 'empresa-456'
});
```

### Using RLS Status Indicators

```typescript
import { RlsStatusIndicator, RlsContextDisplay } from '@/components/rls';

// Simple status indicator
<RlsStatusIndicator 
    status="enforced" 
    userRole="user" 
    size="sm" 
/>

// Full context display
<RlsContextDisplay
    status="enforced"
    userRole="user"
    empresaId="empresa-456"
    empresaName="My Company"
/>
```

### DataTable with RLS Status

```typescript
import { DataTable } from '@/components/shared/DataTable';

<DataTable
    data={data}
    columns={columns}
    rlsStatus="enforced"
    rlsStatusPosition="header"
    showRlsContext={true}
    rlsUserRole="user"
    rlsEmpresaId="empresa-456"
    rlsEmpresaName="My Company"
/>
```

## RLS Policy Configuration

The module includes pre-configured RLS policies for each table:

| Table | Empresa Column | User Column | Requires Empresa Access | Admin Bypass | Allowed Roles |
|--------|----------------|--------------|----------------------|---------------|---------------|
| empresas | id | - | No | Yes | admin, manager |
| usuarios | empresa_id | id | Yes | Yes | admin, manager, user |
| faltas | empresa_id | usuario_id | Yes | Yes | admin, manager, user |
| compras | - | - | No | Yes | admin, manager |
| indices | - | - | No | No | admin, manager, user, viewer |
| tipos | - | - | No | No | admin, manager, user, viewer |
| tratamentos | - | - | No | No | admin, manager, user, viewer |

## Audit Logging

All RLS operations are logged to an in-memory audit store. You can:

- Get audit logs: `getRlsAuditLogs(filters)`
- Get audit statistics: `getRlsAuditStats()`
- Clear audit logs: `clearRlsAuditLogs()`

Audit logs include:
- Operation type (read, create, update, delete)
- User ID and role
- Table name
- Validation result (enforced, bypassed, error)
- Timestamp

## Error Handling

RLS errors are handled gracefully with user-friendly messages:

- **Policy Violation**: "Violação de política de segurança. Você não tem permissão para esta operação."
- **Company Restriction**: "Você não tem permissão para acessar dados desta empresa."
- **User Restriction**: "Você não tem permissão para acessar dados deste usuário."
- **Role Restriction**: "Seu cargo não tem permissão para realizar esta ação."

## Best Practices

1. **Always set user context** before using RLS-aware repositories
2. **Validate forms** before submission to catch RLS violations early
3. **Display RLS status** in data tables to inform users
4. **Handle RLS errors** gracefully with user-friendly messages
5. **Use audit logs** for security monitoring and debugging
6. **Test RLS policies** thoroughly for each user role

## Integration with Existing Code

The RLS utilities are designed to work with existing code:

- **Backward compatible**: Existing repositories continue to work without changes
- **Optional RLS**: RLS validation can be enabled/disabled per repository
- **Type-safe**: Full TypeScript support with proper types
- **No database changes**: All RLS enforcement is frontend-side only

## Performance Considerations

- RLS validation is fast and adds minimal overhead
- Audit logs are stored in-memory with a max of 1000 entries
- RLS filtering is applied at the query level, not after data retrieval
- Cache is not affected by RLS validation

## Future Enhancements

Potential improvements to consider:

1. Persistent audit logging (localStorage or backend)
2. Real-time RLS status updates
3. More granular field-level permissions
4. RLS policy editor for admin users
5. Integration with backend RLS policy management
