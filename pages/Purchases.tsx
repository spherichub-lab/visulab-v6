
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Purchase } from '../types';
import { ExportButtons } from '../components/ExportButtons';
import { CustomSelect } from '../components/CustomSelect';
import { generateTxtReport } from '../lib/reports/generateTxtReport';
import { Toast } from '../components/Toast';
import { comprasService } from '../services/comprasService';
import { empresasService } from '../services/empresasService';
import { FeedbackState } from '../src/components/shared';
import { getCompanyColor, getDefaultCompanyColor } from '../lib/utils/helpers/companyColorHelper';
import { Empresa } from '../lib/types/database/entities.types';

const Purchases: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [newPurchaseSupplier, setNewPurchaseSupplier] = useState('');
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [companies, setCompanies] = useState<Empresa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // New purchase state
    const [newPurchaseData, setNewPurchaseData] = useState({
        date: new Date().toISOString().split('T')[0],
        itemsDescription: '',
        amount: '',
        status: 'Pendente'
    });

    // Action menu state
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [editPurchaseData, setEditPurchaseData] = useState({
        supplier: '',
        date: '',
        description: '',
        amount: '',
        status: 'Pendente'
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false,
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isVisible: true });
    };

    // Helper function to match supplier name with company
    const getCompanyBySupplierName = useCallback((supplierName: string): Empresa | null => {
        return companies.find(c => c.nome === supplierName) || null;
    }, [companies]);

    // Format currency with thousand separators (last 2 digits become cents)
    const formatCurrency = (value: string): string => {
        // Remove all non-numeric characters
        let cleanValue = value.replace(/\D/g, '');

        // If empty, return empty (to show placeholder)
        if (cleanValue === '') return '';

        // Split into integer and decimal parts (last 2 digits are cents)
        let integerPart = cleanValue.slice(0, -2);
        let decimalPart = cleanValue.slice(-2);

        // If no integer part, use '0'
        if (integerPart === '') {
            integerPart = '0';
        }

        // Remove leading zeros from integer part
        integerPart = integerPart.replace(/^0+/, '');
        if (integerPart === '') {
            integerPart = '0';
        }

        // Add thousand separators to integer part
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Combine parts with comma as decimal separator
        return `${formattedInteger},${decimalPart}`;
    };

    // Format date from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString: string): string => {
        if (!dateString) return '-';
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateString;
    };

    // Parse formatted currency back to number
    const parseCurrency = (formatted: string): number => {
        // Remove thousand separators (dots) and replace comma with dot for decimal
        const clean = formatted.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    useEffect(() => {
        const fetchPurchases = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await comprasService.getAll();
                const mapped: Purchase[] = data.map(p => {
                    const company = getCompanyBySupplierName(p.fornecedor);
                    const color = company ? getCompanyColor(company.id) : getDefaultCompanyColor();

                    return {
                        id: p.id,
                        displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
                        supplier: p.fornecedor,
                        supplierInitials: p.fornecedor.substring(0, 2).toUpperCase(),
                        supplierColorClass: `${color.bg} ${color.text} ${color.border}`,
                        supplierDarkColorClass: `${color.darkBg} ${color.darkText} ${color.darkBorder}`,
                        date: p.data_compra,
                        itemsDescription: p.descricao || '-',
                        amount: p.valor_total,
                        status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
                    };
                });
                setPurchases(mapped);
            } catch (e) {
                console.error(e);
                setError(e instanceof Error ? e : new Error('Erro ao carregar compras'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchPurchases();
    }, [getCompanyBySupplierName]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const empresas = await empresasService.getByType('Fornecedor');
                const supplierNames = empresas.map(e => e.nome);
                setSuppliers(supplierNames);
            } catch (e) {
                console.error('Erro ao carregar fornecedores:', e);
            }
        };
        fetchSuppliers();
    }, []);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const empresas = await empresasService.getAll();
                setCompanies(empresas);
            } catch (e) {
                console.error('Erro ao carregar empresas:', e);
            }
        };
        fetchCompanies();
    }, []);

    const handleExportTxt = () => {
        setIsExporting(true);
        try {
            const reportData = purchases.map(p => {
                const statusLabel = p.status === 'Received' ? 'Recebido' : p.status === 'Pending' ? 'Pendente' : 'Cancelado';
                const formattedAmount = `R$ ${formatCurrency(p.amount.toFixed(2).replace('.', ','))}`;
                const formattedDate = formatDate(p.date);

                return {
                    index: p.displayId,
                    esfCil: p.supplier,
                    treatment: `${formattedDate} | ${formattedAmount} | ${statusLabel}`,
                    quantity: 0,
                    user: '-',
                    time: p.date
                };
            });

            generateTxtReport({
                company: 'Todas (Compras)',
                title: 'HISTÓRICO DE COMPRAS',
                groupByLabel: 'PEDIDO',
                hideQuantity: true
            }, reportData);
        } finally {
            setIsExporting(false);
        }
    };

    const handleSavePurchase = async () => {
        // Validate supplier selection
        if (!newPurchaseSupplier) {
            showToast('Por favor, selecione um fornecedor.', 'error');
            return;
        }

        // Validate amount
        const parsedAmount = parseCurrency(newPurchaseData.amount);
        if (!newPurchaseData.amount || parsedAmount <= 0) {
            showToast('Por favor, insira um valor válido.', 'error');
            return;
        }

        // Validate description
        if (!newPurchaseData.itemsDescription.trim()) {
            showToast('Por favor, insira uma descrição.', 'error');
            return;
        }

        try {
            await comprasService.create({
                fornecedor: newPurchaseSupplier,
                data_compra: newPurchaseData.date,
                descricao: newPurchaseData.itemsDescription,
                valor_total: parsedAmount,
                status: newPurchaseData.status === 'Received' ? 'Pago' : 'Pendente'
            });

            // Refresh data
            const data = await comprasService.getAll();
            const mapped: Purchase[] = data.map(p => {
                const company = getCompanyBySupplierName(p.fornecedor);
                const color = company ? getCompanyColor(company.id) : getDefaultCompanyColor();

                return {
                    id: p.id,
                    displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
                    supplier: p.fornecedor,
                    supplierInitials: p.fornecedor.substring(0, 2).toUpperCase(),
                    supplierColorClass: `${color.bg} ${color.text} ${color.border}`,
                    supplierDarkColorClass: `${color.darkBg} ${color.darkText} ${color.darkBorder}`,
                    date: p.data_compra,
                    itemsDescription: p.descricao || '-',
                    amount: p.valor_total,
                    status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
                };
            });
            setPurchases(mapped);

            showToast('Compra registrada com sucesso!', 'success');

            setNewPurchaseSupplier('');
            setNewPurchaseData({
                date: new Date().toISOString().split('T')[0],
                itemsDescription: '',
                amount: '',
                status: 'Pendente'
            });

        } catch (e) {
            console.error(e);
            showToast('Erro ao salvar compra.', 'error');
        }
    };

    const handleViewPurchase = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setViewModalOpen(true);
        setActionMenuOpen(null);
    };

    const handleEditPurchase = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setEditPurchaseData({
            supplier: purchase.supplier,
            date: purchase.date,
            description: purchase.itemsDescription,
            amount: formatCurrency(purchase.amount.toFixed(2).replace('.', ',')),
            status: purchase.status === 'Received' ? 'Received' : purchase.status === 'Pending' ? 'Pending' : 'Cancelled'
        });
        setEditModalOpen(true);
        setActionMenuOpen(null);
    };

    const handleUpdatePurchase = async () => {
        if (!selectedPurchase) return;

        // Validate supplier
        if (!editPurchaseData.supplier) {
            showToast('Por favor, selecione um fornecedor.', 'error');
            return;
        }

        // Validate amount
        const parsedEditAmount = parseCurrency(editPurchaseData.amount);
        if (!editPurchaseData.amount || parsedEditAmount <= 0) {
            showToast('Por favor, insira um valor válido.', 'error');
            return;
        }

        // Validate description
        if (!editPurchaseData.description.trim()) {
            showToast('Por favor, insira uma descrição.', 'error');
            return;
        }

        try {
            await comprasService.update(selectedPurchase.id, {
                fornecedor: editPurchaseData.supplier,
                data_compra: editPurchaseData.date,
                descricao: editPurchaseData.description,
                valor_total: parsedEditAmount,
                status: editPurchaseData.status === 'Received' ? 'Pago' : editPurchaseData.status === 'Pending' ? 'Pendente' : 'Cancelado'
            });

            // Refresh data
            const data = await comprasService.getAll();
            const mapped: Purchase[] = data.map(p => {
                const company = getCompanyBySupplierName(p.fornecedor);
                const color = company ? getCompanyColor(company.id) : getDefaultCompanyColor();

                return {
                    id: p.id,
                    displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
                    supplier: p.fornecedor,
                    supplierInitials: p.fornecedor.substring(0, 2).toUpperCase(),
                    supplierColorClass: `${color.bg} ${color.text} ${color.border}`,
                    supplierDarkColorClass: `${color.darkBg} ${color.darkText} ${color.darkBorder}`,
                    date: p.data_compra,
                    itemsDescription: p.descricao || '-',
                    amount: p.valor_total,
                    status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
                };
            });
            setPurchases(mapped);

            showToast('Compra atualizada com sucesso!', 'success');
            setEditModalOpen(false);
            setSelectedPurchase(null);

        } catch (e) {
            console.error(e);
            showToast('Erro ao atualizar compra.', 'error');
        }
    };

    const handleDeletePurchase = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setDeleteConfirmOpen(true);
        setActionMenuOpen(null);
    };

    const confirmDeletePurchase = async () => {
        if (!selectedPurchase) return;

        try {
            await comprasService.delete(selectedPurchase.id);

            // Refresh data
            const data = await comprasService.getAll();
            const mapped: Purchase[] = data.map(p => {
                const company = getCompanyBySupplierName(p.fornecedor);
                const color = company ? getCompanyColor(company.id) : getDefaultCompanyColor();

                return {
                    id: p.id,
                    displayId: `#PO-${p.id.substring(0, 4).toUpperCase()}`,
                    supplier: p.fornecedor,
                    supplierInitials: p.fornecedor.substring(0, 2).toUpperCase(),
                    supplierColorClass: `${color.bg} ${color.text} ${color.border}`,
                    supplierDarkColorClass: `${color.darkBg} ${color.darkText} ${color.darkBorder}`,
                    date: p.data_compra,
                    itemsDescription: p.descricao || '-',
                    amount: p.valor_total,
                    status: p.status === 'Pago' ? 'Received' : p.status === 'Cancelado' ? 'Cancelled' : 'Pending'
                };
            });
            setPurchases(mapped);

            showToast('Compra excluída com sucesso!', 'success');
            setDeleteConfirmOpen(false);
            setSelectedPurchase(null);

        } catch (e) {
            console.error(e);
            showToast('Erro ao excluir compra.', 'error');
        }
    };

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActionMenuOpen(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="h-full flex flex-col px-4 md:px-6 py-4 overflow-hidden">
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 lg:overflow-hidden no-scrollbar overflow-y-auto">

                <div className="lg:col-span-8 flex flex-col gap-4 h-full lg:overflow-hidden min-h-[500px] lg:min-h-0 order-1">
                    <div className="flex-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Custo Total', value: `R$ ${formatCurrency(purchases.reduce((acc, curr) => acc + (curr.amount || 0), 0).toFixed(2).replace('.', ','))}`, icon: 'receipt_long', color: 'text-white', bg: 'bg-slate-900 dark:bg-primary' },
                            { label: 'Recebidos', value: `${purchases.filter(p => p.status === 'Received').length}`, icon: 'check_circle', color: 'text-white', bg: 'bg-slate-900 dark:bg-primary' },
                            { label: 'Pendentes', value: `${purchases.filter(p => p.status === 'Pending').length}`, icon: 'schedule', color: 'text-white', bg: 'bg-slate-900 dark:bg-primary' },
                            { label: 'Total de Pedidos', value: `${purchases.length}`, icon: 'shopping_cart', color: 'text-white', bg: 'bg-slate-900 dark:bg-primary' },
                        ].map(metric => (
                            <div key={metric.label} className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
                                <div className={`h-10 w-10 rounded-full ${metric.bg} ${metric.color} flex items-center justify-center shadow-md`}>
                                    <Icon name={metric.icon} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase">{metric.label}</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{metric.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 bg-white dark:bg-surface-dark rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                        <div className="flex-none p-4 md:p-6 pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Histórico de Compras</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie e rastreie aquisições de estoque.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ExportButtons
                                        isLoading={isExporting}
                                        onExportTxt={handleExportTxt}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 bg-white dark:bg-surface-dark z-10">
                                    <tr className="border-b border-slate-100 dark:border-slate-700">
                                        <th className="py-4 px-3 pl-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                                        <th className="py-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                                        <th className="py-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                                        <th className="py-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens</th>
                                        <th className="py-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                                        <th className="py-4 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="py-4 px-3 pr-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-700">
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="py-8">
                                            <FeedbackState
                                                type="loading"
                                                variant="inline"
                                                size="sm"
                                            />
                                        </td></tr>
                                    ) : error ? (
                                        <tr><td colSpan={7} className="py-8">
                                            <FeedbackState
                                                type="error"
                                                title="Erro ao carregar compras"
                                                description="Ocorreu um erro ao buscar as compras. Tente novamente."
                                                onRetry={() => window.location.reload()}
                                                variant="inline"
                                                size="sm"
                                            />
                                        </td></tr>
                                    ) : purchases.length === 0 ? (
                                        <tr><td colSpan={7} className="py-8">
                                            <FeedbackState
                                                type="empty"
                                                title="Nenhuma compra encontrada"
                                                description="Não há compras registradas no momento. Adicione uma nova compra para começar."
                                                icon="shopping_cart"
                                                variant="inline"
                                                size="sm"
                                            />
                                        </td></tr>
                                    ) : (
                                        purchases.map(purchase => (
                                            <tr key={purchase.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                                <td className="py-4 px-3 pl-6 font-medium text-primary">{purchase.displayId}</td>
                                                <td className="py-4 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full ${purchase.supplierColorClass} ${purchase.supplierDarkColorClass} flex items-center justify-center font-bold text-xs border`}>
                                                            {purchase.supplierInitials}
                                                        </div>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{purchase.supplier}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 text-slate-500 dark:text-slate-400">{formatDate(purchase.date)}</td>
                                                <td className="py-4 px-3 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">{purchase.itemsDescription}</td>
                                                <td className="py-4 px-3 font-bold text-slate-900 dark:text-white text-right">R$ {formatCurrency(purchase.amount.toFixed(2).replace('.', ','))}</td>
                                                <td className="py-4 px-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${purchase.status === 'Received' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : ''}
                                                ${purchase.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : ''}
                                                ${purchase.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : ''}
                                            `}>
                                                        {purchase.status === 'Received' ? 'Recebido' : purchase.status === 'Pending' ? 'Pendente' : 'Cancelado'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 pr-6 text-right relative">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionMenuOpen(actionMenuOpen === purchase.id ? null : purchase.id);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                                        >
                                                            <Icon name="more_vert" className="!text-lg" />
                                                        </button>

                                                        {actionMenuOpen === purchase.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                                                                <button
                                                                    onClick={() => handleViewPurchase(purchase)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Icon name="visibility" className="!text-base" />
                                                                    Visualizar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditPurchase(purchase)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Icon name="edit" className="!text-base" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePurchase(purchase)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Icon name="delete" className="!text-base" />
                                                                    Excluir
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex-none flex flex-col sm:flex-row items-center justify-between p-4 px-6 gap-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Exibindo {purchases.length} itens</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto pr-1 no-scrollbar shrink-0 order-2">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-soft border border-slate-100 dark:border-slate-700 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-primary flex items-center justify-center text-white shadow-md">
                                <Icon name="add_shopping_cart" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nova Compra</h2>
                        </div>
                        <form className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                        Fornecedor <span className="text-red-500">*</span>
                                    </label>
                                    <CustomSelect
                                        value={newPurchaseSupplier}
                                        onChange={setNewPurchaseSupplier}
                                        options={suppliers}
                                        placeholder="Selecionar"
                                        triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Data</label>
                                    <input
                                        type="date"
                                        value={newPurchaseData.date}
                                        onChange={(e) => setNewPurchaseData({ ...newPurchaseData, date: e.target.value })}
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-base md:text-sm py-2.5 px-4 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={newPurchaseData.itemsDescription}
                                    onChange={(e) => setNewPurchaseData({ ...newPurchaseData, itemsDescription: e.target.value })}
                                    placeholder="Ex: 50x Lentes Blue Cut..."
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-base md:text-sm py-2.5 px-4 shadow-sm resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Valor Total <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                                    <input
                                        type="text"
                                        value={newPurchaseData.amount}
                                        onChange={(e) => {
                                            // Extract only numeric digits from the current input value
                                            const numericOnly = e.target.value.replace(/\D/g, '');
                                            // If empty, set to empty string to allow clearing the input
                                            if (numericOnly === '') {
                                                setNewPurchaseData({ ...newPurchaseData, amount: '' });
                                            } else {
                                                setNewPurchaseData({ ...newPurchaseData, amount: formatCurrency(numericOnly) });
                                            }
                                        }}
                                        placeholder="0,00"
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-base md:text-sm py-2.5 px-4 pl-10 shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            className="peer sr-only"
                                            checked={newPurchaseData.status === 'Pendente'}
                                            onChange={() => setNewPurchaseData({ ...newPurchaseData, status: 'Pendente' })}
                                        />
                                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all">Pendente</div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            className="peer sr-only"
                                            checked={newPurchaseData.status === 'Received'}
                                            onChange={() => setNewPurchaseData({ ...newPurchaseData, status: 'Received' })}
                                        />
                                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-accent-green peer-checked:bg-accent-green/5 peer-checked:text-accent-green transition-all">Recebido</div>
                                    </label>
                                </div>
                            </div>
                            <button type="button" onClick={handleSavePurchase} className="mt-2 w-full py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                <Icon name="save" className="!text-lg" />
                                Salvar Compra
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {viewModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewModalOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Detalhes da Compra</h3>
                            <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Icon name="close" className="!text-xl" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ID</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedPurchase.displayId}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fornecedor</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedPurchase.supplier}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(selectedPurchase.date)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descrição</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedPurchase.itemsDescription}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valor</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">R$ {formatCurrency(selectedPurchase.amount.toFixed(2).replace('.', ','))}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                    ${selectedPurchase.status === 'Received' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : ''}
                                    ${selectedPurchase.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : ''}
                                    ${selectedPurchase.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : ''}
                                `}>
                                    {selectedPurchase.status === 'Received' ? 'Recebido' : selectedPurchase.status === 'Pending' ? 'Pendente' : 'Cancelado'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditModalOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Compra</h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Icon name="close" className="!text-xl" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Fornecedor <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    value={editPurchaseData.supplier}
                                    onChange={(value) => setEditPurchaseData({ ...editPurchaseData, supplier: value })}
                                    options={suppliers}
                                    triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Data</label>
                                <input
                                    type="date"
                                    value={editPurchaseData.date}
                                    onChange={(e) => setEditPurchaseData({ ...editPurchaseData, date: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-sm py-2.5 px-4 shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={editPurchaseData.description}
                                    onChange={(e) => setEditPurchaseData({ ...editPurchaseData, description: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-sm py-2.5 px-4 shadow-sm resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Valor Total <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                                    <input
                                        type="text"
                                        value={editPurchaseData.amount}
                                        onChange={(e) => {
                                            // Extract only numeric digits from the current input value
                                            const numericOnly = e.target.value.replace(/\D/g, '');
                                            // If empty, set to empty string to allow clearing the input
                                            if (numericOnly === '') {
                                                setEditPurchaseData({ ...editPurchaseData, amount: '' });
                                            } else {
                                                setEditPurchaseData({ ...editPurchaseData, amount: formatCurrency(numericOnly) });
                                            }
                                        }}
                                        placeholder=""
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:border-primary focus:ring-primary text-sm py-2.5 px-4 pl-10 shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="editStatus"
                                            className="peer sr-only"
                                            checked={editPurchaseData.status === 'Pending'}
                                            onChange={() => setEditPurchaseData({ ...editPurchaseData, status: 'Pending' })}
                                        />
                                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all">Pendente</div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="editStatus"
                                            className="peer sr-only"
                                            checked={editPurchaseData.status === 'Received'}
                                            onChange={() => setEditPurchaseData({ ...editPurchaseData, status: 'Received' })}
                                        />
                                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-accent-green peer-checked:bg-accent-green/5 peer-checked:text-accent-green transition-all">Recebido</div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="editStatus"
                                            className="peer sr-only"
                                            checked={editPurchaseData.status === 'Cancelled'}
                                            onChange={() => setEditPurchaseData({ ...editPurchaseData, status: 'Cancelled' })}
                                        />
                                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-red-500 peer-checked:bg-red-500/5 peer-checked:text-red-500 transition-all">Cancelado</div>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdatePurchase}
                                    className="flex-1 py-2.5 bg-slate-900 dark:bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Icon name="warning" className="!text-3xl text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Confirmar Exclusão</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                            Tem certeza que deseja excluir a compra <span className="font-semibold">{selectedPurchase.displayId}</span>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeletePurchase}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
