import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, FileText, Download } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { VouchersTable } from '../components/vouchers/VouchersTable';
import { VouchersSummary } from '../components/vouchers/VouchersSummary';
import { Notification } from '../components/Notification';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getVouchersByProject } from '../lib/supabase';
import type { Voucher } from '../types';
import { Search, Filter, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';

interface VouchersPageProps {
  projectId: string;
}

export function VouchersPage({ projectId }: VouchersPageProps) {
  const { isDark } = useTheme();
  const { permissions } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    showConfirm?: boolean;
    onConfirm?: () => void;
  } | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    type: '',
    status: '',
    supplier: '',
  });

  // Récupérer les fournisseurs uniques
  const uniqueSuppliers = React.useMemo(() => {
    return Array.from(new Set(vouchers.map(v => v.supplier))).sort();
  }, [vouchers]);

  // Charger les bons
  useEffect(() => {
    async function loadVouchers() {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        try {
          // Récupérer les bons depuis les rapports journaliers
          const data = await getVouchersByProject(projectId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
            type: filters.type,
            status: filters.status,
            supplier: filters.supplier
          });
          
          setVouchers(data);
        } catch (err) {
          console.error('Erreur lors de la récupération des bons:', err);
          throw err;
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement des bons:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des bons');
        setNotification({
          type: 'error',
          message: 'Erreur lors du chargement des bons'
        });
      } finally {
        setLoading(false);
      }
    }

    loadVouchers();
  }, [projectId, filters]);

  // Gérer le changement de filtres
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Filtrer les bons en fonction du terme de recherche
  const filteredVouchers = React.useMemo(() => {
    if (!searchTerm) return vouchers;
    
    return vouchers.filter(voucher => 
      voucher.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.materials && voucher.materials.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vouchers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Suivi des bons
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Récapitulatif des bons extraits des rapports journaliers
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard requiredPermission="viewVouchers">
            <button
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isDark
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
              }`}
              onClick={() => {
                // Fonction pour exporter les bons en CSV
                const headers = ['Type', 'Numéro', 'Fournisseur', 'Date', 'Matériaux', 'Quantité', 'Unité', 'Prix unitaire', 'Statut'];
                const rows = vouchers.map(v => [
                  v.type === 'delivery' ? 'Livraison' : 
                  v.type === 'evacuation' ? 'Évacuation' : 
                  v.type === 'concrete' ? 'Béton' : 'Matériaux', 
                  v.number, 
                  v.supplier, 
                  v.date, 
                  v.type === 'concrete' ? v.concreteType : v.materials, 
                  v.quantity, 
                  v.unit, 
                  v.unitPrice || '', 
                  v.status === 'validated' ? 'Validé' : 
                  v.status === 'pending' ? 'En attente' : 
                  v.status === 'draft' ? 'Brouillon' : 'Rejeté'
                ]);
                
                const csvContent = [
                  headers.join(','),
                  ...rows.map(row => row.join(','))
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `bons_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button
              className="button-primary"
              onClick={() => {
                // Rediriger vers la page des rapports
                window.location.href = '/rapport';
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Voir les rapports
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Résumé des bons */}
      <VouchersSummary vouchers={filteredVouchers} />

     

      {/* Tableau des bons */}
      <VouchersTable
        vouchers={filteredVouchers}
        loading={loading}
        error={error}
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