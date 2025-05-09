import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { COMPANY_NAME, COMPANY_FULL_NAME, ENTREPRISES } from '../../lib/constants';
import { useTheme } from '../../hooks/useTheme';
import { getPersonnelFonctions, addExternalPersonnelToProject, getPersonnelByProject  } from '../../lib/supabase';
import type { PersonnelFonction } from '../../types';

interface ExternalPersonnelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nom: string;
   
    fonction: string;
    entreprise: string;
    equipe: string;
    zone: string;
  }) => void;
}

export function ExternalPersonnelForm({ isOpen, onClose, onSubmit }: ExternalPersonnelFormProps) {
  const { isDark } = useTheme();
  const [fonctions, setFonctions] = useState<PersonnelFonction[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    
    fonction: '',
    entreprise: '',
    equipe: '',
    zone: ''
  });

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

  if (!isOpen) return null;

  // Filtrer PFSA de la liste des entreprises
  const availableEnterprises = ENTREPRISES.filter(e => e.value !== 'PFSA');


const handleExternalPersonnelSubmit = async (data: {
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  equipe: string;
  zone: string;
}) => {
  try {
    await addExternalPersonnelToProject(projectId, {
      nom: data.nom,
      prenom: data.prenom,
      intitule_fonction: data.fonction, 
      entreprise: data.entreprise,
      equipe: data.equipe,
      zone: data.zone
    });
    
    // Recharger les données du personnel après l'ajout
    const updatedPersonnel = await getPersonnelByProject(projectId);
    onPersonnelChange(updatedPersonnel);
    
    setNotification({
      type: 'success',
      message: 'Personnel externe ajouté avec succès'
    });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du personnel externe:', err);
    setNotification({
      type: 'error',
      message: 'Erreur lors de l\'ajout du personnel externe'
    });
  }
};




  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/70 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${
          isDark ? 'bg-space-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Ajouter du personnel externe
            </h3>
            <button
              onClick={onClose}
              className={`rounded-lg p-1 hover:bg-opacity-80 transition-colors ${
                isDark 
                  ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
            onClose();
          }} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
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
                  
                  Fonction *
                </label>
                <select
                  required
                  value={formData.fonction}
                  onChange={(e) => setFormData(prev => ({ ...prev, fonction: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Sélectionner une fonction</option>
                  {fonctions.map((fonction) => (
                    <option key={fonction.code} value={fonction.code}>
                      {fonction.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Entreprise *
                </label>
                <select
                  required
                  value={formData.entreprise}
                  onChange={(e) => setFormData(prev => ({ ...prev, entreprise: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Sélectionner une entreprise</option>
                  {availableEnterprises.map((entreprise) => (
                    <option key={entreprise.value} value={entreprise.value}>
                      {entreprise.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Équipe
                </label>
                <input
                  type="text"
                  value={formData.equipe}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipe: e.target.value }))}
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
                  Zone
                </label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}