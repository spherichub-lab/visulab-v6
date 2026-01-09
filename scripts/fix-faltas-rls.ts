/**
 * Fix Faltas RLS Policies for Admin Users
 * 
 * This script updates the RLS policies to allow admin users to create faltas
 * even when they have empresa_id = NULL (matriz admins)
 */

import { supabase } from '../lib/supabase';

async function fixFaltasRLS() {
    console.log('🔧 Starting Faltas RLS fix...');

    try {
        // Read the SQL file
        const sqlContent = `
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Admins can create faltas for any company" ON faltas;
DROP POLICY IF EXISTS "Users can create faltas for their company" ON faltas;

-- Create new INSERT policy for admins that doesn't require empresa_id match
CREATE POLICY "Admins can create faltas for any company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Create new INSERT policy for regular users that requires empresa_id match
CREATE POLICY "Users can create faltas for their company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id
    )
);
    `;

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ Failed to execute SQL:', error);
            throw error;
        }

        console.log('✅ Faltas RLS policies updated successfully!');
        console.log('📝 Changes made:');
        console.log('   - Admin users can now create faltas regardless of empresa_id');
        console.log('   - Regular users still need empresa_id matching');

        // Verify the changes
        console.log('\n🔍 Verifying policies...');
        const { data: policies, error: verifyError } = await supabase
            .rpc('get_policies', { table_name: 'faltas' });

        if (verifyError) {
            console.warn('⚠️  Could not verify policies:', verifyError.message);
        } else {
            console.log('✅ Current INSERT policies for faltas table:');
            policies?.forEach((policy: any) => {
                if (policy.cmd === 'INSERT') {
                    console.log(`   - ${policy.policyname}`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Error fixing Faltas RLS:', error);
        throw error;
    }
}

// Run the fix
fixFaltasRLS()
    .then(() => {
        console.log('\n✨ Fix completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fix failed:', error);
        process.exit(1);
    });
