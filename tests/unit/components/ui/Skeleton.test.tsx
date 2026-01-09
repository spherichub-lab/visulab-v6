/**
 * Skeleton component tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonTable
} from '@/components/ui/skeleton';

describe('Skeleton', () => {
    describe('Base Skeleton', () => {
        it('should render with default props', () => {
            const { container } = render(<Skeleton />);
            expect(container.firstChild).toBeInTheDocument();
            expect(container.firstChild).toHaveAttribute('role', 'status');
            expect(container.firstChild).toHaveAttribute('aria-label', 'Carregando');
        });

        it('should render with custom className', () => {
            const { container } = render(<Skeleton className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should render text variant', () => {
            const { container } = render(<Skeleton variant="text" />);
            expect(container.firstChild).toHaveClass('rounded');
        });

        it('should render circular variant', () => {
            const { container } = render(<Skeleton variant="circular" />);
            expect(container.firstChild).toHaveClass('rounded-full');
        });

        it('should render rectangular variant (default)', () => {
            const { container } = render(<Skeleton variant="rectangular" />);
            expect(container.firstChild).toHaveClass('rounded-md');
        });

        it('should render with custom width', () => {
            const { container } = render(<Skeleton width="200px" />);
            expect(container.firstChild).toHaveStyle({ width: '200px' });
        });

        it('should render with custom height', () => {
            const { container } = render(<Skeleton height="50px" />);
            expect(container.firstChild).toHaveStyle({ height: '50px' });
        });

        it('should render with numeric width', () => {
            const { container } = render(<Skeleton width={200} />);
            expect(container.firstChild).toHaveStyle({ width: '200px' });
        });

        it('should render with numeric height', () => {
            const { container } = render(<Skeleton height={50} />);
            expect(container.firstChild).toHaveStyle({ height: '50px' });
        });

        it('should render with pulse animation (default)', () => {
            const { container } = render(<Skeleton animation="pulse" />);
            expect(container.firstChild).toHaveClass('animate-pulse');
        });

        it('should render with wave animation', () => {
            const { container } = render(<Skeleton animation="wave" />);
            expect(container.firstChild).toHaveClass('animate-[shimmer_1.5s_infinite]');
        });

        it('should render without animation', () => {
            const { container } = render(<Skeleton animation="none" />);
            expect(container.firstChild).not.toHaveClass('animate-pulse');
            expect(container.firstChild).not.toHaveClass('animate-[shimmer_1.5s_infinite]');
        });

        it('should render with custom test ID', () => {
            render(<Skeleton testId="custom-skeleton" />);
            expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
        });

        it('should have screen reader text', () => {
            render(<Skeleton />);
            expect(screen.getByText('Carregando...')).toBeInTheDocument();
        });
    });

    describe('SkeletonText', () => {
        it('should render default number of lines (3)', () => {
            const { container } = render(<SkeletonText />);
            const skeletons = container.querySelectorAll('[role="status"]');
            expect(skeletons).toHaveLength(3);
        });

        it('should render custom number of lines', () => {
            const { container } = render(<SkeletonText lines={5} />);
            const skeletons = container.querySelectorAll('[role="status"]');
            expect(skeletons).toHaveLength(5);
        });

        it('should render with custom width', () => {
            render(<SkeletonText width="100px" />);
            const firstSkeleton = screen.getAllByRole('status')[0];
            expect(firstSkeleton).toHaveStyle({ width: '100px' });
        });

        it('should render with custom className', () => {
            const { container } = render(<SkeletonText className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should render with custom test ID', () => {
            render(<SkeletonText testId="custom-skeleton-text" />);
            expect(screen.getByTestId('custom-skeleton-text')).toBeInTheDocument();
        });
    });

    describe('SkeletonAvatar', () => {
        it('should render with default size (md)', () => {
            const { container } = render(<SkeletonAvatar />);
            expect(container.firstChild).toHaveClass('w-12', 'h-12');
        });

        it('should render with small size', () => {
            const { container } = render(<SkeletonAvatar size="sm" />);
            expect(container.firstChild).toHaveClass('w-8', 'h-8');
        });

        it('should render with medium size', () => {
            const { container } = render(<SkeletonAvatar size="md" />);
            expect(container.firstChild).toHaveClass('w-12', 'h-12');
        });

        it('should render with large size', () => {
            const { container } = render(<SkeletonAvatar size="lg" />);
            expect(container.firstChild).toHaveClass('w-16', 'h-16');
        });

        it('should render with extra large size', () => {
            const { container } = render(<SkeletonAvatar size="xl" />);
            expect(container.firstChild).toHaveClass('w-24', 'h-24');
        });

        it('should render with custom className', () => {
            const { container } = render(<SkeletonAvatar className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should render with custom test ID', () => {
            render(<SkeletonAvatar testId="custom-avatar" />);
            expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
        });
    });

    describe('SkeletonCard', () => {
        it('should render card with avatar by default', () => {
            const { container } = render(<SkeletonCard />);
            const avatars = container.querySelectorAll('.rounded-full');
            expect(avatars).toHaveLength(1);
        });

        it('should render card without avatar', () => {
            const { container } = render(<SkeletonCard showAvatar={false} />);
            const avatars = container.querySelectorAll('.rounded-full');
            expect(avatars).toHaveLength(0);
        });

        it('should render with custom className', () => {
            const { container } = render(<SkeletonCard className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should render with custom test ID', () => {
            render(<SkeletonCard testId="custom-card" />);
            expect(screen.getByTestId('custom-card')).toBeInTheDocument();
        });

        it('should render card structure correctly', () => {
            const { container } = render(<SkeletonCard />);
            expect(container.firstChild).toHaveClass(
                'p-4',
                'border',
                'border-slate-200',
                'dark:border-slate-600',
                'rounded-lg'
            );
        });
    });

    describe('SkeletonTable', () => {
        it('should render default number of rows (5)', () => {
            const { container } = render(<SkeletonTable />);
            const rows = container.querySelectorAll('.flex');
            expect(rows).toHaveLength(5);
        });

        it('should render default number of columns (4)', () => {
            const { container } = render(<SkeletonTable />);
            const firstRow = container.querySelectorAll('.flex')[0];
            const skeletons = firstRow.querySelectorAll('[role="status"]');
            expect(skeletons).toHaveLength(4);
        });

        it('should render custom number of rows', () => {
            const { container } = render(<SkeletonTable rows={10} />);
            const rows = container.querySelectorAll('.flex');
            expect(rows).toHaveLength(10);
        });

        it('should render custom number of columns', () => {
            const { container } = render(<SkeletonTable columns={6} />);
            const firstRow = container.querySelectorAll('.flex')[0];
            const skeletons = firstRow.querySelectorAll('[role="status"]');
            expect(skeletons).toHaveLength(6);
        });

        it('should render with custom className', () => {
            const { container } = render(<SkeletonTable className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should render with custom test ID', () => {
            render(<SkeletonTable testId="custom-table" />);
            expect(screen.getByTestId('custom-table')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have role="status"', () => {
            render(<Skeleton />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('should have aria-label', () => {
            render(<Skeleton />);
            expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando');
        });

        it('should have screen reader text', () => {
            render(<Skeleton />);
            expect(screen.getByText('Carregando...')).toBeInTheDocument();
        });
    });
});
