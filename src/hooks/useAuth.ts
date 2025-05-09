import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthState, User, UserPermissions } from '../types';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    permissions: {
      createProject: false,
      editProject: false,
      viewPlanning: true,
      editPlanning: false,
      viewContracts: false,
      editContracts: false,
      viewVouchers: false,
      editVouchers: false,
      viewInvoices: false,
      editInvoices: false,
      viewCosts: false,
      editCosts: false
    }
  });

  // Calculate permissions based on user role
  const calculatePermissions = (userRole: string | null, currentUser: User | null): UserPermissions => {
    if (!currentUser) {
      return {
        createProject: false,
        editProject: false,
        viewPlanning: false,
        editPlanning: false,
        viewContracts: false,
        editContracts: false,
        viewVouchers: false,
        editVouchers: false,
        viewInvoices: false,
        editInvoices: false,
        viewCosts: false,
        editCosts: false
      };
    }

    switch (userRole) {
      case 'super_admin':
      case 'admin':
        // Admin has all permissions
        return {
          createProject: true,
          editProject: true,
          viewPlanning: true,
          editPlanning: true,
          viewContracts: true,
          editContracts: true,
          viewVouchers: true,
          editVouchers: true,
          viewInvoices: true,
          editInvoices: true,
          viewCosts: true,
          editCosts: true
        };
      case 'conducteur':
        // Conducteur de travaux (N+1) has all permissions except some admin functions
        return {
          createProject: true,
          editProject: true,
          viewPlanning: true,
          editPlanning: true,
          viewContracts: true,
          editContracts: true,
          viewVouchers: true,
          editVouchers: true,
          viewInvoices: true,
          editInvoices: true,
          viewCosts: true,
          editCosts: true
        };
      case 'contremaitre':
        // Contremaître (N) has limited permissions
        return {
          createProject: false,
          editProject: false,
          viewPlanning: true,
          editPlanning: true,
          viewContracts: false,
          editContracts: false,
          viewVouchers: false,
          editVouchers: false,
          viewInvoices: false,
          editInvoices: false,
          viewCosts: false,
          editCosts: false
        };
      default:
        return {
          createProject: false,
          editProject: false,
          viewPlanning: false,
          editPlanning: false,
          viewContracts: false,
          editContracts: false,
          viewVouchers: false,
          editVouchers: false,
          viewInvoices: false,
          editInvoices: false,
          viewCosts: false,
          editCosts: false
        };
    }
  };

  useEffect(() => {
    // For development, check localStorage first
    const storedRole = localStorage.getItem('user_role');
    const storedEmail = localStorage.getItem('user_email');
    
    if (storedRole && storedEmail) {
      // Create a mock user from localStorage
      const mockUser: User = {
        id: 'local-user-id',
        email: storedEmail,
        firstName: storedEmail.split('@')[0],
        lastName: '',
        role: storedRole as User['role'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const permissions = calculatePermissions(storedRole, mockUser);
      
      setState({
        user: mockUser,
        session: { user: mockUser },
        loading: false,
        error: null,
        permissions
      });
      
      return;
    }
    
    // If no localStorage data, check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user as User | null;
      const permissions = calculatePermissions(user?.role, user);
      
      setState(prev => ({
        ...prev,
        session,
        user,
        loading: false,
        permissions
      }));
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user as User | null;
      const permissions = calculatePermissions(user?.role, user);
      
      setState(prev => ({
        ...prev,
        session,
        user,
        loading: false,
        permissions
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    isAdmin: state.user?.role === 'admin' || state.user?.role === 'super_admin', 
    isConducteur: state.user?.role === 'conducteur',
    isContremaitre: state.user?.role === 'contremaitre'
  };
}