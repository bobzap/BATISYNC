import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { Personnel, Projet, ProjectPersonnel } from '../types';
import { ENTREPRISES } from '../lib/constants';
import { ProjectPersonnelSelector } from './personnel/ProjectPersonnelSelector';
import { useTheme } from '../hooks/useTheme';
import { getHeuresReference, getProjectPersonnel, assignPersonnelToProject, getPersonnelFonctions } from '../lib/supabase';
// Au début du fichier, ajoutez ces imports
import { supabase } from '../lib/supabase';
import { BasePersonnelSelector } from './personnel/BasePersonnelSelector';

import { addPersonnelToProject } from '../lib/supabase'; // Fonction à créer


interface PersonnelRecapSectionProps {
  personnel: Personnel[];
  onPersonnelChange: (personnel: Personnel[]) => void;
  projectId: string;
  selectedProject: Projet | null;
}

export function PersonnelRecapSection({ 
  personnel, 
  onPersonnelChange, 
  projectId, 
  selectedProject 
}: PersonnelRecapSectionProps) {
  const { isDark } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isPersonnelSelectorOpen, setIsPersonnelSelectorOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [fonctions, setFonctions] = useState<PersonnelFonction[]>([]);
  const [heuresReference, setHeuresReference] = useState<number | null>(null);
  const [projectPersonnel, setProjectPersonnel] = useState<ProjectPersonnel[]>([]);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);

  // Charger les fonctions
  useEffect(() => {
    async function loadFonctions() {
      try {
        const data = await getPersonnelFonctions();
        setFonctions(data);
      } catch (err) {
        console.error('Erreur lors du chargement des fonctions:', err);
      }
    }
    loadFonctions();
  }, []);

  useEffect(() => {
    async function loadHeuresReference() {
      try {
        const heures = await getHeuresReference(projectId, format(new Date(), 'yyyy-MM-dd'));
        setHeuresReference(heures);
      } catch (err) {
        console.error('Erreur lors du chargement des heures de référence:', err);
      }
    }
    
    if (projectId) {
      loadHeuresReference();
    }
  }, [projectId]);

  useEffect(() => {
    async function loadProjectPersonnel() {
      try {
        setError(null);
        const data = await getProjectPersonnel(projectId);
        setProjectPersonnel(data);
      } catch (err) {
        console.error('Erreur lors du chargement du personnel:', err);
        // Ne pas afficher l'erreur à l'utilisateur car ce n'est pas bloquant
      }
    }
    
    if (projectId) {
      loadProjectPersonnel();
    }
  }, [projectId]);
  
  // Mettre à jour les IDs sélectionnés quand le personnel change
  useEffect(() => {
    setSelectedPersonnelIds(personnel.map(p => p.matricule));
  }, [personnel]);


const handleRemovePersonnel = async (index: number, personne: Personnel) => {
  try {
    // Supprimer immédiatement de la liste locale pour l'UX
    const newPersonnel = personnel.filter((_, i) => i !== index);
    onPersonnelChange(newPersonnel);
    
    console.log("Suppression pour:", personne);
    
    // Approche 1: Si c'est un UUID complet, essayer directement
    if (personne.matricule && personne.matricule.includes('-')) {
      try {
        const { data, error } = await supabase
          .from('project_personnel')
          .update({ statut: 'inactif' })
          .eq('id', personne.matricule);
          
        if (!error) {
          console.log("Personnel externe supprimé avec succès (approche 1)");
          return;
        }
      } catch (directError) {
        console.log("Échec de l'approche 1:", directError);
        // Continuer avec les autres approches
      }
    }
    
    // Approche 2: Rechercher toutes les entrées et filtrer côté client
    try {
      const { data: allEntries } = await supabase
        .from('project_personnel')
        .select(`
          id, 
          personnel_id,
          nom,
          numero_personnel,
          personnel:personnel_id (
            id,
            nom,
            prenom,
            numero_personnel
          )
        `)
        .eq('project_id', projectId)
        .eq('statut', 'actif');
      
      console.log("Entrées trouvées:", allEntries);
      
      if (allEntries && allEntries.length > 0) {
        // Chercher une correspondance
        let entryToUpdate = null;
        
        // Cas 1: Personnel interne avec matricule correspondant
        entryToUpdate = allEntries.find(entry => 
          entry.personnel && entry.personnel.numero_personnel === personne.matricule
        );
        
        // Cas 2: Personnel externe avec numero_personnel correspondant
        if (!entryToUpdate) {
          entryToUpdate = allEntries.find(entry => 
            entry.numero_personnel === personne.matricule
          );
        }
        
        // Cas 3: Personnel externe avec nom correspondant (si on n'a pas d'autre choix)
        if (!entryToUpdate) {
          // Normaliser les noms pour la comparaison
          const normalizeName = (name: string) => name.trim().toLowerCase();
          const personneNom = normalizeName(personne.nom);
          
          entryToUpdate = allEntries.find(entry => {
            if (entry.personnel) {
              // Pour personnel interne
              const fullName = `${entry.personnel.nom || ''} ${entry.personnel.prenom || ''}`;
              return normalizeName(fullName) === personneNom;
            } else {
              // Pour personnel externe
              return normalizeName(entry.nom || '') === personneNom;
            }
          });
        }
        
        if (entryToUpdate) {
          console.log("Entrée à mettre à jour:", entryToUpdate);
          
          const { error } = await supabase
            .from('project_personnel')
            .update({ statut: 'inactif' })
            .eq('id', entryToUpdate.id);
            
          if (error) {
            console.error("Erreur lors de la mise à jour:", error);
          } else {
            console.log("Personnel supprimé avec succès (approche 2)");
          }
        } else {
          console.log("Aucune entrée trouvée correspondant à ce personnel");
        }
      }
    } catch (err) {
      console.error("Erreur lors de la recherche:", err);
    }
  } catch (err) {
    console.error("Erreur générale:", err);
    setError("Erreur lors de la suppression du personnel");
  }
};


  
const handlePersonnelSelect = async (selectedPerson: any) => {
  try {
    setError(null);
    
    console.log("Personnel sélectionné :", selectedPerson);
    
    // Déterminer si c'est un objet de type BasePersonnel
    const isBasePersonnel = selectedPerson && 'numero_personnel' in selectedPerson;
    
    if (isBasePersonnel) {
      try {
        // Si c'est un personnel de base, l'ajouter à project_personnel via insertion directe
        console.log("Ajout du personnel à project_personnel:", selectedPerson.id);
        
        const { data, error } = await supabase
          .from('project_personnel')
          .insert({
            project_id: projectId,
            personnel_id: selectedPerson.id,
            date_debut: new Date().toISOString().split('T')[0],
            statut: 'actif'
          })
          .select();
        
        if (error) throw error;
        
        console.log("Personnel ajouté au projet avec succès");
      } catch (err) {
        console.error("Erreur lors de l'ajout du personnel au projet:", err);
        setNotification({
          type: 'error',
          message: 'Erreur lors de l\'ajout du personnel au projet'
        });
        return;
      }
    }
    
    // Créer l'objet Personnel pour le rapport
    const newPersonnel: Personnel = {
      nom: isBasePersonnel 
        ? `${selectedPerson.nom} ${selectedPerson.prenom || ''}`.trim()
        : selectedPerson.nom || '',
      role: isBasePersonnel 
        ? selectedPerson.intitule_fonction 
        : selectedPerson.intitule_fonction || selectedPerson.role || '',
      matricule: isBasePersonnel 
        ? selectedPerson.numero_personnel 
        : selectedPerson.matricule || selectedPerson.id || '',
      entreprise: selectedPerson.entreprise || 'PFSA',
      equipe: selectedPerson.equipe || '',
      zone: selectedPerson.zone || '',
      heuresPresence: heuresReference || 7.5
    };

    console.log("Nouveau personnel ajouté au rapport:", newPersonnel);

    // Mettre à jour le personnel du rapport
    onPersonnelChange([...personnel, newPersonnel]);
    setSelectedPersonnelIds(prev => [...prev, newPersonnel.matricule]);

    setNotification({
      type: 'success',
      message: 'Personnel ajouté avec succès'
    });

    setIsPersonnelSelectorOpen(false);
  } catch (err) {
    console.error('Erreur lors de l\'ajout du personnel:', err);
    setNotification({
      type: 'error',
      message: 'Erreur lors de l\'ajout du personnel'
    });
  }
};

  return (
    <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
      {/* En-tête avec bouton d'ajout */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-base font-medium flex items-center gap-2 ${
          isDark ? 'text-gray-200' : 'text-gray-900'
        }`}>
          <ClipboardList className="w-5 h-5" />
          Personnel présent ({personnel.length})
        </h3>
        <button 
          type="button"
          aria-label="Ajouter du personnel"
          onClick={() => setIsPersonnelSelectorOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
            isDark
              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter du personnel</span>
        </button>
      </div>

      {error && (
        <div className={`p-4 mb-4 rounded-lg text-sm ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {notification && (
        <div className={`p-4 mb-4 rounded-lg text-sm ${
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

      {/* Liste du personnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {personnel.map((personne, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              isDark
                ? 'bg-space-800 border-space-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {personne.nom}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Badge Fonction */}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isDark
                     ? 'bg-blue-500/20 text-blue-300'
                     : 'bg-blue-100 text-blue-800'
                  }`}>
                    {fonctions?.find(f => f.code === personne.role)?.libelle || personne.role}
                  </span>
                  {/* Badge Entreprise */}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isDark 
                      ? ENTREPRISES.find(e => e.value === personne.entreprise)?.colorDark || 'bg-gray-500/20 text-gray-300'
                      : ENTREPRISES.find(e => e.value === personne.entreprise)?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {personne.entreprise}
                  </span>
                  {/* Badge équipe si présent */}
                  {personne.equipe && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {personne.equipe}
                    </span>
                  )}
                  {/* Badge zone si présent */}
                  {personne.zone && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isDark
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {personne.zone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
               
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleRemovePersonnel(index, personne);
  }}
  className={`p-2 rounded-lg transition-colors ${
    isDark
      ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
      : 'hover:bg-red-50 text-red-600 hover:text-red-700'
  }`}
>
  <Trash2 className="w-4 h-4" />
</button>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {personne.heuresPresence.toFixed(1)}h
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun personnel */}
      {personnel.length === 0 && (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Aucun personnel ajouté
        </div>
      )}

      {/* Sélecteur de personnel */}
<ProjectPersonnelSelector
  isOpen={isPersonnelSelectorOpen}
  onClose={() => setIsPersonnelSelectorOpen(false)}
  projectId={projectId}
  onSelect={handlePersonnelSelect}
  selectedIds={selectedPersonnelIds}
/>
    </div>
  );
}