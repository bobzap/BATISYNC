import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Machine } from '../types';
import { saveMachine, getMachinesByProject, deleteMachine } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { Notification } from '../components/Notification';

interface MachinesInventorySectionProps {
  machines: Machine[];
  onMachinesChange: (machines: Machine[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  projectId: string;
}

export function MachinesInventorySection({ 
  machines, 
  onMachinesChange, 
  isOpen, 
  onToggle,
  projectId
}: MachinesInventorySectionProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    showConfirm?: boolean;
    onConfirm?: () => void;
  } | null>(null);
  const [newMachine, setNewMachine] = useState<Machine>({
    nom: '',
    type: '',
    numeroMateriel: '',
    entreprise: '',
    quantite: 1,
    remarques: ''
  });

  // Charger les machines du projet
  useEffect(() => {
    async function loadMachines() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMachinesByProject(projectId);
        onMachinesChange(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) {
      loadMachines();
    }
  }, [projectId, onMachinesChange]);

  const handleSaveMachine = async () => {
    // Validation des champs requis
    if (!newMachine.nom || !newMachine.type || !newMachine.numeroMateriel || !newMachine.entreprise) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!projectId) {
        throw new Error('ID du projet manquant');
      }
      
      // Appel à la fonction saveMachine avec le projectId
      const savedMachine = await saveMachine(projectId, newMachine);
      
      // Mise à jour de l'état local uniquement si la sauvegarde a réussi
      onMachinesChange([...machines, savedMachine]);
      
      // Réinitialiser le formulaire
      setIsAddingMachine(false);
      setNewMachine({
        nom: '',
        type: '',
        numeroMateriel: '',
        entreprise: '',
        quantite: 1,
        remarques: ''
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMachine = async (index: number, updates: Partial<Machine>) => {
    const newMachines = [...machines];
    if (newMachines[index]) {
      newMachines[index] = { ...newMachines[index], ...updates };

      if (!projectId) {
        setError('ID du projet manquant');
        return;
      }
    
      try {
        setLoading(true);
        setError(null);
        await saveMachine(projectId, newMachines[index]);
        onMachinesChange(newMachines);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-lg font-medium text-gray-900"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Inventaire des machines
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggle}
              className="flex items-center gap-2 text-lg font-medium text-gray-900"
            >
              <Wrench className="w-5 h-5" />
              Inventaire des machines
              <ChevronDown className="w-5 h-5" />
            </button>
            <div className="group relative">
              <Info className="w-5 h-5 cursor-help text-gray-500 hover:text-gray-600" />
              <div className="tooltip">
                <p className="font-medium mb-1">Guide d'utilisation :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Renseignez le nom de la machine</li>
                  <li>Le numéro de matériel est unique</li>
                  <li>Sélectionnez le type de machine</li>
                  <li>Indiquez l'entreprise propriétaire</li>
                  <li>La quantité est optionnelle</li>
                </ul>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingMachine(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Machine
          </button>
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
      {isAddingMachine && (
        <div className={`mb-4 p-4 rounded-lg ${
          isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Ajouter une nouvelle machine
          </h3>
          <div className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={newMachine.nom}
              onChange={(e) => setNewMachine(prev => ({ ...prev, nom: e.target.value }))}
              className="col-span-3 form-input"
              placeholder="Nom de la machine"
            />
            <input
              type="text"
              value={newMachine.numeroMateriel}
              onChange={(e) => setNewMachine(prev => ({ ...prev, numeroMateriel: e.target.value }))}
              className="col-span-2 form-input"
              placeholder="Numéro de matériel"
            />
            <select
              value={newMachine.type}
              onChange={(e) => setNewMachine(prev => ({ ...prev, type: e.target.value }))}
              className="col-span-3 form-select"
            >
              <option value="">Sélectionner un type</option>
              {[
                { value: 'excavatrice', label: 'Excavatrice' },
                { value: 'bulldozer', label: 'Bulldozer' },
                { value: 'grue', label: 'Grue' },
                { value: 'camion', label: 'Camion' },
                { value: 'compacteur', label: 'Compacteur' },
              ].map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newMachine.entreprise}
              onChange={(e) => setNewMachine(prev => ({ ...prev, entreprise: e.target.value }))}
              className="col-span-2 form-input"
              placeholder="Entreprise"
            />
            <input
              type="number"
              value={newMachine.quantite}
              onChange={(e) => setNewMachine(prev => ({ 
                ...prev, 
                quantite: parseInt(e.target.value) 
              }))}
              className="col-span-2 form-input"
              placeholder="Quantité"
              min="1"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAddingMachine(false)}
              className="button-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveMachine}
              disabled={loading}
              className={`button-primary ${
                loading ? 'opacity-50 cursor-wait' : ''
              } ${
                !newMachine.nom || !newMachine.type || !newMachine.numeroMateriel || !newMachine.entreprise
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {machines.map((machine, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-md">
            <input
              type="text"
              value={machine.nom}
              onChange={(e) => handleUpdateMachine(index, { nom: e.target.value || '' })}
              className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Nom de la machine"
              required
            />
            <input
              type="text"
              value={machine.numeroMateriel || ''}
              onChange={(e) => {
                handleUpdateMachine(index, { numeroMateriel: e.target.value });
              }}
              className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Numéro de matériel"
            />
            <select
              value={machine.type}
              onChange={(e) => {
                handleUpdateMachine(index, { type: e.target.value });
              }}
              className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Sélectionner un type</option>
              {[
                { value: 'excavatrice', label: 'Excavatrice' },
                { value: 'bulldozer', label: 'Bulldozer' },
                { value: 'grue', label: 'Grue' },
                { value: 'camion', label: 'Camion' },
                { value: 'compacteur', label: 'Compacteur' },
              ].map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={machine.entreprise || ''}
              onChange={(e) => {
                handleUpdateMachine(index, { entreprise: e.target.value });
              }}
              className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Entreprise"
            />
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="number"
                value={machine.quantite}
                onChange={(e) => {
                  handleUpdateMachine(index, { quantite: parseInt(e.target.value) });
                }}
                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                min="1"
              />
              <button
                type="button"
                onClick={() => {
                  setNotification({
                    type: 'warning',
                    message: 'Êtes-vous sûr de vouloir supprimer cette machine ?',
                    showConfirm: true,
                    onConfirm: async () => {
                      try {
                        await deleteMachine(projectId, machine.numeroMateriel);
                        const newMachines = machines.filter((_, i) => i !== index);
                        onMachinesChange(newMachines);
                        setNotification({
                          type: 'success',
                          message: 'Machine supprimée avec succès'
                        });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
                        setNotification({
                          type: 'error',
                          message: 'Erreur lors de la suppression de la machine'
                        });
                      }
                    }
                  });
                }}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          showConfirm={notification.showConfirm}
          onConfirm={notification.onConfirm}
        />
      )}
    </div>
  );
}
