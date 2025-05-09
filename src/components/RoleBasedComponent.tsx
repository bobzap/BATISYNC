import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles: Array<'super_admin' | 'admin' | 'conducteur' | 'contremaitre'>;
  fallback?: React.ReactNode;
}

export function RoleBasedComponent({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedComponentProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}