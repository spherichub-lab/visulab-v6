/**
 * Hook for managing empresa form state and validation
 * Provides reusable form logic for create and edit operations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { EmpresaFormData } from '../../types/domain/domain.types';

// Form validation errors interface
export interface EmpresaFormErrors {
    nome?: string;
    tipo?: string;
    contato_email?: string;
    status?: string;
}

// Hook options interface
export interface UseEmpresaFormOptions {
    initialData?: Partial<EmpresaFormData>;
    onSubmit: (data: EmpresaFormData) => Promise<void>;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    existingEmpresas?: any[];
    isEditing?: boolean;
}

// Validation rules
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateNome = (nome: string): boolean => {
    return nome.trim().length >= 3;
};

// Main hook
export const useEmpresaForm = ({
    initialData,
    onSubmit,
    onSuccess,
    onError,
    existingEmpresas = [],
    isEditing = false
}: UseEmpresaFormOptions) => {
    // Form state
    const [formData, setFormData] = useState<EmpresaFormData>({
        nome: '',
        tipo: 'Fornecedor',
        contato_nome: '',
        contato_email: '',
        status: 'Ativa',
        ...initialData
    });

    // Validation errors state
    const [errors, setErrors] = useState<EmpresaFormErrors>({});

    // Form state metadata
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<keyof EmpresaFormData, boolean>>({
        nome: false,
        tipo: false,
        contato_nome: false,
        contato_email: false,
        status: false
    });

    // Validate individual field
    const validateField = useCallback((name: keyof EmpresaFormData, value: any): string | undefined => {
        switch (name) {
            case 'nome':
                if (!value || value.trim().length === 0) {
                    return 'Nome da empresa é obrigatório';
                }
                if (!validateNome(value)) {
                    return 'Nome deve ter pelo menos 3 caracteres';
                }
                break;

            case 'tipo':
                if (!value) {
                    return 'Tipo da empresa é obrigatório';
                }
                // Validar matriz única apenas em modo de criação
                if (value === 'Matriz' && !isEditing && existingEmpresas.length > 0) {
                    const hasMatriz = existingEmpresas.some((e: any) => e.tipo === 'Matriz');
                    if (hasMatriz) {
                        return 'Já existe uma Matriz cadastrada. Só pode existir uma Matriz.';
                    }
                }
                break;

            case 'contato_email':
                if (value && !validateEmail(value)) {
                    return 'Email inválido';
                }
                break;

            case 'status':
                if (!value) {
                    return 'Status é obrigatório';
                }
                break;

            default:
                return undefined;
        }
    }, []);

    // Validate entire form
    const validateForm = useCallback((): EmpresaFormErrors => {
        const newErrors: EmpresaFormErrors = {};

        // Validate each field
        Object.keys(formData).forEach((key) => {
            const fieldKey = key as keyof EmpresaFormData;
            const error = validateField(fieldKey, formData[fieldKey]);
            if (error) {
                newErrors[fieldKey] = error;
            }
        });

        return newErrors;
    }, [formData, validateField]);

    // Handle field change
    const handleChange = useCallback((name: keyof EmpresaFormData, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
        setIsDirty(true);

        // Clear field error when user starts typing
        if (errors[name as keyof EmpresaFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);

    // Handle field blur
    const handleBlur = useCallback((name: keyof EmpresaFormData) => {
        setTouched(prev => ({ ...prev, [name]: true }));

        // Validate field on blur
        const error = validateField(name, formData[name]);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [formData, validateField]);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData({
            nome: '',
            tipo: 'Fornecedor',
            contato_nome: '',
            contato_email: '',
            status: 'Ativa',
            ...initialData
        });
        setErrors({});
        setTouched({
            nome: false,
            tipo: false,
            contato_nome: false,
            contato_email: false,
            status: false
        });
        setIsDirty(false);
    }, [initialData]);

    // Submit form
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Validate all fields
        const validationErrors = validateForm();
        setErrors(validationErrors);

        // Mark all fields as touched
        setTouched({
            nome: true,
            tipo: true,
            contato_nome: true,
            contato_email: true,
            status: true
        });

        // If there are errors, don't submit
        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formData);

            // Reset form on success
            resetForm();
            onSuccess?.();
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, onSubmit, onSuccess, onError, resetForm]);

    // Check if form is valid
    const isValid = useCallback(() => {
        const validationErrors = validateForm();
        return Object.keys(validationErrors).length === 0;
    }, [validateForm]);

    // Get field error
    const getFieldError = useCallback((name: keyof EmpresaFormData) => {
        return touched[name] ? errors[name as keyof EmpresaFormErrors] : undefined;
    }, [touched, errors]);

    // Check if field has error
    const hasFieldError = useCallback((name: keyof EmpresaFormData) => {
        return !!getFieldError(name);
    }, [getFieldError]);

    // Update form data when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    return {
        // Form state
        formData,
        errors,
        touched,
        isDirty,
        isSubmitting,

        // Form methods
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,

        // Validation helpers
        isValid,
        getFieldError,
        hasFieldError,
        validateField,
        validateForm
    };
};

export default useEmpresaForm;