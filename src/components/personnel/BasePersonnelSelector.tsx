import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Check } from 'lucide-react';
import { BasePersonnel, PersonnelFonction } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { getBasePersonnel, getPersonnelFonctions } from '../../lib/supabase';

interface BasePersonnelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (personnel: BasePersonnel) => void;
  selectedIds?: string[];
  filterByCompany?: boolean;
  companyName?: string;
  excludeCompany?: string;
}

export function BasePersonnelSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedIds = [],
  filterByCompany = false,
  companyName,
  excludeCompany
}: BasePersonnelSelectorProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    departement: ''
  });
  const [fonctions, setFonctions] = useState<PersonnelFonction[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [basePersonnel, setBasePersonnel] = useState<BasePersonnel[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Charger les fonctions
  useEffect(() => {
    async function loadFonctions() {
      try {
        const data = await getPersonnelFonctions();
        setFonctions(data);
      } catch (err) {
        console.error('Erreur lors du chargement des fonctions:', err);
      }
    }
    loadFonctions();
  }, []);

  // Charger le personnel de base
  useEffect(() => {
    async function loadBasePersonnel() {
      try {
        setLoading(true);
        const data = await getBasePersonnel();
        setBasePersonnel(data);
      } catch (err) {
        console.error('Erreur lors du chargement du personnel:', err);
        setError('Erreur lors du chargement du personnel');
      } finally {
        setLoading(false);
      }
    }
    loadBasePersonnel();
  }, []);

  // Filtrer le personnel
  const filteredPersonnel = basePersonnel.filter(p => {
    // Filtrer par entreprise si demandé
    if (filterByCompany) {
      if (companyName && p.entreprise !== companyName) return false;
      if (excludeCompany && p.entreprise === excludeCompany) return false;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = !debouncedSearchTerm || 
      p.nom.toLowerCase().includes(searchLower) ||
     
      p.numero_personnel.toLowerCase().includes(searchLower);

    const matchesRole = !filters.role || p.intitule_fonction === filters.role;
    const matchesDepartement = !filters.departement || p.code_departement === filters.departement;

    return matchesSearch && matchesRole && matchesDepartement;
  });

  // Récupérer les départements uniques
  const departements = Array.from(new Set(
    basePersonnel
      .filter(p => p.code_departement)
      .map(p => p.code_departement)
  )).sort();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/70 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative w-full max-w-4xl rounded-lg shadow-xl ${
          isDark ? 'bg-space-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {excludeCompany 
                ? 'Ajouter du personnel externe au projet'
                : companyName
                  ? `Ajouter du personnel ${companyName} au projet`
                  : 'Ajouter du personnel au projet'
              }
            </h3>
            <button
              onClick={onClose}
              className={`rounded-lg p-1 hover:bg-opacity-80 transition-colors ${
                isDark 
                  ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex-grow relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom ou matricule..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200 placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDark
                    ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className={`mt-4 p-4 rounded-lg ${
                isDark ? 'bg-space-900' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Fonction
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full rounded-lg border ${
                        isDark
                          ? 'bg-space-800 border-space-700 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Toutes les fonctions</option>
                      {fonctions.map((fonction) => (
                        <option key={fonction.code} value={fonction.code}>
                          {fonction.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Département
                    </label>
                    <select
                      value={filters.departement}
                      onChange={(e) => setFilters(prev => ({ ...prev, departement: e.target.value }))}
                      className={`w-full rounded-lg border ${
                        isDark
                          ? 'bg-space-800 border-space-700 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Tous les départements</option>
                      {departements.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personnel List */}
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-2 p-4">
              {loading ? (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Chargement du personnel...
                </div>
              ) : error ? (
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                }`}>
                  {error}
                </div>
              ) : filteredPersonnel.length === 0 ? (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Aucun personnel trouvé
                </div>
              ) : (
                filteredPersonnel.map((personne) => {
                  const isSelected = selectedIds.includes(personne.id);
                  const fonction = fonctions.find(f => f.code === personne.intitule_fonction);

                  return (
                    <button
                      key={personne.id}
                      onClick={() => onSelect(personne)}
                      disabled={isSelected}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-green-50 border border-green-200'
                          : isDark
                            ? 'bg-space-900 hover:bg-space-700 border border-space-700'
                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {/* Avatar/Initiales */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                        isDark ? 'bg-space-700' : 'bg-gray-100'
                      }`}>
                        {personne.nom.charAt(0).toUpperCase()}
                      </div>

                      {/* Informations */}
                      <div className="flex-grow text-left">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {personne.nom || ''}
                          </span>
                         
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              isDark
                               ? fonction?.couleur_sombre || 'bg-blue-500/20 text-blue-300'
                               : fonction?.couleur_claire || 'bg-blue-100 text-blue-800'
                            }`}>
                              {fonctions.find(f => f.code === personne.intitule_fonction)?.libelle || personne.intitule_fonction}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              isDark
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {personne.entreprise}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                           {personne.numero_personnel}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            • {personne.code_departement}
                          </span>
                          {personne.siege && (
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                              • {personne.siege}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Icon */}
                      {isSelected && (
                        <div className={`p-2 rounded-full ${
                          isDark
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}