import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Modal } from './Modal';
import { useAuth } from '../src/hooks/auth/useAuth';

// Helper to get CSS classes based on company (Distinct Colors)
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

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, logout, updatePassword, updateProfile } = useAuth();

  // User Profile State - derived from auth context
  const [userProfile, setUserProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    role: user?.role || 'Usuário',
    password: ''
  });

  // Update profile when auth user changes
  React.useEffect(() => {
    if (user) {
      setUserProfile(prev => {
        // Only update if values have actually changed
        if (prev.name === user.name &&
          prev.email === user.email &&
          prev.company === (user.company || '') &&
          prev.role === user.role) {
          return prev;
        }
        return {
          ...prev,
          name: user.name,
          email: user.email,
          company: user.company || '',
          role: user.role,
        };
      });
    }
  }, [user?.name, user?.email, user?.company, user?.role]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even on error
      navigate('/');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update name if changed
      if (userProfile.name !== user?.name) {
        await updateProfile({ name: userProfile.name });
      }

      // Update password if provided
      if (userProfile.password && userProfile.password.trim().length >= 6) {
        await updatePassword(userProfile.password);
      } else if (userProfile.password && userProfile.password.trim().length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      setIsSettingsOpen(false);
      setUserProfile(prev => ({ ...prev, password: '' }));

      if (userProfile.password) {
        alert('Senha atualizada com sucesso! Você precisará fazer login novamente com a nova senha.');
      } else {
        alert('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil: ' + (error as Error).message);
    }
  };

  const navItems = [
    { name: 'Painel', path: '/dashboard' },
    { name: 'Faltas', path: '/shortages' },
    { name: 'Usuários', path: '/users', adminOnly: true },
    { name: 'Empresas', path: '/companies', adminOnly: true },
    { name: 'Compras', path: '/purchases', adminOnly: true },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    // Temporarily allow all pages until RLS is configured
    // return true;

    if (item.adminOnly) {
      return userProfile.role === 'Administrador';
    }
    return true;
  });

  return (
    <>
      <div className="px-3 pt-3 md:px-6 md:pt-6 w-full max-w-[1440px] mx-auto z-20 relative flex-none">
        <nav className="w-full rounded-2xl md:rounded-full bg-white dark:bg-surface-dark shadow-soft border border-slate-100 dark:border-slate-700 p-2 pl-3 md:pl-4 pr-2 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 md:border-r border-slate-100 dark:border-slate-700">
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-primary text-white shadow-md">
                <Logo className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              {/* Title with Company Name appended */}
              <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block whitespace-nowrap">
                VisuLab <span className="font-medium text-slate-400 dark:text-slate-500">- {userProfile.company}</span>
              </h1>
            </div>

            <div className="hidden lg:flex items-center bg-slate-100/80 dark:bg-slate-700/50 rounded-full p-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${isActive
                      ? 'bg-slate-900 dark:bg-primary text-white shadow-sm font-semibold'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label="Alternar Tema"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} className="!text-lg md:!text-2xl" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label="Configurações"
              title="Configurações da Conta"
            >
              <Icon name="settings" className="!text-lg md:!text-2xl" />
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-2 md:gap-3 pl-1">
              <div className="flex items-center gap-2 md:gap-3">
                {/* User Info Block */}
                <div className="text-right hidden md:flex flex-col items-end justify-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{userProfile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{userProfile.company}</p>

                  {/* Admin Badge */}
                  {userProfile.role === 'Administrador' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-accent-purple dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded leading-none mt-0.5">
                      <Icon name="admin_panel_settings" className="!text-sm" filled />
                      <span>Administrador</span>
                    </div>
                  )}
                </div>
                <div
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-slate-600 shadow-sm ${getCompanyLogoStyle(userProfile.company)}`}
                >
                  {getCompanyInitials(userProfile.company)}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                title="Sair"
                aria-label="Sair"
              >
                <Icon name="logout" className="!text-lg md:!text-xl" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="lg:hidden mt-3 md:mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${isActive
                    ? 'bg-slate-900 dark:bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Configurações da Conta">
        <form onSubmit={handleSaveProfile} className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Nome Completo</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Empresa</label>
            <input
              type="text"
              value={userProfile.company}
              readOnly
              disabled
              className="w-full rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">E-mail</label>
            <input
              type="email"
              value={userProfile.email}
              readOnly
              disabled
              className="w-full rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium focus:outline-none cursor-not-allowed opacity-70"
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1">O e-mail e empresa não podem ser alterados. Contate o suporte.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Alterar Senha</label>
            <input
              type="password"
              value={userProfile.password}
              onChange={(e) => setUserProfile({ ...userProfile, password: e.target.value })}
              placeholder="Deixe em branco para manter a atual"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="pt-2 md:pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-primary-dark transition-all"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Sair do Sistema">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/30">
              <Icon name="logout" className="!text-3xl" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tem certeza que deseja sair?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-2">
              Você precisará fazer login novamente com suas credenciais para acessar o sistema.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Sim, Sair
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;