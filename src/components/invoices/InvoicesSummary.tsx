import React from 'react';
import { Calculator, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Invoice } from '../../types';
import { format, parseISO, isAfter } from 'date-fns';

interface InvoicesSummaryProps {
  invoices: Invoice[];
}

export function InvoicesSummary({ invoices }: InvoicesSummaryProps) {
  const { isDark } = useTheme();
  const today = new Date();

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    const total = invoices.length;
    const totalAmountHT = invoices.reduce((sum, invoice) => sum + invoice.amountHT, 0);
    const totalAmountTTC = invoices.reduce((sum, invoice) => sum + invoice.amountTTC, 0);
    
    const byStatus = {
      draft: invoices.filter(i => i.status === 'draft').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      validated: invoices.filter(i => i.status === 'validated').length,
      rejected: invoices.filter(i => i.status === 'rejected').length,
    };
    
    const paid = invoices.filter(i => i.paymentDate).length;
    const unpaid = total - paid;
    
    const overdue = invoices.filter(i => 
      !i.paymentDate && 
      isAfter(today, parseISO(i.dueDate))
    ).length;
    
    const dueThisWeek = invoices.filter(i => 
      !i.paymentDate && 
      !isAfter(today, parseISO(i.dueDate)) &&
      isAfter(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), parseISO(i.dueDate))
    ).length;
    
    return {
      total,
      totalAmountHT,
      totalAmountTTC,
      byStatus,
      paid,
      unpaid,
      overdue,
      dueThisWeek,
    };
  }, [invoices, today]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total des factures */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total des factures
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.total}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}>
            <Calculator className={`w-6 h-6 ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Brouillon</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {stats.byStatus.draft}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>En attente</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-yellow-300' : 'text-yellow-600'
            }`}>
              {stats.byStatus.pending}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Validées</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-green-300' : 'text-green-600'
            }`}>
              {stats.byStatus.validated}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rejetées</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>
              {stats.byStatus.rejected}
            </p>
          </div>
        </div>
      </div>

      {/* Montant total */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Montant total TTC
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.totalAmountTTC.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} CHF
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-green-500/20' : 'bg-green-100'
          }`}>
            <DollarSign className={`w-6 h-6 ${
              isDark ? 'text-green-300' : 'text-green-600'
            }`} />
          </div>
        </div>
        <div className="mt-4">
          <div className={`w-full bg-gray-200 rounded-full h-2.5 ${
            isDark ? 'bg-space-700' : 'bg-gray-200'
          }`}>
            <div className={`h-2.5 rounded-full ${
              isDark ? 'bg-green-500' : 'bg-green-600'
            }`} style={{ width: `${Math.min(100, (stats.paid / (stats.total || 1)) * 100)}%` }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Payé: {stats.paid} ({Math.round((stats.paid / (stats.total || 1)) * 100)}%)
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Non payé: {stats.unpaid}
            </p>
          </div>
        </div>
      </div>

      {/* Factures en retard */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Factures en retard
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              stats.overdue > 0
                ? isDark ? 'text-red-300' : 'text-red-600'
                : isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.overdue}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`} />
          </div>
        </div>
        <div className="mt-4">
          <div className={`p-3 rounded-lg ${
            stats.overdue > 0
              ? isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'
              : isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'
          }`}>
            <p className={`text-sm ${
              stats.overdue > 0
                ? isDark ? 'text-red-300' : 'text-red-600'
                : isDark ? 'text-green-300' : 'text-green-600'
            }`}>
              {stats.overdue > 0
                ? `${stats.overdue} facture${stats.overdue > 1 ? 's' : ''} en retard de paiement`
                : 'Aucune facture en retard de paiement'}
            </p>
          </div>
        </div>
      </div>

      {/* Échéances à venir */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Échéances à venir
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.dueThisWeek}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
          }`}>
            <Clock className={`w-6 h-6 ${
              isDark ? 'text-yellow-300' : 'text-yellow-600'
            }`} />
          </div>
        </div>
        <div className="mt-4">
          <div className={`p-3 rounded-lg ${
            stats.dueThisWeek > 0
              ? isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-100'
              : isDark ? 'bg-gray-500/10 border border-gray-500/20' : 'bg-gray-50 border border-gray-100'
          }`}>
            <p className={`text-sm ${
              stats.dueThisWeek > 0
                ? isDark ? 'text-yellow-300' : 'text-yellow-600'
                : isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {stats.dueThisWeek > 0
                ? `${stats.dueThisWeek} facture${stats.dueThisWeek > 1 ? 's' : ''} à payer cette semaine`
                : 'Aucune facture à payer cette semaine'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}