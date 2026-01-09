/**
 * Compras Repository
 * Repository for managing compras data
 */

import { BaseRepository } from '../base/baseRepository';
import { Compra } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';

export class ComprasRepository extends BaseRepository<Compra> {
    constructor() {
        super({
            table: TABLE_NAMES.COMPRAS,
            useCache: false, // Dynamic data, no caching
            defaultSelect: 'id, fornecedor, data_compra, valor_total, status, descricao, created_at, updated_at'
        });
    }

    /**
     * Find by status
     */
    async findByStatus(status: string): Promise<Compra[]> {
        const result = await this.findWithFilters({ status });
        return result.data;
    }

    /**
     * Find by fornecedor
     */
    async findByFornecedor(fornecedor: string): Promise<Compra[]> {
        const result = await this.findWithFilters({
            fornecedor: { ilike: `%${fornecedor}%` }
        });
        return result.data;
    }

    /**
     * Find by date range
     */
    async findByDateRange(
        startDate: string,
        endDate: string,
        options: any = {}
    ): Promise<Compra[]> {
        const result = await this.findWithFilters({
            data_compra: { gte: startDate, lte: endDate },
            ...options
        });
        return result.data;
    }

    /**
     * Find by value range
     */
    async findByValueRange(
        minValue: number,
        maxValue: number,
        options: any = {}
    ): Promise<Compra[]> {
        const result = await this.findWithFilters({
            valor_total: { gte: minValue, lte: maxValue },
            ...options
        });
        return result.data;
    }

    /**
     * Find recent compras
     */
    async findRecent(limit: number = 10): Promise<Compra[]> {
        const result = await this.findAll({
            sort: { column: 'created_at', direction: 'desc' },
            limit
        });
        return result.data;
    }

    /**
     * Update status
     */
    async updateStatus(id: string, status: string): Promise<Compra> {
        return this.update(id, { status });
    }

    /**
     * Search compras by multiple criteria
     */
    async search(criteria: {
        fornecedor?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        minValue?: number;
        maxValue?: number;
    }): Promise<Compra[]> {
        const filters: any = {};

        if (criteria.fornecedor) {
            filters.fornecedor = { ilike: `%${criteria.fornecedor}%` };
        }

        if (criteria.status) {
            filters.status = criteria.status;
        }

        if (criteria.startDate && criteria.endDate) {
            filters.data_compra = { gte: criteria.startDate, lte: criteria.endDate };
        } else if (criteria.startDate) {
            filters.data_compra = { gte: criteria.startDate };
        } else if (criteria.endDate) {
            filters.data_compra = { lte: criteria.endDate };
        }

        if (criteria.minValue && criteria.maxValue) {
            filters.valor_total = { gte: criteria.minValue, lte: criteria.maxValue };
        } else if (criteria.minValue) {
            filters.valor_total = { gte: criteria.minValue };
        } else if (criteria.maxValue) {
            filters.valor_total = { lte: criteria.maxValue };
        }

        const result = await this.findWithFilters(filters);
        return result.data;
    }

    /**
     * Get count by status
     */
    async getCountByStatus(): Promise<Record<string, number>> {
        const pendenteCount = await this.count({ status: 'Pendente' });
        const pagoCount = await this.count({ status: 'Pago' });
        const canceladoCount = await this.count({ status: 'Cancelado' });

        return {
            Pendente: pendenteCount,
            Pago: pagoCount,
            Cancelado: canceladoCount
        };
    }

    /**
     * Get total value by status
     */
    async getTotalValueByStatus(): Promise<Record<string, number>> {
        const pendente = await this.findByStatus('Pendente');
        const pago = await this.findByStatus('Pago');
        const cancelado = await this.findByStatus('Cancelado');

        const sumValues = (compras: Compra[]) =>
            compras.reduce((sum, compra) => sum + compra.valor_total, 0);

        return {
            Pendente: sumValues(pendente),
            Pago: sumValues(pago),
            Cancelado: sumValues(cancelado)
        };
    }

    /**
     * Get summary statistics
     */
    async getSummary(): Promise<{
        total: number;
        totalValue: number;
        averageValue: number;
        byStatus: Record<string, { count: number; totalValue: number }>;
    }> {
        const result = await this.findAll();
        const compras = result.data;

        const total = compras.length;
        const totalValue = compras.reduce((sum, compra) => sum + compra.valor_total, 0);
        const averageValue = total > 0 ? totalValue / total : 0;

        const byStatus: Record<string, { count: number; totalValue: number }> = {};

        compras.forEach(compra => {
            if (!byStatus[compra.status]) {
                byStatus[compra.status] = { count: 0, totalValue: 0 };
            }
            byStatus[compra.status].count++;
            byStatus[compra.status].totalValue += compra.valor_total;
        });

        return {
            total,
            totalValue,
            averageValue,
            byStatus
        };
    }

    /**
     * Get monthly statistics
     */
    async getMonthlyStatistics(year: number): Promise<Array<{
        month: number;
        count: number;
        totalValue: number;
    }>> {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const compras = await this.findByDateRange(startDate, endDate);

        const monthlyStats: Record<number, { count: number; totalValue: number }> = {};

        compras.forEach(compra => {
            const month = new Date(compra.data_compra).getMonth() + 1; // JavaScript months are 0-based

            if (!monthlyStats[month]) {
                monthlyStats[month] = { count: 0, totalValue: 0 };
            }

            monthlyStats[month].count++;
            monthlyStats[month].totalValue += compra.valor_total;
        });

        // Convert to array and sort by month
        return Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
            month,
            count: monthlyStats[month]?.count || 0,
            totalValue: monthlyStats[month]?.totalValue || 0
        }));
    }

    /**
     * Get top fornecedores by value
     */
    async getTopFornecedoresByValue(limit: number = 10): Promise<Array<{
        fornecedor: string;
        totalValue: number;
        count: number;
    }>> {
        const result = await this.findAll();
        const compras = result.data;

        const fornecedorStats: Record<string, { totalValue: number; count: number }> = {};

        compras.forEach(compra => {
            if (!fornecedorStats[compra.fornecedor]) {
                fornecedorStats[compra.fornecedor] = { totalValue: 0, count: 0 };
            }

            fornecedorStats[compra.fornecedor].totalValue += compra.valor_total;
            fornecedorStats[compra.fornecedor].count++;
        });

        return Object.entries(fornecedorStats)
            .map(([fornecedor, stats]) => ({
                fornecedor,
                totalValue: stats.totalValue,
                count: stats.count
            }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, limit);
    }
}