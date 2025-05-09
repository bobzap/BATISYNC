import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../hooks/useTheme';

interface VouchersFilterBarProps {
  onFilterChange: (filters: {
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    supplier: string;
  }) => void;
  suppliers: string[];
}

export function VouchersFilterBar({ onFilterChange, suppliers }: VouchersFilterBarProps) {
  const { isDark } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    type: '',
    status: '',
    supplier: '',
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Fonction pour mettre à jour les filtres
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    const defaultFilters = {
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      type: '',
      status: '',
      supplier: '',
    };
    setFilters(defaultFilters);
    setSelectedPeriod('month');
    onFilterChange(defaultFilters);
  };

  // Fonction pour changer la période
  const changePeriod = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    let startDate = '';
    let endDate = '';
    
    switch (period) {
      case 'week':
        // Début de la semaine (lundi)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        startDate = format(monday, 'yyyy-MM-dd');
        
        // Fin de la semaine (vendredi)
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        endDate = format(friday, 'yyyy-MM-dd');
        break;
        
      case 'month':
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
        
      case 'prev-month':
        const prevMonth = subMonths(now, 1);
        startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(prevMonth), 'yyyy-MM-dd');
        break;
        
      case 'next-month':
        const nextMonth = addMonths(now, 1);
        startDate = format(startOfMonth(nextMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(nextMonth), 'yyyy-MM-dd');
        break;
        
      case 'custom':
        // Garder les dates actuelles
        return;
        
      default:
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    }
    
    updateFilters({ startDate, endDate });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Sélecteur de période */}
        <div className="flex items-center">
          <button
            onClick={() => changePeriod('week')}
            className={`px-3 py-1.5 text-sm rounded-l-lg ${
              selectedPeriod === 'week'
                ? isDark
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-600 text-white'
                : isDark
                ? 'bg-space-700 text-gray-300 hover:bg-space-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => changePeriod('month')}
            className={`px-3 py-1.5 text-sm ${
              selectedPeriod === 'month'
                ? isDark
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-600 text-white'
                : isDark
                ? 'bg-space-700 text-gray-300 hover:bg-space-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => {
              setSelectedPeriod('custom');
              setShowFilters(true);
            }}
            className={`px-3 py-1.5 text-sm rounded-r-lg ${
              selectedPeriod === 'custom'
                ? isDark
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-600 text-white'
                : isDark
                ? 'bg-space-700 text-gray-300 hover:bg-space-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Personnalisé
          </button>
        </div>

        {/* Navigation mois précédent/suivant */}
        {selectedPeriod === 'month' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePeriod('prev-month')}
              className={`p-1.5 rounded-lg ${
                isDark
                  ? 'hover:bg-space-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <span className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {format(new Date(filters.startDate), 'MMMM yyyy', { locale: fr })}
            </span>
            <button
              onClick={() => changePeriod('next-month')}
              className={`p-1.5 rounded-lg ${
                isDark
                  ? 'hover:bg-space-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>
          </div>
        )}

        {/* Bouton de filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ml-auto ${
            isDark
              ? 'bg-space-700 hover:bg-space-600 text-gray-200'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtres avancés</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className={`p-4 rounded-lg mb-4 ${
          isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date de début
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setSelectedPeriod('custom');
                    updateFilters({ startDate: e.target.value });
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date de fin
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setSelectedPeriod('custom');
                    updateFilters({ endDate: e.target.value });
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type de bon
              </label>
              <select
                value={filters.type}
                onChange={(e) => updateFilters({ type: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les types</option>
                <option value="delivery">Livraison</option>
                <option value="evacuation">Évacuation</option>
                <option value="concrete">Béton</option>
                <option value="materials">Matériaux</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="validated">Validé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Fournisseur
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => updateFilters({ supplier: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les fournisseurs</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isDark
                  ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <X className="w-4 h-4" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}