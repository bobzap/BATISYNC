import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { Tiers } from '../types';

interface TiersSectionProps {
  tiers: Tiers[];
  onTiersChange: (tiers: Tiers[]) => void;
}

export function TiersSection({ tiers, onTiersChange }: TiersSectionProps) {
  const ajouterTiers = () => {
    onTiersChange([
      ...tiers,
      { entreprise: '', activite: '', nombrePersonnes: 0, heuresPresence: 0, zone: '' },
    ]);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tiers / SST
        </h2>
        <button
          type="button"
          onClick={ajouterTiers}
          className="inline-flex items-center px-2 py-1 text-sm border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {tiers.map((tier, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-md">
            <input
              type="text"
              value={tier.entreprise}
              onChange={(e) => {
                const newTiers = [...tiers];
                newTiers[index].entreprise = e.target.value;
                onTiersChange(newTiers);
              }}
              className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Entreprise"
            />
            <input
              type="text"
              value={tier.activite}
              onChange={(e) => {
                const newTiers = [...tiers];
                newTiers[index].activite = e.target.value;
                onTiersChange(newTiers);
              }}
              className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Activité"
            />
            <input
              type="number"
              value={tier.nombrePersonnes}
              onChange={(e) => {
                const newTiers = [...tiers];
                newTiers[index].nombrePersonnes = parseInt(e.target.value);
                onTiersChange(newTiers);
              }}
              className="col-span-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Nb pers."
            />
            <input
              type="number"
              value={tier.heuresPresence}
              onChange={(e) => {
                const newTiers = [...tiers];
                newTiers[index].heuresPresence = parseFloat(e.target.value);
                onTiersChange(newTiers);
              }}
              className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Heures"
              step="0.5"
            />
            <input
              type="text"
              value={tier.zone}
              onChange={(e) => {
                const newTiers = [...tiers];
                newTiers[index].zone = e.target.value;
                onTiersChange(newTiers);
              }}
              className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Zone"
            />
            <button
              type="button"
              onClick={() => {
                const newTiers = tiers.filter((_, i) => i !== index);
                onTiersChange(newTiers);
              }}
              className="col-span-1 text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}