import React from 'react';
import { BonApport, BonEvacuation, BonBeton, BonMateriaux } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface BonsRecapTableProps {
  bonsApport: BonApport[];
  bonsEvacuation: BonEvacuation[];
  bonsBeton: BonBeton[];
  bonsMateriaux: BonMateriaux[];
}

export function BonsRecapTable({
  bonsApport,
  bonsEvacuation,
  bonsBeton,
  bonsMateriaux,
}: BonsRecapTableProps) {
  const { isDark } = useTheme();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Bon</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matériaux/Articles</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu Chargement</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu Déchargement</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Camion</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-space-600' : 'divide-gray-200'}`}>
          {/* Bons d'apport */}
          {bonsApport.map((bon, index) => (
            <tr key={`apport-${index}`} className={`transition-colors ${
              isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 hover:bg-blue-100'
            }`}>
              <td className="px-3 py-2 text-sm font-medium text-blue-700">
                {index === 0 ? 'Apport' : ''}
              </td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.numeroBon}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.fournisseur}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.materiaux}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.lieuChargement}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.lieuDechargement}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.typeCamion}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.quantite}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.prixUnitaire ? bon.prixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.unite}</td>
            </tr>
          ))}
          
          {/* Bons d'évacuation */}
          {bonsEvacuation.map((bon, index) => (
            <tr key={`evacuation-${index}`} className={`transition-colors ${
              isDark ? 'bg-orange-500/10 hover:bg-orange-500/20' : 'bg-orange-50 hover:bg-orange-100'
            }`}>
              <td className="px-3 py-2 text-sm font-medium text-orange-700">
                {index === 0 ? 'Évacuation' : ''}
              </td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.numeroBon}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.fournisseur}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.materiaux}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.lieuChargement}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.lieuDechargement}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.typeCamion}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.quantite}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.prixUnitaire ? bon.prixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.unite}</td>
            </tr>
          ))}
          
          {/* Bons de béton */}
          {bonsBeton.map((bon, index) => (
            <tr key={`beton-${index}`} className={`transition-colors ${
              isDark ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-green-50 hover:bg-green-100'
            }`}>
              <td className="px-3 py-2 text-sm font-medium text-green-700">
                {index === 0 ? 'Béton' : ''}
              </td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.numeroBon}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.fournisseur}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.articles}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-gray-400">-</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-gray-400">-</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.typeCamion}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.quantite}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.prixUnitaire ? bon.prixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.unite}</td>
            </tr>
          ))}
          
          {/* Bons matériaux */}
          {bonsMateriaux.map((bon, index) => (
            <tr key={`materiaux-${index}`} className={`transition-colors ${
              isDark ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-purple-50 hover:bg-purple-100'
            }`}>
              <td className="px-3 py-2 text-sm font-medium text-purple-700">
                {index === 0 ? 'Matériaux' : ''}
              </td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.numeroBon}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.fournisseur}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.fournitures}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-gray-400">-</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-gray-400">-</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-gray-400">-</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.quantite}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-right">{bon.prixUnitaire ? bon.prixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{bon.unite}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}