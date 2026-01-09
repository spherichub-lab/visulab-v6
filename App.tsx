import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Shortages from './pages/Shortages';
import Users from './pages/Users';
import Companies from './pages/Companies';
import Purchases from './pages/Purchases';
import Login from './pages/Login';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProtectedRoute } from './src/components/auth/ProtectedRoute';
import type { UserRole } from './src/components/auth/ProtectedRoute';

// Define Theme Context Props
interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col font-display antialiased overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {!isLoginPage && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <main className={`flex-1 flex flex-col overflow-hidden relative w-full ${!isLoginPage ? 'max-w-[1440px] mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {

  // Query Client for TanStack Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }));

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Navigate to="/" replace />} />

              {/*
             * Dashboard Route
             * Access: All authenticated users
             * No specific role requirements
             */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/*
             * Shortages Route
             * Access: All authenticated users
             * No specific role requirements
             */}
              <Route
                path="/shortages"
                element={
                  <ProtectedRoute>
                    <Shortages />
                  </ProtectedRoute>
                }
              />

              {/*
              * Users Route
              * Access: Administrators only
              * This route requires the 'Administrador' role
              */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRoles={['Administrador']}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/*
              * Companies Route
              * Access: Administrators only
              * This route requires the 'Administrador' role
              */}
              <Route
                path="/companies"
                element={
                  <ProtectedRoute requiredRoles={['Administrador']}>
                    <Companies />
                  </ProtectedRoute>
                }
              />

              {/*
              * Purchases Route
              * Access: Administrators only
              * This route requires the 'Administrador' role
              */}
              <Route
                path="/purchases"
                element={
                  <ProtectedRoute requiredRoles={['Administrador']}>
                    <Purchases />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;