/**
 * PageHeader component exports
 * Central export point for PageHeader functionality
 */

export { default as PageHeader } from './PageHeader';
export { default as PageHeaderBreadcrumb } from './PageHeaderBreadcrumb';
export { default as PageHeaderSearch } from './PageHeaderSearch';
export { default as PageHeaderActions, renderActions } from './PageHeaderActions';

export type {
    BaseComponentProps,
    BreadcrumbItem,
    PageHeaderSearch as PageHeaderSearchType,
    PageHeaderAction,
    PageHeaderProps,
    PageHeaderBreadcrumbProps,
    PageHeaderActionsProps,
    PageHeaderSearchProps,
} from './types';