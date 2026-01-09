/**
 * Seed database with minimal test data
 * Run with: npm run seed:db
 */

import { createClient } from '@supabase/supabase-js';
import './load-env';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Seed data
const seedData = {
    indices: [
        { id: 'idx-1', nome: '1.50' },
        { id: 'idx-2', nome: '1.56' },
        { id: 'idx-3', nome: '1.60' },
        { id: 'idx-4', nome: '1.67' },
        { id: 'idx-5', nome: '1.74' },
    ],
    tipos: [
        { id: 'tipo-1', nome: 'Incolor' },
        { id: 'tipo-2', nome: 'Photo' },
        { id: 'tipo-3', nome: 'Blue Cut' },
    ],
    tratamientos: [
        { id: 'trat-1', nome: 'Antirreflexo' },
        { id: 'trat-2', nome: 'Antirrisco' },
        { id: 'trat-3', nome: 'Antirreflexo + Antirrisco' },
        { id: 'trat-4', nome: 'Photochromic' },
        { id: 'trat-5', nome: 'Blue Cut' },
    ],
    empresas: [
        { id: 'emp-1', nome: 'VisuLab Matriz', tipo: 'Matriz', contato_nome: 'João Silva', contato_email: 'contato@visulab.com', status: 'Ativa' },
        { id: 'emp-2', nome: 'VisuLab Filial Centro', tipo: 'Filial', contato_nome: 'Maria Santos', contato_email: 'centro@visulab.com', status: 'Ativa' },
        { id: 'emp-3', nome: 'Essilor International', tipo: 'Fornecedor', contato_nome: 'Carlos Oliveira', contato_email: 'vendas@essilor.com', status: 'Ativa' },
    ],
    usuarios: [
        { id: 'usr-1', nome: 'Administrador Sistema', email: 'admin@visulab.com', empresa_id: 'emp-1', role: 'admin', status: 'Active', initials: 'AS' },
        { id: 'usr-2', nome: 'João Silva', email: 'joao@visulab.com', empresa_id: 'emp-1', role: 'user', status: 'Active', initials: 'JS' },
        { id: 'usr-3', nome: 'Maria Santos', email: 'maria@visulab.com', empresa_id: 'emp-2', role: 'user', status: 'Active', initials: 'MS' },
    ],
    compras: [
        { id: 'comp-1', fornecedor: 'Essilor International', data_compra: '2026-01-01', valor_total: 5000.00, status: 'Pago', descricao: '100x Lentes 1.50 Incolor Antirreflexo' },
        { id: 'comp-2', fornecedor: 'Hoya Corporation', data_compra: '2026-01-02', valor_total: 3500.00, status: 'Pago', descricao: '50x Lentes 1.56 Photo' },
        { id: 'comp-3', fornecedor: 'Zeiss Vision', data_compra: '2026-01-03', valor_total: 7500.00, status: 'Pendente', descricao: '150x Lentes 1.67 Blue Cut' },
    ],
    faltas: [
        { id: 'fal-1', usuario_id: 'usr-2', empresa_id: 'emp-1', tipo_id: 'tipo-1', indice_id: 'idx-2', tratamiento_id: 'trat-1', esf: -1.50, cil: -0.75, quantidade: 2 },
        { id: 'fal-2', usuario_id: 'usr-2', empresa_id: 'emp-1', tipo_id: 'tipo-2', indice_id: 'idx-3', tratamiento_id: 'trat-4', esf: -2.00, cil: -1.00, quantidade: 1 },
        { id: 'fal-3', usuario_id: 'usr-3', empresa_id: 'emp-2', tipo_id: 'tipo-1', indice_id: 'idx-2', tratamiento_id: 'trat-1', esf: -1.00, cil: -0.50, quantidade: 3 },
        { id: 'fal-4', usuario_id: 'usr-3', empresa_id: 'emp-2', tipo_id: 'tipo-3', indice_id: 'idx-4', tratamiento_id: 'trat-5', esf: -3.00, cil: -1.50, quantidade: 1 },
        { id: 'fal-5', usuario_id: 'usr-2', empresa_id: 'emp-1', tipo_id: 'tipo-2', indice_id: 'idx-5', tratamiento_id: 'trat-3', esf: -4.00, cil: -2.00, quantidade: 2 },
    ],
};

async function seedTable(tableName: string, data: any[]) {
    console.log(`\n📊 Seeding ${tableName}...`);

    for (const item of data) {
        const { error } = await supabase
            .from(tableName)
            .upsert(item, { onConflict: 'id' });

        if (error) {
            console.error(`  ❌ Error inserting ${tableName} item ${item.id}:`, error.message);
        } else {
            console.log(`  ✅ Inserted ${tableName} item: ${item.id}`);
        }
    }
}

async function main() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Seed reference tables first (no dependencies)
        await seedTable('indices', seedData.indices);
        await seedTable('tipos', seedData.tipos);
        await seedTable('tratamientos', seedData.tratamientos);

        // Seed empresas (no dependencies)
        await seedTable('empresas', seedData.empresas);

        // Seed usuarios (depends on empresas)
        await seedTable('usuarios', seedData.usuarios);

        // Seed compras (no dependencies)
        await seedTable('compras', seedData.compras);

        // Seed faltas (depends on usuarios, empresas, tipos, indices, tratamientos)
        await seedTable('faltas', seedData.faltas);

        console.log('\n✅ Database seed completed successfully!\n');
        console.log('Test Credentials:');
        console.log('  Admin: admin@visulab.com (empresa: VisuLab Matriz)');
        console.log('  User 1: joao@visulab.com (empresa: VisuLab Matriz)');
        console.log('  User 2: maria@visulab.com (empresa: VisuLab Filial Centro)\n');
    } catch (error) {
        console.error('\n❌ Error during seed:', error);
        process.exit(1);
    }
}

main();
