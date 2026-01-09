/**
 * Load environment variables from .env.local
 * This must be imported before any other modules that use process.env
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');

    // Parse and set environment variables
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0 && !line.trim().startsWith('#')) {
            // Keep both VITE_ prefixed and non-prefixed versions
            const value = valueParts.join('=').trim();
            process.env[key] = value;
            if (key.startsWith('VITE_')) {
                const cleanKey = key.replace('VITE_', '');
                process.env[cleanKey] = value;
            }
        }
    });

    console.log('✅ Environment variables loaded from .env.local');
} else {
    console.log('⚠️  .env.local file not found');
}
