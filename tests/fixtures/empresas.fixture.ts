/**
 * Minimal fixture for empresas (companies)
 * Used by E2E tests to ensure test data availability
 */

export const empresasFixture = [
    {
        id: '1',
        nome: 'Empresa Teste 1',
        tipo: 'Fornecedor',
        status: 'Ativa',
        contato_nome: 'João Silva',
        contato_email: 'joao@empresa1.com',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        nome: 'Empresa Teste 2',
        tipo: 'Filial',
        status: 'Ativa',
        contato_nome: 'Maria Santos',
        contato_email: 'maria@empresa2.com',
        created_at: new Date().toISOString(),
    },
    {
        id: '3',
        nome: 'Empresa Teste 3',
        tipo: 'Matriz',
        status: 'Inativa',
        contato_nome: 'Pedro Costa',
        contato_email: 'pedro@empresa3.com',
        created_at: new Date().toISOString(),
    },
];

export const empresaFixture = empresasFixture[0];
