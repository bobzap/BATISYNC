import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Save, X, UserCircle } from 'lucide-react';

export function UserProfilePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Mettre à jour le formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Mettre à jour le profil
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mettre à jour le mot de passe si nécessaire
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.newPassword
        });

        if (passwordError) throw passwordError;

        // Réinitialiser les champs de mot de passe
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <h1 className={`text-3xl font-bold mb-4 ${
          isDark ? 'text-galaxy-100' : 'text-blue-900'
        }`}>
          Mon profil
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Informations de profil */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Informations personnelles
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {error && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {error}
              </div>
            )}
            {success && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {success}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Prénom
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Nom
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                } opacity-70 cursor-not-allowed`}
              />
              <p className={`mt-1 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                L'email ne peut pas être modifié
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Rôle
              </label>
              <div className={`px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-space-900 border-space-700 text-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
              }`}>
                {user?.role === 'super_admin' ? 'Super Admin' :
                 user?.role === 'admin' ? 'Administrateur' :
                 user?.role === 'conducteur' ? 'Conducteur de travaux' :
                 'Contremaître'}
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                  loading ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
              </button>
            </div>
          </div>
        </div>

        {/* Changement de mot de passe */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Changer de mot de passe
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={profileData.currentPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={profileData.newPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="pt-4">
              <button
                onClick={handleUpdateProfile}
                disabled={loading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword || profileData.newPassword !== profileData.confirmPassword}
                className={`w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                  (loading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword || profileData.newPassword !== profileData.confirmPassword)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </div>
          </div>
        </div>

        {/* Informations du compte */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Informations du compte
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center mb-6">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-medium ${
                isDark ? 'bg-space-700' : 'bg-gray-200'
              }`}>
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Date d'inscription
                </p>
                <p className={`font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Dernière connexion
                </p>
                <p className={`font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Statut du compte
                </p>
                <p className={`font-medium ${
                  isDark ? 'text-green-300' : 'text-green-600'
                }`}>
                  Actif
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}