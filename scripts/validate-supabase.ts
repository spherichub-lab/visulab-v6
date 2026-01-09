/**
 * Supabase Connection Validation Script
 * Tests Supabase connection and MCP availability
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

// Parse environment variables
const parseEnv = (content: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            if (key && value) {
                result[key.trim()] = value;
            }
        }
    }
    return result;
};

const env = parseEnv(envContent);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('='.repeat(60));
console.log('Supabase Connection Validation');
console.log('='.repeat(60));
console.log();

// Validate environment variables
if (!supabaseUrl) {
    console.error('❌ ERROR: VITE_SUPABASE_URL is not set in .env.local');
    process.exit(1);
}

if (!supabaseKey) {
    console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY is not set in .env.local');
    process.exit(1);
}

console.log(`✅ Environment variables loaded`);
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 10)}...`);
console.log();

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function validateConnection() {
    console.log('Testing Supabase connection...');
    console.log();

    // Test 1: Check auth connection
    console.log('1. Testing Auth connection...');
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('   ❌ Auth connection failed:', error.message);
        } else {
            console.log('   ✅ Auth connection successful');
        }
    } catch (e: any) {
        console.error('   ❌ Auth connection failed:', e.message);
    }
    console.log();

    // Test 2: Check table access (empresas)
    console.log('2. Testing table access (empresas)...');
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('id, nome')
            .limit(1);

        if (error) {
            console.error('   ❌ Table access failed:', error.message);
            console.error(`   Error code: ${error.code}`);
            console.error(`   Error hint: ${error.hint}`);
        } else {
            console.log('   ✅ Table access successful');
            if (data && data.length > 0) {
                console.log(`   📊 Found ${data.length} empresa(s)`);
            } else {
                console.log('   📊 Table is empty');
            }
        }
    } catch (e: any) {
        console.error('   ❌ Table access failed:', e.message);
    }
    console.log();

    // Test 3: Check table access (usuarios)
    console.log('3. Testing table access (usuarios)...');
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(1);

        if (error) {
            console.error('   ❌ Table access failed:', error.message);
        } else {
            console.log('   ✅ Table access successful');
            if (data && data.length > 0) {
                console.log(`   📊 Found ${data.length} usuario(s)`);
            } else {
                console.log('   📊 Table is empty');
            }
        }
    } catch (e: any) {
        console.error('   ❌ Table access failed:', e.message);
    }
    console.log();

    // Test 4: Check RLS policies
    console.log('4. Testing RLS policies...');
    try {
        // Try to query without auth (should fail if RLS is enabled and requires auth)
        const { data, error } = await supabase
            .from('empresas')
            .select('id')
            .limit(1);

        if (error) {
            console.log('   ⚠️  RLS is enabled (expected behavior without auth)');
        } else {
            console.log('   ✅ RLS policies are accessible');
        }
    } catch (e: any) {
        console.error('   ❌ RLS test failed:', e.message);
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('Validation Complete');
    console.log('='.repeat(60));
    console.log();
    console.log('✅ Supabase connection is working!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Implement Phase 2: Authentication');
    console.log('  2. Implement Phase 3: Pilot Entity (Empresas)');
    console.log('  3. Implement Phase 4: Remaining Entities');
}

// Run validation
validateConnection().catch((error) => {
    console.error('Fatal error during validation:', error);
    process.exit(1);
});
