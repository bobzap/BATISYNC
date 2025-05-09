import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../hooks/useTheme';
import type { Projet } from '../../types';

interface RapportHeaderProps {
  selectedDate: Date;
  selectedProject: Projet | null;
  saving: boolean;
  hasUnsavedChanges: boolean;
  visaContremaitre: boolean;
  onToggleVisa: () => void;
  onDateChange: (date: Date) => void;
}

export function RapportHeader({
  selectedDate,
  selectedProject,
  saving,
  hasUnsavedChanges,
  visaContremaitre,
  onToggleVisa,
  onDateChange
}: RapportHeaderProps) {
  const { isDark } = useTheme();

  return (
    <div className={`mt-8 rounded-xl p-8 ${
      isDark 
        ? 'bg-space-800 border border-space-700' 
        : 'bg-white border border-blue-100 shadow-sm'
    }`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${
            isDark ? 'text-galaxy-100' : 'text-blue-900'
          }`}>
            <div className="flex items-center gap-4">
              <span>Rapport du {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
              <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                • {selectedProject?.nom}
              </span>
              {saving && (
                <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  • Sauvegarde en cours...
                </span>
              )}
              {hasUnsavedChanges && !saving && (
                <span className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  • Modifications non sauvegardées
                </span>
              )}
            </div>
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
            Remplissez les informations du rapport journalier. Les champs marqués d'un astérisque (*) sont obligatoires.
          </p>
        </div>
        <button
          onClick={onToggleVisa}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            visaContremaitre
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : isDark
                ? 'bg-space-700 hover:bg-space-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {visaContremaitre && <Check className="w-4 h-4" />}
          Visa contremaître
        </button>
      </div>
    </div>
  );
}