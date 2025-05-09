import React from 'react';
import { ClipboardList, Wrench, Truck, Users } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface RapportTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function RapportTabs({ activeTab, onTabChange }: RapportTabsProps) {
  const { isDark } = useTheme();

  const tabs = [
    { id: 'travaux', label: 'Désignation des travaux', icon: ClipboardList },
    { id: 'machines', label: 'Machines et Matériel', icon: Wrench },
    { id: 'bons', label: 'Bons', icon: Truck },
    { id: 'tiers', label: 'Tiers / SST', icon: Users },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === id
                ? isDark
                  ? 'border-galaxy-500 text-galaxy-100'
                  : 'border-blue-500 text-blue-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Icon className={`
              mr-2 h-5 w-5
              ${activeTab === id
                ? isDark
                  ? 'text-galaxy-400'
                  : 'text-blue-500'
                : isDark
                  ? 'text-gray-400 group-hover:text-gray-300'
                  : 'text-gray-400 group-hover:text-gray-500'
              }
            `} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}