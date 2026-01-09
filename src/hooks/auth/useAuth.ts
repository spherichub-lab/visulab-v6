/**
 * useAuth Hook
 * Exports authentication context for use in components
 */

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';

/**
 * Hook to access authentication context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;
