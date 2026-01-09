/**
 * ServiceRegistry - Centralized registry for all application services
 * Provides typed access to service instances
 */

import { supabaseEmpresasService } from '../empresas/SupabaseEmpresasService';
import { supabaseUsuariosService } from '../usuarios/SupabaseUsuariosService';
import { supabaseFaltasService } from '../faltas/SupabaseFaltasService';
import { supabaseComprasService } from '../compras/SupabaseComprasService';
import { supabaseIndicesService } from '../indices/SupabaseIndicesService';
import { supabaseTiposService } from '../tipos/SupabaseTiposService';
import { supabaseTratamentosService } from '../tratamentos/SupabaseTratamentosService';

/**
 * ServiceRegistry class provides centralized access to all services
 */
export class ServiceRegistry {
    private static instance: ServiceRegistry | null = null;

    private constructor() {
        // No initialization needed - services are imported as singletons
    }

    /**
     * Get or create ServiceRegistry singleton instance
     */
    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    // Service getters - Return Supabase services for real data
    public getEmpresasService(): any {
        return supabaseEmpresasService;
    }

    public getUsuariosService(): any {
        return supabaseUsuariosService;
    }

    public getFaltasService(): any {
        return supabaseFaltasService;
    }

    public getComprasService(): any {
        return supabaseComprasService;
    }

    public getIndicesService(): any {
        return supabaseIndicesService;
    }

    public getTiposService(): any {
        return supabaseTiposService;
    }

    public getTratamientosService(): any {
        return supabaseTratamentosService;
    }

    public getTratamentosService(): any {
        return supabaseTratamentosService;
    }

    /**
     * Reset ServiceRegistry singleton (useful for testing)
     */
    public static resetInstance(): void {
        ServiceRegistry.instance = null;
    }
}