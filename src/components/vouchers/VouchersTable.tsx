import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../hooks/useTheme';
import type { Voucher } from '../../types';

interface VouchersTableProps {
  vouchers: Voucher[];
  loading: boolean;
  error: string | null;
}

export function VouchersTable({ vouchers, loading, error }: VouchersTableProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    supplier: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Voucher | '';
    direction: 'ascending' | 'descending';
  }>({
    key: 'date',
    direction: 'descending',
  });

  // Filtrer les bons
  const filteredVouchers = vouchers.filter((voucher) => {
    // Filtre de recherche
    const matchesSearch =
      searchTerm === '' ||
      voucher.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.type === 'delivery' && voucher.materials?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voucher.type === 'evacuation' && voucher.materials?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voucher.type === 'concrete' && voucher.concreteType?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voucher.type === 'materials' && voucher.materials?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtres avancés
    const matchesType = filters.type === '' || voucher.type === filters.type;
    const matchesStatus = filters.status === '' || voucher.status === filters.status;
    const matchesSupplier =
      filters.supplier === '' || voucher.supplier.toLowerCase().includes(filters.supplier.toLowerCase());
    
    // Filtre de date
    const voucherDate = parseISO(voucher.date);
    const startDate = filters.startDate ? parseISO(filters.startDate) : null;
    const endDate = filters.endDate ? parseISO(filters.endDate) : null;
    
    const matchesDateRange =
      (!startDate || voucherDate >= startDate) && (!endDate || voucherDate <= endDate);

    return matchesSearch && matchesType && matchesStatus && matchesSupplier && matchesDateRange;
  });

  // Trier les bons
  const sortedVouchers = React.useMemo(() => {
    if (sortConfig.key === '') return filteredVouchers;

    return [...filteredVouchers].sort((a, b) => {
      if (a[sortConfig.key as keyof Voucher] < b[sortConfig.key as keyof Voucher]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Voucher] > b[sortConfig.key as keyof Voucher]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredVouchers, sortConfig]);

  // Calculer les totaux
  const totals = React.useMemo(() => {
    return sortedVouchers.reduce(
      (acc, voucher) => {
        acc.quantity += voucher.quantity || 0;
        acc.amount += (voucher.quantity || 0) * (voucher.unitPrice || 0);
        
        // Compter par type
        if (voucher.type === 'delivery') acc.delivery += 1;
        if (voucher.type === 'evacuation') acc.evacuation += 1;
        if (voucher.type === 'concrete') acc.concrete += 1;
        if (voucher.type === 'materials') acc.materials += 1;
        
        return acc;
      },
      { quantity: 0, amount: 0, delivery: 0, evacuation: 0, concrete: 0, materials: 0 }
    );
  }, [sortedVouchers]);

  // Fonction pour gérer le tri
  const requestSort = (key: keyof Voucher) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Fonction pour obtenir les classes de l'en-tête de tri
  const getSortDirectionIcon = (key: keyof Voucher) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      supplier: '',
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
  };

  // Obtenir les fournisseurs uniques pour le filtre
  const uniqueSuppliers = React.useMemo(() => {
    return Array.from(new Set(vouchers.map((v) => v.supplier))).sort();
  }, [vouchers]);

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    // En-têtes du CSV
    const headers = [
      'Type',
      'Numéro',
      'Fournisseur',
      'Date',
      'Matériaux',
      'Quantité',
      'Unité',
      'Prix unitaire',
      'Montant',
      'Statut',
      'Facture'
    ];

    // Lignes de données
    const rows = sortedVouchers.map((voucher) => {
      let materials = '';
      if (voucher.type === 'delivery' || voucher.type === 'evacuation' || voucher.type === 'materials') {
        materials = voucher.materials || '';
      } else if (voucher.type === 'concrete') {
        materials = voucher.concreteType || '';
      }

      return [
        voucher.type,
        voucher.number,
        voucher.supplier,
        voucher.date,
        materials,
        voucher.quantity,
        voucher.unit,
        voucher.unitPrice || '',
        (voucher.quantity || 0) * (voucher.unitPrice || 0),
        voucher.status,
        voucher.invoiceId || ''
      ];
    });

    // Ajouter la ligne de totaux
    rows.push([
      `Total (${sortedVouchers.length} bons)`,
      '',
      '',
      '',
      '',
      totals.quantity,
      '',
      '',
      totals.amount,
      '',
      ''
    ]);

    // Convertir en CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bons_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour formater le type de bon
  const formatVoucherType = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'Livraison';
      case 'evacuation':
        return 'Évacuation';
      case 'concrete':
        return 'Béton';
      case 'materials':
        return 'Matériaux';
      default:
        return type;
    }
  };

  // Fonction pour obtenir la classe de style selon le type
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'delivery':
        return isDark
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-blue-100 text-blue-800';
      case 'evacuation':
        return isDark
          ? 'bg-orange-500/20 text-orange-300'
          : 'bg-orange-100 text-orange-800';
      case 'concrete':
        return isDark
          ? 'bg-green-500/20 text-green-300'
          : 'bg-green-100 text-green-800';
      case 'materials':
        return isDark
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-purple-100 text-purple-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir la classe de style selon le statut
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'validated':
        return isDark
          ? 'bg-green-500/20 text-green-300'
          : 'bg-green-100 text-green-800';
      case 'pending':
        return isDark
          ? 'bg-yellow-500/20 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return isDark
          ? 'bg-red-500/20 text-red-300'
          : 'bg-red-100 text-red-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-grow">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro, fournisseur, matériaux..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-space-900 border-space-700 text-gray-200 placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDark
                ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtres</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={exportToCSV}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDark
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type de bon
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les fournisseurs</option>
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Période
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-space-900 border-space-700 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>à</span>
                <div className="relative flex-grow">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-space-900 border-space-700 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
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

      {/* Résumé des filtres */}
      <div className="flex justify-between items-center">
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {sortedVouchers.length} bons trouvés
          {filters.type && ` • Type: ${formatVoucherType(filters.type)}`}
          {filters.status && ` • Statut: ${filters.status}`}
          {filters.supplier && ` • Fournisseur: ${filters.supplier}`}
          {filters.startDate && filters.endDate && ` • Période: ${format(parseISO(filters.startDate), 'dd/MM/yyyy')} - ${format(parseISO(filters.endDate), 'dd/MM/yyyy')}`}
        </div>
        <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {totals.delivery > 0 && <span className="mr-3">Livraisons: {totals.delivery}</span>}
          {totals.evacuation > 0 && <span className="mr-3">Évacuations: {totals.evacuation}</span>}
          {totals.concrete > 0 && <span className="mr-3">Béton: {totals.concrete}</span>}
          {totals.materials > 0 && <span className="mr-3">Matériaux: {totals.materials}</span>}
        </div>
      </div>

      {/* Tableau des bons */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      ) : (
        <div className={`rounded-lg border overflow-x-auto ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
              <tr>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('type')}
                >
                  <div className="flex items-center">
                    <span>Type</span>
                    {getSortDirectionIcon('type')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('number')}
                >
                  <div className="flex items-center">
                    <span>Numéro</span>
                    {getSortDirectionIcon('number')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('supplier')}
                >
                  <div className="flex items-center">
                    <span>Fournisseur</span>
                    {getSortDirectionIcon('supplier')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('date')}
                >
                  <div className="flex items-center">
                    <span>Date</span>
                    {getSortDirectionIcon('date')}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matériaux
                </th>
                <th
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center justify-end">
                    <span>Quantité</span>
                    {getSortDirectionIcon('quantity')}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unité
                </th>
                <th
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('unitPrice')}
                >
                  <div className="flex items-center justify-end">
                    <span>Prix unitaire</span>
                    {getSortDirectionIcon('unitPrice')}
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    <span>Statut</span>
                    {getSortDirectionIcon('status')}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
              {sortedVouchers.length > 0 ? (
                <>
                  {sortedVouchers.map((voucher) => {
                    // Déterminer les matériaux à afficher selon le type
                    let materials = '';
                    if (voucher.type === 'delivery' || voucher.type === 'evacuation' || voucher.type === 'materials') {
                      materials = voucher.materials || '';
                    } else if (voucher.type === 'concrete') {
                      materials = voucher.concreteType || '';
                    }

                    // Calculer le montant
                    const amount = (voucher.quantity || 0) * (voucher.unitPrice || 0);

                    return (
                      <tr
                        key={voucher.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getTypeStyle(voucher.type)
                          }`}>
                            {formatVoucherType(voucher.type)}
                          </span>
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.number}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.supplier}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {format(parseISO(voucher.date), 'dd/MM/yyyy')}
                        </td>
                        <td className={`px-3 py-4 ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {materials}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.quantity.toLocaleString('fr-FR')}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.unit}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.unitPrice
                            ? voucher.unitPrice.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '-'}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {amount.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getStatusStyle(voucher.status)
                          }`}>
                            {voucher.status === 'draft'
                              ? 'Brouillon'
                              : voucher.status === 'pending'
                              ? 'En attente'
                              : voucher.status === 'validated'
                              ? 'Validé'
                              : 'Rejeté'}
                          </span>
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {voucher.invoiceId ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {voucher.invoiceId.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Non facturé
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Ligne de totaux */}
                  <tr className={`font-medium ${
                    isDark ? 'bg-space-700 text-gray-200' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <td className="px-3 py-4 whitespace-nowrap" colSpan={5}>
                      Total ({sortedVouchers.length} bons)
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      {totals.quantity.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      -
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      -
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      {totals.amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap" colSpan={2}>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          Livr.: {totals.delivery}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDark
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          Évac.: {totals.evacuation}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDark
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Béton: {totals.concrete}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDark
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          Mat.: {totals.materials}
                        </span>
                      </div>
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className={`px-3 py-8 text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {searchTerm || filters.type || filters.status || filters.supplier
                      ? 'Aucun bon ne correspond aux critères de recherche'
                      : 'Aucun bon disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}