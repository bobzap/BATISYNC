import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Personnel } from '../../types';

interface ImportPersonnelCheckboxProps {
  importPersonnel: boolean;
  onImportChange: (checked: boolean) => void;
  loadingPreviousPersonnel: boolean;
  previousDayPersonnel: Personnel[];
  previousPersonnelError: string | null;
}

export function ImportPersonnelCheckbox({
  importPersonnel,
  onImportChange,
  loadingPreviousPersonnel,
  previousDayPersonnel,
  previousPersonnelError
}: ImportPersonnelCheckboxProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2 pt-2">
      <input
        type="checkbox"
        id="importPersonnel"
        checked={importPersonnel}
        onChange={(e) => {
          if (previousDayPersonnel.length > 0) {
            onImportChange(e.target.checked);
          }
        }}
        disabled={loadingPreviousPersonnel}
        className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
          isDark ? 'bg-space-800 border-space-700' : ''
        }`}
      />
      <label
        htmlFor="importPersonnel"
        className={`text-sm ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        } ${loadingPreviousPersonnel ? 'opacity-50' : ''}`}
      >
        {loadingPreviousPersonnel 
          ? 'Chargement du personnel...'
          : previousDayPersonnel.length === 0
            ? previousPersonnelError || 'Aucun personnel disponible pour la veille' 
            : 'Importer le personnel de la veille'}
      </label>
    </div>
  );
}