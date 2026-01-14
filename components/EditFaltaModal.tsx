import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CustomSelect, SelectOption } from './CustomSelect';
import { Falta } from '../lib/types/database/entities.types';
import type { AuthUser } from '../src/types/api/api.types';
import { indicesService } from '../services/indicesService';
import { tiposService } from '../services/tiposService';
import { tratamentosService } from '../services/tratamentosService';
import { Icon } from './Icon';

interface EditFaltaModalProps {
    isOpen: boolean;
    onClose: () => void;
    falta: Falta | null;
    onSave: (faltaId: string, updates: Partial<Falta>) => Promise<void>;
    currentUser: AuthUser;
}

interface EditFormData {
    indice_id: string;
    tipo_id: string;
    tratamiento_id: string;
    esf: string;
    cil: string;
    quantidade: number;
}

export const EditFaltaModal: React.FC<EditFaltaModalProps> = ({
    isOpen,
    onClose,
    falta,
    onSave,
    currentUser
}) => {
    const [formData, setFormData] = useState<EditFormData>({
        indice_id: '',
        tipo_id: '',
        tratamiento_id: '',
        esf: '',
        cil: '',
        quantidade: 1
    });

    const [sphereError, setSphereError] = useState(false);
    const [cylinderError, setCylinderError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lockTipoTratamento, setLockTipoTratamento] = useState(false);

    // Dynamic Options
    const [dbIndices, setDbIndices] = useState<SelectOption[]>([]);
    const [dbTratamientos, setDbTratamientos] = useState<SelectOption[]>([]);
    const [dbTipos, setDbTipos] = useState<SelectOption[]>([]);

    // Load options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [indices, tratamientos, tipos] = await Promise.all([
                    indicesService.getAllActive(),
                    tratamentosService.getAllActive(),
                    tiposService.getAllActive()
                ]);

                setDbIndices(indices.map(i => ({ value: i.id, label: i.nome })));
                setDbTratamientos(tratamientos.map(t => ({ value: t.id, label: t.nome })));
                setDbTipos(tipos.map(t => ({ value: t.id, label: t.nome })));
            } catch (e) {
                console.error("Failed to load options", e);
            }
        };
        fetchOptions();
    }, []);

    // Populate form when falta changes
    useEffect(() => {
        if (falta) {
            const esfFormatted = falta.esf !== null && falta.esf !== undefined
                ? (falta.esf >= 0 ? `+${falta.esf.toFixed(2)}` : falta.esf.toFixed(2))
                : '';

            const cilFormatted = falta.cil !== null && falta.cil !== undefined
                ? `-${Math.abs(falta.cil).toFixed(2)}`
                : '';

            setFormData({
                indice_id: falta.indice_id || '',
                tipo_id: falta.tipo_id || '',
                tratamiento_id: falta.tratamiento_id || '',
                esf: esfFormatted,
                cil: cilFormatted,
                quantidade: falta.quantidade || 1
            });

            // Check if index is "1.49" to lock tipo/tratamento
            if (falta.indices?.nome === '1.49') {
                setLockTipoTratamento(true);
            } else {
                setLockTipoTratamento(false);
            }
        }
    }, [falta]);

    // --- SMART FORMATTING LOGIC (same as Shortages.tsx) ---
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!value) return;

        // Replace comma with dot for decimal separator
        const normalizedValue = value.replace(',', '.');

        if (name === 'esf') {
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
                setFormData(prev => ({ ...prev, esf: formatted }));
                setSphereError(false);
            }
        }

        if (name === 'cil') {
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
                setFormData(prev => ({ ...prev, cil: formatted }));
                setCylinderError(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'esf') setSphereError(false);
        if (name === 'cil') setCylinderError(false);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof EditFormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Check if index "1.49" is selected
        if (name === 'indice_id') {
            const selectedIndex = dbIndices.find(idx => idx.value === value);
            if (selectedIndex?.label === '1.49') {
                // Find "incolor" options
                const incolorTipo = dbTipos.find(t => t.label.toLowerCase() === 'incolor');
                const incolorTratamento = dbTratamientos.find(t => t.label.toLowerCase() === 'incolor');

                if (incolorTipo && incolorTratamento) {
                    setFormData(prev => ({
                        ...prev,
                        tipo_id: incolorTipo.value,
                        tratamiento_id: incolorTratamento.value
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

        if (cylinderError) {
            alert('Corrija o valor do Cilíndrico.');
            return;
        }

        if (sphereError) {
            alert('Corrija o valor do Esférico.');
            return;
        }

        if (!falta) return;

        setIsSubmitting(true);

        try {
            const updates: Partial<Falta> = {
                indice_id: formData.indice_id,
                tipo_id: formData.tipo_id,
                tratamiento_id: formData.tratamiento_id,
                esf: parseFloat(formData.esf),
                cil: parseFloat(formData.cil),
                quantidade: formData.quantidade
            };

            await onSave(falta.id, updates);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao atualizar registro');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!falta) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Falta">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Especificações da Lente */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <Icon name="lens" className="text-primary !text-base" />
                        Especificações da Lente
                    </h3>

                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <CustomSelect
                                label="Índice de Refração"
                                value={formData.indice_id}
                                onChange={(val) => handleSelectChange('indice_id', val)}
                                options={dbIndices}
                                placeholder="Selecione..."
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Tipo"
                                value={formData.tipo_id}
                                onChange={(val) => handleSelectChange('tipo_id', val)}
                                options={dbTipos}
                                placeholder="Selecione..."
                                disabled={lockTipoTratamento}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Tratamento"
                                value={formData.tratamiento_id}
                                onChange={(val) => handleSelectChange('tratamiento_id', val)}
                                options={dbTratamientos}
                                placeholder="Selecione..."
                                disabled={lockTipoTratamento}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Parâmetros */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <Icon name="tune" className="text-accent-purple !text-base" />
                        Parâmetros
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Esférico (ESF)</label>
                            <div className="relative">
                                <input
                                    name="esf"
                                    value={formData.esf}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400
                                                      ${formData.esf.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}
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
                                    name="cil"
                                    value={formData.cil}
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
                                    name="quantidade"
                                    value={formData.quantidade}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
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

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Icon name="check" className="!text-lg" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
