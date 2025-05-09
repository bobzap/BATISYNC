import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning } from 'lucide-react';

interface MeteoSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function MeteoSelect({ value, onChange }: MeteoSelectProps) {
  const options = [
    { value: 'ensoleille', icon: Sun, label: 'Ensoleillé' },
    { value: 'nuageux', icon: Cloud, label: 'Nuageux' },
    { value: 'pluvieux', icon: CloudRain, label: 'Pluvieux' },
    { value: 'orageux', icon: CloudLightning, label: 'Orageux' },
  ];

  return (
    <div className="flex gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-lg flex flex-col items-center gap-2 ${
              value === option.value
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}