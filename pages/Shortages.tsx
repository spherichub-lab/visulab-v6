import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { ShortageFormData } from '../types';
import { Toast } from '../components/Toast';
import { indicesService } from '../services/indicesService';
import { tiposService } from '../services/tiposService';
import { tratamentosService } from '../services/tratamentosService';
import { faltasService } from '../services/faltasService';
import { useAuth } from '../src/contexts/AuthContext';

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

const Shortages: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState<ShortageFormData>({
    material: '',
    lensType: '',
    coating: '',
    sphere: '',
    cylinder: '',
    quantity: 1
  });

  const [sphereError, setSphereError] = useState(false);
  const [cylinderError, setCylinderError] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockTipoTratamento, setLockTipoTratamento] = useState(false);

  // Dynamic Options
  const [dbIndices, setDbIndices] = useState<SelectOption[]>([]);
  const [dbTratamientos, setDbTratamientos] = useState<SelectOption[]>([]);
  const [dbTipos, setDbTipos] = useState<SelectOption[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const sphereRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [indices, tratamientos, tipos] = await Promise.all([
          indicesService.getAllActive(),
          tratamentosService.getAllActive(),
          tiposService.getAllActive()
        ]);

        setDbIndices(indices.map(i => ({ value: i.id, label: i.nome })));
        setDbTratamientos(tratamientos.map(t => ({ value: t.id, label: t.nome })));
        setDbTipos(tipos.map(t => ({ value: t.id, label: t.nome })));

        // Only set defaults if form is empty (initial page load)
        setFormData(prev => {
          if (!prev.material && !prev.lensType && !prev.coating) {
            let defaultMaterial = indices.length ? indices[0].id : '';
            let defaultCoating = tratamientos.length ? tratamientos[0].id : '';
            let defaultLensType = tipos.length ? tipos[0].id : '';

            // Check if default index is "1.49"
            if (indices.length && indices[0].nome === '1.49') {
              const incolorTipo = tipos.find(t => t.nome.toLowerCase() === 'incolor');
              const incolorTratamento = tratamientos.find(t => t.nome.toLowerCase() === 'incolor');

              if (incolorTipo && incolorTratamento) {
                defaultLensType = incolorTipo.id;
                defaultCoating = incolorTratamento.id;
                setLockTipoTratamento(true);
              }
            }

            return {
              ...prev,
              material: defaultMaterial,
              coating: defaultCoating,
              lensType: defaultLensType
            };
          }
          return prev;
        });

      } catch (e) {
        console.error("Failed to load options", e);
        showToast("Erro ao carregar opções.", "error");
      }
    };
    fetchData();
  }, [currentUser]);

  const fetchHistory = async () => {
    try {
      // Pass user context to apply visibility rules
      if (!currentUser) {
        console.error('No current user found');
        return;
      }

      const data = await faltasService.getByUserVisibility(currentUser);
      const mapped = data.slice(0, 10).map(f => ({
        index: f.indices?.nome || '-',
        esfCil: 'Lente', // placeholder, logic needed
        user: f.usuarios?.nome || 'User',
        treatment: f.tratamentos?.nome || '-',
        time: f.created_at ? formatTimeAgo(new Date(f.created_at)) : '-',
        quantity: 1,
        type: f.tipos?.nome || '-'
      }));
      setRecentHistory(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory();
    }
  }, [isHistoryOpen]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // --- SMART FORMATTING LOGIC ---
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return;

    // Replace comma with dot for decimal separator
    const normalizedValue = value.replace(',', '.');

    if (name === 'sphere') {
      let num = parseFloat(normalizedValue);
      if (isNaN(num)) return;

      if (Math.abs(num) >= 25 && !normalizedValue.includes('.')) {
        num = num / 100;
      }

      const isStepValid = (Math.abs(num) * 100) % 25 === 0;

      if (!isStepValid) {
        setSphereError(true);
      } else {
        const formatted = num === 0 ? '+0.00' : num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
        setFormData(prev => ({ ...prev, sphere: formatted }));
        setSphereError(false);
      }
    }

    if (name === 'cylinder') {
      let num = parseFloat(normalizedValue);

      if (isNaN(num)) {
        setCylinderError(true);
        return;
      }

      if (Math.abs(num) >= 25 && !normalizedValue.includes('.')) {
        num = num / 100;
      }

      const isStepValid = (Math.abs(num) * 100) % 25 === 0;

      if (!isStepValid) {
        setCylinderError(true);
      } else {
        const absVal = Math.abs(num);
        const formatted = `-${absVal.toFixed(2)}`;
        setFormData(prev => ({ ...prev, cylinder: formatted }));
        setCylinderError(false);
      }
    }
  };

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'sphere') setSphereError(false);
    if (name === 'cylinder') setCylinderError(false);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Select Changes (CustomSelect)
  const handleSelectChange = (name: keyof ShortageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check if index "1.49" is selected
    if (name === 'material') {
      const selectedIndex = dbIndices.find(idx => idx.value === value);
      if (selectedIndex?.label === '1.49') {
        // Find "incolor" options
        const incolorTipo = dbTipos.find(t => t.label.toLowerCase() === 'incolor');
        const incolorTratamento = dbTratamientos.find(t => t.label.toLowerCase() === 'incolor');

        if (incolorTipo && incolorTratamento) {
          setFormData(prev => ({
            ...prev,
            lensType: incolorTipo.value,
            coating: incolorTratamento.value
          }));
          setLockTipoTratamento(true);
        }
      } else {
        setLockTipoTratamento(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showToast("Usuário não autenticado.", "error");
      return;
    }

    if (cylinderError) {
      showToast("Corrija o valor do Cilíndrico.", "error");
      return;
    }

    if (sphereError) {
      showToast("Corrija o valor do Esférico.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!currentUser.empresa_id) {
        showToast("Usuário não possui empresa associada.", "error");
        return;
      }

      console.log('🔍 [SHORTAGES PAGE] About to create falta with user data:', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        userEmpresaId: currentUser.empresa_id,
        userCompany: currentUser.company
      });

      await faltasService.create({
        indice_id: formData.material,
        tipo_id: formData.lensType,
        tratamiento_id: formData.coating,
        esf: parseFloat(formData.sphere),
        cil: parseFloat(formData.cylinder),
        quantidade: formData.quantity,
        usuario_id: currentUser.id,
        empresa_id: currentUser.empresa_id
      });

      showToast(`Falta registrada com sucesso!`, "success");

      setFormData(prev => ({
        ...prev,
        sphere: '',
        cylinder: '',
        quantity: 1
      }));

      // Refocus for next entry
      setTimeout(() => {
        sphereRef.current?.focus();
      }, 0);

    } catch (error: any) {
      console.error(error);
      showToast("Erro ao processar.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col px-4 md:px-6 py-4 w-full max-w-[1440px] mx-auto overflow-hidden relative">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      {/* Header Section */}
      <div className="flex-none mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Registrar Falta</h2>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm whitespace-nowrap"
        >
          <Icon name="history" className="!text-lg" />
          Histórico Recente
        </button>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-white dark:bg-surface-dark rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden mb-2">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 md:px-10 md:py-6 flex-1 overflow-y-auto no-scrollbar flex flex-col justify-start md:justify-center">
            <div className="max-w-5xl mx-auto space-y-6 w-full py-2">

              {/* Section 1 */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Icon name="lens" className="text-primary !text-base" />
                  Especificações da Lente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <CustomSelect
                      label="Índice de Refração"
                      value={formData.material}
                      onChange={(val) => handleSelectChange('material', val)}
                      options={dbIndices}
                      placeholder="Selecione..."
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Tipo"
                      value={formData.lensType}
                      onChange={(val) => handleSelectChange('lensType', val)}
                      options={dbTipos}
                      placeholder="Selecione..."
                      disabled={lockTipoTratamento}
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Tratamento"
                      value={formData.coating}
                      onChange={(val) => handleSelectChange('coating', val)}
                      options={dbTratamientos}
                      placeholder="Selecione..."
                      disabled={lockTipoTratamento}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Icon name="tune" className="text-accent-purple !text-base" />
                  Parâmetros
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Esférico (ESF)</label>
                    <div className="relative">
                      <input
                        name="sphere"
                        ref={sphereRef}
                        value={formData.sphere}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400
                                                    ${formData.sphere.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}
                                                    ${sphereError ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/20 focus:border-primary'}`}
                        placeholder="+0.00"
                        type="text"
                        inputMode="decimal"
                      />
                      {sphereError && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold bg-white dark:bg-slate-900 px-1">ESF inválido</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Cilíndrico (CIL)</label>
                    <div className="relative">
                      <input
                        name="cylinder"
                        value={formData.cylinder}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 text-red-600 dark:text-red-400
                                                        ${cylinderError ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/20 focus:border-primary'}`}
                        placeholder="-0.00"
                        type="text"
                        inputMode="decimal"
                      />
                      {cylinderError && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold bg-white dark:bg-slate-900 px-1">CIL inválido</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Quantidade</label>
                    <div className="relative">
                      <input
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="1"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 pl-4 pr-12 py-2.5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                        type="number"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">QTD</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex-none p-4 md:px-10 md:py-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              onClick={() => {
                // Reset only the parameters, keep specifications (index, type, treatment)
                setFormData(prev => ({
                  ...prev,
                  sphere: '',
                  cylinder: '',
                  quantity: 1
                }));
                setCylinderError(false);
                setSphereError(false);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
              type="button"
            >
              Limpar
            </button>
            <button
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              type="submit"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Icon name="check" className="!text-lg" />
                  Confirmar Falta
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Histórico Recente">
        <div className="w-full overflow-y-auto overflow-x-hidden no-scrollbar space-y-4">
          {recentHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Nenhum registro encontrado.</p>
          ) : (
            recentHistory.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-surface-dark shadow-sm shrink-0 ${getIndexColorClass(item.index)}`}>
                  {item.index || '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.esfCil || 'Lente'}</p>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">{item.time || '-'}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.treatment || '-'} - {item.type || '-'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Shortages;
