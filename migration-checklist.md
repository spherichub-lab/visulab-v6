# Service Layer Migration Checklist

## Overview

This checklist provides a step-by-step guide for migrating from the current anti-pattern of instantiating BaseService with placeholders to the new service layer architecture.

## Pre-Migration Checklist

- [ ] Review current domain hooks to understand existing patterns
- [ ] Identify all files that need to be refactored
- [ ] Backup current implementation
- [ ] Create feature branch for migration
- [ ] Set up testing environment

## Migration Steps

### Phase 1: Core Infrastructure

#### 1.1 Create ServiceFactory
- [ ] Create `src/services/core/ServiceFactory.ts`
- [ ] Implement singleton pattern for factory
- [ ] Add dependency injection methods
- [ ] Add service caching mechanism
- [ ] Add testing utilities (clear, reset methods)

#### 1.2 Create ServiceRegistry
- [ ] Create `src/services/core/ServiceRegistry.ts`
- [ ] Implement singleton pattern for registry
- [ ] Add service getter methods for each entity
- [ ] Initialize all services using factory
- [ ] Add testing utilities

#### 1.3 Configure ApiClient
- [ ] Create `src/lib/apiClientConfig.ts`
- [ ] Add environment-specific configurations
- [ ] Create initialization function
- [ ] Update application startup code

### Phase 2: Service Implementation

#### 2.1 Create Concrete Service Classes
- [ ] Create `src/services/empresas/EmpresasService.ts`
- [ ] Create `src/services/usuarios/UsuariosService.ts`
- [ ] Create `src/services/faltas/FaltasService.ts`
- [ ] Create `src/services/compras/ComprasService.ts`
- [ ] Create `src/services/indices/IndicesService.ts`
- [ ] Create `src/services/tipos/TiposService.ts`
- [ ] Create `src/services/tratamientos/TratamientosService.ts`

#### 2.2 Implement Service-Specific Methods
For each service class:
- [ ] Extend BaseService with proper constructor
- [ ] Add entity-specific methods (getWithUI, getByStatus, etc.)
- [ ] Add bulk operations
- [ ] Add search/filter methods
- [ ] Add data transformation methods

### Phase 3: Domain Hook Refactoring

#### 3.1 Refactor Individual Domain Hooks
For each domain hook file:
- [ ] Remove service class definition
- [ ] Import serviceRegistry
- [ ] Get service instance from registry
- [ ] Update all service method calls
- [ ] Test functionality

#### 3.2 Specific Files to Refactor
- [ ] Refactor `src/hooks/domain/empresas.ts`
- [ ] Refactor `src/hooks/domain/usuarios.ts`
- [ ] Refactor `src/hooks/domain/faltas.ts`
- [ ] Refactor `src/hooks/domain/compras.ts`
- [ ] Refactor `src/hooks/domain/indices.ts`
- [ ] Refactor `src/hooks/domain/tipos.ts`
- [ ] Refactor `src/hooks/domain/tratamientos.ts`

### Phase 4: Exports and Integration

#### 4.1 Update Service Exports
- [ ] Update `src/services/index.ts`
- [ ] Export all new service classes
- [ ] Export core factory and registry
- [ ] Ensure proper TypeScript types

#### 4.2 Update Application Integration
- [ ] Import and initialize ApiClient in main app file
- [ ] Ensure service registry is available globally
- [ ] Test application startup

### Phase 5: Testing and Validation

#### 5.1 Unit Tests
- [ ] Create tests for ServiceFactory
- [ ] Create tests for ServiceRegistry
- [ ] Create tests for each service implementation
- [ ] Create tests for refactored domain hooks

#### 5.2 Integration Tests
- [ ] Test service factory with ApiClient
- [ ] Test service registry with factory
- [ ] Test domain hooks with mocked services
- [ ] Test end-to-end functionality

#### 5.3 Manual Testing
- [ ] Test all CRUD operations
- [ ] Test bulk operations
- [ ] Test search and filtering
- [ ] Test error handling
- [ ] Test loading states

## Post-Migration Checklist

### Validation
- [ ] Verify all domain hooks work correctly
- [ ] Verify no TypeScript errors
- [ ] Verify no runtime errors
- [ ] Verify performance is maintained
- [ ] Verify all tests pass

### Documentation
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Create migration guide for team
- [ ] Update README files

### Code Review
- [ ] Peer review of all new code
- [ ] Security review
- [ ] Performance review
- [ ] Architecture review

### Deployment
- [ ] Deploy to staging environment
- [ ] Conduct QA testing
- [ ] Get stakeholder approval
- [ ] Deploy to production
- [ ] Monitor for issues

## Rollback Plan

### If Issues Arise
1. **Immediate Rollback**: Revert to previous implementation
2. **Partial Rollback**: Keep infrastructure, revert specific hooks
3. **Forward Fix**: Address issues without rolling back

### Rollback Steps
- [ ] Identify affected components
- [ ] Revert code changes
- [ ] Restore database state if needed
- [ ] Test rollback functionality
- [ ] Communicate with team

## Migration Timeline

### Week 1: Infrastructure
- Day 1-2: Create ServiceFactory and ServiceRegistry
- Day 3-4: Configure ApiClient and create service classes
- Day 5: Update exports and basic integration

### Week 2: Refactoring
- Day 1-2: Refactor domain hooks
- Day 3-4: Testing and validation
- Day 5: Documentation and code review

### Week 3: Deployment
- Day 1-2: Staging deployment and QA
- Day 3-4: Production deployment
- Day 5: Monitoring and optimization

## Common Issues and Solutions

### TypeScript Errors
**Issue**: Type mismatches after refactoring
**Solution**: Ensure proper typing in service implementations and registry

### Runtime Errors
**Issue**: Services not properly initialized
**Solution**: Verify ApiClient configuration and initialization order

### Performance Issues
**Issue**: Slower performance after migration
**Solution**: Optimize service caching and query patterns

### Test Failures
**Issue**: Tests failing with new architecture
**Solution**: Update test mocks and fixtures to match new patterns

## Best Practices

### During Migration
1. **Small Changes**: Migrate one service at a time
2. **Test Continuously**: Run tests after each change
3. **Document Progress**: Keep track of what's been migrated
4. **Communicate**: Keep team informed of progress

### After Migration
1. **Monitor**: Watch for performance issues
2. **Refine**: Optimize based on usage patterns
3. **Maintain**: Keep documentation up to date
4. **Train**: Ensure team understands new architecture

## Success Criteria

### Technical Criteria
- [ ] No more `{} as any` placeholders
- [ ] All services properly injected
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Performance maintained or improved

### Functional Criteria
- [ ] All CRUD operations working
- [ ] All UI components functioning
- [ ] All integrations working
- [ ] Error handling working
- [ ] Loading states working

### Quality Criteria
- [ ] Code is maintainable
- [ ] Architecture is scalable
- [ ] Documentation is complete
- [ ] Team is trained
- [ ] Migration is complete

## Contact Information

For questions or issues during migration:
- **Architecture Lead**: [Contact Info]
- **Tech Lead**: [Contact Info]
- **QA Lead**: [Contact Info]

## Resources

- [Service Layer Architecture](./service-layer-architecture.md)
- [Service Implementation Guide](./service-implementation-guide.md)
- [API Documentation](./api-documentation.md)
- [Testing Guidelines](./testing-guidelines.md)