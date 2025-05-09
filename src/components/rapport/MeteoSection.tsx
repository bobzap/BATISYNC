import React from 'react';
import { Calendar } from 'lucide-react';
import { MeteoSelect } from '../MeteoSelect';
import { useTheme } from '../../hooks/useTheme';

interface MeteoSectionProps {
  nomChantier: string;
  meteo: {
    condition: string;
    temperature: number;
  };
  onUpdate: (updates: { nomChantier?: string; meteo?: { condition: string; temperature: number } }) => void;
}

export function MeteoSection({ nomChantier, meteo, onUpdate }: MeteoSectionProps) {
  const { isDark } = useTheme();

  return (
    <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
      <div className="section-header mb-6">
        <Calendar className="section-icon" />
        <span>Informations générales</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="form-label">
            Zone de chantier *
          </label>
          <input
            type="text"
            value={nomChantier}
            onChange={(e) => onUpdate({ nomChantier: e.target.value })}
            className="form-input"
            placeholder="Zone de chantier"
            required
          />
        </div>

        <div>
          <label className="form-label">
            Conditions Météo
          </label>
          <MeteoSelect
            value={meteo.condition}
            onChange={(value) =>
              onUpdate({
                meteo: { ...meteo, condition: value }
              })
            }
          />
        </div>
        <div>
          <label className="form-label">
            Température (°C)
          </label>
          <input
            type="number"
            value={meteo.temperature}
            onChange={(e) =>
              onUpdate({
                meteo: {
                  ...meteo,
                  temperature: parseInt(e.target.value)
                }
              })
            }
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
}