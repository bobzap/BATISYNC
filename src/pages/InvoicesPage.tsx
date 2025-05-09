import React, { useState, useEffect } from 'react';
import { Calculator, Plus, FileText, Download, Filter, Search, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { format, startOfMonth, endOfMonth, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Notification } from '../components/Notification';
import { InvoicesSummary } from '../components/invoices/InvoicesSummary';
import { InvoicesTable } from '../components/invoices/InvoicesTable';
import { InvoiceModal } from '../components/invoices/InvoiceModal';
import { FileViewerModal } from '../components/FileViewerModal';
import { getInvoicesByProject, deleteInvoice } from '../lib/supabase';
import type { Invoice } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';

interface InvoicesPageProps {
  projectId: string;
}

export function InvoicesPage({ projectId }: InvoicesPageProps) {
  const { isDark } = useTheme();
  const { permissions } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    showConfirm?: boolean;
    onConfirm?: () => void;
  } | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: '',
    supplier: '',
    isPaid: '',
    isOverdue: '',
  });

  // Récupérer les fournisseurs uniques
  const uniqueSuppliers = React.useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.supplier))).sort();
  }, [invoices]);

  // Charger les factures
  useEffect(() => {
    async function loadInvoices() {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getInvoicesByProject(projectId, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          supplier: filters.supplier,
          isPaid: filters.isPaid === 'true',
          isOverdue: filters.isOverdue === 'true',
        });
        
        setInvoices(data);
      } catch (err) {
        console.error('Erreur lors du chargement des factures:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des factures');
        setNotification({
          type: 'error',
          message: 'Erreur lors du chargement des factures'
        });
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [projectId, filters]);

  // Filtrer les factures en fonction du terme de recherche
  const filteredInvoices = React.useMemo(() => {
    if (!searchTerm) return invoices;
    
    return invoices.filter(invoice => 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  // Gérer la suppression d'une facture
  const handleDeleteInvoice = (invoiceId: string) => {
    setNotification({
      type: 'warning',
      message: 'Êtes-vous sûr de vouloir supprimer cette facture ?',
      showConfirm: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteInvoice(invoiceId);
          
          // Mettre à jour l'état local
          setInvoices(prev => prev.filter(i => i.id !== invoiceId));
          
          setNotification({
            type: 'success',
            message: 'Facture supprimée avec succès'
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la facture');
          setNotification({
            type: 'error',
            message: 'Erreur lors de la suppression de la facture'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Gérer le changement de filtres
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      status: '',
      supplier: '',
      isPaid: '',
      isOverdue: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Suivi des factures
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Gérez vos factures et associez-les aux bons de livraison
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard requiredPermission="viewInvoices">
            <button
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isDark
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
              }`}
              onClick={() => {
                // Exporter les factures en CSV
                const headers = ['Numéro', 'Référence', 'Fournisseur', 'Date', 'Échéance', 'Montant HT', 'Montant TTC', 'TVA', 'Statut', 'Date de paiement'];
                const rows = filteredInvoices.map(i => [
                  i.number,
                  i.reference || '',
                  i.supplier,
                  format(parseISO(i.date), 'dd/MM/yyyy'),
                  format(parseISO(i.dueDate), 'dd/MM/yyyy'),
                  i.amountHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
                  i.amountTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
                  `${i.vatRate}%`,
                  i.status === 'validated' ? 'Validée' : 
                  i.status === 'pending' ? 'En attente' : 
                  i.status === 'draft' ? 'Brouillon' : 'Rejetée',
                  i.paymentDate ? format(parseISO(i.paymentDate), 'dd/MM/yyyy') : ''
                ]);
                
                const csvContent = [
                  headers.join(','),
                  ...rows.map(row => row.join(','))
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `factures_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </PermissionGuard>
          <PermissionGuard requiredPermission="editInvoices">
            <button
              className="button-primary"
              onClick={() => {
                setSelectedInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle facture
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Résumé des factures */}
      <InvoicesSummary invoices={filteredInvoices} />

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
            placeholder="Rechercher par numéro, fournisseur, référence..."
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
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="validated">Validée</option>
                <option value="rejected">Rejetée</option>
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
                Paiement
              </label>
              <select
                value={filters.isPaid}
                onChange={(e) => setFilters({ ...filters, isPaid: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Toutes les factures</option>
                <option value="true">Payées</option>
                <option value="false">Non payées</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Échéance
              </label>
              <select
                value={filters.isOverdue}
                onChange={(e) => setFilters({ ...filters, isOverdue: e.target.value })}
                className={`w-full rounded-lg border ${
                  isDark
                    ? 'bg-space-900 border-space-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Toutes les factures</option>
                <option value="true">Échues</option>
                <option value="false">Non échues</option>
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

      {/* Tableau des factures */}
      <InvoicesTable
        invoices={filteredInvoices}
        loading={loading}
        error={error}
        onEdit={permissions.editInvoices ? (invoice) => {
            setSelectedInvoice(invoice);
            setIsInvoiceModalOpen(true);
          } : undefined}
        onDelete={permissions.editInvoices ? handleDeleteInvoice : undefined}
        onViewDocument={setSelectedFile}
      />

      {/* Modal de facture */}
      {permissions.editInvoices && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoice={selectedInvoice}
          projectId={projectId}
          onSave={(savedInvoice) => {
            if (selectedInvoice) {
              // Mise à jour d'une facture existante
              setInvoices(prev => prev.map(i => i.id === savedInvoice.id ? savedInvoice : i));
            } else {
              // Ajout d'une nouvelle facture
              setInvoices(prev => [...prev, savedInvoice]);
            }
            setIsInvoiceModalOpen(false);
            setNotification({
              type: 'success',
              message: selectedInvoice ? 'Facture mise à jour avec succès' : 'Facture créée avec succès'
            });
          }}
        />
      )}

      {/* Modal de visualisation des fichiers */}
      <FileViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          showConfirm={notification.showConfirm}
          onConfirm={notification.onConfirm}
        />
      )}
    </div>
  );
}