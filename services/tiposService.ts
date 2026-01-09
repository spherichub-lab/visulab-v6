import { supabase } from '../lib/supabase';
import { Tipo } from '../types/database.types';

export const tiposService = {
    async getAll() {
        const { data, error } = await supabase
            .from('tipos')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data as Tipo[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('tipos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Tipo;
    },

    async getAllActive() {
        // For now, simply return all. 
        // If soft delete logic is implemented later (e.g. deleted_at), add filter here.
        return this.getAll();
    }
};
