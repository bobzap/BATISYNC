import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { ContractExtractedData, ContractDataRow } from '../../types';
import { SECTION_COLUMNS } from '../../types';

interface ContractDataSummaryProps {
  contractId: string;
  extractedData: Record<string, ContractDataRow[]>;
}

export function ContractDataSummary({ contractId, extractedData }: ContractDataSummaryProps) {
  const { isDark } = useTheme();

  // Vérifier si des données sont disponibles
  const hasData = Object.values(extractedData).some(rows => rows.length > 0);

  if (!hasData) {
    return (
      <div className={`text-center py-8 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        Aucune donnée extraite disponible pour ce contrat
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className={`text-lg font-medium ${
        isDark ? 'text-gray-200' : 'text-gray-900'
      }`}>
        Récapitulatif des données extraites
      </h3>

      {/* Détails des Articles */}
      {extractedData.articles && extractedData.articles.length > 0 && (
        <div className="space-y-2">
          <h4 className={`text-base font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Détails des Articles
          </h4>
          <div className={`rounded-lg border overflow-x-auto ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                <tr>
                  {SECTION_COLUMNS.articles.map(column => (
                    <th 
                      key={column.id}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-space-700' : 'divide-gray-200'
              }`}>
                {extractedData.articles.map(row => (
                  <tr key={row.id} className={
                    isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                  }>
                    {SECTION_COLUMNS.articles.map(column => (
                      <td 
                        key={`${row.id}-${column.id}`} 
                        className={`px-3 py-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}
                      >
                        {column.type === 'number' && typeof row.values[column.id] === 'number'
                          ? row.values[column.id].toLocaleString('fr-FR')
                          : row.values[column.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conditions */}
      {extractedData.conditions && extractedData.conditions.length > 0 && (
        <div className="space-y-2">
          <h4 className={`text-base font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Conditions
          </h4>
          <div className={`rounded-lg border overflow-x-auto ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                <tr>
                  {SECTION_COLUMNS.conditions.map(column => (
                    <th 
                      key={column.id}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-space-700' : 'divide-gray-200'
              }`}>
                {extractedData.conditions.map(row => (
                  <tr key={row.id} className={
                    isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                  }>
                    {SECTION_COLUMNS.conditions.map(column => (
                      <td 
                        key={`${row.id}-${column.id}`} 
                        className={`px-3 py-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}
                      >
                        {column.type === 'number' && typeof row.values[column.id] === 'number'
                          ? row.values[column.id].toLocaleString('fr-FR')
                          : row.values[column.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conditions Spéciales */}
      {extractedData.conditions_speciales && extractedData.conditions_speciales.length > 0 && (
        <div className="space-y-2">
          <h4 className={`text-base font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Conditions Spéciales
          </h4>
          <div className={`rounded-lg border overflow-x-auto ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                <tr>
                  {SECTION_COLUMNS.conditions_speciales.map(column => (
                    <th 
                      key={column.id}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-space-700' : 'divide-gray-200'
              }`}>
                {extractedData.conditions_speciales.map(row => (
                  <tr key={row.id} className={
                    isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                  }>
                    {SECTION_COLUMNS.conditions_speciales.map(column => (
                      <td 
                        key={`${row.id}-${column.id}`} 
                        className={`px-3 py-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}
                      >
                        {column.type === 'number' && typeof row.values[column.id] === 'number'
                          ? row.values[column.id].toLocaleString('fr-FR')
                          : row.values[column.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}