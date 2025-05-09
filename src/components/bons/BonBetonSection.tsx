import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { BonBeton } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface BonBetonSectionProps {
  bonsBeton: BonBeton[];
  onBonsBetonChange: (bons: BonBeton[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function BonBetonSection({
  bonsBeton,
  onBonsBetonChange,
  isOpen,
  onToggle
}: BonBetonSectionProps) {
  const { isDark } = useTheme();

  if (!isOpen) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors border ${
            isDark 
              ? 'bg-green-500/10 hover:bg-green-500/20 text-green-200 border-green-500/20'
              : 'bg-green-50 hover:bg-green-100 text-green-900 border-green-200'
          }`}
        >
          <span className="font-medium">Bons de béton</span>
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
            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-200 border-green-500/20'
            : 'bg-green-50 hover:bg-green-100 text-green-900 border-green-200'
        }`}
      >
        <span className="font-medium">Bons de béton</span>
        <ChevronDown className="w-5 h-5" />
      </button>

      <div className="mt-4 space-y-2">
        {bonsBeton.map((bon, index) => (
          <div key={index} className={`grid grid-cols-7 gap-2 p-2 rounded-lg ${
            isDark ? 'bg-space-900/30' : 'bg-gray-50'
          }`}>
            <input
              type="text"
              value={bon.fournisseur}
              onChange={(e) => {
                const newBons = [...bonsBeton];
                newBons[index] = { ...newBons[index], fournisseur: e.target.value };
                onBonsBetonChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Fournisseur"
            />
            <input
              type="text"
              value={bon.numeroBon}
              onChange={(e) => {
                const newBons = [...bonsBeton];
                newBons[index] = { ...newBons[index], numeroBon: e.target.value };
                onBonsBetonChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="N° de bon"
            />
            <input
              type="text"
              value={bon.articles}
              onChange={(e) => {
                const newBons = [...bonsBeton];
                newBons[index] = { ...newBons[index], articles: e.target.value };
                onBonsBetonChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Articles"
            />
            <input
              type="text"
              value={bon.typeFourniture}
              onChange={(e) => {
                const newBons = [...bonsBeton];
                newBons[index] = { ...newBons[index], typeFourniture: e.target.value };
                onBonsBetonChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Type de fourniture"
            />
            <input
              type="text"
              value={bon.typeCamion}
              onChange={(e) => {
                const newBons = [...bonsBeton];
                newBons[index] = { ...newBons[index], typeCamion: e.target.value };
                onBonsBetonChange(newBons);
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
                    const newBons = [...bonsBeton];
                    newBons[index] = { ...newBons[index], quantite: parseFloat(e.target.value) };
                    onBonsBetonChange(newBons);
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
                    const newBons = [...bonsBeton];
                    newBons[index] = { ...newBons[index], unite: e.target.value };
                    onBonsBetonChange(newBons);
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
                  const newBons = [...bonsBeton];
                  newBons[index] = { ...newBons[index], prixUnitaire: e.target.value ? parseFloat(e.target.value) : undefined };
                  onBonsBetonChange(newBons);
                }}
                className="form-input"
                placeholder="Prix unitaire"
                step="0.01"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => {
                  const newBons = bonsBeton.filter((_, i) => i !== index);
                  onBonsBetonChange(newBons);
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
          onClick={() => onBonsBetonChange([...bonsBeton, {
            fournisseur: '',
            numeroBon: '',
            articles: '',
            typeFourniture: '',
            typeCamion: '',
            prixUnitaire: undefined,
            quantite: 0,
            unite: ''
          }])}
          className="form-button-secondary w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un bon de béton
        </button>
      </div>
    </div>
  );
}