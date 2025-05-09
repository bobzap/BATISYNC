import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ContractDataRow } from '../../types';

interface ExcelImporterProps {
  onImport: (rows: ContractDataRow[]) => void;
  columns: Array<{
    id: string;
    name: string;
    type: 'text' | 'number';
  }>;
  onExport: () => void;
}

export function ExcelImporter({ onImport, columns, onExport }: ExcelImporterProps) {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const rows = csvData.split('\n');
        
        if (rows.length < 2) {
          setError('Le fichier ne contient pas assez de données');
          return;
        }
        
        // Extraire les en-têtes et créer un mapping initial
        const csvHeaders = rows[0].split(',').map(h => h.trim());
        setHeaders(csvHeaders);
        
        // Créer un mapping automatique basé sur la similarité des noms
        const initialMapping: Record<string, string> = {};
        csvHeaders.forEach((header, index) => {
          const matchingColumn = columns.find(col => 
            col.name.toLowerCase().includes(header.toLowerCase()) || 
            header.toLowerCase().includes(col.name.toLowerCase())
          );
          if (matchingColumn) {
            initialMapping[index.toString()] = matchingColumn.id;
          }
        });
        
        setColumnMapping(initialMapping);
        
        // Prévisualisation des données (jusqu'à 5 lignes)
        const preview = rows.slice(1, 6).map(row => row.split(',').map(cell => cell.trim()));
        setPreviewData(preview);
        
        setIsModalOpen(true);
      } catch (err) {
        setError('Erreur lors de la lecture du fichier');
        console.error(err);
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      // Créer les lignes de données à partir du mapping
      const newRows: ContractDataRow[] = [];
      
      previewData.forEach(row => {
        if (row.length === 0 || row.every(cell => !cell)) return;
        
        const values: Record<string, string | number> = {};
        
        Object.entries(columnMapping).forEach(([csvIndex, colId]) => {
          const column = columns.find(c => c.id === colId);
          if (column && parseInt(csvIndex) < row.length) {
            const value = row[parseInt(csvIndex)];
            values[colId] = column.type === 'number' && !isNaN(parseFloat(value))
              ? parseFloat(value)
              : value;
          }
        });
        
        newRows.push({
          id: crypto.randomUUID(),
          values
        });
      });
      
      onImport(newRows);
      setIsModalOpen(false);
    } catch (err) {
      setError('Erreur lors de l\'importation des données');
      console.error(err);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
            isDark
              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          title="Importer depuis Excel/CSV"
        >
          <Upload className="w-3 h-3" />
          <span>Importer</span>
        </button>
        <button
          onClick={onExport}
          className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
            isDark
              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
          title="Exporter en CSV"
        >
          <Download className="w-3 h-3" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Modal de mapping des colonnes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/70 transition-opacity" 
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-4xl rounded-lg shadow-xl ${
              isDark ? 'bg-space-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                  <h3 className={`text-lg font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Importer des données
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {error && (
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-900' : 'bg-gray-50'
                }`}>
                  <h4 className={`text-base font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Associer les colonnes
                  </h4>
                  <p className={`text-sm mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Associez les colonnes de votre fichier aux champs du système
                  </p>

                  <div className="space-y-3">
                    {headers.map((header, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`text-sm font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {header}
                        </div>
                        <div className="flex-grow text-center">→</div>
                        <select
                          value={columnMapping[index.toString()] || ''}
                          onChange={(e) => {
                            setColumnMapping(prev => ({
                              ...prev,
                              [index.toString()]: e.target.value
                            }));
                          }}
                          className={`form-select ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Ne pas importer</option>
                          {columns.map(col => (
                            <option key={col.id} value={col.id}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-900' : 'bg-gray-50'
                }`}>
                  <h4 className={`text-base font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Aperçu des données
                  </h4>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${
                      isDark ? 'divide-space-700' : 'divide-gray-200'
                    }`}>
                      <thead className={isDark ? 'bg-space-700' : 'bg-gray-100'}>
                        <tr>
                          {headers.map((header, index) => (
                            <th 
                              key={index}
                              className={`px-3 py-2 text-left text-xs font-medium ${
                                columnMapping[index.toString()]
                                  ? isDark ? 'text-blue-300' : 'text-blue-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {header}
                              {columnMapping[index.toString()] && (
                                <span className="ml-1">
                                  ✓
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        isDark ? 'divide-space-700' : 'divide-gray-200'
                      }`}>
                        {previewData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex}
                                className={`px-3 py-2 text-sm ${
                                  columnMapping[cellIndex.toString()]
                                    ? isDark ? 'text-gray-200' : 'text-gray-900'
                                    : isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}
                              >
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`flex justify-end gap-2 p-4 border-t ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="button-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  className="button-primary"
                >
                  Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}