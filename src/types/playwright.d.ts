/**
 * Type declarations for Playwright
 * Provides global test functions and page objects
 */

declare namespace PlaywrightTest {
    interface TestInfo {
        retry: number;
        parallelIndex: number;
        project: {
            name: string;
            use: any;
        };
    }
}

declare const test: typeof import('@playwright/test').test;
declare const expect: typeof import('@playwright/test').expect;
