import React, { useState } from 'react';
import { LogIn, Building2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // For development, we'll use hardcoded credentials
      const validCredentials = [
        { email: 'admin@batisync.com', password: '123', role: 'admin' },
        { email: 'conducteur@batisync.com', password: '123', role: 'conducteur' },
        { email: 'contremaitre@batisync.com', password: '123', role: 'contremaitre' }
      ];
      
      const matchedUser = validCredentials.find(
        cred => cred.email === email && cred.password === password
      );
      
      if (matchedUser) {
        // Simulate successful login
        localStorage.setItem('user_role', matchedUser.role);
        localStorage.setItem('user_email', matchedUser.email);
        onLogin();
        return;
      }
      
      throw new Error('Email ou mot de passe incorrect');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Voile semi-transparent */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

      <div className={`max-w-md w-full space-y-8 p-8 rounded-xl ${
        isDark 
          ? 'bg-space-800/95 border border-space-700' 
          : 'bg-white/95 border border-gray-200 shadow-lg'
        } relative z-10
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center ${
            isDark ? 'bg-space-700' : 'bg-blue-50'
          }`}>
            <Building2 className={`w-8 h-8 ${
              isDark ? 'text-blue-400' : 'text-blue-500'
            }`} />
          </div>
          

          
          <h2 className={`mt-6 text-3xl font-bold ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            BatiSync
          </h2>
          <p className={`mt-2 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Connectez-vous pour accéder à votre espace de gestion de chantier
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-lg text-sm ${
            isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={`form-input block w-full px-3 py-2 border rounded-lg shadow-sm ${
                    isDark 
                      ? 'bg-space-900 border-space-700 text-gray-200 focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={`form-input block w-full px-3 py-2 border rounded-lg shadow-sm ${
                    isDark 
                      ? 'bg-space-900 border-space-700 text-gray-200 focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className={`h-4 w-4 rounded border focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-space-900 border-space-700 text-blue-500'
                    : 'border-gray-300 text-blue-600'
                }`}
              />
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className={`font-medium ${
                isDark 
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-500'
              }`}>
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isDark
                  ? 'bg-blue-500 hover:bg-blue-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200
              ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}