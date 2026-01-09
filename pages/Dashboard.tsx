import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ExportButtons } from '../components/ExportButtons';
import { CustomSelect } from '../components/CustomSelect';
import { generateTxtReport } from '../lib/reports/generateTxtReport';
import { generatePdfReport } from '../lib/reports/generatePdfReport';
import { faltasService } from '../services/faltasService';
import { empresasService } from '../services/empresasService';
import { indicesService } from '../services/indicesService';
import { tratamentosService } from '../services/tratamentosService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { comprasService } from '../services/comprasService';
import { FeedbackState } from '../src/components/shared/index';
import { Falta } from '../lib/types/database/entities.types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { isAdmin } from '../lib/utils/visibility';
import { Toast } from '../components/Toast';

// --- Distinct Palette Colors ---
const INDEX_COLORS: Record<string, string> = {
  '1.49': '#ef4444', // Red 500
  '1.53': '#f97316', // Orange 500
  '1.56': '#eab308', // Yellow 500
  '1.59': '#22c55e', // Green 500
  '1.60': '#06b6d4', // Cyan 500
  '1.61': '#3b82f6', // Blue 500
  '1.67': '#8b5cf6', // Violet 500
  '1.74': '#ec4899', // Pink 500
};

// Updated Colors to match Reference Image
const TREATMENT_COLORS: Record<string, string> = {
  'Incolor': '#e2e8f0',           // Light Grey
  'AR': '#3b82f6',                // Blue
  'Filtro Azul (Verde)': '#10b981', // Emerald
  'BlueCut (Azul)': '#8b5cf6',    // Purple
  'AR Premium': '#6366f1',        // Indigo
  'Photochromic': '#f97316',      // Orange
  'Photo': '#f97316',
  'Fotossensível (Photo)': '#f97316',
  'White': '#e2e8f0',
  'Outros': '#cbd5e1'             // Slate 300
};

// Helper to get CSS classes based on index (Distinct Colors)
const getIndexColorClass = (index: string) => {
  switch (index) {
    case '1.49': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    case '1.53': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case '1.56': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case '1.59': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    case '1.60': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    case '1.61': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case '1.67': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case '1.74': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
    default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
  }
};

const getCompanyLogoStyle = (company: string) => {
  const normalizedCompany = company?.trim().toLowerCase() || '';
  switch (normalizedCompany) {
    case 'master': return 'bg-slate-900 dark:bg-white text-white dark:text-slate-900';
    case 'amx': return 'bg-blue-600 text-white';
    case 'ultra optics': return 'bg-emerald-600 text-white';
    case 'gbo': return 'bg-orange-500 text-white';
    default: return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  }
};

const getCompanyInitials = (company: string) => {
  if (!company || company.trim() === '') return '-';
  const trimmed = company.trim();
  return trimmed.substring(0, 2).toUpperCase();
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

// Helper function to parse DATE columns as local dates (avoids timezone conversion issues)
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();

  // Handle DATE columns (YYYY-MM-DD format) - create date in local timezone
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Handle full timestamps
  return new Date(dateString);
};

const Dashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recentShortages, setRecentShortages] = useState<any[]>([]);
  const [allShortages, setAllShortages] = useState<any[]>([]);
  const [rawShortages, setRawShortages] = useState<any[]>([]);
  const [totalShortages, setTotalShortages] = useState(0);
  const [shortagesToday, setShortagesToday] = useState(0);
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string>('-');
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Dynamic Options
  const [companyOptions, setCompanyOptions] = useState<string[]>(['Todas']);
  const [indexOptions, setIndexOptions] = useState<string[]>(['Todos']);
  const [treatmentOptions, setTreatmentOptions] = useState<string[]>(['Todos']);

  // Refs for PDF capture
  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const cardCRef = useRef<HTMLDivElement>(null);
  const cardDRef = useRef<HTMLDivElement>(null);
  const indexChartRef = useRef<HTMLDivElement>(null);
  const treatmentChartRef = useRef<HTMLDivElement>(null);
  const subscriptionsRef = useRef<any[]>([]);

  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    index: 'Todos',
    treatment: 'Todos',
    company: 'Todas'
  });

  const handleReportFilterChange = (name: string, value: string) => {
    setReportFilters(prev => {
      const newFilters = { ...prev, [name]: value };

      // When index is "1.49", treatment must always be "incolor"
      if (name === 'index' && value === '1.49') {
        newFilters.treatment = 'Incolor';
      }

      return newFilters;
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportFilters(prev => ({ ...prev, [name]: value }));
  };

  // Toast handlers
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Memoized fetch function to avoid recreating on every render
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 [DASHBOARD] Fetching dashboard data...');
    console.log('🔍 [DASHBOARD] Current user:', {
      id: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.role,
      empresa_id: currentUser?.empresa_id
    });

    setIsChartLoading(true);
    setError(null);

    try {
      // Load Options in parallel
      const [empresas, indices, tratamentos] = await Promise.all([
        empresasService.getAll(),
        indicesService.getAllActive(),
        tratamentosService.getAllActive()
      ]);

      setCompanyOptions(['Todas', ...empresas.filter(e => e.tipo === 'Matriz' || e.tipo === 'Filial').map(e => e.nome)]);
      setIndexOptions(['Todos', ...indices.map(i => i.nome)]);
      setTreatmentOptions(['Todos', ...tratamentos.map(t => t.nome)]);

      // Busca dados reais do backend com role-based filtering
      console.log('📊 [DASHBOARD] Fetching data from services...');
      console.log('📊 [DASHBOARD] Current user for compras fetch:', {
        id: currentUser?.id,
        email: currentUser?.email,
        role: currentUser?.role,
        empresa_id: currentUser?.empresa_id
      });

      const [dbData, compras] = await Promise.all([
        faltasService.getByUserVisibility(currentUser),
        comprasService.getAll()
      ]);

      console.log('📊 [DASHBOARD] Data fetched:', {
        faltasCount: dbData.length,
        comprasCount: compras.length,
        comprasData: compras,
        faltasSample: dbData.slice(0, 2)
      });

      // Get last purchase date
      if (compras.length > 0) {
        // Sort manually using local date parsing to avoid timezone issues with DATE columns
        const sorted = [...compras].sort((a, b) => {
          const dateA = parseLocalDate(a.data_compra).getTime();
          const dateB = parseLocalDate(b.data_compra).getTime();
          return dateB - dateA; // Descending order (most recent first)
        });

        const mostRecentPurchase = sorted[0];
        const formattedDate = format(parseLocalDate(mostRecentPurchase.data_compra), 'dd/MM/yy');
        setLastPurchaseDate(formattedDate);

        console.log('📅 [DASHBOARD] Última compra:', {
          totalCompras: compras.length,
          ultimaData: mostRecentPurchase.data_compra,
          dataFormatada: formattedDate,
          timestamp: new Date().toISOString()
        });
      }

      // Mapeia os dados do banco para o formato esperado pelo Dashboard
      const mappedData = dbData.map((item: Falta) => {
        // Formata esf e cil para exibição no padrão: sinal + esf(0.00) + cil(0.00)
        const formatEsfCil = (value: number | null | undefined): string => {
          if (value === null || value === undefined) return '-';
          const sign = value >= 0 ? '+' : '-';
          const absValue = Math.abs(value);
          return `${sign}${absValue.toFixed(2)}`;
        };

        const esfStr = formatEsfCil(item.esf);
        const cilStr = formatEsfCil(item.cil);
        const esfCilDisplay = esfStr === '-' || cilStr === '-' ? `${esfStr} ${cilStr}` : `${esfStr} ${cilStr}`;

        return {
          id: item.id,
          index: item.indices?.nome || 'N/A',
          treatment: item.tratamentos?.nome || 'N/A',
          quantity: item.quantidade || 1,
          company: item.empresas?.nome || 'N/A',
          user: item.usuarios?.nome || 'N/A',
          esfCil: esfCilDisplay,
          time: item.created_at ? formatTimeAgo(new Date(item.created_at)) : '-',
          rawDate: item.created_at ? new Date(item.created_at) : new Date(),
          type: item.tipos?.nome || 'N/A'
        };
      });

      // Store raw dataset for cards
      setRawShortages(mappedData);

      // Store all shortages for report generation
      setAllShortages(mappedData);

      // Show all data without date filtering
      let filteredData = mappedData;

      // Calculate KPIs from all data
      // Calculate "Total de Faltas" - respects both company and date filters
      const totalShortages = filteredData.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      setTotalShortages(totalShortages);

      // Calculate "Faltas Hoje" - shows today's shortages
      const now = new Date();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const shortagesToday = mappedData.filter(item =>
        item.rawDate >= startOfToday && item.rawDate <= endOfToday
      ).reduce((sum, item) => sum + (item.quantity || 1), 0);
      setShortagesToday(shortagesToday);

      // Calculate "Maior Falta" bar data - respects both company and date filters
      const cardIndexCounts: Record<string, number> = {};

      filteredData.forEach(item => {
        const index = item.index || 'Outros';
        const qty = item.quantity || 1;
        cardIndexCounts[index] = (cardIndexCounts[index] || 0) + qty;
      });

      // Calculate total for percentage calculation
      const totalIndexCount = Object.values(cardIndexCounts).reduce((sum, val) => sum + val, 0);

      const cardBarData = Object.entries(cardIndexCounts)
        .map(([key, value]) => ({
          name: key,
          value,
          percentage: totalIndexCount > 0 ? Math.round((value / totalIndexCount) * 100) : 0,
          color: INDEX_COLORS[key] || '#94a3b8'
        }))
        .sort((a, b) => b.value - a.value);

      setBarData(cardBarData);

      // 5. Use filtered data for recent activity
      if (!filteredData || filteredData.length === 0) {
        setRecentShortages([]);
        setPieData([]);
        return;
      }

      setRecentShortages(filteredData.slice(0, 4));

      // 3. Calculate Treatment Stats from filtered data
      const treatmentCounts: Record<string, number> = {};
      let total = 0;

      filteredData.forEach((item: any) => {
        let t = item.treatment || 'Outros';
        const qty = item.quantity || 1;
        treatmentCounts[t] = (treatmentCounts[t] || 0) + qty;
        total += qty;
      });

      const newPieData = Object.keys(treatmentCounts).map((key) => {
        let color = TREATMENT_COLORS[key] || '#e2e8f0';
        return {
          name: key,
          value: treatmentCounts[key],
          percentage: total > 0 ? Math.round((treatmentCounts[key] / total) * 100) : 0,
          color: color
        };
      }).sort((a, b) => b.value - a.value);

      setPieData(newPieData);
      console.log('✅ [DASHBOARD] Dashboard data updated successfully:', {
        totalShortages,
        shortagesToday,
        barDataCount: cardBarData.length,
        pieDataCount: newPieData.length,
        filteredDataCount: filteredData.length
      });

    } catch (e) {
      console.error('❌ [DASHBOARD] Error fetching dashboard data:', e);
      setError(e instanceof Error ? e : new Error('Erro ao carregar dados do dashboard'));
    } finally {
      setIsChartLoading(false);
    }
  }, [currentUser]); // Only depend on currentUser, not analyticsFilters

  // Main data fetching effect
  useEffect(() => {
    console.log('🎯 [DASHBOARD] Dashboard useEffect triggered');
    fetchDashboardData();
  }, [refreshTrigger]);

  // Real-time subscriptions effect
  useEffect(() => {
    console.log('🔌 [DASHBOARD] Setting up real-time subscriptions...');

    // Subscribe to faltas table changes
    const faltasSubscription = supabase
      .channel('faltas_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'faltas'
        },
        (payload) => {
          console.log('📡 [DASHBOARD] Real-time faltas event:', payload.eventType, payload);
          // Trigger data refresh when faltas changes
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [DASHBOARD] Successfully subscribed to faltas table');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('❌ [DASHBOARD] Faltas subscription error:', status);
        }
      });

    // Subscribe to compras table changes
    const comprasSubscription = supabase
      .channel('compras_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compras'
        },
        (payload) => {
          console.log('📡 [DASHBOARD] Real-time compras event:', payload.eventType, payload);
          // Trigger data refresh when compras changes
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [DASHBOARD] Successfully subscribed to compras table');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('❌ [DASHBOARD] Compras subscription error:', status);
        }
      });

    // Store subscriptions for cleanup
    subscriptionsRef.current = [faltasSubscription, comprasSubscription];

    // Cleanup function
    return () => {
      console.log('🧹 [DASHBOARD] Cleaning up subscriptions...');
      subscriptionsRef.current.forEach(subscription => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      });
      subscriptionsRef.current = [];
    };
  }, []); // Run once on mount

  const handleExportTxt = () => {
    // Check if user is admin - regular users cannot generate TXT reports
    if (currentUser?.role !== 'Administrador') {
      showToast('Acesso negado: Apenas administradores podem gerar relatórios TXT.', 'warning');
      return;
    }

    setIsExporting(true);

    // Filter all shortages based on report filters
    let filteredReportData = allShortages;

    // Filter by company (only for admins)
    if (currentUser?.role === 'Administrador' && reportFilters.company && reportFilters.company !== 'Todas') {
      filteredReportData = filteredReportData.filter(item => item.company === reportFilters.company);
    }

    // Filter by index
    if (reportFilters.index && reportFilters.index !== 'Todos') {
      filteredReportData = filteredReportData.filter(item => item.index === reportFilters.index);
    }

    // Filter by treatment
    if (reportFilters.treatment && reportFilters.treatment !== 'Todos') {
      filteredReportData = filteredReportData.filter(item => item.treatment === reportFilters.treatment);
    }

    // Filter by date range
    if (reportFilters.startDate && reportFilters.endDate) {
      // Parse dates as local time to avoid timezone issues
      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const startDate = parseLocalDate(reportFilters.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = parseLocalDate(reportFilters.endDate);
      endDate.setHours(23, 59, 59, 999);

      filteredReportData = filteredReportData.filter(item => {
        return item.rawDate >= startDate && item.rawDate <= endDate;
      });
    }

    generateTxtReport(
      {
        company: reportFilters.company,
        startDate: reportFilters.startDate,
        endDate: reportFilters.endDate,
        index: reportFilters.index,
        treatment: reportFilters.treatment,
        groupByLabel: 'ÍNDICE DE REFRAÇÃO'
      },
      filteredReportData
    );
    setIsExporting(false);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const cards = [
        cardARef.current!,
        cardBRef.current!,
        cardCRef.current!,
        cardDRef.current!
      ];
      await generatePdfReport({
        kpiCards: cards,
        indexChart: indexChartRef.current!,
        treatmentChart: treatmentChartRef.current!,
        companyChart: treatmentChartRef.current!
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      <div className="h-full overflow-y-auto px-4 md:px-6 py-6 w-full max-w-[1440px] mx-auto flex flex-col gap-6 no-scrollbar">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white block">Painel de Controle</h2>
        </div>

        {/* KPI Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left Block */}
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div ref={cardARef} className="bg-white dark:bg-surface-dark p-4 md:p-5 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-2 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-2xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="error_outline" className="!text-lg md:!text-2xl" />
                </div>
                <span className="flex items-center text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 md:px-2 py-1 rounded-lg">
                  +8% <Icon name="trending_up" className="!text-xs md:!text-sm ml-0.5" />
                </span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-wide truncate">Total de Faltas</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {totalShortages > 0 ? totalShortages : 0}
                </h3>
              </div>
            </div>

            <div ref={cardBRef} className="bg-white dark:bg-surface-dark p-4 md:p-5 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-2 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-2xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="today" className="!text-lg md:!text-2xl" />
                </div>
                <span className="flex items-center text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 md:px-2 py-1 rounded-lg">
                  -2 <Icon name="trending_down" className="!text-xs md:!text-sm ml-0.5" />
                </span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-wide truncate">Faltas Hoje</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">{shortagesToday}</h3>
              </div>
            </div>
          </div>

          {/* Right Block */}
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div ref={cardCRef} className="bg-white dark:bg-surface-dark p-4 md:p-5 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-2 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-2xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="analytics" className="!text-lg md:!text-2xl" />
                </div>
                <span className="flex items-center text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 md:px-2 py-1 rounded-lg whitespace-nowrap">
                  Top #1
                </span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-wide truncate">Maior Falta</p>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1 leading-tight truncate">
                  {barData.length > 0 ? barData[0].name : '-'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                  {barData.length > 0 ? 'Mais frequente' : 'Sem dados'}
                </p>
              </div>
            </div>

            <div ref={cardDRef} className="bg-white dark:bg-surface-dark p-4 md:p-5 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-2 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-2xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="receipt_long" className="!text-lg md:!text-2xl" />
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-wide truncate">Última Compra</p>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1 whitespace-nowrap">{lastPurchaseDate}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Verificado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="flex flex-col gap-6">

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Análise de Faltas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visão geral das faltas em tempo real.</p>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div ref={indexChartRef} className={`bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col transition-all duration-300 hover:shadow-hover hover:-translate-y-1 ${isChartLoading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-slate-900 dark:bg-primary text-white rounded-lg shadow-md">
                    <Icon name="bar_chart" className="!text-lg" />
                  </div>
                  Por Índice de Refração
                </h4>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-5">
                {isChartLoading ? (
                  <FeedbackState
                    type="loading"
                    variant="inline"
                    size="sm"
                  />
                ) : error ? (
                  <FeedbackState
                    type="error"
                    title="Erro ao carregar dados"
                    description="Ocorreu um erro ao carregar os dados do dashboard. Tente novamente."
                    onRetry={() => window.location.reload()}
                    variant="inline"
                    size="sm"
                  />
                ) : barData.length === 0 ? (
                  <FeedbackState
                    type="empty"
                    title="Nenhum dado encontrado"
                    description="Não há dados disponíveis para o período selecionado."
                    variant="inline"
                    size="sm"
                  />
                ) : (
                  barData.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div ref={treatmentChartRef} className={`bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col transition-all duration-300 hover:shadow-hover hover:-translate-y-1 ${isChartLoading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-slate-900 dark:bg-primary text-white rounded-lg shadow-md">
                    <Icon name="pie_chart" className="!text-lg" />
                  </div>
                  Por Tratamento
                </h4>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 px-2 pt-2">
                <div className="relative h-64 w-64 shrink-0 flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={105}
                            paddingAngle={0}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            animationDuration={1000}
                            stroke="none"
                            cornerRadius={0}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{totalShortages}</span>
                        <span className="text-xs font-medium text-slate-400 mt-1">Total Items</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <FeedbackState
                        type="empty"
                        title="Sem dados"
                        description="Não há dados disponíveis para exibir."
                        variant="inline"
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-5 w-full">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium text-slate-500 dark:text-slate-400 text-sm truncate max-w-[120px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

          {/* Recent Activity */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 h-full flex flex-col hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atividade Recente</h3>
            </div>
            <div className="space-y-6 flex-1">
              {isChartLoading ? (
                <FeedbackState
                  type="loading"
                  variant="inline"
                  size="sm"
                />
              ) : error ? (
                <FeedbackState
                  type="error"
                  title="Erro ao carregar atividades"
                  description="Ocorreu um erro ao carregar as atividades recentes."
                  onRetry={() => window.location.reload()}
                  variant="inline"
                  size="sm"
                />
              ) : recentShortages.length === 0 ? (
                <FeedbackState
                  type="empty"
                  title="Nenhuma atividade recente"
                  description="Não há atividades recentes encontradas no período."
                  variant="inline"
                  size="sm"
                />
              ) : (
                recentShortages.map((item, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== recentShortages.length - 1 && (
                      <div className="absolute left-[20px] top-10 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-700 -translate-x-1/2 z-0"></div>
                    )}

                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white dark:border-surface-dark shadow-sm z-10 relative shrink-0 ${getIndexColorClass(item.index)}`}>
                      {item.index}
                    </div>

                    <div className="flex-1 flex items-center justify-between min-w-0 py-2">
                      <div className="flex flex-col gap-0.5 mr-2 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{item.esfCil}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap truncate">
                            {item.type && item.type.toLowerCase() === 'photo' ? `Photo ${item.treatment}` : item.treatment}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.user}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0 pl-2">
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap text-right">{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generate Report UI */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-700 pb-4">
              <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-primary flex items-center justify-center text-white shadow-md">
                <Icon name="description" className="!text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Gerar Relatório</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Exportar dados de faltas filtrados.</p>
              </div>
            </div>

            <div className="flex flex-col gap-5 flex-1 justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">De</label>
                    <input
                      type="date"
                      name="startDate"
                      value={reportFilters.startDate}
                      onChange={handleDateChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Até</label>
                    <input
                      type="date"
                      name="endDate"
                      value={reportFilters.endDate}
                      onChange={handleDateChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <CustomSelect
                      label="Índice"
                      value={reportFilters.index}
                      onChange={(val) => handleReportFilterChange('index', val)}
                      options={indexOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <CustomSelect
                      label="Tratamento"
                      value={reportFilters.treatment}
                      onChange={(val) => handleReportFilterChange('treatment', val)}
                      options={treatmentOptions}
                      disabled={reportFilters.index === '1.49'}
                    />
                  </div>
                  {currentUser?.role === 'Administrador' && (
                    <div className="space-y-1.5">
                      <CustomSelect
                        label="Empresa"
                        value={reportFilters.company}
                        onChange={(val) => handleReportFilterChange('company', val)}
                        options={companyOptions}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto">
                <ExportButtons
                  onExportTxt={handleExportTxt}
                  isLoading={isExporting}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;
