import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Search } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import { UserManagement } from '../components/UserManagement';
import { RoleBasedComponent } from '../components/RoleBasedComponent';

export function AdminPage() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className={isDark ? 'text-blue-400' : 'text-blue-500'} />
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-galaxy-100' : 'text-blue-900'
            }`}>
              Administration
            </h1>
          </div>
          <RoleBasedComponent allowedRoles={['super_admin', 'admin']}>
            <button className="button-primary">
              <Users className="w-4 h-4 mr-2" />
              Inviter un utilisateur
            </button>
          </RoleBasedComponent>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Gérez les utilisateurs et leurs permissions
        </p>
      </div>

      <UserManagement />
    </div>
  );
}