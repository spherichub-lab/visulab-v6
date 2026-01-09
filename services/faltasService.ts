
import { supabase } from '../lib/supabase';
import { Falta } from '../lib/types/database/entities.types';
import type { AuthUser } from '../src/types/api/api.types';
import { isAdmin } from '../lib/utils/visibility';

export const faltasService = {
  /**
   * Get faltas based on user visibility rules
   * ALL users (admins and regular) see all faltas for dashboard cards
   */
  async getByUserVisibility(user: AuthUser): Promise<Falta[]> {
    console.log('🔍 [FALTAS SERVICE] getByUserVisibility called with user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      empresa_id: user.empresa_id
    });

    const { data, error } = await supabase
      .from('faltas')
      .select(`
        *,
        usuarios (id, nome, email),
        empresas (id, nome),
        tipos (id, nome),
        indices (id, nome),
        tratamentos (id, nome)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [FALTAS ERROR] Failed to fetch faltas:', error);
      throw error;
    }

    const faltas = data as Falta[];

    console.log('🔍 [FALTAS SERVICE] Fetched faltas:', {
      totalCount: faltas.length,
      userRole: user.role,
      userEmpresaId: user.empresa_id
    });

    // ALL users see all faltas for dashboard cards
    console.log('🔍 [FALTAS SERVICE] Returning all faltas for dashboard');
    return faltas;
  },

  // Busca faltas com todos os relacionamentos para exibição na UI
  // DEPRECATED: Use getByUserVisibility(user) instead for role-based filtering
  async getAll() {
    const { data, error } = await supabase
      .from('faltas')
      .select(`
        *,
        usuarios (id, nome, email),
        empresas (id, nome),
        tipos (id, nome),
        indices (id, nome),
        tratamentos (id, nome)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Falta[];
  },

  // Filtros podem ser adicionados aqui
  async getByEmpresa(empresaId: string) {
    const { data, error } = await supabase
      .from('faltas')
      .select(`
        *,
        usuarios (id, nome, email),
        empresas (id, nome),
        tipos (id, nome),
        indices (id, nome),
        tratamentos (id, nome)
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Falta[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('faltas')
      .select(`
        *,
        usuarios (id, nome, email),
        empresas (id, nome),
        tipos (id, nome),
        indices (id, nome),
        tratamentos (id, nome)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Falta;
  },

  async create(falta: Omit<Falta, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🔍 [FALTAS CREATE] Attempting to create falta:', {
      usuario_id: falta.usuario_id,
      empresa_id: falta.empresa_id,
      tipo_id: falta.tipo_id,
      indice_id: falta.indice_id,
      tratamiento_id: falta.tratamiento_id
    });

    // Validate that empresa_id is provided
    if (!falta.empresa_id) {
      console.error('❌ [FALTAS CREATE ERROR] empresa_id is required:', {
        usuario_id: falta.usuario_id,
        empresa_id: falta.empresa_id
      });
      throw new Error('empresa_id is required to create a falta. Please ensure you are assigned to a company.');
    }

    const { data, error } = await supabase
      .from('faltas')
      .insert([falta])
      .select()
      .single();

    if (error) {
      console.error('❌ [FALTAS CREATE ERROR] Failed to create falta:', {
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
        falta: {
          usuario_id: falta.usuario_id,
          empresa_id: falta.empresa_id
        }
      });
      throw error;
    }

    console.log('✅ [FALTAS CREATE] Successfully created falta:', {
      id: data.id,
      usuario_id: data.usuario_id,
      empresa_id: data.empresa_id
    });

    return data as Falta;
  },

  async update(id: string, updates: Partial<Falta>) {
    const { data, error } = await supabase
      .from('faltas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Falta;
  },

  // Atualizar apenas o status (Workflow)
  async updateStatus(id: string, status: string, etapa?: number) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (etapa) updates.etapa_atual = etapa;

    const { data, error } = await supabase
      .from('faltas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Falta;
  },

  /**
   * Delete operation is NOT ALLOWED for faltas
   * This is a business rule: faltas records are permanent
   */
  async delete(id: string): Promise<never> {
    throw new Error('Delete operations are not allowed for faltas. This is a business rule to maintain data integrity.');
  }
};
