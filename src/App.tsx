import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LoginPage } from './pages/LoginPage';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { RapportPage } from './pages/RapportPage';
import { HistoriquePage } from './pages/HistoriquePage';
import { SiteMonitoringPage } from './pages/SiteMonitoringPage';
import { ContremaitrePage } from './pages/ContremaitrePage';
import { AdminPage } from './pages/AdminPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { useTheme } from './hooks/useTheme';
import { useEvents } from './hooks/useEvents';
import { useAuth } from './hooks/useAuth';
import { PermissionGuard } from './components/PermissionGuard';
import type { Projet } from './types';

function AppContent() { 
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null);
  const navigate = useNavigate();
  
  // Mémoiser l'ID du projet pour éviter les re-rendus inutiles
  const projectId = React.useMemo(() => selectedProject?.id || '', [selectedProject]);

  const { 
    events,
    loading: eventsLoading,
    getUpcomingEvents,
    notification,
    setNotification
  } = useEvents(projectId);
  
  const upcomingEvents = React.useMemo(() => {
    if (!user || !selectedProject) return [];
    return getUpcomingEvents();
  }, [user, selectedProject, getUpcomingEvents]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-space-900 text-gray-200' : 'bg-gray-100'}`}>
      <Navigation selectedProject={selectedProject} />
      {selectedProject && (
        <div className={`border-b ${isDark ? 'border-space-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {selectedProject.nom}
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  N° {selectedProject.numeroChantier}
                </p>
              </div>
              {upcomingEvents.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-400"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {upcomingEvents.length} événement{upcomingEvents.length > 1 ? 's' : ''} à venir
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Grouper les événements par type */}
                    {upcomingEvents.length > 0 && ['livraison', 'intervention', 'autre'].map((type) => {
                      const typeEvents = upcomingEvents.filter(e => e.type === type);
                      if (typeEvents.length === 0) return null;
                      
                      return (
                        <div
                          key={type}
                          className="group relative"
                        >
                          {/* Carte de pile */}
                          <div className={`relative flex-shrink-0 w-40 p-3 rounded-lg cursor-pointer 
                            transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:z-50
                            ${typeEvents.length > 1 ? 'pl-6' : ''} ${
                            type === 'livraison' ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/30'
                              : type === 'intervention' ? 'event-intervention'
                              : 'event-autre'
                          }`}>
                            {/* Indicateurs de pile pour plusieurs événements */}
                            {typeEvents.length > 1 && (
                              <>
                                <div className={`absolute left-1.5 top-1.5 w-full h-full rounded-lg -z-20 transform rotate-2 ${
                                  type === 'livraison' ? 'bg-amber-50/80 dark:bg-amber-500/10'
                                    : type === 'intervention' ? 'event-intervention-pile'
                                    : 'event-autre-pile'
                                }`} />
                                <div className={`absolute left-3 top-3 w-full h-full rounded-lg -z-10 transform -rotate-2 ${
                                  type === 'livraison' ? 'bg-amber-50/80 dark:bg-amber-500/10'
                                    : type === 'intervention' ? 'event-intervention-pile'
                                    : 'event-autre-pile'
                                }`} />
                              </>
                            )}
                            
                            
                            {/* Date (Aujourd'hui/Demain) */}
                            <div className={`text-xs mb-1 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {format(new Date(typeEvents[0].date), 'EEEE d MMMM', { locale: fr })}
                            </div>
                            
                            <div className={`text-sm font-medium truncate ${
                              isDark ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {typeEvents.length} {type === 'livraison' ? 'Livraison' : type === 'intervention' ? 'Intervention' : 'Autre'}
                              {typeEvents.length > 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Liste déroulante au survol */}
                          <div className={`invisible group-hover:visible opacity-0 group-hover:opacity-100
                            absolute left-0 mt-1 w-64 z-[60] transition-all duration-200 transform origin-top-left
                            rounded-lg shadow-lg ${
                            isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
                          }`}>
                            {typeEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                                  type === 'livraison'
                                    ? isDark 
                                      ? 'bg-amber-500/10 hover:bg-amber-500/20'
                                      : 'bg-amber-50 hover:bg-amber-100'
                                    : type === 'intervention'
                                      ? isDark
                                        ? 'bg-violet-500/10 hover:bg-violet-500/20'
                                        : 'bg-violet-50 hover:bg-violet-100'
                                      : isDark
                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20'
                                        : 'bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {format(new Date(event.date), 'HH:mm')}
                                  </span>
                                  {event.priority === 'high' && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      isDark
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      Urgent
                                    </span>
                                  )}
                                </div>
                                <h4 className={`font-medium ${
                                  isDark ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {event.title}
                                </h4>
                                <p className={`text-sm mt-1 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {event.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg ${
          notification.type === 'success'
            ? isDark 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-green-100 text-green-800'
            : isDark
              ? 'bg-red-500/20 text-red-300'
              : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage selectedProject={selectedProject} onProjectSelect={setSelectedProject} />} />
        <Route 
          path="/rapport" 
          element={
            <PermissionGuard 
              requiredPermission="editPlanning"
              fallback={<Navigate to="/" replace />}
            >
              {selectedProject ? 
                <RapportPage projectId={selectedProject.id} selectedProject={selectedProject} /> 
                : <Navigate to="/" replace />
              }
            </PermissionGuard>
          } 
        />
        <Route 
          path="/historique" 
          element={
            <PermissionGuard 
              requiredPermission="viewPlanning"
              fallback={<Navigate to="/" replace />}
            >
              {selectedProject ? 
                <HistoriquePage projectId={selectedProject.id} /> 
                : <Navigate to="/" replace />
              }
            </PermissionGuard>
          } 
        />
        <Route 
          path="/suivi" 
          element={
            <PermissionGuard 
              requiredPermission="viewPlanning"
              fallback={<Navigate to="/" replace />}
            >
              {selectedProject ? 
                <SiteMonitoringPage projectId={selectedProject.id} /> 
                : <Navigate to="/" replace />
              }
            </PermissionGuard>
          } 
        />
        <Route 
          path="/contremaitre" 
          element={
            <PermissionGuard 
              requiredPermission="viewPlanning"
              fallback={<Navigate to="/" replace />}
            >
              {selectedProject ? 
                <ContremaitrePage projectId={selectedProject.id} selectedProject={selectedProject} /> 
                : <Navigate to="/" replace />
              }
            </PermissionGuard>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <PermissionGuard 
              requiredPermission="createProject"
              fallback={<Navigate to="/" replace />}
            >
              <AdminPage />
            </PermissionGuard>
          } 
        />
        <Route 
          path="/profile" 
          element={<UserProfilePage />} 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;