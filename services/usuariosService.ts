
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Usuario } from '../types/database.types';
import { supabaseAuthService } from '../src/services/auth/SupabaseAuthService';

// Cliente admin com service role key (já configurada em .env.local)
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const usuariosService = {
  // Listar usuários com dados da empresa
  async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, empresas(nome)')
      .is('deleted_at', null)
      .order('nome');

    if (error) throw error;
    return data as Usuario[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, empresas(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Usuario;
  },

  async create(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>, password?: string) {
    let userId: string | null = null;

    console.log('🔍 [USUARIOS DEBUG] Starting user creation:', {
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      empresa_id: usuario.empresa_id
    });

    try {
      // Step 1: Create user in auth.users
      if (!password) {
        throw new Error('Password is required to create a new user');
      }

      console.log('🔍 [USUARIOS DEBUG] Calling signUp for user:', usuario.email);
      userId = await supabaseAuthService.signUp(
        usuario.email,
        password,
        {
          name: usuario.nome,
          role: usuario.role,
        }
      );

      console.log('🔍 [USUARIOS DEBUG] User created in auth.users with ID:', userId);

      // Step 2: Create user in public.usuarios with same ID and auth_user_id
      const usuarioComId = {
        ...usuario,
        id: userId,
        auth_user_id: userId, // Store auth.uid() for RLS policies
      };

      console.log('🔍 [USUARIOS DEBUG] Attempting to insert into public.usuarios:', {
        id: usuarioComId.id,
        auth_user_id: usuarioComId.auth_user_id,
        email: usuarioComId.email,
        nome: usuarioComId.nome,
        empresa_id: usuarioComId.empresa_id,
        role: usuarioComId.role,
        status: usuarioComId.status
      });

      const { data, error } = await supabase
        .from('usuarios')
        .insert([usuarioComId])
        .select()
        .single();

      if (error) {
        // Rollback: Delete user from auth.users if public.usuarios insertion fails
        // Note: We can't use admin.deleteUser from client-side, so auth user
        // will remain but won't be usable since public.usuarios record failed
        console.error('❌ [USUARIOS DEBUG] Failed to create user in public.usuarios:', error);
        console.error('❌ [USUARIOS DEBUG] Error object type:', typeof error);
        console.error('❌ [USUARIOS DEBUG] Error keys:', Object.keys(error));
        console.error('❌ [USUARIOS DEBUG] Full error object:', JSON.stringify(error, null, 2));
        console.error('❌ [USUARIOS DEBUG] Error message:', error.message || 'No message property');
        console.error('❌ [USUARIOS DEBUG] Error code:', error.code || 'No code property');
        console.error('❌ [USUARIOS DEBUG] Error details:', error.details || 'No details property');
        console.error('❌ [USUARIOS DEBUG] Error hint:', error.hint || 'No hint property');
        throw error;
      }

      console.log('✅ [USUARIOS DEBUG] User successfully created in both tables:', userId);
      return data as Usuario;
    } catch (error) {
      console.error('❌ [USUARIOS DEBUG] Error in create method:', error);
      // Re-throw error to be handled by caller
      throw error;
    }
  },

  async update(id: string, updates: Partial<Usuario>) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Usuario;
  },

  /**
   * Update a user's password (admin only)
   * Solução simples usando Supabase Admin Client
   * 
   * ⚠️ AVISO DE SEGURANÇA: Esta solução usa uma service role key no lado do cliente
   * NÃO é recomendado para produção. Use apenas para desenvolvimento/testes.
   */
  async updatePassword(userId: string, newPassword: string) {
    console.log('🔍 [USUARIOS DEBUG] Atualizando senha para usuário:', userId);

    // Verificar usuário atual está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é admin
    console.log('🔍 [USUARIOS DEBUG] Buscando usuário admin:', session.user.id);

    const { data: userData, error: userDataError } = await supabase
      .from('usuarios')
      .select('role, email, nome, deleted_at')
      .eq('id', session.user.id)
      .is('deleted_at', null)
      .single();

    console.log('🔍 [USUARIOS DEBUG] Resultado da busca:', { userData, userDataError });

    if (userDataError) {
      console.error('❌ [USUARIOS DEBUG] Erro ao buscar usuário:', userDataError);
      throw new Error(`Erro ao buscar usuário: ${userDataError.message}`);
    }

    if (!userData) {
      console.error('❌ [USUARIOS DEBUG] Usuário não encontrado na tabela usuarios');
      console.error('❌ [USUARIOS DEBUG] User ID:', session.user.id);

      // Tentar buscar sem o filtro deleted_at para ver se o usuário existe
      const { data: allUsers } = await supabase
        .from('usuarios')
        .select('id, email, nome, role, deleted_at')
        .eq('id', session.user.id)
        .is('deleted_at', null);

      console.error('❌ [USUARIOS DEBUG] Todos os usuários com este ID:', allUsers);

      throw new Error('Usuário não encontrado na tabela usuarios. Verifique se o usuário está ativo.');
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
      console.error('❌ [USUARIOS DEBUG] Erro ao atualizar senha:', error);
      throw new Error(`Falha ao atualizar senha: ${error.message}`);
    }

    console.log('✅ [USUARIOS DEBUG] Senha atualizada com sucesso');

    return {
      success: true,
      message: 'Senha atualizada com sucesso',
      user_id: userId,
      updated_by: session.user.id
    };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('usuarios')
      .update({ deleted_at: new Date().toISOString(), status: 'Inactive' })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Update last_active timestamp for a user
   * Called when user logs in to track their last access time
   */
  async updateLastActive(id: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ last_active: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Usuario;
  }
};
