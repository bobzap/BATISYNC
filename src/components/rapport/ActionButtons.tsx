import React from 'react';
import { Save, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ActionButtonsProps {
  visaContremaitre: boolean;
  saving: boolean;
  onToggleVisa: () => void;
  onSave: () => void;
}

export function ActionButtons({ visaContremaitre, saving, onToggleVisa, onSave }: ActionButtonsProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex justify-end gap-4">
      <button
        type="button"
        onClick={onToggleVisa}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          visaContremaitre
            ? isDark
              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
            : isDark
              ? 'bg-space-700 text-gray-300 hover:bg-space-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {visaContremaitre && <Check className="w-4 h-4" />}
        Visa contremaître
      </button>
      <button
        type="button"
        onClick={onSave}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          isDark
            ? 'bg-blue-500 hover:bg-blue-400 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        disabled={saving}
      >
        <Save className="w-4 h-4" />
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}