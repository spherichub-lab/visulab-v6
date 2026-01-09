// Solução simples usando Supabase Client com Service Role Key
// Esta solução usa o cliente Supabase existente com a service role key

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Usuario } from '../types/database.types';

// ⚠️ AVISO: Esta solução usa a service role key no lado do cliente
// NÃO é recomendado para produção. Use apenas para desenvolvimento.

// Criar cliente admin com service role key
const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_KEY, // Você já tem isso no .env.local
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export const usuariosServiceV3 = {
    // ... mantém todos os métodos existentes ...

    /**
     * Update a user's password (admin only)
     * Solução simples usando Supabase Client com Service Role Key
     */
    async updatePassword(userId: string, newPassword: string) {
        console.log('🔍 [USUARIOS V3] Atualizando senha para usuário:', userId);

        // Verificar usuário atual está autenticado
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Usuário não autenticado');
        }

        // Verificar se o usuário atual é admin
        const { data: userData, error: userDataError } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', session.user.id)
            .eq('deleted_at', null)
            .single();

        if (userDataError || !userData) {
            throw new Error('Usuário não encontrado na tabela usuarios');
        }

        if (userData.role !== 'Administrador') {
            throw new Error('Apenas administradores podem atualizar senhas de outros usuários');
        }

        // Usar o cliente admin para atualizar a senha
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ [USUARIOS V3] Erro ao atualizar senha:', error);
            throw new Error(`Falha ao atualizar senha: ${error.message}`);
        }

        console.log('✅ [USUARIOS V3] Senha atualizada com sucesso');

        return {
            success: true,
            message: 'Senha atualizada com sucesso',
            user_id: userId,
            updated_by: session.user.id
        };
    }
};
