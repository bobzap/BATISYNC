import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Voucher } from '../../types';

interface VouchersSummaryProps {
  vouchers: Voucher[];
}

export function VouchersSummary({ vouchers }: VouchersSummaryProps) {
  const { isDark } = useTheme();

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    const total = vouchers.length;
    const totalAmount = vouchers.reduce(
      (sum, voucher) => sum + (voucher.quantity || 0) * (voucher.unitPrice || 0),
      0
    );
    
    const byType = {
      delivery: vouchers.filter(v => v.type === 'delivery').length,
      evacuation: vouchers.filter(v => v.type === 'evacuation').length,
      concrete: vouchers.filter(v => v.type === 'concrete').length,
      materials: vouchers.filter(v => v.type === 'materials').length,
    };
    
    const byStatus = {
      draft: vouchers.filter(v => v.status === 'draft').length,
      pending: vouchers.filter(v => v.status === 'pending').length,
      validated: vouchers.filter(v => v.status === 'validated').length,
      rejected: vouchers.filter(v => v.status === 'rejected').length,
    };
    
    const invoiced = vouchers.filter(v => v.invoiceId).length;
    const notInvoiced = total - invoiced;
    
    return {
      total,
      totalAmount,
      byType,
      byStatus,
      invoiced,
      notInvoiced,
    };
  }, [vouchers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total des bons */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total des bons
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
            <BarChart3 className={`w-6 h-6 ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Livr.</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`}>
              {stats.byType.delivery}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Évac.</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-orange-300' : 'text-orange-600'
            }`}>
              {stats.byType.evacuation}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Béton</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-green-300' : 'text-green-600'
            }`}>
              {stats.byType.concrete}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mat.</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-purple-300' : 'text-purple-600'
            }`}>
              {stats.byType.materials}
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
              Montant total
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.totalAmount.toLocaleString('fr-FR', {
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
            }`} style={{ width: `${Math.min(100, (stats.invoiced / stats.total) * 100 || 0)}%` }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Facturé: {stats.invoiced} ({Math.round((stats.invoiced / stats.total) * 100 || 0)}%)
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Non facturé: {stats.notInvoiced}
            </p>
          </div>
        </div>
      </div>

      {/* Statut des bons */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Statut des bons
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {stats.byStatus.validated} validés
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
          }`}>
            <TrendingUp className={`w-6 h-6 ${
              isDark ? 'text-yellow-300' : 'text-yellow-600'
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
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Validés</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-green-300' : 'text-green-600'
            }`}>
              {stats.byStatus.validated}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rejetés</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>
              {stats.byStatus.rejected}
            </p>
          </div>
        </div>
      </div>

      {/* Tendance */}
      <div className={`rounded-lg p-4 ${
        isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Tendance mensuelle
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              +12% ce mois
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <TrendingDown className={`w-6 h-6 ${
              isDark ? 'text-purple-300' : 'text-purple-600'
            }`} />
          </div>
        </div>
        <div className="mt-4 h-12 flex items-end">
          {/* Mini graphique de tendance */}
          {[30, 45, 25, 60, 35, 45, 40, 50, 60, 75, 65, 80].map((value, index) => (
            <div
              key={index}
              className={`w-full h-${Math.max(1, Math.floor(value / 10))} ${
                index < 6
                  ? isDark
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
                  : isDark
                  ? 'bg-purple-500'
                  : 'bg-purple-400'
              } mx-0.5 rounded-t`}
              style={{ height: `${value}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}