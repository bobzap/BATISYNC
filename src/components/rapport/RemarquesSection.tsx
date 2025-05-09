import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface RemarquesSectionProps {
  remarques: string;
  remarquesContremaitre: string;
  onUpdate: (updates: { remarques?: string; remarquesContremaitre?: string }) => void;
}

export function RemarquesSection({ remarques, remarquesContremaitre, onUpdate }: RemarquesSectionProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Remarques</label>
        <textarea
          value={remarques}
          onChange={(e) => onUpdate({ remarques: e.target.value })}
          className="form-input min-h-[100px] w-full"
          placeholder="Remarques générales..."
        />
      </div>

      <div>
        <label className="form-label">Remarques contremaître</label>
        <textarea
          value={remarquesContremaitre}
          onChange={(e) => onUpdate({ remarquesContremaitre: e.target.value })}
          className="form-input min-h-[100px] w-full"
          placeholder="Remarques du contremaître..."
        />
      </div>
    </div>
  );
}