/**
 * Fix Regular Users auth_user_id
 * 
 * This script helps populate the auth_user_id field for regular users
 * by matching their email with Supabase Auth users.
 * 
 * Run with: npx tsx scripts/fix-regular-users-auth-user-id.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

interface User {
    id: string;
    email: string;
    nome: string;
    role: string;
    empresa_id: string | null;
    auth_user_id: string | null;
}

interface AuthUser {
    id: string;
    email: string;
    created_at: string;
}

async function main() {
    console.log('🔍 [FIX AUTH USER ID] Starting...');
    console.log('');

    // Step 1: Fetch all users from usuarios table
    console.log('📋 [STEP 1] Fetching users from usuarios table...');
    const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, email, nome, role, empresa_id, auth_user_id')
        .order('email');

    if (usuariosError) {
        console.error('❌ Error fetching usuarios:', usuariosError);
        process.exit(1);
    }

    if (!usuarios || usuarios.length === 0) {
        console.log('⚠️  No users found in usuarios table');
        process.exit(0);
    }

    console.log(`✅ Found ${usuarios.length} users in usuarios table`);
    console.log('');

    // Step 2: Identify users missing auth_user_id
    const usersMissingAuthUserId = usuarios.filter(u => !u.auth_user_id);

    if (usersMissingAuthUserId.length === 0) {
        console.log('✅ All users have auth_user_id populated');
        process.exit(0);
    }

    console.log(`⚠️  Found ${usersMissingAuthUserId.length} users missing auth_user_id:`);
    usersMissingAuthUserId.forEach(u => {
        console.log(`   - ${u.email} (${u.nome})`);
    });
    console.log('');

    // Step 3: Fetch auth users from Supabase Auth
    console.log('📋 [STEP 2] Fetching users from Supabase Auth...');

    // Note: This requires service_role key to access auth.users
    // If you don't have service_role key, you'll need to manually update
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found');
        console.log('📝 Manual fix instructions:');
        console.log('');
        console.log('1. Go to Supabase Dashboard > Authentication > Users');
        console.log('2. For each user, copy their UUID (id)');
        console.log('3. Run the following SQL for each user:');
        console.log('');
        usersMissingAuthUserId.forEach(u => {
            console.log(`   UPDATE usuarios`);
            console.log(`   SET auth_user_id = 'PASTE_UUID_HERE'`);
            console.log(`   WHERE email = '${u.email}';`);
            console.log('');
        });
        process.exit(0);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authUsers, error: authError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, created_at')
        .order('email');

    if (authError) {
        console.error('❌ Error fetching auth.users:', authError);
        console.log('⚠️  You may not have permission to access auth.users');
        console.log('📝 Please follow manual fix instructions above');
        process.exit(1);
    }

    if (!authUsers || authUsers.length === 0) {
        console.log('⚠️  No users found in auth.users');
        process.exit(0);
    }

    console.log(`✅ Found ${authUsers.length} users in auth.users`);
    console.log('');

    // Step 4: Match and update users
    console.log('📋 [STEP 3] Matching and updating users...');
    console.log('');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const usuario of usersMissingAuthUserId) {
        const authUser = authUsers.find(au => au.email === usuario.email);

        if (authUser) {
            console.log(`✅ Found match for ${usuario.email}:`);
            console.log(`   Auth UUID: ${authUser.id}`);

            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ auth_user_id: authUser.id })
                .eq('id', usuario.id);

            if (updateError) {
                console.error(`   ❌ Error updating:`, updateError);
            } else {
                console.log(`   ✅ Updated auth_user_id for ${usuario.email}`);
                updatedCount++;
            }
        } else {
            console.log(`⚠️  No auth user found for ${usuario.email}`);
            notFoundCount++;
        }
        console.log('');
    }

    // Step 5: Summary
    console.log('📊 [SUMMARY]');
    console.log(`   Total users processed: ${usersMissingAuthUserId.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Not found in auth: ${notFoundCount}`);
    console.log('');

    // Step 6: Verify
    console.log('📋 [STEP 4] Verifying updates...');
    const { data: updatedUsuarios, error: verifyError } = await supabase
        .from('usuarios')
        .select('id, email, nome, role, empresa_id, auth_user_id')
        .order('email');

    if (verifyError) {
        console.error('❌ Error verifying updates:', verifyError);
        process.exit(1);
    }

    console.log('');
    console.log('📋 Current user status:');
    console.log('');

    const stillMissing = updatedUsuarios?.filter(u => !u.auth_user_id) || [];

    updatedUsuarios?.forEach(u => {
        const status = u.auth_user_id ? '✅ OK' : '❌ MISSING';
        const company = u.empresa_id ? '✅' : '❌';
        const visibility = u.role === 'Administrador'
            ? 'ALL DATA'
            : (u.empresa_id ? 'COMPANY DATA' : 'NO DATA');

        console.log(`${status} ${u.email} (${u.nome})`);
        console.log(`   Role: ${u.role}`);
        console.log(`   empresa_id: ${company} ${u.empresa_id || 'NULL'}`);
        console.log(`   auth_user_id: ${u.auth_user_id || 'NULL'}`);
        console.log(`   Expected visibility: ${visibility}`);
        console.log('');
    });

    if (stillMissing.length > 0) {
        console.log('⚠️  Some users still missing auth_user_id:');
        stillMissing.forEach(u => {
            console.log(`   - ${u.email}`);
        });
        console.log('');
        console.log('📝 These users may need to be created in Supabase Auth first');
    }

    console.log('✅ [DONE]');
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
