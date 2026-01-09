import { supabase } from '../lib/supabase';
import { Indice } from '../types/database.types';

export const indicesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('indices')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data as Indice[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('indices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Indice;
    },

    async getAllActive() {
        return this.getAll();
    }
};
