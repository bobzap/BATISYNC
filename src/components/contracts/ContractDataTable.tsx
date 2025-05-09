import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ContractDataRow } from '../../types';

interface ContractDataTableProps {
  columns: Array<{
    id: string;
    name: string;
    type: 'text' | 'number';
  }>;
  rows: ContractDataRow[];
  isEditing: boolean;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onCellChange: (rowId: string, columnId: string, value: string | number) => void;
}

export function ContractDataTable({
  columns,
  rows,
  isEditing,
  onAddRow,
  onRemoveRow,
  onCellChange
}: ContractDataTableProps) {
  const { isDark } = useTheme();
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null);

  const handleCellClick = (rowId: string, columnId: string) => {
    if (isEditing) {
      setEditingCell({ rowId, columnId });
    }
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, columnId: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Trouver l'index de la colonne actuelle
      const colIndex = columns.findIndex(col => col.id === columnId);
      
      // Passer à la colonne suivante ou à la première colonne de la ligne suivante
      if (colIndex < columns.length - 1) {
        // Colonne suivante dans la même ligne
        setEditingCell({ rowId, columnId: columns[colIndex + 1].id });
      } else {
        // Trouver l'index de la ligne actuelle
        const rowIndex = rows.findIndex(row => row.id === rowId);
        
        // S'il y a une ligne suivante, passer à la première colonne de cette ligne
        if (rowIndex < rows.length - 1) {
          setEditingCell({ rowId: rows[rowIndex + 1].id, columnId: columns[0].id });
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border overflow-x-auto ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
            <tr>
              {columns.map(column => (
                <th 
                  key={column.id}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.name}
                </th>
              ))}
              {isEditing && (
                <th className="relative px-3 py-3 w-10">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDark ? 'divide-space-700' : 'divide-gray-200'
          }`}>
            {rows.length > 0 ? (
              rows.map(row => (
                <tr key={row.id} className={
                  isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                }>
                  {columns.map(column => (
                    <td 
                      key={`${row.id}-${column.id}`} 
                      className={`px-3 py-2 ${
                        isEditing ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => handleCellClick(row.id, column.id)}
                    >
                      {editingCell?.rowId === row.id && editingCell?.columnId === column.id ? (
                        column.type === 'number' ? (
                          <input
                            type="number"
                            value={row.values[column.id] || 0}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              onCellChange(row.id, column.id, value);
                            }}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => handleKeyDown(e, row.id, column.id)}
                            autoFocus
                            className={`w-full px-2 py-1 rounded-md border ${
                              isDark
                                ? 'bg-space-900 border-space-700 text-gray-200'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            step="0.01"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.values[column.id] || ''}
                            onChange={(e) => onCellChange(row.id, column.id, e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => handleKeyDown(e, row.id, column.id)}
                            autoFocus
                            className={`w-full px-2 py-1 rounded-md border ${
                              isDark
                                ? 'bg-space-900 border-space-700 text-gray-200'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        )
                      ) : (
                        <div className={`${
                          isEditing ? 'hover:bg-opacity-80 transition-colors' : ''
                        } ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {column.type === 'number' && typeof row.values[column.id] === 'number'
                            ? row.values[column.id].toLocaleString('fr-FR')
                            : row.values[column.id] || '-'}
                        </div>
                      )}
                    </td>
                  ))}
                  {isEditing && (
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onRemoveRow(row.id)}
                        className={`p-1 rounded-lg ${
                          isDark
                            ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                            : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + (isEditing ? 1 : 0)} 
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

      {isEditing && (
        <div className="flex justify-end">
          <button
            onClick={onAddRow}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        </div>
      )}
    </div>
  );
}