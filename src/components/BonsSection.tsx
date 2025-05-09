import React, { useState } from 'react';
import { Truck, Info } from 'lucide-react';
import { BonApport, BonEvacuation, BonBeton, BonMateriaux } from '../types';
import { useTheme } from '../hooks/useTheme';
import { BonApportSection } from './bons/BonApportSection';
import { BonEvacuationSection } from './bons/BonEvacuationSection';
import { BonBetonSection } from './bons/BonBetonSection';
import { BonMateriauxSection } from './bons/BonMateriauxSection';
import { BonsRecapTable } from './bons/BonsRecapTable';

interface BonsSectionProps {
  bonsApport: BonApport[];
  bonsEvacuation: BonEvacuation[];
  bonsBeton: BonBeton[];
  bonsMateriaux: BonMateriaux[];
  onBonsApportChange: (bons: BonApport[]) => void;
  onBonsEvacuationChange: (bons: BonEvacuation[]) => void;
  onBonsBetonChange: (bons: BonBeton[]) => void;
  onBonsMateriauxChange: (bons: BonMateriaux[]) => void;
}

export function BonsSection({
  bonsApport,
  bonsEvacuation,
  bonsBeton,
  bonsMateriaux,
  onBonsApportChange,
  onBonsEvacuationChange,
  onBonsBetonChange,
  onBonsMateriauxChange,
}: BonsSectionProps) {
  const { isDark } = useTheme();
  const [sectionsOpen, setSectionsOpen] = useState({
    apport: true,
    evacuation: true,
    beton: true,
    materiaux: true
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`form-section ${isDark ? 'card-dark' : 'card-light'}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="section-header">
              <Truck className="section-icon" />
              Bons de livraison et d'évacuation
            </h2>
            <div className="group relative">
              <Info className={`w-5 h-5 cursor-help ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
              }`} />
              <div className="tooltip">
                <p className="font-medium mb-1">Guide d'utilisation :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Renseignez le numéro de bon exact tel qu'il apparaît sur le document</li>
                  <li>Pour les bons d'apport :
                    <ul className="list-disc list-inside ml-4">
                      <li>Indiquez le fournisseur et le matériau livré</li>
                      <li>Précisez la quantité et l'unité (m³, tonnes, etc.)</li>
                    </ul>
                  </li>
                  <li>Pour les bons d'évacuation :
                    <ul className="list-disc list-inside ml-4">
                      <li>Notez la destination (décharge, recyclage, etc.)</li>
                      <li>Spécifiez le type de matériau évacué</li>
                    </ul>
                  </li>
                  <li>L'heure doit être renseignée pour la traçabilité</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <BonApportSection
          bonsApport={bonsApport}
          onBonsApportChange={onBonsApportChange}
          isOpen={sectionsOpen.apport}
          onToggle={() => toggleSection('apport')}
        />

        <BonEvacuationSection
          bonsEvacuation={bonsEvacuation}
          onBonsEvacuationChange={onBonsEvacuationChange}
          isOpen={sectionsOpen.evacuation}
          onToggle={() => toggleSection('evacuation')}
        />

        <BonBetonSection
          bonsBeton={bonsBeton}
          onBonsBetonChange={onBonsBetonChange}
          isOpen={sectionsOpen.beton}
          onToggle={() => toggleSection('beton')}
        />

        <BonMateriauxSection
          bonsMateriaux={bonsMateriaux}
          onBonsMateriauxChange={onBonsMateriauxChange}
          isOpen={sectionsOpen.materiaux}
          onToggle={() => toggleSection('materiaux')}
        />

        {/* Récapitulatif */}
        <div className="mt-8">
          <h3 className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Récapitulatif des bons
          </h3>
          <BonsRecapTable
            bonsApport={bonsApport}
            bonsEvacuation={bonsEvacuation}
            bonsBeton={bonsBeton}
            bonsMateriaux={bonsMateriaux}
          />
        </div>
      </div>
    </div>
  );
}