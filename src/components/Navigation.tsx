import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Sun, Moon, History, Lock, BarChart as ChartBar, UserCircle, LogOut, Shield, User, HardHat } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Projet } from '../types';

interface NavigationProps {
  selectedProject?: Projet | null;
}

export function Navigation({ selectedProject }: NavigationProps) {
  const location = useLocation();
  const { isDark, setIsDark } = useTheme();
  const { user, permissions, isAdmin, isConducteur, isContremaitre } = useAuth();
  
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    
    // Redirect to login page
    window.location.href = '/';
  };

  return (
    <nav className={`transition-all duration-200 shadow-sm ${
      isDark 
        ? 'bg-space-800 border-b border-space-700'
        : 'bg-white border-b border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center pr-8 border-r border-gray-200 dark:border-space-700">
              <span className={`text-xl font-bold ${
                isDark ? 'text-galaxy-100' : 'text-gray-900'
              }`}>
                BatiSync
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  location.pathname === '/'
                    ? isDark
                      ? 'border-blue-500 text-blue-100'
                      : 'border-blue-600 text-blue-900'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:border-galaxy-500/50 hover:text-galaxy-200'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } px-4 py-2 font-medium tracking-wide relative group`}
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
                {location.pathname === '/' && (
                  <span className={`absolute inset-x-0 -bottom-px h-px ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                )}
              </Link>
              <Link
                to="/rapport"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${!selectedProject && 'pointer-events-none opacity-50'} ${
                  location.pathname === '/rapport'
                    ? isDark
                      ? 'border-blue-500 text-blue-100'
                      : 'border-blue-600 text-blue-900'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:border-galaxy-500/50 hover:text-galaxy-200'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } px-4 py-2 font-medium tracking-wide relative group`}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Rapport journalier
                {!selectedProject && <Lock className="w-3 h-3 ml-2" />}
                {location.pathname === '/rapport' && (
                  <span className={`absolute inset-x-0 -bottom-px h-px ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                )}
              </Link>
              <Link
                to="/contremaitre"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${!selectedProject && 'pointer-events-none opacity-50'} ${
                  location.pathname === '/contremaitre'
                    ? isDark
                      ? 'border-blue-500 text-blue-100'
                      : 'border-blue-600 text-blue-900'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:border-galaxy-500/50 hover:text-galaxy-200'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } px-4 py-2 font-medium tracking-wide relative group`}
              >
                <HardHat className="w-4 h-4 mr-2" />
                Contremaître
                {!selectedProject && <Lock className="w-3 h-3 ml-2" />}
                {location.pathname === '/contremaitre' && (
                  <span className={`absolute inset-x-0 -bottom-px h-px ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                )}
              </Link>
              <Link
                to="/historique"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${!selectedProject && 'pointer-events-none opacity-50'} ${
                  location.pathname === '/historique'
                    ? isDark
                      ? 'border-blue-500 text-blue-100'
                      : 'border-blue-600 text-blue-900'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:border-galaxy-500/50 hover:text-galaxy-200'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } px-4 py-2 font-medium tracking-wide relative group`}
              >
                <History className="w-4 h-4 mr-2" />
                Historique
                {!selectedProject && <Lock className="w-3 h-3 ml-2" />}
                {location.pathname === '/historique' && (
                  <span className={`absolute inset-x-0 -bottom-px h-px ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                )}
              </Link>
              <Link
                to="/suivi"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${!selectedProject && 'pointer-events-none opacity-50'} ${
                  location.pathname === '/suivi'
                    ? isDark
                      ? 'border-blue-500 text-blue-100'
                      : 'border-blue-600 text-blue-900'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:border-galaxy-500/50 hover:text-galaxy-200'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } px-4 py-2 font-medium tracking-wide relative group`}
              >
                <ChartBar className="w-4 h-4 mr-2" />
                Suivi de chantier
                {!selectedProject && <Lock className="w-3 h-3 ml-2" />}
                {location.pathname === '/suivi' && (
                  <span className={`absolute inset-x-0 -bottom-px h-px ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                )}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="relative group">
              <button className="flex items-center gap-2">
                <UserCircle className={`w-6 h-6 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`} />
                <span className={`text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {user?.firstName || user?.email?.split('@')[0] || 'Utilisateur'}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  user?.role === 'admin' || user?.role === 'super_admin'
                    ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                    : user?.role === 'conducteur'
                      ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                      : isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                }`}>
                  {user?.role === 'admin' || user?.role === 'super_admin'
                    ? 'Admin'
                    : user?.role === 'conducteur'
                      ? 'Conducteur'
                      : 'Contremaître'}
                </span>
              </button>
              
              {/* Dropdown menu */}
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10 
                invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
              }`}>
                <Link
                  to="/profile"
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    isDark
                      ? 'text-gray-300 hover:bg-space-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  Mon profil
                </Link>
                {(isAdmin || isConducteur) && (
                  <Link
                    to="/admin"
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      isDark
                        ? 'text-gray-300 hover:bg-space-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Administration
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    isDark
                      ? 'text-gray-300 hover:bg-space-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </button>
              </div>
            </div>
            
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-space-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}