/**
 * Type declarations for Vitest
 * Provides global test functions and matchers
 */

declare namespace Vi {
    interface MockInstance<TArgs extends any[] = any[], TReturn = any> {
        (...args: TArgs): TReturn;
        getMockName(): string;
        mockClear(): this;
        mockReset(): this;
        mockRestore(): this;
        getMockImplementation(): ((...args: TArgs) => TReturn) | undefined;
        mockImplementation(fn: (...args: TArgs) => TReturn): this;
        mockImplementationOnce(fn: (...args: TArgs) => TReturn): this;
        mockName(name: string): this;
        mockReturnThis(): this;
        mockReturnValue(value: TReturn): this;
        mockReturnValueOnce(value: TReturn): this;
        mockResolvedValue(value: TReturn): this;
        mockResolvedValueOnce(value: TReturn): this;
        mockRejectedValue(value: any): this;
        mockRejectedValueOnce(value: any): this;
        _isMockFunction: true;
        _mockImplementation: ((...args: TArgs) => TReturn) | undefined;
        _mockInstances: any[];
        _mockCalls: TArgs[];
        _mockResultValues: TReturn[];
    }

    interface SpyInstance extends MockInstance { }
}

declare const describe: typeof import('vitest').describe;
declare const it: typeof import('vitest').it;
declare const test: typeof import('vitest').test;
declare const expect: typeof import('vitest').expect;
declare const vi: typeof import('vitest').vi;
declare const beforeEach: typeof import('vitest').beforeEach;
declare const afterEach: typeof import('vitest').afterEach;
declare const beforeAll: typeof import('vitest').beforeAll;
declare const afterAll: typeof import('vitest').afterAll;
