import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Trash2, ChevronDown, ChevronRight, Info, UserPlus, Search, Users, Briefcase, Clock } from 'lucide-react';
import { Personnel, PersonnelFonction } from '../types';
import { savePersonnel, getPersonnelByProject, getPersonnelFonctions, addPersonnelToProject, addExternalPersonnelToProject, supabase } from '../lib/supabase';

import { useTheme } from '../hooks/useTheme';
import { BasePersonnelSelector } from './personnel/BasePersonnelSelector';

interface PersonnelSectionProps {
  personnel: Personnel[];
  onPersonnelChange: (newPersonnel: Personnel[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  projectId: string;
}

export function PersonnelSection({ personnel, onPersonnelChange, isOpen, onToggle, projectId }: PersonnelSectionProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingPersonnel, setIsAddingPersonnel] = useState(false);
  const [fonctions, setFonctions] = useState<PersonnelFonction[]>([]);
  const [isPersonnelSelectorOpen, setIsPersonnelSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newPersonnel, setNewPersonnel] = useState<Personnel>({
    nom: '',
    heuresPresence: 7.5,
    role: '',
    matricule: '',
    equipe: '',
    entreprise: ''
  });
  
  // Charger les fonctions disponibles
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

  // Filtrer le personnel en fonction de la recherche et du rôle sélectionné
  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch = !searchTerm || 
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.equipe?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !selectedRole || p.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Charger le personnel du projet
  useEffect(() => {
    async function loadPersonnel() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPersonnelByProject(projectId);
        onPersonnelChange(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) {
      loadPersonnel();
    }
  }, [projectId]);

  const handleRemovePersonnel = async (index: number, personne: Personnel) => {
    try {
      // Supprimer de la liste locale pour réponse immédiate
      const newPersonnel = personnel.filter((_, i) => i !== index);
      onPersonnelChange(newPersonnel);
      
      setLoading(true);
      setError(null);
  
      if (!projectId) {
        throw new Error('ID du projet manquant');
      }
  
      console.log("Tentative de suppression pour:", personne);
  
      // Approche simplifiée - récupérer toutes les entrées et chercher la correspondance
      const { data: projectPersonnelEntries } = await supabase
        .from('project_personnel')
        .select(`
          id, 
          personnel_id,
          numero_personnel,
          personnel:personnel_id (numero_personnel)
        `)
        .eq('project_id', projectId)
        .eq('statut', 'actif');
      
      console.log("Entrées trouvées:", projectPersonnelEntries);
      
      if (!projectPersonnelEntries || projectPersonnelEntries.length === 0) {
        console.log("Aucune entrée active trouvée");
        return;
      }
      
      // Trouver la bonne entrée
      let entryToUpdate = null;
      
      // Pour personnel externe - vérifier si matricule = id
      if (personne.matricule && personne.matricule.includes('-')) {
        entryToUpdate = projectPersonnelEntries.find(entry => entry.id === personne.matricule);
        console.log("Recherche par ID:", entryToUpdate);
      }
      
      // Pour personnel externe - vérifier si numero_personnel = matricule
      if (!entryToUpdate && personne.matricule) {
        entryToUpdate = projectPersonnelEntries.find(entry => 
          entry.numero_personnel === personne.matricule
        );
        console.log("Recherche par numero_personnel:", entryToUpdate);
      }
      
      // Pour personnel interne - vérifier via personnel.numero_personnel
      if (!entryToUpdate && personne.matricule) {
        entryToUpdate = projectPersonnelEntries.find(entry => 
          entry.personnel && entry.personnel.numero_personnel === personne.matricule
        );
        console.log("Recherche par personnel.numero_personnel:", entryToUpdate);
      }
      
      if (entryToUpdate) {
        // Mettre à jour le statut à inactif
        const { error } = await supabase
          .from('project_personnel')
          .update({ statut: 'inactif' })
          .eq('id', entryToUpdate.id);
        
        if (error) {
          console.error("Erreur mise à jour:", error);
          throw error;
        }
        
        console.log('Personnel désactivé avec succès, ID:', entryToUpdate.id);
      } else {
        console.log("Personnel non trouvé dans les entrées actives");
      }
    } catch (err) {
      console.error('Erreur lors de la désactivation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };
 
  const handleSavePersonnel = async () => {
    // Validation des champs requis
    if (!newPersonnel.nom || !newPersonnel.role) {
      setError('Le nom et le rôle sont obligatoires');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      if (!projectId) {
        throw new Error('ID du projet manquant');
      }
      
      console.log("Ajout de personnel externe:", newPersonnel);
      
      // Insérer dans project_personnel
      const { data, error } = await supabase
  .from('project_personnel')
  .insert({
    project_id: projectId,
    personnel_id: null, // null pour personnel externe
    nom: newPersonnel.nom,
    prenom: " ", // espace simple pour satisfaire la contrainte
    intitule_fonction: newPersonnel.role,
    entreprise: newPersonnel.entreprise || 'PFSA',
    equipe: newPersonnel.equipe || '',
    zone: '',
    numero_personnel: newPersonnel.matricule || '', // Stocker le matricule externe ici
    date_debut: new Date().toISOString().split('T')[0],
    statut: 'actif'
  })
  .select();
      
      if (error) {
        console.error("Erreur insertion:", error);
        throw error;
      }
      
      console.log("Données insérées:", data);
      
      // Ajout immédiat à l'UI sans attendre le rechargement complet
      if (data && data.length > 0) {
        const nouveauPersonnel: Personnel = {
          nom: newPersonnel.nom,
          role: newPersonnel.role,
          matricule: newPersonnel.matricule || data[0].id,
          entreprise: newPersonnel.entreprise || 'PFSA',
          equipe: newPersonnel.equipe || '',
          zone: '',
          heuresPresence: newPersonnel.heuresPresence
        };
        
        console.log("Nouveau personnel ajouté:", nouveauPersonnel);
        onPersonnelChange([...personnel, nouveauPersonnel]);
      }
      
      // Réinitialiser le formulaire
      setIsAddingPersonnel(false);
      setNewPersonnel({
        nom: '',
        heuresPresence: 7.5,
        role: '',
        matricule: '',
        equipe: '',
        entreprise: ''
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
      setError(message);
      console.error('Erreur détaillée:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePersonnel = async (index: number, updates: Partial<Personnel>) => {
    const personnelToUpdate = [...personnel][index];
    if (!personnelToUpdate) return;
  
    if (!projectId) {
      setError('ID du projet manquant');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      
      console.log("Mise à jour du personnel:", personnelToUpdate, "avec", updates);
      
      // Mise à jour locale immédiate pour l'UI
      const updatedPersonnel = [...personnel];
      updatedPersonnel[index] = {
        ...updatedPersonnel[index],
        ...updates
      };
      onPersonnelChange(updatedPersonnel);
      
      // Approche similaire à handleRemovePersonnel - trouver d'abord l'entrée
      const { data: projectPersonnelEntries } = await supabase
        .from('project_personnel')
        .select(`
          id, 
          personnel_id,
          numero_personnel,
          personnel:personnel_id (numero_personnel)
        `)
        .eq('project_id', projectId)
        .eq('statut', 'actif');
      
      if (!projectPersonnelEntries || projectPersonnelEntries.length === 0) {
        throw new Error('Aucune entrée trouvée');
      }
      
      // Trouver la bonne entrée
      let entryToUpdate = null;
      
      // Pour personnel externe - vérifier si matricule = id
      if (personnelToUpdate.matricule && personnelToUpdate.matricule.includes('-')) {
        entryToUpdate = projectPersonnelEntries.find(entry => entry.id === personnelToUpdate.matricule);
      }
      
      // Pour personnel externe - vérifier si numero_personnel = matricule
      if (!entryToUpdate && personnelToUpdate.matricule) {
        entryToUpdate = projectPersonnelEntries.find(entry => 
          entry.numero_personnel === personnelToUpdate.matricule
        );
      }
      
      // Pour personnel interne - vérifier via personnel.numero_personnel
      if (!entryToUpdate && personnelToUpdate.matricule) {
        entryToUpdate = projectPersonnelEntries.find(entry => 
          entry.personnel && entry.personnel.numero_personnel === personnelToUpdate.matricule
        );
      }
      
      if (entryToUpdate) {
        // Personnels externes (pas de personnel_id)
        if (!entryToUpdate.personnel_id) {
          await supabase
            .from('project_personnel')
            .update({
              nom: updates.nom !== undefined ? updates.nom : personnelToUpdate.nom,
              intitule_fonction: updates.role !== undefined ? updates.role : personnelToUpdate.role,
              entreprise: updates.entreprise !== undefined ? updates.entreprise : personnelToUpdate.entreprise,
              equipe: updates.equipe !== undefined ? updates.equipe : personnelToUpdate.equipe,
              numero_personnel: updates.matricule !== undefined ? updates.matricule : personnelToUpdate.matricule,
              updated_at: new Date().toISOString()
            })
            .eq('id', entryToUpdate.id);
        } 
        // Personnels internes (avec personnel_id)
        else {
          await supabase
            .from('project_personnel')
            .update({
              equipe: updates.equipe !== undefined ? updates.equipe : personnelToUpdate.equipe,
              zone: updates.zone !== undefined ? updates.zone : personnelToUpdate.zone,
              updated_at: new Date().toISOString()
            })
            .eq('id', entryToUpdate.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      console.error('Erreur mise à jour personnel:', err);
    } finally {
      setLoading(false);
    }
  };

  
const handleSelectBasePersonnel = async (basePersonnel: BasePersonnel) => {
  try {
    setLoading(true);
    setError(null);

    if (!projectId) {
      throw new Error('ID du projet manquant');
    }
    
    console.log("Ajout de personnel de base:", basePersonnel);
    
    // Récupérer d'abord les détails complets de la fonction
    let fonctionLibelle = "";
    const fonctionTrouvee = fonctions.find(f => f.code === basePersonnel.intitule_fonction);
    if (fonctionTrouvee) {
      fonctionLibelle = fonctionTrouvee.libelle;
    }
    
    // Insertion dans project_personnel
    const { data, error } = await supabase
      .from('project_personnel')
      .insert({
        project_id: projectId,
        personnel_id: basePersonnel.id,
        intitule_fonction: basePersonnel.intitule_fonction,
        entreprise: basePersonnel.entreprise,
        date_debut: new Date().toISOString().split('T')[0],
        statut: 'actif'
      })
      .select();
    
    if (error) {
      console.error("Erreur insertion:", error);
      throw error;
    }
    
    console.log("Données insérées:", data);
    
    // Ajout immédiat à l'UI avec la fonction correcte
    const nouveauPersonnel: Personnel = {
      nom: `${basePersonnel.nom} ${basePersonnel.prenom || ''}`.trim(),
      role: basePersonnel.intitule_fonction, // Utiliser le code de la fonction
      matricule: basePersonnel.numero_personnel,
      entreprise: basePersonnel.entreprise,
      equipe: '',
      zone: '',
      heuresPresence: 7.5
    };
    
    console.log("Nouveau personnel ajouté avec fonction:", nouveauPersonnel);
    onPersonnelChange([...personnel, nouveauPersonnel]);
    
    // Fermer le sélecteur
    setIsPersonnelSelectorOpen(false);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
    setError(message);
    console.error('Erreur détaillée:', err);
  } finally {
    setLoading(false);
  }
};

  
  if (!isOpen) {
    return (
      <div className={`bg-white shadow rounded-lg p-4 ${isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-100 shadow-md'}`}>
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <HardHat className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            Personnel présents
          </div>
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-6 ${isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-100 shadow-md'}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggle}
              className={`flex items-center gap-2 text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
            >
              <HardHat className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              Personnel présents
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            <div className="group relative">
              <Info className={`w-5 h-5 cursor-help ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`} />
              <div className={`tooltip ${isDark ? 'bg-space-700 border-space-600 text-gray-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                <p className="font-medium mb-1">Guide d'utilisation :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Renseignez le nom complet de la personne</li>
                  <li>Le matricule est unique et permet d'identifier chaque employé</li>
                  <li>Sélectionnez le rôle approprié dans la liste</li>
                  <li>Les heures de présence sont par défaut à 7.5h</li>
                  <li>L'équipe permet de regrouper le personnel par groupe de travail</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPersonnelSelectorOpen(true)} 
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isDark 
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Personnel Base
            </button>
            <button
              type="button"
              onClick={() => setIsAddingPersonnel(true)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Personnel Externe
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 mb-4 rounded-lg text-sm ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {isAddingPersonnel && (
        <div className={`mb-4 p-4 rounded-lg ${
          isDark ? 'bg-space-700 border border-space-600' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Ajouter un nouveau membre
          </h3>
          <div className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={newPersonnel.nom}
              onChange={(e) => setNewPersonnel(prev => ({ ...prev, nom: e.target.value || '' }))}
              className="col-span-3 form-input"
              placeholder="Nom complet"
            />
            <input
              type="text"
              value={newPersonnel.matricule}
              onChange={(e) => setNewPersonnel(prev => ({ ...prev, matricule: e.target.value || '' }))}
              className="col-span-2 form-input"
              placeholder="Matricule"
            />
            <select
              value={newPersonnel.role}
              onChange={(e) => setNewPersonnel(prev => ({ ...prev, role: e.target.value }))}
              className="col-span-3 form-select" 
            >
              <option value="">Sélectionner un rôle</option>
              {fonctions.map((fonction) => (
                <option key={fonction.code} value={fonction.code}>
                  {fonction.libelle}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newPersonnel.entreprise}
              onChange={(e) => setNewPersonnel(prev => ({ ...prev, entreprise: e.target.value || '' }))}
              className="col-span-2 form-input"
              placeholder="Entreprise"
            />
            <input
              type="text"
              value={newPersonnel.equipe}
              onChange={(e) => setNewPersonnel(prev => ({ ...prev, equipe: e.target.value || '' }))}
              className="col-span-2 form-input"
              placeholder="Équipe"
            />
            <input
              type="number"
              value={newPersonnel.heuresPresence}
              onChange={(e) => setNewPersonnel(prev => ({ 
                ...prev, 
                heuresPresence: parseFloat(e.target.value) 
              }))}
              className="col-span-2 form-input"
              step="0.5"
              min="0"
              max="24"
              placeholder="Heures"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAddingPersonnel(false)}
              className="button-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSavePersonnel}
              disabled={loading}
              className={`button-primary ${
                loading ? 'opacity-50 cursor-wait' : ''
              } ${
                !newPersonnel.nom || !newPersonnel.role || !newPersonnel.entreprise
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter personnel externe'}
            </button>
          </div>
        </div>
      )}
      
      {/* Barre de recherche et filtres */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, matricule, entreprise..."
            className={`pl-9 pr-4 py-2 w-full rounded-lg border ${
              isDark 
                ? 'bg-space-700 border-space-600 text-gray-200 placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className={`rounded-lg border px-3 py-2 ${
            isDark 
              ? 'bg-space-700 border-space-600 text-gray-200' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <option value="">Toutes les fonctions</option>
          {fonctions.map((fonction) => (
            <option key={fonction.code} value={fonction.code}>
              {fonction.libelle}
            </option>
          ))}
        </select>
        
        <div className={`ml-auto text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {filteredPersonnel.length} {filteredPersonnel.length > 1 ? 'personnes' : 'personne'}
        </div>
      </div>

      {/* Liste du personnel */}
      <div className={`overflow-hidden rounded-lg border ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${
          isDark ? 'bg-space-700 text-gray-300' : 'bg-gray-50 text-gray-700'
        } text-sm font-medium`}>
          <div className="col-span-3">Nom</div>
          <div className="col-span-2">Matricule</div>
          <div className="col-span-2">Fonction</div>
          <div className="col-span-2">Entreprise</div>
          <div className="col-span-2">Équipe</div>
          <div className="col-span-1 text-center">Heures</div>
        </div>
        
        <div className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
          {filteredPersonnel.length > 0 ? (
            filteredPersonnel.map((personne, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-12 gap-2 items-center p-3 ${
                  isDark 
                    ? 'hover:bg-space-700' 
                    : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isDark ? 'bg-space-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {personne.nom.charAt(0).toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={personne.nom}
                    onChange={(e) => handleUpdatePersonnel(index, { nom: e.target.value || '' })}
                    className={`block w-full rounded-md border ${
                      isDark 
                        ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                    } text-sm`}
                    placeholder="Nom complet"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={personne.matricule || ''}
                      onChange={(e) => {
                        handleUpdatePersonnel(index, { matricule: e.target.value });
                      }}
                      className={`block w-full rounded-md border ${
                        isDark 
                          ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                      } text-sm`}
                      placeholder="Matricule"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <select
                    value={personne.role || ''}
                    onChange={(e) => {
                      handleUpdatePersonnel(index, { role: e.target.value });
                    }}
                    className={`block w-full rounded-md border ${
                      isDark 
                        ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                    } text-sm`}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {fonctions.map((fonction) => (
                      <option key={fonction.code} value={fonction.code}>
                        {fonction.libelle}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <Briefcase className={`w-4 h-4 flex-shrink-0 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      value={personne.entreprise || ''}
                      onChange={(e) => {
                        handleUpdatePersonnel(index, { entreprise: e.target.value });
                      }}
                      className={`block w-full rounded-md border ${
                        isDark 
                          ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                      } text-sm`}
                      placeholder="Entreprise"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <Users className={`w-4 h-4 flex-shrink-0 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      value={personne.equipe || ''}
                      onChange={(e) => {
                        handleUpdatePersonnel(index, { equipe: e.target.value });
                      }}
                      className={`block w-full rounded-md border ${
                        isDark 
                          ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                      } text-sm`}
                      placeholder="Équipe"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className={`w-4 h-4 flex-shrink-0 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="number"
                      value={personne.heuresPresence}
                      onChange={(e) => {
                        handleUpdatePersonnel(index, { heuresPresence: parseFloat(e.target.value) });
                      }}
                      className={`block w-14 rounded-md border ${
                        isDark 
                          ? 'bg-space-800 border-space-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/30' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500/30'
                      } text-sm text-center`}
                      step="0.5"
                      min="0"
                      max="24"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      handleRemovePersonnel(index, personne);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDark
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                        : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm || selectedRole 
                ? 'Aucun personnel ne correspond aux critères de recherche' 
                : 'Aucun personnel ajouté'}
            </div>
          )}
        </div>
      </div>
      
      {/* Sélecteur de personnel de base */}
      <BasePersonnelSelector
        isOpen={isPersonnelSelectorOpen}
        onClose={() => setIsPersonnelSelectorOpen(false)}
        onSelect={handleSelectBasePersonnel}
        selectedIds={personnel.map(p => p.matricule)}
      />
    </div>
  );
}