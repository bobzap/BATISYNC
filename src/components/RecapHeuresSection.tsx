import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { Personnel, Tache } from '../types';
import { useTheme } from '../hooks/useTheme';
import { getHeuresReference } from '../lib/supabase';

interface RecapHeuresSectionProps {
  personnel: Personnel[];
  taches: Tache[];
  selectedProject: Projet;
  projectId: string;
  onHeuresChange: (matricule: string, tacheId: string, heures: number) => void;
  heuresRef: number | null;
}

export function RecapHeuresSection({ personnel, taches, selectedProject, projectId, onHeuresChange, heuresRef }: RecapHeuresSectionProps) {
  const { isDark } = useTheme();
  const [editingCell, setEditingCell] = useState<{
    matricule: string;
    tacheId: string;
  } | null>(null);

  const personnelColumns = personnel.map((p) => ({
    id: p.matricule,
    nom: p.nom,
    role: p.role,
  }));
  const handleCellClick = (matricule: string, tacheId: string) => {
    setEditingCell({ matricule, tacheId });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleHeuresChange = (e: React.ChangeEvent<HTMLInputElement>, matricule: string, tacheId: string) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      // Mettre à jour les heures pour cette personne et cette tâche
      onHeuresChange(matricule, tacheId, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  };

  // Calculer le total des heures par personne
  const totalHeuresParPersonne = personnelColumns.reduce((acc, personne) => {
    acc[personne.id] = taches.reduce(
      (total, tache) => total + (tache.personnel?.find(p => p.matricule === personne.id)?.heures || 0),
      0
    );
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
              Zone
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            {personnelColumns.map((personne) => (
              <th 
                key={`header-${personne.id}-${personne.nom}`}
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>{personne.nom}</div>
                <div className="text-gray-400">{personne.role}</div>
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
          {taches.map((tache, index) => {
            const totalTache = personnelColumns.reduce(
              (total, personne) => total + (tache.personnel?.find(p => p.matricule === personne.id)?.heures || 0),
              0
            );
            const tacheId = `${tache.zone}-${tache.description}`;
            const showZone = index === 0 || tache.zone !== taches[index - 1].zone;

            return (
              <tr key={tacheId} className={`transition-colors ${
                isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
              }`}>
                <td className="px-3 py-2 text-sm text-gray-900">
                  {showZone ? tache.zone : '"'}
                </td>
                <td className="px-3 py-2 text-sm text-gray-900 whitespace-pre-line">
                  {tache.description.trim()}
                </td>
                {personnelColumns.map((personne) => (
                  <td 
                    key={`${tacheId}-${personne.id}`}
                    className={`px-3 py-2 text-sm text-gray-900 text-center cursor-pointer hover:bg-opacity-80 ${
                      isDark ? 'hover:bg-space-600' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleCellClick(personne.id, tacheId)}
                  >
                    {editingCell?.matricule === personne.id && editingCell?.tacheId === tacheId ? (
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={tache.personnel?.find(p => p.matricule === personne.id)?.heures || ''}
                          step="0.5"
                          min="0"
                          max="24"
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(numValue)) {
                              handleHeuresChange(
                                { target: { value: numValue.toString() } } as any,
                                personne.id,
                                tacheId
                              );
                            }
                          }}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.select();
                              handleCellBlur();
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              const currentIndex = personnelColumns.findIndex(p => p.id === personne.id);
                              if (currentIndex < personnelColumns.length - 1) {
                                e.currentTarget.select();
                                handleCellClick(personnelColumns[currentIndex + 1].id, tacheId);
                              }
                            }
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          autoFocus
                          className={`w-20 text-center rounded-md border py-1 ${
                            isDark
                              ? 'bg-space-700 text-gray-200 border-space-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                              : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.select();
                          }}
                        />
                      </div>
                    ) : (
                      <span className="block w-full text-center">
                        {tache.personnel?.find(p => p.matricule === personne.id)?.heures?.toLocaleString('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        }) || '-'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-sm text-gray-900 text-center font-medium">
                  {totalTache || '-'}
                </td>
              </tr>
            );
          })}
          <tr className={`font-medium ${isDark ? 'bg-space-700' : 'bg-gray-50'}`}>
            <td colSpan={2} className="px-3 py-2 text-sm text-gray-900">
              Total des heures
            </td>
            {personnelColumns.map((personne) => {
              const totalHeures = totalHeuresParPersonne[personne.id] || 0;
              if (!heuresRef) {
                return (
                  <td key={`total-${personne.id}`} className={`px-3 py-2 text-sm text-center`}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className={`w-4 h-4 ${
                        isDark ? 'text-orange-300' : 'text-orange-600'
                      }`} />
                      <span>{totalHeures || '-'}</span>
                    </div>
                  </td>
                );
              }
              const depassement = totalHeures > heuresRef;
              const inferieur = totalHeures < heuresRef;
              
              return (
                <td 
                  key={`total-${personne.id}`}
                  className={`px-3 py-2 text-sm text-center ${
                    depassement
                      ? isDark
                        ? 'text-red-300'
                        : 'text-red-600'
                      : inferieur
                        ? isDark
                          ? 'text-orange-300'
                          : 'text-orange-600'
                        : isDark
                          ? 'text-green-300'
                          : 'text-green-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {depassement && (
                      <AlertTriangle className={`w-4 h-4 ${
                        isDark ? 'text-red-300' : 'text-red-600'
                      }`} />
                    )}
                    {inferieur && (
                      <AlertTriangle className={`w-4 h-4 ${
                        isDark ? 'text-orange-300' : 'text-orange-600'
                      }`} />
                    )}
                    <span>{totalHeures || '-'}</span>
                    {(depassement || inferieur) && (
                      <span className={`text-xs ${
                        depassement
                          ? isDark ? 'text-red-300' : 'text-red-600'
                          : isDark ? 'text-orange-300' : 'text-orange-600'
                      }`}>
                        ({heuresRef}h)
                      </span>
                    )}
                  </div>
                </td>
              );
            })}
            <td className="px-3 py-2 text-sm text-center">
              {taches.reduce(
                (total, tache) => 
                  total + personnelColumns.reduce(
                    (tacheTotal, personne) => tacheTotal + (tache.personnel?.find(p => p.matricule === personne.id)?.heures || 0),
                    0
                  ),
                0
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}