/**
 * Test setup file
 * Global test configuration and mocks
 */

import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock window.addEventListener before any imports to prevent side effects
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

window.addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    return originalAddEventListener.call(window, type, listener);
});

window.removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    return originalRemoveEventListener.call(window, type, listener);
});


// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
} as any;

// Mock BroadcastChannel
const mockBroadcastChannels = new Map<string, any>();

class MockBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onmessageerror: ((event: Event) => void) | null = null;
    on: string = 'message';

    constructor(name: string) {
        this.name = name;
        mockBroadcastChannels.set(name, this);
    }

    postMessage(message: any) {
        mockBroadcastChannels.forEach((channel, channelName) => {
            if (channelName === this.name && channel !== this) {
                channel.postMessage(message);
            }
        });
    }

    addEventListener(type: string, listener: any) {
        if (type === 'message') {
            this.onmessage = listener;
        }
    }

    removeEventListener(type: string, listener: any) {
        if (type === 'message' && this.onmessage === listener) {
            this.onmessage = null;
        }
    }

    close() {
        mockBroadcastChannels.delete(this.name);
        this.onmessage = null;
    }

    static reset() {
        mockBroadcastChannels.clear();
    }
}

global.BroadcastChannel = MockBroadcastChannel as any;

// Mock React act
global.act = (callback: any) => {
    callback();
    return {
        then: (cb: any) => cb(),
        catch: (cb: any) => { },
    };
};

// Clear all mocks and timers after each test
afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    MockBroadcastChannel.reset();
});
