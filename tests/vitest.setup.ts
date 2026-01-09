/**
 * Vitest setup file for module mocking
 * This file is loaded before any test files to set up mocks
 * Note: Module mocks are now in tests/setup-globals.ts to prevent side effects
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK BROADCAST CHANNEL
// ============================================================================

type MessageEventListener = (event: MessageEvent) => void;

class MockBroadcastChannel {
    name: string;
    listeners: Map<string, Set<MessageEventListener>>;

    constructor(name: string) {
        this.name = name;
        this.listeners = new Map();
    }

    addEventListener(type: string, listener: MessageEventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
    }

    removeEventListener(type: string, listener: MessageEventListener): void {
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            typeListeners.delete(listener);
        }
    }

    postMessage(message: any): void {
        const messageListeners = this.listeners.get('message');
        if (messageListeners) {
            const event = new MessageEvent('message', {
                data: message,
                origin: 'mock-origin',
                source: this as any,
            });
            messageListeners.forEach(listener => listener(event));
        }
    }

    close(): void {
        this.listeners.clear();
    }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
