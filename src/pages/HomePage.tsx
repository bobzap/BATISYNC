import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Personnel, Machine, Projet } from '../types';
import { addHeuresReference, getHeuresReference, getPersonnelByProject, getMachinesByProject, supabase } from '../lib/supabase';
import { PersonnelSection } from '../components/PersonnelSection';
import { MachinesInventorySection } from '../components/MachinesInventorySection';
import { ProjectSection } from '../components/ProjectSection';
import { ClipboardList, Users, Wrench, TrendingUp, Plus } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';

interface HomePageProps {
  selectedProject: Projet | null;
  onProjectSelect: (project: Projet) => void;
}

export function HomePage({ selectedProject, onProjectSelect }: HomePageProps) {
  const { isDark } = useTheme();
  const { permissions } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isPersonnelOpen, setIsPersonnelOpen] = useState(true);
  const [isMachinesOpen, setIsMachinesOpen] = useState(true);
  const [currentHeures, setCurrentHeures] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  const [isEditingHours, setIsEditingHours] = useState(false);
  const [newHeures, setNewHeures] = useState<{
    heures: number;
    dateDebut: string;
    dateFin?: string;
  }>({
    heures: 0,
    dateDebut: format(new Date(), 'yyyy-MM-dd')
  });

  const [showHeuresModal, setShowHeuresModal] = useState(false);
  
  const location = useLocation();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Charger les heures de référence actuelles
  useEffect(() => {
    if (selectedProject) {
      // Nettoyer l'ancienne souscription si elle existe
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }

      // Créer une nouvelle souscription pour les changements en temps réel
      const subscription = supabase
        .channel('project_reference_hours_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_reference_hours',
            filter: `project_id=eq.${selectedProject.id}`
          },
          async () => {
            // Recharger les heures de référence
            const heures = await getHeuresReference(
              selectedProject.id,
              format(new Date(), 'yyyy-MM-dd')
            );
            setCurrentHeures(heures);
          }
        )
        .subscribe();

      setRealtimeSubscription(subscription);

      const loadHeures = async () => {
        try {
          const heures = await getHeuresReference(
            selectedProject.id,
            format(new Date(), 'yyyy-MM-dd')
          );
          setCurrentHeures(heures);
        } catch (err) {
          console.error('Erreur lors du chargement des heures:', err);
        }
      };
      loadHeures();

      // Nettoyer la souscription lors du démontage
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [selectedProject]);

  // Charger le personnel et les machines quand un projet est sélectionné
  useEffect(() => {
    if (selectedProject) {
      const loadData = async () => {
        try {
          setLoading(true);
          
          // Charger le personnel
          const personnelData = await getPersonnelByProject(selectedProject.id);
          setPersonnel(personnelData);
          
          // Charger les machines
          const machinesData = await getMachinesByProject(selectedProject.id);
          setMachines(machinesData);
          
        } catch (err) {
          console.error('Erreur lors du chargement des données:', err);
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (location.state?.error) {
      setNotification({
        type: 'error',
        message: location.state.error
      });
      // Clear the error from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleHeuresReferenceChange = async () => {
    if (!selectedProject) return;
    
    // Validation des heures
    if (newHeures.heures < 0 || newHeures.heures > 24) {
      setError('Les heures doivent être comprises entre 0 et 24');
      return;
    }

    // Validation des dates
    if (!newHeures.dateDebut) {
      setError('La date de début est requise');
      return;
    }

    if (newHeures.dateFin && newHeures.dateFin <= newHeures.dateDebut) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await addHeuresReference(
        selectedProject.id,
        newHeures.heures,
        newHeures.dateDebut,
        newHeures.dateFin
      );
      
      setIsEditingHours(false);
      
      // Feedback utilisateur
      setNotification({ 
        type: 'success',
        message: 'Les nouvelles heures de référence ont été définies et seront appliquées automatiquement'
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      setNotification({
        type: 'error',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <h1 className={`text-3xl font-bold mb-4 ${
          isDark ? 'text-galaxy-100' : 'text-blue-900'
        }`}>
          Tableau de bord
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Bienvenue dans votre espace de gestion de chantier. Gérez votre personnel, 
          consultez les rapports journaliers et suivez l'avancement de vos projets.
        </p>
      </div>

      {/* Section Projet */}
      <PermissionGuard 
        requiredPermission="createProject"
        fallback={
          <div className={`rounded-xl p-8 mb-8 ${
            isDark 
              ? 'bg-space-800 border border-space-700' 
              : 'bg-white border border-blue-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-medium ${
              isDark ? 'text-galaxy-100' : 'text-blue-900'
            }`}>
              {selectedProject ? selectedProject.nom : 'Aucun projet sélectionné'}
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
              {selectedProject 
                ? `Projet n° ${selectedProject.numeroChantier}`
                : 'Veuillez contacter un administrateur pour sélectionner un projet'
              }
            </p>
          </div>
        }
      >
        <ProjectSection
          selectedProject={selectedProject}
          onProjectSelect={onProjectSelect}
        />
      </PermissionGuard>

      {selectedProject && (
        <div className={loading ? "opacity-50" : ""}>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            {[
              { name: 'Personnel actif', value: personnel.length, icon: Users },
              { name: 'Heures de référence', value: (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-semibold ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}
                    >
                      {currentHeures !== null ? `${currentHeures}h` : '-'}
                    </span>
                    <button
                      onClick={() => setShowHeuresModal(true)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ), icon: ClipboardList },
              { name: 'Machines actives', value: machines.length, icon: Wrench },
              { name: "Taux d'occupation", value: '92%', icon: TrendingUp }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className={`rounded-xl p-5 transition-all duration-200 ${
                    isDark 
                      ? 'bg-space-800 border border-space-700' 
                      : 'bg-white border border-blue-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className={isDark ? 'text-galaxy-400' : 'text-blue-500'} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className={`text-sm font-medium truncate ${
                          isDark ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                          {stat.name}
                        </dt>
                        <dd className={`text-2xl font-semibold ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Personnel */}
          <PermissionGuard requiredPermission="editProject">
            <PersonnelSection
              personnel={personnel}
              onPersonnelChange={setPersonnel}
              isOpen={isPersonnelOpen}
              onToggle={() => setIsPersonnelOpen(!isPersonnelOpen)}
              projectId={selectedProject.id}
            />
          </PermissionGuard>

          {/* Section Machines */}
          <div className="mt-8">
            <PermissionGuard requiredPermission="editProject">
              <MachinesInventorySection
                machines={machines}
                onMachinesChange={setMachines}
                isOpen={isMachinesOpen}
                onToggle={() => setIsMachinesOpen(!isMachinesOpen)}
                projectId={selectedProject.id}
              />
            </PermissionGuard>
          </div>
          
          {loading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-700">Chargement des données...</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal pour les heures de référence */}
      {showHeuresModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 transition-opacity" onClick={() => setShowHeuresModal(false)} />
            <div className={`relative w-full max-w-md rounded-lg shadow-xl ${
              isDark ? 'bg-space-800' : 'bg-white'
            }`}>
              <div className={`p-6 ${isDark ? 'border-space-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-medium mb-4 ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Définir les heures de référence
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Heures *
                    </label>
                    <input
                      type="number"
                      value={newHeures.heures || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 24) {
                          setNewHeures(prev => ({ ...prev, heures: value }));
                        }
                      }}
                      className="form-input w-full"
                      step="0.5"
                      min="0"
                      max="24"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={newHeures.dateDebut}
                      onChange={(e) => setNewHeures(prev => ({
                        ...prev,
                        dateDebut: e.target.value
                      }))}
                      className="form-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Date de fin (optionnelle)
                    </label>
                    <input
                      type="date"
                      value={newHeures.dateFin || ''}
                      onChange={(e) => setNewHeures(prev => ({
                        ...prev,
                        dateFin: e.target.value || undefined
                      }))}
                      className="form-input w-full"
                      min={newHeures.dateDebut}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowHeuresModal(false)}
                    className="button-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      await handleHeuresReferenceChange();
                      setShowHeuresModal(false);
                    }}
                    className="button-primary"
                    disabled={loading || !newHeures.heures || !newHeures.dateDebut}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
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
    </div>
  );
}
