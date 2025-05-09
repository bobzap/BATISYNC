import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Edit2, Check, X, Download, Upload, Table } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ContractDocument, ContractExtractedData, ContractDataRow } from '../../types';
import { SECTION_COLUMNS, DEFAULT_SECTION_VALUES } from '../../types';
import { saveContractExtractedData, getContractExtractedData } from '../../lib/supabase';
import { ContractDataTable } from './ContractDataTable';
import { ExcelImporter } from './ExcelImporter';

interface ContractDataExtractorProps {
  contractId: string;
  selectedDocument: ContractDocument | null;
  onDataSaved?: () => void;
}

export function ContractDataExtractor({ contractId, selectedDocument, onDataSaved }: ContractDataExtractorProps) {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<'articles' | 'conditions' | 'conditions_speciales'>('articles');
  const [extractedData, setExtractedData] = useState<Record<string, ContractDataRow[]>>({
    articles: [],
    conditions: [],
    conditions_speciales: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<ContractExtractedData[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Charger les données extraites existantes
  useEffect(() => {
    async function loadExtractedData() {
      if (!contractId) return;
      
      try {
        setLoading(true);
        const data = await getContractExtractedData(contractId);
        setSavedData(data);
        
        // Organiser les données par section
        const organizedData: Record<string, ContractDataRow[]> = {
          articles: extractedData.articles,
          conditions: extractedData.conditions.length > 0 ? extractedData.conditions : [],
          conditions_speciales: extractedData.conditions_speciales.length > 0 ? extractedData.conditions_speciales : []
        };
        
        data.forEach(item => {
          if (organizedData[item.section]) {
            organizedData[item.section] = item.data;
          }
        });
        
        // Si aucune donnée n'existe pour les conditions et conditions spéciales, utiliser les valeurs par défaut
        if (organizedData.conditions.length === 0) {
          organizedData.conditions = DEFAULT_SECTION_VALUES.conditions.map(item => ({
            id: crypto.randomUUID(),
            values: item
          }));
        }
        
        if (organizedData.conditions_speciales.length === 0) {
          organizedData.conditions_speciales = DEFAULT_SECTION_VALUES.conditions_speciales.map(item => ({
            id: crypto.randomUUID(),
            values: item
          }));
        }
        
        setExtractedData(organizedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    
    loadExtractedData();
  }, [contractId]);

  // Initialiser les valeurs par défaut si nécessaire
  useEffect(() => {
    if (extractedData.conditions.length === 0) {
      setExtractedData(prev => ({
        ...prev,
        conditions: DEFAULT_SECTION_VALUES.conditions.map(item => ({
          id: crypto.randomUUID(),
          values: item
        }))
      }));
    }
    
    if (extractedData.conditions_speciales.length === 0) {
      setExtractedData(prev => ({
        ...prev,
        conditions_speciales: DEFAULT_SECTION_VALUES.conditions_speciales.map(item => ({
          id: crypto.randomUUID(),
          values: item
        }))
      }));
    }
  }, [activeSection]);

  const handleAddRow = () => {
    const columns = SECTION_COLUMNS[activeSection];
    const newRow: ContractDataRow = {
      id: crypto.randomUUID(),
      values: columns.reduce((acc, col) => {
        acc[col.id] = col.type === 'number' ? 0 : '';
        return acc;
      }, {} as Record<string, string | number>)
    };
    
    setExtractedData(prev => ({
      ...prev,
      [activeSection]: [...prev[activeSection], newRow]
    }));
    
    setIsEditing(true);
  };

  const handleRemoveRow = (rowId: string) => {
    setExtractedData(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].filter(row => row.id !== rowId)
    }));
  };

  const handleCellChange = (rowId: string, columnId: string, value: string | number) => {
    setExtractedData(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            values: {
              ...row.values,
              [columnId]: value
            }
          };
        }
        return row;
      })
    }));
  };

  const handleSaveData = async () => {
    if (!contractId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Sauvegarder les données pour chaque section
      for (const section of Object.keys(extractedData) as Array<keyof typeof extractedData>) {
        if (extractedData[section].length > 0) {
          await saveContractExtractedData(
            contractId,
            selectedDocument?.id,
            section,
            extractedData[section]
          );
        }
      }
      
      setIsEditing(false);
      onDataSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des données');
    } finally {
      setLoading(false);
    }
  };

  // Add the missing handleExportCSV function
  const handleExportCSV = () => {
    const columns = SECTION_COLUMNS[activeSection];
    const rows = extractedData[activeSection];
    
    // Create CSV header
    const header = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const value = row.values[col.id];
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...csvRows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contract_data_${activeSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Extraction de données
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImporter 
            columns={SECTION_COLUMNS[activeSection]}
            onImport={(newRows) => {
              setExtractedData(prev => ({
                ...prev,
                [activeSection]: [...prev[activeSection], ...newRows] 
              }));
              setIsEditing(true);
            }}
            onExport={handleExportCSV} 
          />
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveData}
                disabled={loading}
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`p-2 rounded-lg ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Onglets des sections */}
      <div className="flex border-b border-gray-200">
        {Object.entries(SECTION_COLUMNS).map(([section, _]) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeSection === section
                ? isDark
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-500 text-blue-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {section === 'articles' 
              ? 'Détails des Articles' 
              : section === 'conditions' 
                ? 'Conditions' 
                : 'Conditions Spéciales'}
          </button>
        ))}
      </div>

      {error && (
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {isEditing && (
            <div className="flex justify-between mt-4">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedDocument ? 'Document sélectionné' : 'Aucun document sélectionné'}
              </div>
            </div>
          )}

          <ContractDataTable
            columns={SECTION_COLUMNS[activeSection]}
            rows={extractedData[activeSection]}
            isEditing={isEditing}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onCellChange={handleCellChange}
          />
        </>
      )}

      {/* Informations sur le document sélectionné */}
      {selectedDocument && (
        <div className={`mt-4 p-4 rounded-lg ${
          isDark ? 'bg-space-900 border border-space-700' : 'bg-gray-50 border border-gray-200'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <FileText className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <div>
              <p className={`font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Document sélectionné: {selectedDocument.nom}
              </p>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Les données extraites seront liées à ce document
              </p>
            </div>
          </div>
          <div className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {!selectedDocument && (
              <div className="italic">
                Sélectionnez un document pour lier les données extraites
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}