import React, { useState, useEffect } from 'react';
import { UserPlus, UserX, Edit, Save, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { RoleBasedComponent } from './RoleBasedComponent';

export function UserManagement() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'contremaitre' as User['role'],
    password: ''
  });

  // Charger les utilisateurs
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data as User[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Ajouter un utilisateur
  const handleAddUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
        throw new Error('Tous les champs sont obligatoires');
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Créer le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          role: newUser.role
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Mettre à jour l'état
      setUsers(prev => [profileData as User, ...prev]);
      setIsAddingUser(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'contremaitre',
        password: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un utilisateur
  const handleUpdateUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) throw new Error('Utilisateur non trouvé');

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: userToUpdate.firstName,
          last_name: userToUpdate.lastName,
          role: userToUpdate.role
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      setEditingUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Supprimer l'utilisateur de Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Mettre à jour l'état
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleBasedComponent allowedRoles={['super_admin', 'admin']}>
      <div className={`rounded-lg border ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className={`p-4 border-b ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Gestion des utilisateurs
            </h3>
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isAddingUser ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isAddingUser ? 'Annuler' : 'Ajouter un utilisateur'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className={`p-4 ${
            isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}

        {isAddingUser && (
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Prénom *
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nom *
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Rôle *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value="admin">Administrateur</option>
                  <option value="conducteur">Conducteur de travaux</option>
                  <option value="contremaitre">Contremaître</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddUser}
                disabled={loading}
                className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                  loading ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {loading ? 'Ajout en cours...' : 'Ajouter l\'utilisateur'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-4 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-4 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${
                    isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-medium ${
                          isDark ? 'bg-space-600' : 'bg-gray-200'
                        }`}>
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          {editingUserId === user.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={user.firstName || ''}
                                onChange={(e) => setUsers(prev => prev.map(u => 
                                  u.id === user.id ? { ...u, firstName: e.target.value } : u
                                ))}
                                className={`w-24 rounded-lg border ${
                                  isDark
                                    ? 'bg-space-900 border-space-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                              <input
                                type="text"
                                value={user.lastName || ''}
                                onChange={(e) => setUsers(prev => prev.map(u => 
                                  u.id === user.id ? { ...u, lastName: e.target.value } : u
                                ))}
                                className={`w-24 rounded-lg border ${
                                  isDark
                                    ? 'bg-space-900 border-space-700 text-gray-200'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                          ) : (
                            <div className={`font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {user.firstName} {user.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <select
                          value={user.role}
                          onChange={(e) => setUsers(prev => prev.map(u => 
                            u.id === user.id ? { ...u, role: e.target.value as User['role'] } : u
                          ))}
                          className={`rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="admin">Administrateur</option>
                          <option value="conducteur">Conducteur de travaux</option>
                          <option value="contremaitre">Contremaître</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'super_admin' || user.role === 'admin'
                            ? isDark
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-purple-100 text-purple-800'
                            : user.role === 'conducteur'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                              : isDark
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' :
                           user.role === 'admin' ? 'Administrateur' :
                           user.role === 'conducteur' ? 'Conducteur de travaux' :
                           'Contremaître'}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUserId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUserId(null)}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateUser(user.id)}
                            disabled={loading}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? 'hover:bg-green-500/20 text-green-400 hover:text-green-300'
                                : 'hover:bg-green-50 text-green-600 hover:text-green-700'
                            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading || user.role === 'super_admin'}
                            className={`p-2 rounded-lg ${
                              user.role === 'super_admin'
                                ? 'opacity-50 cursor-not-allowed'
                                : isDark
                                  ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleBasedComponent>
  );
}