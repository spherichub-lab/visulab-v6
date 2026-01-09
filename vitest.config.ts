/**
 * Vitest configuration
 * Unit and integration test configuration for VisuLab
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup-globals.ts', './tests/vitest.setup.ts', './tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        exclude: [
            'node_modules/',
            'dist/',
            '.idea/',
            '.git/',
            '.cache/',
            'tests/e2e/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.config.*',
                '**/*.d.ts',
                '**/index.ts',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
            all: true,
            lines: 70,
            functions: 70,
            branches: 60,
            statements: 70,
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@tests': path.resolve(__dirname, 'tests'),
        },
    },
});
