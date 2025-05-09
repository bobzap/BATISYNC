import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { BonEvacuation } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface BonEvacuationSectionProps {
  bonsEvacuation: BonEvacuation[];
  onBonsEvacuationChange: (bons: BonEvacuation[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function BonEvacuationSection({
  bonsEvacuation,
  onBonsEvacuationChange,
  isOpen,
  onToggle
}: BonEvacuationSectionProps) {
  const { isDark } = useTheme();

  if (!isOpen) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors border ${
            isDark 
              ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border-orange-500/20'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
          }`}
        >
          <span className="font-medium">Bons d'évacuation</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors border ${
          isDark 
            ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border-orange-500/20'
            : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
        }`}
      >
        <span className="font-medium">Bons d'évacuation</span>
        <ChevronDown className="w-5 h-5" />
      </button>

      <div className="mt-4 space-y-2">
        {bonsEvacuation.map((bon, index) => (
          <div key={index} className={`grid grid-cols-8 gap-2 p-2 rounded-lg ${
            isDark ? 'bg-space-900/30' : 'bg-gray-50'
          }`}>
            <input
              type="text"
              value={bon.fournisseur}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], fournisseur: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Fournisseur"
            />
            <input
              type="text"
              value={bon.numeroBon}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], numeroBon: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="N° de bon"
            />
            <input
              type="text"
              value={bon.materiaux}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], materiaux: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Matériaux"
            />
            <input
              type="text"
              value={bon.lieuChargement}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], lieuChargement: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Lieu chargement"
            />
            <input
              type="text"
              value={bon.lieuDechargement}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], lieuDechargement: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Lieu déchargement"
            />
            <input
              type="text"
              value={bon.typeCamion}
              onChange={(e) => {
                const newBons = [...bonsEvacuation];
                newBons[index] = { ...newBons[index], typeCamion: e.target.value };
                onBonsEvacuationChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Type de camion"
            />
            <div className="col-span-1 grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={bon.quantite}
                  onChange={(e) => {
                    const newBons = [...bonsEvacuation];
                    newBons[index] = { ...newBons[index], quantite: parseFloat(e.target.value) };
                    onBonsEvacuationChange(newBons);
                  }}
                  className="form-input"
                  placeholder="Qté"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={bon.unite}
                  onChange={(e) => {
                    const newBons = [...bonsEvacuation];
                    newBons[index] = { ...newBons[index], unite: e.target.value };
                    onBonsEvacuationChange(newBons);
                  }}
                  className="form-input"
                  placeholder="Unité"
                />
              </div>
            </div>
            <div className="col-span-1">
              <input
                type="number"
                value={bon.prixUnitaire || ''}
                onChange={(e) => {
                  const newBons = [...bonsEvacuation];
                  newBons[index] = { ...newBons[index], prixUnitaire: e.target.value ? parseFloat(e.target.value) : undefined };
                  onBonsEvacuationChange(newBons);
                }}
                className="form-input"
                placeholder="Prix unitaire"
                step="0.01"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => {
                  const newBons = bonsEvacuation.filter((_, i) => i !== index);
                  onBonsEvacuationChange(newBons);
                }}
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => onBonsEvacuationChange([...bonsEvacuation, {
            fournisseur: '',
            numeroBon: '',
            materiaux: '',
            lieuChargement: '',
            lieuDechargement: '',
            typeCamion: '',
            prixUnitaire: undefined,
            quantite: 0,
            unite: ''
          }])}
          className="form-button-secondary w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un bon d'évacuation
        </button>
      </div>
    </div>
  );
}