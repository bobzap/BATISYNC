import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Save } from 'lucide-react';
import { MeteoSelect } from '../components/MeteoSelect';
import { RapportHeader } from '../components/rapport/RapportHeader';
import { RapportTabs } from '../components/rapport/RapportTabs';
import { RapportContent } from '../components/rapport/RapportContent';
import { ImportPersonnelCheckbox } from '../components/rapport/ImportPersonnelCheckbox';
import { PersonnelRecapSection } from '../components/PersonnelRecapSection';
import { FileUploadSection } from '../components/rapport/FileUploadSection';
import { WeeklyTabs } from '../components/WeeklyTabs';
import { FileViewerModal } from '../components/FileViewerModal';
import { RemarquesSection } from '../components/rapport/RemarquesSection';
import { ActionButtons } from '../components/rapport/ActionButtons';
import { useTheme } from '../hooks/useTheme';
import { useRapport } from '../hooks/useRapport';
import { createThumbnail, compressImage } from '../lib/imageUtils';
import { Rapport, emptyRapport, Personnel } from '../types';
import { getRapportsByPeriod, getRapport, getHeuresReference, getProjectPersonnel } from '../lib/supabase';

interface RapportPageProps {
  projectId: string;
  selectedProject: Projet | null;
}

export function RapportPage({ projectId, selectedProject }: RapportPageProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    return dateParam ? new Date(dateParam) : today;
  });
  const [projectPersonnel, setProjectPersonnel] = useState<ProjectPersonnel[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [personnelError, setPersonnelError] = useState<string | null>(null);
  
  const {
    rapport,
    setRapport,
    loading,
    saving,
    hasUnsavedChanges,
    error,
    save,
    heuresReference,
    heuresLoaded
  } = useRapport(projectId, format(selectedDate, 'yyyy-MM-dd'), selectedProject);
  
  useEffect(() => {
    if (saving) {
      setNotification({
        type: 'info',
        message: 'Sauvegarde en cours...'
      });
    } else if (hasUnsavedChanges) {
      setNotification({
        type: 'warning',
        message: 'Modifications non sauvegardées'
      });
    } else {
      setNotification(null);
    }
  }, [saving, hasUnsavedChanges]);

  const [importPersonnel, setImportPersonnel] = useState(false);
  const [previousDayPersonnel, setPreviousDayPersonnel] = useState<Personnel[]>([]);
  const [loadingPreviousPersonnel, setLoadingPreviousPersonnel] = useState(false);
  const [previousPersonnelError, setPreviousPersonnelError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadProjectPersonnel() {
      try {
        setLoadingPersonnel(true);
        const data = await getProjectPersonnel(projectId);
        setProjectPersonnel(data);
        setPersonnelError(null);
      } catch (err) {
        console.error('Erreur lors du chargement du personnel:', err);
        setPersonnelError('Erreur lors du chargement du personnel');
      } finally {
        setLoadingPersonnel(false);
      }
    }
    
    if (projectId) {
      loadProjectPersonnel();
    }
  }, [projectId]);

  useEffect(() => {
    async function loadPreviousPersonnel() {
      if (!projectId || !selectedDate) return;

      try {
        setLoadingPreviousPersonnel(true);
        const previousDay = new Date(selectedDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const previousDayStr = format(previousDay, 'yyyy-MM-dd');

        try {
          const previousReport = await getRapport(projectId, previousDayStr);
          if (previousReport?.personnel?.length > 0) {
            setPreviousDayPersonnel(previousReport.personnel);
          }
        } catch (err) {
          console.error('Erreur lors du chargement du personnel précédent:', err);
          setPreviousPersonnelError('Impossible de charger le personnel du rapport précédent');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du personnel précédent:', err);
        setPreviousPersonnelError('Erreur lors du chargement du personnel précédent');
      } finally {
        setLoadingPreviousPersonnel(false);
      }
    }

    loadPreviousPersonnel();
  }, [projectId, selectedDate]);

  useEffect(() => {
    if (importPersonnel && previousDayPersonnel.length > 0) {
      setRapport(prev => ({
        ...prev,
        personnel: previousDayPersonnel.map(p => ({
          ...p,
          heuresPresence: heuresReference || 7.5
        }))
      }));
    }
  }, [importPersonnel, previousDayPersonnel, heuresReference]);

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    type: 'image' | 'pdf';
  } | null>(null);
  const [weekRapports, setWeekRapports] = useState<{
    date: string;
    visa_contremaitre: boolean;
  }[]>([]);

  // Charger les rapports de la semaine
  useEffect(() => {
    async function loadWeekRapports() {
      try {
        if (!projectId) {
          setWeekRapports([]);
          return;
        }

        const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const data = await getRapportsByPeriod(projectId, weekStart, weekEnd);
        setWeekRapports((data || []).map(r => ({
          date: r.date,
          visa_contremaitre: r.visa_contremaitre
        })));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des rapports';
        console.error('Erreur lors du chargement des rapports:', message);
        setWeekRapports([]);
        setNotification({
          type: 'error',
          message: 'Impossible de charger les rapports de la semaine'
        });
      }
    }
    loadWeekRapports();
  }, [selectedDate, projectId]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkHeuresReference() {
      try {
        if (heuresLoaded && heuresReference === null) {
          console.log('Heures de référence non définies, redirection...');
          navigate('/', { 
            state: { 
              error: `Aucune heure de référence n'est définie pour la date du ${format(selectedDate, 'dd/MM/yyyy')}. Veuillez configurer les heures de référence avant de créer un rapport.`
            },
          });
          return;
        }
        if (heuresLoaded) {
          console.log('Heures de référence trouvées:', heuresReference);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des heures:', err);
      }
    }
    checkHeuresReference();
  }, [heuresLoaded, heuresReference, selectedDate, navigate]);

  useEffect(() => {
    if (importPersonnel && projectId) {
      const personnel = projectPersonnel
        .filter(p => p.personnel)
        .map(p => ({
          nom: `${p.personnel?.nom} ${p.personnel?.prenom}`.trim(),
          role: p.personnel?.intitule_fonction || '',
          matricule: p.personnel?.numero_personnel || '',
          equipe: p.equipe || '',
          heuresPresence: heuresReference || 7.5
        }));

      setRapport(prev => ({
        ...prev,
        personnel
      }));
    }
  }, [importPersonnel, projectId, projectPersonnel, heuresReference]);

  if (heuresLoaded && heuresReference === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className={`max-w-md w-full mx-auto p-8 rounded-xl shadow-xl ${
          isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Configuration requise
            </h2>
            <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Aucune heure de référence n'est définie pour la date du {format(selectedDate, 'dd/MM/yyyy')}. 
              Vous devez configurer les heures de référence avant de pouvoir créer un rapport.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={() => navigate('/', { state: { showHeuresModal: true } })}
                className="button-primary"
              >
                Configurer les heures
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleHeuresChange = (matricule: string, tacheId: string, heures: number) => {
    const [zone, description] = tacheId.split('-');
    
    setRapport(prev => {
      const updatedTaches = prev.taches.map(tache => {
        if (tache.zone === zone && tache.description === description) {
          return {
            ...tache,
            personnel: tache.personnel.map(p => {
              if (p.matricule === matricule) {
                return {
                  ...p,
                  heures: {
                    ...p.heures,
                    [tacheId]: heures
                  }
                };
              }
              return p;
            })
          };
        }
        return tache;
      });

      return {
        ...prev,
        taches: updatedTaches
      };
    });
  };

  const [activeTab, setActiveTab] = useState('travaux');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!rapport) {
        throw new Error('Rapport non initialisé');
      }

      if (!rapport.date) {
        throw new Error('La date du rapport est requise');
      }

      await save(rapport!);
      setNotification({
        type: 'success',
        message: 'Rapport sauvegardé avec succès'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du rapport';
      setNotification({
        type: 'error',
        message
      });
    }
  };

  const handleDateChange = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  const toggleVisa = () => {
    setRapport({
      ...rapport!,
      visaContremaitre: !rapport!.visaContremaitre
    });
  };

  const updateRapport = (updates: Partial<Rapport>) => {
    setRapport({
      ...rapport!,
      ...updates
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDark ? 'text-gray-200' : 'text-gray-900'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDark ? 'text-red-400' : 'text-red-600'
      }`}>
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Erreur</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <WeeklyTabs
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        rapports={weekRapports}
      />

      <RapportHeader
        selectedDate={selectedDate}
        selectedProject={selectedProject}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        visaContremaitre={rapport!.visaContremaitre}
        onToggleVisa={toggleVisa}
        onDateChange={handleDateChange}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
            <div className="section-header mb-6">
              <span>Informations générales</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  Zone de chantier *
                </label>
                <input
                  type="text"
                  value={rapport!.nomChantier}
                  onChange={(e) =>
                    updateRapport({ nomChantier: e.target.value })
                  }
                  className="form-input"
                  placeholder="Zone de chantier"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Conditions Météo
                </label>
                <MeteoSelect
                  value={rapport!.meteo.condition}
                  onChange={(value) =>
                    updateRapport({
                      meteo: { ...rapport!.meteo, condition: value as any }
                    })
                  }
                />
              </div>
              <div>
                <label className="form-label">
                  Température (°C)
                </label>
                <input
                  type="number"
                  value={rapport!.meteo.temperature}
                  onChange={(e) =>
                    updateRapport({
                      meteo: {
                        ...rapport!.meteo,
                        temperature: parseInt(e.target.value)
                      }
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="mt-4">
                <ImportPersonnelCheckbox
                  importPersonnel={importPersonnel}
                  onImportChange={(checked) => {
                    setImportPersonnel(checked);
                    if (!checked) {
                      setRapport(prev => ({
                        ...prev,
                        personnel: []
                      }));
                    }
                  }}
                  loadingPreviousPersonnel={loadingPreviousPersonnel}
                  previousDayPersonnel={previousDayPersonnel}
                  previousPersonnelError={previousPersonnelError}
                />
                <PersonnelRecapSection
                  personnel={rapport!.personnel}
                  onPersonnelChange={(newPersonnel) => {
                    setRapport(prev => ({
                      ...prev,
                      personnel: newPersonnel
                    }));
                  }}
                  projectId={projectId}
                  selectedProject={selectedProject}
                />
              </div>
            </div>
          </div>
           
          <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
            <div className="section-header mb-4">
              <span>Événements Particuliers et Documents</span>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className={`text-base font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Événements
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'betonnage', label: 'Bétonnage' },
                    { id: 'essais', label: 'Essais' },
                    { id: 'poseEnrobe', label: 'Pose d\'enrobé' },
                    { id: 'controleExtInt', label: 'Contrôle Ext/Int' },
                    { id: 'reception', label: 'Réception' },
                  ].map(({ id, label }) => (
                    <div
                      key={id}
                      className={`relative flex items-center p-2 rounded-lg border transition-all ${
                        rapport!.evenementsParticuliers[id as 'betonnage' | 'essais' | 'poseEnrobe' | 'controleExtInt' | 'reception']
                          ? isDark
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-blue-50 border-blue-200'
                          : isDark
                            ? 'bg-space-800/50 border-space-700'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={id}
                        checked={rapport!.evenementsParticuliers[id as 'betonnage' | 'essais' | 'poseEnrobe' | 'controleExtInt' | 'reception']}
                        onChange={(e) => {
                          updateRapport({
                            evenementsParticuliers: {
                              ...rapport!.evenementsParticuliers,
                              [id]: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={id}
                        className={`ml-2 block text-sm ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={`text-base font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Photos et documents
                </h4>
                <FileUploadSection
                  files={rapport!.photos}
                  onFilesChange={(files) => updateRapport({ photos: files })}
                  onFileSelect={setSelectedFile}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <RapportTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <RapportContent
            activeTab={activeTab}
            rapport={rapport!}
            selectedProject={selectedProject}
            projectId={projectId}
            heuresReference={heuresReference}
            onRapportUpdate={updateRapport}
            onHeuresChange={handleHeuresChange}
          />
        </div>

        {/* Remarques et visa */}
        <div className="mt-8">
          <RemarquesSection
            remarques={rapport!.remarques}
            remarquesContremaitre={rapport!.remarquesContremaitre}
            onUpdate={updateRapport}
          />
        </div>

        {/* Boutons d'action */}
        <div className="mt-8">
          <ActionButtons
            visaContremaitre={rapport!.visaContremaitre}
            saving={saving}
            onToggleVisa={toggleVisa}
            onSave={handleSubmit}
          />
        </div>
      </form>

      {/* Modal de visualisation des fichiers */}
      <FileViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </main>
  );
}
