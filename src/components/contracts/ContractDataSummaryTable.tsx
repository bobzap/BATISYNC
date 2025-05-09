import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { FileText, Info } from 'lucide-react';
import { getContractExtractedData } from '../../lib/supabase';
import type { ContractExtractedData, ContractDataRow } from '../../types';
import { SECTION_COLUMNS } from '../../types';

interface ContractDataSummaryTableProps {
  contractId: string;
}

export function ContractDataSummaryTable({ contractId }: ContractDataSummaryTableProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ContractExtractedData[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    async function loadExtractedData() {
      if (!contractId) return;
      
      try {
        setLoading(true);
        const data = await getContractExtractedData(contractId);
        setExtractedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    
    loadExtractedData();
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${
        isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
      }`}>
        {error}
      </div>
    );
  }

  if (extractedData.length === 0) {
    return (
      <div className={`text-center py-8 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        Aucune donnée extraite disponible pour ce contrat
      </div>
    );
  }

  // Organiser les données par section et document
  const organizedData: Record<string, {
    documentId: string | null;
    documentName: string | null;
    rows: ContractDataRow[];
  }[]> = {
    articles: [],
    conditions: [],
    conditions_speciales: []
  };

  extractedData.forEach(item => {
    if (!organizedData[item.section]) {
      organizedData[item.section] = [];
    }
    
    organizedData[item.section].push({
      documentId: item.documentId || null,
      documentName: item.documentName || null,
      rows: item.data
    });
  });

  return (
    <div className="space-y-6">
      {Object.entries(organizedData).map(([section, dataSets]) => (
        dataSets.length > 0 && (
          <div key={section} className="space-y-2">
            <h4 className={`text-base font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {section === 'articles' 
                ? 'Détails des Articles' 
                : section === 'conditions' 
                  ? 'Conditions' 
                  : 'Conditions Spéciales'}
            </h4>
            
            {dataSets.map((dataSet, dataSetIndex) => (
              <div key={dataSetIndex} className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {dataSet.documentName 
                      ? `Document: ${dataSet.documentName}` 
                      : 'Contrat d\'origine'}
                  </span>
                </div>
                
                <div className={`rounded-lg border overflow-x-auto ${
                  isDark ? 'border-space-700' : 'border-gray-200'
                }`}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                      <tr>
                        {SECTION_COLUMNS[section as keyof typeof SECTION_COLUMNS].map(column => (
                          <th 
                            key={column.id}
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.name}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isDark ? 'divide-space-700' : 'divide-gray-200'
                    }`}>
                      {dataSet.rows.length > 0 ? (
                        dataSet.rows.map(row => (
                          <tr key={row.id} className={
                            isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                          }>
                            {SECTION_COLUMNS[section as keyof typeof SECTION_COLUMNS].map(column => (
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
                            <td className="px-3 py-2">
                              <div className="relative">
                                <div 
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                    dataSet.documentId
                                      ? isDark
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-blue-100 text-blue-800'
                                      : isDark
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-purple-100 text-purple-800'
                                  }`}
                                  onMouseEnter={() => setShowTooltip(row.id)}
                                  onMouseLeave={() => setShowTooltip(null)}
                                >
                                  {dataSet.documentId ? 'Document' : 'Contrat'}
                                  <Info className="w-3 h-3" />
                                </div>
                                
                                {showTooltip === row.id && (
                                  <div className={`absolute z-10 w-48 p-2 text-xs rounded-lg shadow-lg -top-2 left-full ml-2 ${
                                    isDark
                                      ? 'bg-space-700 border border-space-600 text-gray-200'
                                      : 'bg-white border border-gray-200 text-gray-700'
                                  }`}>
                                    {dataSet.documentId
                                      ? `Données extraites du document: ${dataSet.documentName}`
                                      : 'Données liées directement au contrat sans document spécifique'}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td 
                            colSpan={SECTION_COLUMNS[section as keyof typeof SECTION_COLUMNS].length + 1} 
                            className={`px-3 py-4 text-center ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Aucune donnée disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
}