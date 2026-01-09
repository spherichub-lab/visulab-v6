/**
 * Login Page
 * Enhanced with improved error handling, form validation, and user feedback
 *
 * IMPROVEMENTS:
 * - Specific error messages for different login failure scenarios
 * - Form validation with helpful error messages
 * - Loading states during authentication
 * - Network error handling with retry option
 * - Offline detection
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Toast } from '../components/Toast';
import { useAuth } from '../src/hooks/auth/useAuth';
import { Icon } from '../components/Icon';
import { Button } from '../src/components/ui/button/Button';
import { checkOfflineStatus } from '../src/utils/errorHandler';

interface FormErrors {
  email?: string;
  password?: string;
}

interface LoginError {
  type: 'invalid_credentials' | 'network_error' | 'offline' | 'unknown';
  message: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isOffline, setIsOffline] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const { login } = useAuth();

  // Check offline status on mount and when connection changes
  useEffect(() => {
    const checkStatus = () => setIsOffline(checkOfflineStatus());

    checkStatus();
    window.addEventListener('online', checkStatus);
    window.addEventListener('offline', checkStatus);

    return () => {
      window.removeEventListener('online', checkStatus);
      window.removeEventListener('offline', checkStatus);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Determine error type from error message
   */
  const getLoginError = (error: any): LoginError => {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('invalid') || message.includes('credential') || message.includes('email')) {
      return {
        type: 'invalid_credentials',
        message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network_error',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'Erro ao realizar login. Tente novamente.',
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if offline
    if (isOffline) {
      showToast('Você está offline. Conecte-se à internet para fazer login.', 'warning');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      console.log('🔍 [LOGIN DIAGNOSTIC] Starting login attempt:', {
        email,
        timestamp: new Date().toISOString(),
        isOffline: navigator.onLine,
        userAgent: navigator.userAgent
      });

      await login({ email, password });
      showToast('Login realizado com sucesso!', 'success');

      // Navigate after a short delay to allow the toast to be seen
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('❌ [LOGIN DIAGNOSTIC] Login failed:', {
        error: error,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        isOffline: navigator.onLine
      });

      const loginError = getLoginError(error);
      showToast(loginError.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry login with same credentials
   */
  const handleRetry = async () => {
    if (isOffline) {
      showToast('Você ainda está offline. Aguarde a conexão ser restaurada.', 'warning');
      return;
    }

    setIsRetrying(true);
    try {
      await handleLogin(new Event('submit') as any);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex items-center justify-center font-display p-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <div className="w-full max-w-[420px] bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header Section */}
        <div className="bg-slate-900 dark:bg-background-dark p-10 flex flex-col items-center justify-center text-center pt-14 pb-14">
          <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10 shadow-lg">
            <Logo className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">VisuLab</h1>
          <p className="text-slate-400 text-lg font-medium">Registro de Faltas do Estoque</p>
        </div>

        {/* Offline Warning Banner */}
        {isOffline && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-8 py-3 flex items-center gap-2">
            <Icon name="wifi_off" className="!text-amber-600 dark:text-amber-400 !text-xl" />
            <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Você está offline. Algumas funcionalidades podem não funcionar.
            </span>
          </div>
        )}

        {/* Form Section (Light) */}
        <div className="p-8 pt-10 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1" htmlFor="email">
                Usuário
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[24px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="nome@empresa.com"
                  className={cn(
                    'w-full rounded-2xl border bg-white dark:bg-slate-900 pl-12 pr-4 py-4 text-slate-900 dark:text-white text-base font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 shadow-sm',
                    formErrors.email
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 focus:ring-slate-900/10 focus:border-slate-900'
                  )}
                  disabled={loading || isOffline}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                />
              </div>
              {formErrors.email && (
                <p id="email-error" className="mt-1.5 ml-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Icon name="error" className="!text-base" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[24px]">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear error when user starts typing
                    if (formErrors.password) {
                      setFormErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="•••••"
                  className={cn(
                    'w-full rounded-2xl border bg-white dark:bg-slate-900 pl-12 pr-4 py-4 text-slate-900 dark:text-white text-base font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 shadow-sm',
                    formErrors.password
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 focus:ring-slate-900/10 focus:border-slate-900'
                  )}
                  disabled={loading || isOffline}
                  aria-invalid={!!formErrors.password}
                  aria-describedby={formErrors.password ? 'password-error' : undefined}
                />
              </div>
              {formErrors.password && (
                <p id="password-error" className="mt-1.5 ml-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Icon name="error" className="!text-base" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isOffline}
              className="w-full py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed mt-8"
            >
              {loading || isRetrying ? (
                <>
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isRetrying ? 'Tentando novamente...' : 'Entrando...'}</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            {/* Retry Button (shown after error) */}
            {toast.type === 'error' && !loading && (
              <div className="mt-4">
                <Button
                  onClick={handleRetry}
                  variant="secondary"
                  size="md"
                  icon="refresh"
                  className="w-full"
                  disabled={isOffline}
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function for className merging
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default Login;
