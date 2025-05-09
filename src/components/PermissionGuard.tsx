import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: keyof UserPermissions;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallback 
}: PermissionGuardProps) {
  const { permissions, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!permissions[requiredPermission]) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-medium mb-2">Accès non autorisé</h3>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  return <>{children}</>;
}