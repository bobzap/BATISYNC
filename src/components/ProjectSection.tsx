import React, { useState, useEffect } from 'react';
import { Building2, Plus, ChevronDown, Settings, Edit2 } from 'lucide-react';
import type { Projet } from '../types';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ProjectSectionProps {
  selectedProject: Projet | null;
  onProjectSelect: (project: Projet) => void;
}

export function ProjectSection({ selectedProject, onProjectSelect }: ProjectSectionProps) {
  const { isDark } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    nom: '',
    numeroChantier: '',
    directionChantier: '',
    responsableCTX: '',
    cmCe: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Projet | null>(null);
  const [projects, setProjects] = useState<Projet[]>([
    {
      id: '1',
      nom: 'CTM 378',
      numeroChantier: '10185',
      directionChantier: 'JPETAIN',
      responsableCTX: 'LDAIZE',
      cmCe: 'TVAUTRIN',
      actif: true,
      dateCreation: '2024-01-01',
      dateMiseAJour: '2024-01-20'
    }
  ]);

  useEffect(() => {
    // Charger la liste des projets
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data.map(p => ({
          id: p.id,
          nom: p.name,
          numeroChantier: p.number,
          directionChantier: p.site_manager || '',
          responsableCTX: p.ctx_manager || '',
          cmCe: p.cm_ce || '',
          actif: p.active,
          dateCreation: p.created_at,
          dateMiseAJour: p.updated_at
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = isEditing && editingProject ? editingProject : newProject;
      if (!projectData) return;

      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: isEditing && editingProject ? editingProject.id : undefined,
          name: projectData.nom,
          number: projectData.numeroChantier,
          site_manager: projectData.directionChantier,
          ctx_manager: projectData.responsableCTX,
          cm_ce: projectData.cmCe,
          active: true
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Erreur lors de la sauvegarde');

      const projet: Projet = {
        id: data.id,
        nom: data.name,
        numeroChantier: data.number,
        directionChantier: data.site_manager || '',
        responsableCTX: data.ctx_manager || '',
        cmCe: data.cm_ce || '',
        actif: data.active,
        dateCreation: data.created_at,
        dateMiseAJour: data.updated_at
      };
      
      // Mettre à jour la liste des projets
      setProjects(prev => {
        if (isEditing) {
          const updated = prev.map(p => p.id === projet.id ? projet : p);
          // Si c'est le projet actuellement sélectionné, le mettre à jour aussi
          if (selectedProject?.id === projet.id) {
            onProjectSelect(projet);
          }
          return updated;
        } else {
          // Pour un nouveau projet, le sélectionner automatiquement
          onProjectSelect(projet);
          return [...prev, projet];
        }
      });
      
      // Réinitialiser l'état
      setIsEditing(false);
      setIsCreating(false);
      setEditingProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl p-8 mb-8 ${
      isDark 
        ? 'bg-space-800 border border-space-700' 
        : 'bg-white border border-blue-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-galaxy-100' : 'text-blue-900'
          }`}>
            Projets
          </h2>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="button-primary cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </button>
      </div>
      
      {/* Affichage des informations du projet sélectionné */}
      {selectedProject && !isCreating && !isEditing && (
        <div className={`mb-6 p-4 rounded-lg ${
          isDark ? 'bg-space-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {selectedProject.nom}
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                N° {selectedProject.numeroChantier}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedProject.actif && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                }`}>
                  Actif
                </span>
              )}
              <button
                onClick={() => {
                  setEditingProject(selectedProject);
                  setIsEditing(true);
                }}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                }`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Direction de chantier
              </p>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedProject.directionChantier || '-'}
              </p>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Responsable CTX
              </p>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedProject.responsableCTX || '-'}
              </p>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                CM / CE
              </p>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedProject.cmCe || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {(isCreating || isEditing) ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom du projet *</label>
              <input
                type="text"
                value={isEditing ? editingProject?.nom || '' : newProject.nom}
                onChange={(e) => {
                  if (isEditing && editingProject) {
                    setEditingProject({ ...editingProject, nom: e.target.value });
                  } else {
                    setNewProject({ ...newProject, nom: e.target.value });
                  }
                }}
                className="form-input"
                placeholder="Ex: Construction Pont A13"
              />
            </div>
            <div>
              <label className="form-label">N° de chantier *</label>
              <input
                type="text"
                value={isEditing ? editingProject?.numeroChantier || '' : newProject.numeroChantier}
                onChange={(e) => {
                  if (isEditing && editingProject) {
                    setEditingProject({ ...editingProject, numeroChantier: e.target.value });
                  } else {
                    setNewProject({ ...newProject, numeroChantier: e.target.value });
                  }
                }}
                className="form-input"
                placeholder="Ex: CH-2024-001"
              />
            </div>
            <div>
              <label className="form-label">Direction de chantier</label>
              <input
                type="text"
                value={isEditing ? editingProject?.directionChantier || '' : newProject.directionChantier}
                onChange={(e) => {
                  if (isEditing && editingProject) {
                    setEditingProject({ ...editingProject, directionChantier: e.target.value });
                  } else {
                    setNewProject({ ...newProject, directionChantier: e.target.value });
                  }
                }}
                className="form-input"
                placeholder="Nom du directeur"
              />
            </div>
            <div>
              <label className="form-label">Responsable CTX</label>
              <input
                type="text"
                value={isEditing ? editingProject?.responsableCTX || '' : newProject.responsableCTX}
                onChange={(e) => {
                  if (isEditing && editingProject) {
                    setEditingProject({ ...editingProject, responsableCTX: e.target.value });
                  } else {
                    setNewProject({ ...newProject, responsableCTX: e.target.value });
                  }
                }}
                className="form-input"
                placeholder="Nom du responsable"
              />
            </div>
            <div>
              <label className="form-label">CM / CE</label>
              <input
                type="text"
                value={isEditing ? editingProject?.cmCe || '' : newProject.cmCe}
                onChange={(e) => {
                  if (isEditing && editingProject) {
                    setEditingProject({ ...editingProject, cmCe: e.target.value });
                  } else {
                    setNewProject({ ...newProject, cmCe: e.target.value });
                  }
                }}
                className="form-input"
                placeholder="Nom du CM/CE"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  setIsCreating(false);
                }
              }}
              className="button-secondary cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateProject}
              disabled={loading || (isEditing ? !editingProject?.nom || !editingProject?.numeroChantier : !newProject.nom || !newProject.numeroChantier)}
              className={`button-primary cursor-pointer ${(loading || 
                (isEditing ? !editingProject?.nom || !editingProject?.numeroChantier : !newProject.nom || !newProject.numeroChantier))
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {loading ? 'Sauvegarde...' : isEditing ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full p-4 text-left rounded-lg border cursor-pointer ${
              isDark 
                ? 'bg-space-700 border-space-600 hover:bg-space-600' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                {selectedProject ? selectedProject.nom : 'Sélectionner un projet'}
                {selectedProject && (
                  <span className={`ml-2 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    (N° {selectedProject.numeroChantier})
                  </span>
                )}
              </span>
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </button>

          {isDropdownOpen && (
            <div className={`absolute z-10 mt-2 w-full rounded-lg border shadow-lg ${
              isDark 
                ? 'bg-space-700 border-space-600' 
                : 'bg-white border-gray-200'
            }`}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-opacity-80 cursor-pointer ${
                    isDark 
                      ? 'hover:bg-space-600 text-gray-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.nom}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {project.numeroChantier}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.actif && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                        }`}>
                          Actif
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}