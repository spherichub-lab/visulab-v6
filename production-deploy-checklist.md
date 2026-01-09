# Production Build and Deploy Checklist
## VisuLab v6.0 - Supabase Integration

Generated: 2026-01-04

---

## Pre-Build Checklist

### Environment Variables
- [ ] Verify `.env.local` exists with all required variables:
  - [ ] `VITE_SUPABASE_URL` - Supabase project URL
  - [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key
  - [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
  - [ ] `SENTRY_DSN` - Sentry error tracking (optional but recommended)

### Database Setup
- [ ] Run database schema migrations
- [ ] Configure Row Level Security (RLS) policies
- [ ] Seed reference data (indices, tipos, tratamientos)
- [ ] Seed test data (empresas, usuarios, faltas, compras)
  - Run: `npm run seed:db` (TypeScript script)
  - Or: `npm run seed:db:sql` (direct SQL)

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests passing: `npm test`
- [ ] E2E tests passing: `npm run test:e2e`

---

## Build Process

### 1. Install Dependencies
```bash
npm install
```

- [ ] All dependencies installed successfully
- [ ] No peer dependency warnings

### 2. Run Tests
```bash
npm test
npm run test:e2e
```

- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Coverage meets requirements (if applicable)

### 3. Build Production Bundle
```bash
npm run build
```

- [ ] Build completes without errors
- [ ] Build output in `dist/` directory
- [ ] Bundle size is reasonable (< 500KB gzipped)
- [ ] No console warnings during build

### 4. Preview Production Build
```bash
npm run preview
```

- [ ] Preview server starts successfully
- [ ] All pages load without 500 errors
- [ ] Authentication flow works
- [ ] Data fetching works correctly

---

## Post-Build Validation

### Page Load Testing
- [ ] **Dashboard** (`/`) - Loads without errors, displays charts
- [ ] **Shortages** (`/shortages`) - Form works, data loads
- [ ] **Users** (`/users`) - List loads, CRUD operations work
- [ ] **Companies** (`/companies`) - List loads, CRUD operations work
- [ ] **Purchases** (`/purchases`) - List loads, form works
- [ ] **Login** (`/login`) - Authentication works

### Data Integrity Checks
- [ ] **Faltas** queries return joined data (usuarios, empresas, tipos, indices, tratamientos)
- [ ] **Usuarios** queries return joined empresa data
- [ ] No hardcoded user_id or empresa_id in production code
- [ ] All user_id and empresa_id values come from AuthContext

### RLS Policy Validation
- [ ] Users can only see their own empresa's data
- [ ] Admin users can see all data
- [ ] Reference tables (indices, tipos, tratamientos) are readable by all
- [ ] Only admins can write to reference tables

### Error Handling
- [ ] 500 errors are caught and displayed gracefully
- [ ] Network errors are handled with retry logic
- [ ] Auth errors redirect to login page
- [ ] Sentry error tracking is configured (if using)

---

## Deployment Checklist

### Supabase Configuration
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Storage buckets configured (if using file storage)
- [ ] Edge functions deployed (if using)
- [ ] Auth providers configured (email, OAuth, etc.)

### Production Environment
- [ ] Production environment variables set in hosting platform
- [ ] Database connection string is correct
- [ ] CORS settings allow production domain
- [ ] SSL/HTTPS is enabled

### Build Deployment
- [ ] Production build artifacts uploaded
- [ ] Static files served correctly
- [ ] Client-side routing configured
- [ ] Service worker registered (if using PWA)

### Monitoring & Logging
- [ ] Application monitoring configured (Sentry, LogRocket, etc.)
- [ ] Database query logging enabled
- [ ] Performance monitoring active
- [ ] Error alerts configured

---

## Rollback Plan

### If Issues Occur
1. **Immediate Rollback**
   - Revert to previous build
   - Restore database from backup
   - Notify users of maintenance

2. **Database Issues**
   - Disable RLS temporarily if blocking
   - Check foreign key constraints
   - Verify data integrity

3. **Performance Issues**
   - Check database query performance
   - Review bundle size
   - Enable CDN caching

---

## Post-Deployment Verification

### Smoke Tests
- [ ] Application loads in < 3 seconds
- [ ] Login works with test credentials
- [ ] Dashboard displays data
- [ ] Can create a new falta
- [ ] Can view users list
- [ ] Can view companies list

### Data Validation
- [ ] Seed data is present
- [ ] Relationships are correct
- [ ] No orphaned records
- [ ] Foreign keys are valid

### User Acceptance
- [ ] Test with admin user (full access)
- [ ] Test with regular user (restricted access)
- [ ] Verify all CRUD operations
- [ ] Check export functionality (PDF, TXT, CSV)

---

## Maintenance Tasks

### Daily
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Review user activity

### Weekly
- [ ] Review and optimize slow queries
- [ ] Check storage usage
- [ ] Update reference data if needed

### Monthly
- [ ] Review and update RLS policies
- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance optimization

---

## Contact Information

### Support
- **Database Issues**: Supabase Dashboard
- **Application Errors**: Sentry Dashboard (if configured)
- **Deployment Issues**: Hosting platform support

### Test Credentials (for validation)
- **Admin**: admin@visulab.com
- **User 1**: joao@visulab.com
- **User 2**: maria@visulab.com

---

## Notes

1. **Seed Data**: Use `npm run seed:db` to populate database with test data
2. **Type Generation**: Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public` to regenerate types after schema changes
3. **RLS Policies**: Always test RLS policies in development before deploying to production
4. **Environment Variables**: Never commit `.env.local` to version control
5. **Backups**: Enable automated database backups in Supabase settings

---

## Quick Reference Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:ui
npm run test:coverage

# Run E2E tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# Seed database
npm run seed:db
npm run seed:db:sql
```

---

**Last Updated**: 2026-01-04
**Version**: v6.0
**Status**: Ready for Production
