/**
 * Test script to validate Empresas Supabase integration
 */

// Load environment variables from .env.local BEFORE importing anything
import './load-env';

// Now import services after environment is set
import { supabaseEmpresasService } from '../src/services/empresas/SupabaseEmpresasService';
import { supabaseAuthService } from '../src/services/auth/SupabaseAuthService';

async function testEmpresasIntegration() {
    console.log('🧪 Testing Empresas Supabase Integration...\n');

    // Test 1: Get all empresas
    console.log('Test 1: Get all empresas');
    const allEmpresas = await supabaseEmpresasService.getAll();
    console.log('Result:', allEmpresas.success ? '✅ Success' : '❌ Failed');
    if (allEmpresas.success) {
        console.log(`   Found ${allEmpresas.data?.length || 0} empresas`);
        if (allEmpresas.data && allEmpresas.data.length > 0) {
            console.log('   Sample empresa:', JSON.stringify(allEmpresas.data[0], null, 2));
        }
    } else {
        console.log('   Error:', allEmpresas.error);
    }
    console.log();

    // Test 2: Get empresas by status
    console.log('Test 2: Get empresas by status (Ativa)');
    const activeEmpresas = await supabaseEmpresasService.getByStatus('Ativa');
    console.log('Result:', activeEmpresas.success ? '✅ Success' : '❌ Failed');
    if (activeEmpresas.success) {
        console.log(`   Found ${activeEmpresas.data?.length || 0} active empresas`);
    } else {
        console.log('   Error:', activeEmpresas.error);
    }
    console.log();

    // Test 3: Search empresas
    console.log('Test 3: Search empresas');
    const searchResults = await supabaseEmpresasService.search('AMX');
    console.log('Result:', searchResults.success ? '✅ Success' : '❌ Failed');
    if (searchResults.success) {
        console.log(`   Found ${searchResults.data?.length || 0} matching empresas`);
    } else {
        console.log('   Error:', searchResults.error);
    }
    console.log();

    // Test 4: Get count by status
    console.log('Test 4: Get count by status');
    const counts = await supabaseEmpresasService.getCountByStatus();
    console.log('Result:', '✅ Success');
    console.log('   Counts:', counts);
    console.log();

    // Test 5: Test auth service
    console.log('Test 5: Test Auth Service (getCurrentSession)');
    try {
        const session = await supabaseAuthService.getCurrentSession();
        console.log('Result:', '✅ Success');
        console.log('   Session:', session ? 'Active' : 'No active session');
    } catch (error) {
        console.log('Result:', '❌ Failed');
        console.log('   Error:', error);
    }
    console.log();

    console.log('✨ All tests completed!');
}

// Run tests
testEmpresasIntegration().catch(console.error);
