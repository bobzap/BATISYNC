import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, MoreVertical, Edit2, Trash2, Plus, Eye } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Contract } from '../../types';

interface ContractsTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onViewDocument?: (document: { name: string; url: string; type: string }) => void;
}

export function ContractsTable({ contracts, onEdit, onDelete, onViewDocument }: ContractsTableProps) {
  const { isDark } = useTheme();
  const [expandedContract, setExpandedContract] = React.useState<string | null>(null);

  const getStatusColor = (status: Contract['statut']) => {
    switch (status) {
      case 'actif':
        return isDark 
          ? 'bg-green-500/20 text-green-300'
          : 'bg-green-100 text-green-800';
      case 'termine':
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
      case 'suspendu':
        return isDark
          ? 'bg-orange-500/20 text-orange-300'
          : 'bg-orange-100 text-orange-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Contract['type']) => {
    switch (type) {
      case 'fournisseur':
        return isDark
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-blue-100 text-blue-800';
      case 'sous-traitance':
        return isDark
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-purple-100 text-purple-800';
      case 'location':
        return isDark
          ? 'bg-yellow-500/20 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      case 'commande-unique':
        return isDark
          ? 'bg-pink-500/20 text-pink-300'
          : 'bg-pink-100 text-pink-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
          <tr>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Référence
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entreprise
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant HT
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date début
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documents
            </th>
            <th className="relative px-3 py-3.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
          {contracts.map((contract) => (
            <React.Fragment key={contract.id}>
              <tr className={`transition-colors ${
                isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
              }`}>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    getTypeColor(contract.type)
                  }`}>
                    {contract.type === 'fournisseur' ? 'Fournisseur'
                      : contract.type === 'sous-traitance' ? 'Sous-traitance'
                      : contract.type === 'location' ? 'Location'
                      : 'Commande unique'}
                  </span>
                </td>
                <td className={`px-3 py-4 whitespace-nowrap ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {contract.reference}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {contract.entreprise}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-right ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {contract.montantHT.toLocaleString('fr-FR')} CHF
                </td>
                <td className={`px-3 py-4 whitespace-nowrap ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {format(new Date(contract.dateDebut), 'dd/MM/yyyy')}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    getStatusColor(contract.statut)
                  }`}>
                    {contract.statut === 'actif' ? 'Actif'
                      : contract.statut === 'termine' ? 'Terminé'
                      : 'Suspendu'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {contract.documents.length}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(contract)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(contract.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                          : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedContract(
                        expandedContract === contract.id ? null : contract.id
                      )}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Détails du contrat */}
              {expandedContract === contract.id && (
                <tr>
                  <td colSpan={8} className={`px-3 py-4 ${
                    isDark ? 'bg-space-900/50' : 'bg-gray-50'
                  }`}>
                    <div className="space-y-4">
                      {/* Avenants */}
                      {contract.avenants.length > 0 && (
                        <div>
                          <h4 className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Avenants
                          </h4>
                          <div className="space-y-2">
                            {contract.avenants.map((avenant) => (
                              <div
                                key={avenant.id}
                                className={`p-3 rounded-lg ${
                                  isDark ? 'bg-space-800' : 'bg-white'
                                }`}
                              >
                                <div className="grid grid-cols-4 gap-4">
                                  <div>
                                    <label className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Référence
                                    </label>
                                    <div className={`text-sm ${
                                      isDark ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                      {avenant.reference}
                                    </div>
                                  </div>
                                  <div>
                                    <label className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Description
                                    </label>
                                    <div className={`text-sm ${
                                      isDark ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                      {avenant.description}
                                    </div>
                                  </div>
                                  <div>
                                    <label className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Montant HT
                                    </label>
                                    <div className={`text-sm ${
                                      isDark ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                      {avenant.montantHT.toLocaleString('fr-FR')} CHF
                                    </div>
                                  </div>
                                  <div>
                                    <label className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Date
                                    </label>
                                    <div className={`text-sm ${
                                      isDark ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                      {format(new Date(avenant.date), 'dd/MM/yyyy')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {contract.documents.length > 0 && (
                        <div>
                          <h4 className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Documents
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {contract.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  isDark ? 'bg-space-800 hover:bg-space-700' : 'bg-white hover:bg-gray-50'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isDark ? 'bg-space-700' : 'bg-gray-100'
                                }`}>
                                  <FileText className={`w-4 h-4 ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </div>
                                <div className="flex-grow">
                                  <div className={`text-sm font-medium ${
                                    isDark ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {doc.nom}
                                  </div>
                                  <div className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {format(new Date(doc.dateUpload), 'dd/MM/yyyy')}
                                  </div>
                                </div>
                                <button
                                  onClick={() => onViewDocument?.({
                                    name: doc.nom,
                                    url: doc.url,
                                    type: doc.type
                                  })}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDark
                                      ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}