import React from 'react';
import { ClipboardList, Plus, Trash2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Tache, Personnel } from '../types';
import { useTheme } from '../hooks/useTheme';
import { RecapHeuresSection } from './RecapHeuresSection';

interface TachesSectionProps {
  taches: Tache[];
  personnel: Personnel[];
  selectedProject: Projet;
  projectId: string;
  heuresRef: number | null;
  onTachesChange: (taches: Tache[]) => void;
  onHeuresChange: (matricule: string, tacheId: string, heures: number) => void;
}

export function TachesSection({ 
  taches, 
  personnel, 
  selectedProject, 
  projectId,
  heuresRef,
  onTachesChange, 
  onHeuresChange 
}: TachesSectionProps) {
  const { isDark } = useTheme();
  const [expandedTasks, setExpandedTasks] = React.useState<Record<number, boolean>>({});

  const ajouterTache = () => {
    onTachesChange([
      ...taches,
      {
        zone: '',
        description: '',
        personnel: [],
        machines: [],
        totalHeures: 0,
      },
    ]);
  };

  const handleHeuresChange = (matricule: string, tacheId: string, heures: number) => {
    const [zone, description] = tacheId.split('-');
    
    // Vérifier que les heures sont valides
    if (heures < 0 || heures > 24) return;
    
    const newTaches = taches.map(tache => {
      if (tache.zone === zone && tache.description === description) {
        // Trouver ou créer l'entrée de personnel
        const personnelIndex = tache.personnel?.findIndex(p => p.matricule === matricule) ?? -1;
        
        if (personnelIndex === -1) {
          // Ajouter une nouvelle entrée
          return {
            ...tache,
            personnel: [...(tache.personnel || []), { matricule, heures }]
          };
        } else {
          // Mettre à jour l'entrée existante
          const newPersonnel = [...(tache.personnel || [])];
          newPersonnel[personnelIndex] = { ...newPersonnel[personnelIndex], heures };
          return { ...tache, personnel: newPersonnel };
        }
      }
      return tache;
    });
    
    onTachesChange(newTaches);
  };

  // Calculer le total des heures par personne
  const totalHeuresParPersonne = personnel.reduce((acc, p) => {
    acc[p.matricule] = taches.reduce(
      (total, tache) => total + (tache.personnel?.find(tp => tp.matricule === p.matricule)?.heures || 0),
      0
    );
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="section-header">
            <ClipboardList className="section-icon" />
            Désignation des travaux
          </h2>
          <div className="group relative">
            <Info className={`w-5 h-5 cursor-help ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
            }`} />
            <div className="tooltip">
              <p className="font-medium mb-1">Guide d'utilisation :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>La zone doit être précise et identifiable (ex: "OM 8.1", "Bâtiment A")</li>
                <li>La description doit détailler clairement le travail effectué</li>
                <li>Assignez le personnel impliqué et leurs heures de travail</li>
                <li>Le total des heures est calculé automatiquement</li>
                <li>Vous pouvez ajouter plusieurs personnes à une même tâche</li>
              </ul>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={ajouterTache}
          className="form-button"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter une tâche
        </button>
      </div>

      <div className="space-y-6">
        {taches.map((tache, tacheIndex) => (
          <div key={tacheIndex} className={`form-section ${
            isDark ? 'bg-space-800' : 'bg-white'
          } ${isDark ? 'border border-space-700' : 'border border-gray-200'} rounded-xl p-6 transition-all duration-200`}>
            <div className={`space-y-4 ${!expandedTasks[tacheIndex] ? 'overflow-hidden' : ''}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-grow">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Zone *
                      </label>
                      <input
                        type="text"
                        value={tache.zone}
                        onChange={(e) => {
                          const newTaches = [...taches];
                          newTaches[tacheIndex] = { ...newTaches[tacheIndex], zone: e.target.value };
                          onTachesChange(newTaches);
                        }}
                        className="form-input"
                        placeholder="ex: OM 8.1, Bâtiment A"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description *
                      </label>
                      <textarea
                        rows={3}
                        value={tache.description}
                        onChange={(e) => {
                          const newTaches = [...taches];
                          newTaches[tacheIndex] = { ...newTaches[tacheIndex], description: e.target.value };
                          onTachesChange(newTaches);
                        }}
                        className={`form-input resize-vertical min-h-[4.5rem] bg-[repeating-linear-gradient(to_bottom,#f5f0e0_0,#f5f0e0_1.5rem,#fff_1.5rem,#fff_3rem)] dark:bg-[repeating-linear-gradient(to_bottom,#1e293b_0,#1e293b_1.5rem,#0f172a_1.5rem,#0f172a_3rem)] leading-[1.5rem] py-0`}
                        placeholder="Description détaillée du travail effectué"
                        required
                        style={{ maxHeight: !expandedTasks[tacheIndex] ? '3rem' : 'none' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedTasks(prev => ({
                      ...prev,
                      [tacheIndex]: !prev[tacheIndex]
                    }))}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-space-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {expandedTasks[tacheIndex] ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newTaches = [...taches];
                      newTaches.splice(tacheIndex, 1);
                      onTachesChange(newTaches);
                    }}
                    className={`p-2 rounded-lg ${
                      isDark
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className={`text-lg font-medium mb-4 ${
          isDark ? 'text-gray-200' : 'text-gray-900'
        }`}>
          Récapitulatif des heures
        </h3>
        <RecapHeuresSection
          personnel={personnel}
          taches={taches}
          heuresRef={heuresRef}
          selectedProject={selectedProject}
          projectId={projectId}
          onHeuresChange={handleHeuresChange}
        />
      </div>
    </div>
  );
}