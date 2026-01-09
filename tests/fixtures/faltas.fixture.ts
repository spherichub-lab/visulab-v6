/**
 * Minimal fixture for faltas (shortages)
 * Used by E2E tests to ensure test data availability
 */

export const faltasFixture = [
    {
        id: '1',
        usuario_id: '1',
        usuario_nome: 'João Silva',
        usuario_email: 'joao@example.com',
        usuario_initials: 'JS',
        tipo: 'Doença',
        data_inicio: '2025-12-20T00:00:00.000Z',
        data_fim: '2025-12-20T00:00:00.000Z',
        motivo: 'Motivo de saúde',
        status: 'Pendente',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        usuario_id: '2',
        usuario_nome: 'Maria Santos',
        usuario_email: 'maria@example.com',
        usuario_initials: 'MS',
        tipo: 'Pessoal',
        data_inicio: '2025-12-21T00:00:00.000Z',
        data_fim: '2025-12-21T00:00:00.000Z',
        motivo: 'Assunto pessoal',
        status: 'Aprovada',
        created_at: new Date().toISOString(),
    },
    {
        id: '3',
        usuario_id: '3',
        usuario_nome: 'Pedro Costa',
        usuario_email: 'pedro@example.com',
        usuario_initials: 'PC',
        tipo: 'Outros',
        data_inicio: '2025-12-22T00:00:00.000Z',
        data_fim: '2025-12-22T00:00:00.000Z',
        motivo: 'Outro motivo',
        status: 'Rejeitada',
        created_at: new Date().toISOString(),
    },
];

export const faltaFixture = faltasFixture[0];
