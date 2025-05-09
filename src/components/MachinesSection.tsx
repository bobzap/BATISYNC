import React from 'react';
import { Wrench, Plus, Trash2 } from 'lucide-react';
import { Tache, TacheMachine } from '../types';
import { useTheme } from '../hooks/useTheme';

interface MachinesSectionProps {
  taches: Tache[];
  onTachesChange: (taches: Tache[]) => void;
}

export function MachinesSection({ taches = [], onTachesChange }: MachinesSectionProps) {
  const { isDark } = useTheme();

  const ajouterMachinePourTache = (tacheIndex: number) => {
    const newTaches = [...taches];
    if (!newTaches[tacheIndex].machines) {
      newTaches[tacheIndex].machines = [];
    }
    newTaches[tacheIndex].machines.push({
      numeroMateriel: '',
      entreprise: '',
      heures: 0,
      remarques: ''
    });
    onTachesChange(newTaches);
  };

  const supprimerMachine = (tacheIndex: number, machineIndex: number) => {
    const newTaches = [...taches];
    newTaches[tacheIndex].machines = newTaches[tacheIndex].machines.filter((_, i) => i !== machineIndex);
    onTachesChange(newTaches);
  };

  const updateMachine = (
    tacheIndex: number,
    machineIndex: number,
    updates: Partial<TacheMachine>
  ) => {
    const newTaches = [...taches];
    if (!newTaches[tacheIndex].machines) {
      newTaches[tacheIndex].machines = [];
    }
    newTaches[tacheIndex].machines[machineIndex] = {
      ...newTaches[tacheIndex].machines[machineIndex],
      ...updates
    };
    onTachesChange(newTaches);
  };

  if (!Array.isArray(taches) || taches.length === 0) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Aucune tâche n'a été créée. Commencez par créer des tâches dans l'onglet "Désignation des travaux".
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {taches.map((tache, tacheIndex) => (
        <div key={tacheIndex} className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium mb-1">
                {tache.zone || 'Zone non spécifiée'}
              </h3>
              <p className="text-sm text-gray-500">
                {tache.description || 'Aucune description'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ajouterMachinePourTache(tacheIndex)}
              className="form-button"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une machine
            </button>
          </div>

          <div className="space-y-2">
            {(tache.machines || []).map((machine, machineIndex) => (
              <div key={machineIndex} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-md ${
                isDark ? 'bg-space-900/30' : 'bg-gray-50'
              }`}>
                <input
                  type="text"
                  value={machine.numeroMateriel}
                  onChange={(e) => updateMachine(tacheIndex, machineIndex, { numeroMateriel: e.target.value })}
                  className="form-input col-span-2"
                  placeholder="N° Matériel"
                />
                <input
                  type="text"
                  value={machine.entreprise}
                  onChange={(e) => updateMachine(tacheIndex, machineIndex, { entreprise: e.target.value })}
                  className="form-input col-span-3"
                  placeholder="Entreprise"
                />
                <input
                  type="number"
                  value={machine.heures}
                  onChange={(e) => updateMachine(tacheIndex, machineIndex, { heures: parseFloat(e.target.value) })}
                  className="form-input col-span-2"
                  placeholder="Heures"
                  step="0.5"
                  min="0"
                  max="24"
                />
                <input
                  type="text"
                  value={machine.remarques}
                  onChange={(e) => updateMachine(tacheIndex, machineIndex, { remarques: e.target.value })}
                  className="form-input col-span-4"
                  placeholder="Remarques"
                />
                <button
                  type="button"
                  onClick={() => supprimerMachine(tacheIndex, machineIndex)}
                  className={`col-span-1 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {(!tache.machines || tache.machines.length === 0) && (
              <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Aucune machine assignée à cette tâche
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}