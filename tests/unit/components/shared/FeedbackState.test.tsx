/**
 * FeedbackState component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackState } from '@/components/shared/FeedbackState';

// Mock LoadingSpinner
const LoadingSpinner = ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message || 'Loading...'}</div>
);

// Mock Icon
const Icon = ({ name }: { name: string }) => <div data-testid={`icon-${name}`}>Icon</div>;

// Mock Button
const Button = ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="button">
        {children}
    </button>
);

describe('FeedbackState', () => {
    describe('Loading state', () => {
        it('should render loading state with default title', () => {
            render(<FeedbackState type="loading" />);
            expect(screen.getByText(/carregando/i)).toBeInTheDocument();
        });

        it('should render loading state with custom title', () => {
            render(<FeedbackState type="loading" title="Carregando dados..." />);
            expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
        });

        it('should render loading state with description', () => {
            render(
                <FeedbackState type="loading" description="Por favor, aguarde." />
            );
            expect(screen.getByText('Por favor, aguarde.')).toBeInTheDocument();
        });
    });

    describe('Empty state', () => {
        it('should render empty state with default title', () => {
            render(<FeedbackState type="empty" />);
            expect(screen.getByText(/nenhum dado encontrado/i)).toBeInTheDocument();
        });

        it('should render empty state with action', () => {
            const action = { label: 'Criar', onClick: vi.fn() };
            render(<FeedbackState type="empty" action={action} />);
            expect(screen.getByText('Criar')).toBeInTheDocument();
        });

        it('should call action onClick', () => {
            const action = { label: 'Criar', onClick: vi.fn() };
            render(<FeedbackState type="empty" action={action} />);

            const button = screen.getByText('Criar');
            fireEvent.click(button);

            expect(action.onClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error state', () => {
        it('should render error state with default title', () => {
            render(<FeedbackState type="error" />);
            expect(screen.getByText(/ocorreu um erro/i)).toBeInTheDocument();
        });

        it('should render error state with error message', () => {
            const error = { message: 'Test error message' } as Error;
            render(<FeedbackState type="error" error={error} />);
            expect(screen.getByText('Test error message')).toBeInTheDocument();
        });

        it('should render retry button when onRetry is provided', () => {
            const onRetry = vi.fn();
            render(<FeedbackState type="error" onRetry={onRetry} />);

            expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
        });

        it('should call onRetry when retry button is clicked', () => {
            const onRetry = vi.fn();
            render(<FeedbackState type="error" onRetry={onRetry} />);

            const button = screen.getByRole('button', { name: /tentar novamente/i });
            fireEvent.click(button);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should render custom retry text', () => {
            const onRetry = vi.fn();
            render(
                <FeedbackState type="error" onRetry={onRetry} retryText="Recarregar" />
            );

            expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument();
        });
    });

    describe('Success state', () => {
        it('should render success state with default title', () => {
            render(<FeedbackState type="success" />);
            expect(screen.getByText(/operação concluída/i)).toBeInTheDocument();
        });

        it('should render success state with custom title', () => {
            render(<FeedbackState type="success" title="Sucesso!" />);
            expect(screen.getByText('Sucesso!')).toBeInTheDocument();
        });
    });

    describe('Warning state', () => {
        it('should render warning state with default title', () => {
            render(<FeedbackState type="warning" />);
            expect(screen.getByText(/atenção/i)).toBeInTheDocument();
        });
    });

    describe('Info state', () => {
        it('should render info state with default title', () => {
            render(<FeedbackState type="info" />);
            expect(screen.getByText(/informação/i)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have alert role for error state', () => {
            render(<FeedbackState type="error" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('should have status role for non-error states', () => {
            render(<FeedbackState type="loading" />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('should have aria-live assertive for error', () => {
            render(<FeedbackState type="error" />);
            const container = screen.getByRole('alert');
            expect(container).toHaveAttribute('aria-live', 'assertive');
        });

        it('should have aria-live polite for non-error', () => {
            render(<FeedbackState type="loading" />);
            const container = screen.getByRole('status');
            expect(container).toHaveAttribute('aria-live', 'polite');
        });
    });

    describe('Size variants', () => {
        it('should render small size', () => {
            const { container } = render(<FeedbackState type="loading" size="sm" />);
            expect(container.firstChild).toHaveClass('py-8');
        });

        it('should render medium size (default)', () => {
            const { container } = render(<FeedbackState type="loading" size="md" />);
            expect(container.firstChild).toHaveClass('py-12');
        });

        it('should render large size', () => {
            const { container } = render(<FeedbackState type="loading" size="lg" />);
            expect(container.firstChild).toHaveClass('py-16');
        });
    });

    describe('Variant types', () => {
        it('should render inline variant', () => {
            const { container } = render(
                <FeedbackState type="loading" variant="inline" />
            );
            expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-3', 'text-sm');
        });

        it('should render full variant (default)', () => {
            const { container } = render(
                <FeedbackState type="loading" variant="full" />
            );
            expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
        });

        it('should render modal variant', () => {
            const { container } = render(
                <FeedbackState type="loading" variant="modal" />
            );
            expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'p-8');
        });

        it('should render card variant', () => {
            const { container } = render(
                <FeedbackState type="loading" variant="card" />
            );
            expect(container.firstChild).toHaveClass(
                'flex',
                'flex-col',
                'items-center',
                'justify-center',
                'p-6',
                'border',
                'rounded-lg'
            );
        });
    });

    describe('Custom icon', () => {
        it('should render custom icon', () => {
            render(<FeedbackState type="loading" icon="custom_icon" />);
            expect(screen.getByTestId('icon-custom_icon')).toBeInTheDocument();
        });
    });

    describe('Test ID', () => {
        it('should render with custom test ID', () => {
            render(<FeedbackState type="loading" testId="custom-test-id" />);
            expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
        });
    });
});
