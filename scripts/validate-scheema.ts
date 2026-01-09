/**
 * Validation Script for scheema-sql.json
 * 
 * This script compares the data in scheema-sql.json with the actual
 * data in the Supabase database to verify consistency.
 * 
 * Usage: npm run validate:scheema
 *        tsx scripts/validate-scheema.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import './load-env';

// Configuration
const SCHEEMA_JSON_PATH = join(process.cwd(), 'scheema-sql.json');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validation
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions
interface ScheemaData {
    export_all_public_tables: {
        tipos: Tipo[];
        indices: Indice[];
        tratamentos: Tratamento[];
        empresas: Empresa[];
        usuarios: Usuario[];
        compras: Compra[];
        faltas: Falta[];
    };
}

interface Tipo {
    id: string;
    nome: string;
    created_at: string;
}

interface Indice {
    id: string;
    nome: string;
    created_at: string;
}

interface Tratamento {
    id: string;
    nome: string;
    created_at: string;
}

interface Empresa {
    id: string;
    nome: string;
    tipo: string;
    status: string;
    contato_nome?: string | null;
    contato_email?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface Usuario {
    id: string;
    nome: string;
    email: string;
    role: string;
    status: string;
    empresa_id: string;
    last_active?: string;
    avatar_url?: string | null;
    initials?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface Compra {
    id: string;
    fornecedor: string;
    data_compra: string;
    valor_total: number;
    status: string;
    descricao?: string;
    created_at: string;
    updated_at: string;
}

interface Falta {
    id: string;
    cil: number;
    esf: number;
    tipo_id: string;
    indice_id: string;
    tratamento_id: string;
    empresa_id?: string | null;
    quantidade: number;
    usuario_id: string;
    created_at: string;
    updated_at: string;
}

// Validation results
interface ValidationResult {
    table: string;
    jsonCount: number;
    dbCount: number;
    match: boolean;
    missingInDb: string[];
    extraInDb: string[];
    details?: string[];
}

const results: Record<string, ValidationResult> = {};

// Helper functions
function logValidation(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const colors = {
        info: '\x1b[36m',     // Cyan
        success: '\x1b[32m',  // Green
        warning: '\x1b[33m',  // Yellow
        error: '\x1b[31m'     // Red
    };
    const reset = '\x1b[0m';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${colors[type]}${icon} ${message}${reset}`);
}

// Validation functions
function validateScheemaStructure(data: any): data is ScheemaData {
    if (!Array.isArray(data) || data.length === 0) {
        console.error('❌ Invalid JSON structure: Expected array with one element');
        return false;
    }

    const root = data[0];
    if (!root.export_all_public_tables) {
        console.error('❌ Invalid JSON structure: Missing export_all_public_tables');
        return false;
    }

    const tables = root.export_all_public_tables;
    const requiredTables = ['tipos', 'indices', 'tratamentos', 'empresas', 'usuarios', 'compras', 'faltas'];

    for (const table of requiredTables) {
        if (!Array.isArray(tables[table])) {
            console.error(`❌ Invalid JSON structure: Missing or invalid table '${table}'`);
            return false;
        }
    }

    return true;
}

async function fetchTableData(tableName: string): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        logValidation(`Failed to fetch ${tableName}: ${error.message}`, 'error');
        return [];
    }
}

function compareRecords(jsonRecords: any[], dbRecords: any[], tableName: string): ValidationResult {
    const jsonIds = new Set(jsonRecords.map(r => r.id));
    const dbIds = new Set(dbRecords.map(r => r.id));

    const missingInDb = jsonRecords.filter(r => !dbIds.has(r.id)).map(r => r.id);
    const extraInDb = dbRecords.filter(r => !jsonIds.has(r.id)).map(r => r.id);

    const details: string[] = [];

    // Check for specific field differences
    if (missingInDb.length === 0 && extraInDb.length === 0) {
        // All IDs match, check field values
        for (const jsonRecord of jsonRecords) {
            const dbRecord = dbRecords.find(r => r.id === jsonRecord.id);
            if (dbRecord) {
                const fieldDiffs = compareFields(jsonRecord, dbRecord, tableName);
                if (fieldDiffs.length > 0) {
                    details.push(`ID ${jsonRecord.id}: ${fieldDiffs.join(', ')}`);
                }
            }
        }
    }

    return {
        table: tableName,
        jsonCount: jsonRecords.length,
        dbCount: dbRecords.length,
        match: jsonRecords.length === dbRecords.length && missingInDb.length === 0 && extraInDb.length === 0 && details.length === 0,
        missingInDb,
        extraInDb,
        details: details.length > 0 ? details : undefined
    };
}

function compareFields(jsonRecord: any, dbRecord: any, tableName: string): string[] {
    const diffs: string[] = [];

    // Fields to compare (exclude timestamp fields for now as they may differ)
    const fieldsToCompare: Record<string, string[]> = {
        'tipos': ['nome'],
        'indices': ['nome'],
        'tratamentos': ['nome'],
        'empresas': ['nome', 'tipo', 'status'],
        'usuarios': ['nome', 'email', 'role', 'status', 'empresa_id'],
        'compras': ['fornecedor', 'data_compra', 'valor_total', 'status', 'descricao'],
        'faltas': ['cil', 'esf', 'tipo_id', 'indice_id', 'tratamento_id', 'empresa_id', 'quantidade', 'usuario_id']
    };

    const fields = fieldsToCompare[tableName] || [];

    for (const field of fields) {
        const jsonValue = jsonRecord[field];
        const dbValue = dbRecord[field];

        if (jsonValue !== dbValue) {
            diffs.push(`${field}: JSON="${jsonValue}" vs DB="${dbValue}"`);
        }
    }

    return diffs;
}

// Generate validation report
function generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 VALIDATION REPORT');
    console.log('='.repeat(80) + '\n');

    let allMatch = true;
    let totalJsonRecords = 0;
    let totalDbRecords = 0;

    Object.values(results).forEach(result => {
        totalJsonRecords += result.jsonCount;
        totalDbRecords += result.dbCount;

        console.log(`\n📊 ${result.table.toUpperCase()}`);
        console.log(`   JSON Records: ${result.jsonCount}`);
        console.log(`   DB Records: ${result.dbCount}`);
        console.log(`   Match: ${result.match ? '✅ YES' : '❌ NO'}`);

        if (result.missingInDb.length > 0) {
            console.log(`   ⚠️  Missing in DB (${result.missingInDb.length}): ${result.missingInDb.slice(0, 3).join(', ')}${result.missingInDb.length > 3 ? '...' : ''}`);
        }

        if (result.extraInDb.length > 0) {
            console.log(`   ⚠️  Extra in DB (${result.extraInDb.length}): ${result.extraInDb.slice(0, 3).join(', ')}${result.extraInDb.length > 3 ? '...' : ''}`);
        }

        if (result.details && result.details.length > 0) {
            console.log(`   ⚠️  Field Differences (${result.details.length}):`);
            result.details.slice(0, 3).forEach(detail => {
                console.log(`      - ${detail}`);
            });
            if (result.details.length > 3) {
                console.log(`      ... and ${result.details.length - 3} more`);
            }
        }

        if (!result.match) {
            allMatch = false;
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total JSON Records: ${totalJsonRecords}`);
    console.log(`Total DB Records: ${totalDbRecords}`);
    console.log(`All Tables Match: ${allMatch ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(80) + '\n');

    if (allMatch) {
        console.log('🎉 All data in scheema-sql.json matches the database!');
        console.log('✅ The application should work correctly with the current database.');
    } else {
        console.log('⚠️  Some discrepancies found between scheema-sql.json and database.');
        console.log('ℹ️  This may indicate:');
        console.log('   - The database has been modified since the JSON was exported');
        console.log('   - Some records are missing or added in the database');
        console.log('   - Field values have been updated');
        console.log('\n💡 Recommendations:');
        console.log('   - Review the discrepancies above');
        console.log('   - Update scheema-sql.json if needed');
        console.log('   - Or use the import script to sync data: npm run import:scheema');
    }
}

// Main function
async function main() {
    console.log('🔍 Starting validation of scheema-sql.json...\n');

    try {
        // Read and parse JSON file
        console.log('📖 Reading scheema-sql.json...');
        const jsonContent = readFileSync(SCHEEMA_JSON_PATH, 'utf-8');
        const jsonData = JSON.parse(jsonContent);

        // Validate structure
        console.log('🔍 Validating JSON structure...');
        if (!validateScheemaStructure(jsonData)) {
            console.error('❌ JSON validation failed');
            process.exit(1);
        }
        console.log('✅ JSON structure is valid\n');

        const data = jsonData[0].export_all_public_tables;

        // Test Supabase connection
        console.log('🔌 Testing Supabase connection...');
        const { error: connectionError } = await supabase.from('tipos').select('id').limit(1);
        if (connectionError) {
            console.error('❌ Failed to connect to Supabase:', connectionError.message);
            process.exit(1);
        }
        console.log('✅ Supabase connection successful\n');

        // Validate each table
        console.log('📊 Validating tables...\n');

        // 1. tipos
        logValidation('Validating tipos...', 'info');
        const dbTipos = await fetchTableData('tipos');
        results['tipos'] = compareRecords(data.tipos, dbTipos, 'tipos');

        // 2. indices
        logValidation('Validating indices...', 'info');
        const dbIndices = await fetchTableData('indices');
        results['indices'] = compareRecords(data.indices, dbIndices, 'indices');

        // 3. tratamentos
        logValidation('Validating tratamentos...', 'info');
        const dbTratamentos = await fetchTableData('tratamentos');
        results['tratamentos'] = compareRecords(data.tratamentos, dbTratamentos, 'tratamentos');

        // 4. empresas
        logValidation('Validating empresas...', 'info');
        const dbEmpresas = await fetchTableData('empresas');
        results['empresas'] = compareRecords(data.empresas, dbEmpresas, 'empresas');

        // 5. usuarios
        logValidation('Validating usuarios...', 'info');
        const dbUsuarios = await fetchTableData('usuarios');
        results['usuarios'] = compareRecords(data.usuarios, dbUsuarios, 'usuarios');

        // 6. compras
        logValidation('Validating compras...', 'info');
        const dbCompras = await fetchTableData('compras');
        results['compras'] = compareRecords(data.compras, dbCompras, 'compras');

        // 7. faltas
        logValidation('Validating faltas...', 'info');
        const dbFaltas = await fetchTableData('faltas');
        results['faltas'] = compareRecords(data.faltas, dbFaltas, 'faltas');

        // Generate report
        generateReport();

        console.log('\n✅ Validation process completed!\n');

    } catch (error: any) {
        console.error('\n❌ Fatal error during validation:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run script
main();
