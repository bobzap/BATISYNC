import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { BonApport } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface BonApportSectionProps {
  bonsApport: BonApport[];
  onBonsApportChange: (bons: BonApport[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function BonApportSection({
  bonsApport,
  onBonsApportChange,
  isOpen,
  onToggle
}: BonApportSectionProps) {
  const { isDark } = useTheme();

  if (!isOpen) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors border ${
            isDark 
              ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border-blue-500/20'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
          }`}
        >
          <span className="font-medium">Bons d'apport</span>
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
            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border-blue-500/20'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
        }`}
      >
        <span className="font-medium">Bons d'apport</span>
        <ChevronDown className="w-5 h-5" />
      </button>

      <div className="mt-4 space-y-2">
        {bonsApport.map((bon, index) => (
          <div key={index} className={`grid grid-cols-8 gap-2 p-2 rounded-lg ${
            isDark ? 'bg-space-900/30' : 'bg-gray-50'
          }`}>
            <input
              type="text"
              value={bon.fournisseur}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], fournisseur: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Fournisseur"
            />
            <input
              type="text"
              value={bon.numeroBon}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], numeroBon: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="N° de bon"
            />
            <input
              type="text"
              value={bon.materiaux}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], materiaux: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Matériaux"
            />
            <input
              type="text"
              value={bon.lieuChargement}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], lieuChargement: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="col-span-1 form-input"
              placeholder="Lieu chargement"
            />
            <input
              type="text"
              value={bon.lieuDechargement}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], lieuDechargement: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="col-span-1 form-input"
              placeholder="Lieu déchargement"
            />
            <input
              type="text"
              value={bon.typeCamion}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], typeCamion: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="form-input col-span-1"
              placeholder="Type de camion"
            />
            <input
              type="number"
              value={bon.quantite}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], quantite: parseFloat(e.target.value) };
                onBonsApportChange(newBons);
              }}
              className="form-input"
              placeholder="Qté"
            />
            <input
              type="text"
              value={bon.unite}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], unite: e.target.value };
                onBonsApportChange(newBons);
              }}
              className="form-input"
              placeholder="Unité"
            />
            <input
              type="number"
              value={bon.prixUnitaire || ''}
              onChange={(e) => {
                const newBons = [...bonsApport];
                newBons[index] = { ...newBons[index], prixUnitaire: e.target.value ? parseFloat(e.target.value) : undefined };
                onBonsApportChange(newBons);
              }}
              className="form-input"
              placeholder="Prix unitaire"
              step="0.01"
            />
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => {
                  const newBons = bonsApport.filter((_, i) => i !== index);
                  onBonsApportChange(newBons);
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
          onClick={() => onBonsApportChange([...bonsApport, {
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
          Ajouter un bon d'apport
        </button>
      </div>
    </div>
  );
}