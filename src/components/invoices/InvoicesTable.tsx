import React, { useState } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit2, Trash2, Eye, Download, Link, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Invoice } from '../../types';

interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  onViewDocument: (document: { name: string; url: string; type: string }) => void;
}

export function InvoicesTable({ 
  invoices, 
  loading, 
  error, 
  onEdit, 
  onDelete, 
  onViewDocument 
}: InvoicesTableProps) {
  const { isDark } = useTheme();
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Invoice | '';
    direction: 'ascending' | 'descending';
  }>({
    key: 'date',
    direction: 'descending',
  });
  
  const today = new Date();

  // Fonction pour gérer le tri
  const requestSort = (key: keyof Invoice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Trier les factures
  const sortedInvoices = React.useMemo(() => {
    if (sortConfig.key === '') return invoices;

    return [...invoices].sort((a, b) => {
      if (a[sortConfig.key as keyof Invoice] < b[sortConfig.key as keyof Invoice]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Invoice] > b[sortConfig.key as keyof Invoice]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [invoices, sortConfig]);

  // Fonction pour obtenir les classes de l'en-tête de tri
  const getSortDirectionIcon = (key: keyof Invoice) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
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

  // Fonction pour vérifier si une facture est en retard
  const isInvoiceOverdue = (invoice: Invoice) => {
    return !invoice.paymentDate && isAfter(today, parseISO(invoice.dueDate));
  };

  return (
    <div className="space-y-4">
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
                  onClick={() => requestSort('number')}
                >
                  <div className="flex items-center">
                    <span>Numéro</span>
                    {getSortDirectionIcon('number')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('reference')}
                >
                  <div className="flex items-center">
                    <span>Référence</span>
                    {getSortDirectionIcon('reference')}
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
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('dueDate')}
                >
                  <div className="flex items-center">
                    <span>Échéance</span>
                    {getSortDirectionIcon('dueDate')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('amountHT')}
                >
                  <div className="flex items-center justify-end">
                    <span>Montant HT</span>
                    {getSortDirectionIcon('amountHT')}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('amountTTC')}
                >
                  <div className="flex items-center justify-end">
                    <span>Montant TTC</span>
                    {getSortDirectionIcon('amountTTC')}
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TVA
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
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('paymentDate')}
                >
                  <div className="flex items-center">
                    <span>Paiement</span>
                    {getSortDirectionIcon('paymentDate')}
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bons
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
              {sortedInvoices.length > 0 ? (
                sortedInvoices.map((invoice) => {
                  const isOverdue = isInvoiceOverdue(invoice);
                  
                  return (
                    <React.Fragment key={invoice.id}>
                      <tr
                        className={`transition-colors ${
                          isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                        } ${
                          isOverdue
                            ? isDark ? 'bg-red-500/10' : 'bg-red-50'
                            : ''
                        }`}
                      >
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          <div className="flex items-center">
                            <button
                              onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                              className={`mr-2 p-1 rounded-full transition-colors ${
                                isDark
                                  ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {expandedInvoice === invoice.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {invoice.number}
                          </div>
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.reference || '-'}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.supplier}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {format(parseISO(invoice.date), 'dd/MM/yyyy')}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isOverdue
                            ? isDark ? 'text-red-300 font-medium' : 'text-red-600 font-medium'
                            : isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}
                          {isOverdue && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                            }`}>
                              En retard
                            </span>
                          )}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.amountHT.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} CHF
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.amountTTC.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} CHF
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-center ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.vatRate}%
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getStatusStyle(invoice.status)
                          }`}>
                            {invoice.status === 'draft'
                              ? 'Brouillon'
                              : invoice.status === 'pending'
                              ? 'En attente'
                              : invoice.status === 'validated'
                              ? 'Validée'
                              : 'Rejetée'}
                          </span>
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.paymentDate ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isDark
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {format(parseISO(invoice.paymentDate), 'dd/MM/yyyy')}
                            </span>
                          ) : (
                            <span className={`text-sm ${
                              isOverdue
                                ? isDark ? 'text-red-300' : 'text-red-600'
                                : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Non payée
                            </span>
                          )}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-center ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {invoice.vouchers && invoice.vouchers.length > 0 ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {invoice.vouchers.length}
                            </span>
                          ) : (
                            <span className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              0
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => onEdit && onEdit(invoice)}
                              disabled={!onEdit}
                              className={`p-1.5 rounded-lg transition-colors ${
                                !onEdit ? 'opacity-50 cursor-not-allowed' :
                                isDark
                                  ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                              }`}
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete && onDelete(invoice.id)}
                              disabled={!onDelete}
                              className={`p-1.5 rounded-lg transition-colors ${
                                !onDelete ? 'opacity-50 cursor-not-allowed' :
                                isDark
                                  ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-500 hover:text-red-700'
                              }`}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {invoice.documents && invoice.documents.length > 0 && (
                              <button
                                onClick={() => onViewDocument({
                                  name: invoice.documents[0].name,
                                  url: invoice.documents[0].url,
                                  type: invoice.documents[0].type
                                })}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark
                                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Voir le document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Détails de la facture */}
                      {expandedInvoice === invoice.id && (
                        <tr className={isDark ? 'bg-space-900/50' : 'bg-gray-50'}>
                          <td colSpan={12} className="px-3 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Informations détaillées */}
                              <div>
                                <h4 className={`text-sm font-medium mb-2 ${
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Informations détaillées
                                </h4>
                                <div className={`p-4 rounded-lg ${
                                  isDark ? 'bg-space-800' : 'bg-white'
                                }`}>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Référence
                                      </p>
                                      <p className={`text-sm font-medium ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {invoice.reference || '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Fournisseur
                                      </p>
                                      <p className={`text-sm font-medium ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {invoice.supplier}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Date de facture
                                      </p>
                                      <p className={`text-sm ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {format(parseISO(invoice.date), 'dd MMMM yyyy', { locale: fr })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Date d'échéance
                                      </p>
                                      <p className={`text-sm ${
                                        isOverdue
                                          ? isDark ? 'text-red-300 font-medium' : 'text-red-600 font-medium'
                                          : isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {format(parseISO(invoice.dueDate), 'dd MMMM yyyy', { locale: fr })}
                                        {isOverdue && (
                                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                            isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                                          }`}>
                                            En retard
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Montant HT
                                      </p>
                                      <p className={`text-sm ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {invoice.amountHT.toLocaleString('fr-FR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })} CHF
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        TVA ({invoice.vatRate}%)
                                      </p>
                                      <p className={`text-sm ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {(invoice.amountTTC - invoice.amountHT).toLocaleString('fr-FR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })} CHF
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Montant TTC
                                      </p>
                                      <p className={`text-sm font-medium ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                      }`}>
                                        {invoice.amountTTC.toLocaleString('fr-FR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })} CHF
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Statut
                                      </p>
                                      <p>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          getStatusStyle(invoice.status)
                                        }`}>
                                          {invoice.status === 'draft'
                                            ? 'Brouillon'
                                            : invoice.status === 'pending'
                                            ? 'En attente'
                                            : invoice.status === 'validated'
                                            ? 'Validée'
                                            : 'Rejetée'}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Informations de paiement */}
                                  {invoice.paymentDate && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <h5 className={`text-xs font-medium mb-2 ${
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        Informations de paiement
                                      </h5>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className={`text-xs ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                          }`}>
                                            Date de paiement
                                          </p>
                                          <p className={`text-sm ${
                                            isDark ? 'text-gray-200' : 'text-gray-900'
                                          }`}>
                                            {format(parseISO(invoice.paymentDate), 'dd MMMM yyyy', { locale: fr })}
                                          </p>
                                        </div>
                                        <div>
                                          <p className={`text-xs ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                          }`}>
                                            Référence de paiement
                                          </p>
                                          <p className={`text-sm ${
                                            isDark ? 'text-gray-200' : 'text-gray-900'
                                          }`}>
                                            {invoice.paymentReference || '-'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Documents et bons liés */}
                              <div>
                                {/* Documents */}
                                <h4 className={`text-sm font-medium mb-2 ${
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Documents
                                </h4>
                                <div className={`p-4 rounded-lg mb-4 ${
                                  isDark ? 'bg-space-800' : 'bg-white'
                                }`}>
                                  {invoice.documents && invoice.documents.length > 0 ? (
                                    <div className="space-y-2">
                                      {invoice.documents.map((doc, index) => (
                                        <div
                                          key={index}
                                          className={`flex items-center justify-between p-2 rounded-lg ${
                                            isDark ? 'bg-space-700 hover:bg-space-600' : 'bg-gray-50 hover:bg-gray-100'
                                          } transition-colors`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <FileText className={`w-5 h-5 ${
                                              isDark ? 'text-gray-400' : 'text-gray-500'
                                            }`} />
                                            <div>
                                              <p className={`text-sm font-medium ${
                                                isDark ? 'text-gray-200' : 'text-gray-900'
                                              }`}>
                                                {doc.name}
                                              </p>
                                              <p className={`text-xs ${
                                                isDark ? 'text-gray-400' : 'text-gray-500'
                                              }`}>
                                                {format(parseISO(doc.date), 'dd/MM/yyyy')}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => onViewDocument({
                                                name: doc.name,
                                                url: doc.url,
                                                type: doc.type
                                              })}
                                              className={`p-1.5 rounded-lg ${
                                                isDark
                                                  ? 'hover:bg-space-500 text-gray-400 hover:text-gray-300'
                                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                              }`}
                                              title="Voir"
                                            >
                                              <Eye className="w-4 h-4" />
                                            </button>
                                            <a
                                              href={doc.url}
                                              download
                                              className={`p-1.5 rounded-lg ${
                                                isDark
                                                  ? 'hover:bg-space-500 text-gray-400 hover:text-gray-300'
                                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                              }`}
                                              title="Télécharger"
                                            >
                                              <Download className="w-4 h-4" />
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className={`text-center py-4 ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Aucun document disponible
                                    </div>
                                  )}
                                </div>
                                
                                {/* Bons liés */}
                                <h4 className={`text-sm font-medium mb-2 ${
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Bons liés
                                </h4>
                                <div className={`p-4 rounded-lg ${
                                  isDark ? 'bg-space-800' : 'bg-white'
                                }`}>
                                  {invoice.vouchers && invoice.vouchers.length > 0 ? (
                                    <div className="space-y-2">
                                      {invoice.vouchers.map((voucher, index) => (
                                        <div
                                          key={index}
                                          className={`flex items-center justify-between p-2 rounded-lg ${
                                            isDark ? 'bg-space-700 hover:bg-space-600' : 'bg-gray-50 hover:bg-gray-100'
                                          } transition-colors`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-full ${
                                              voucher.type === 'delivery'
                                                ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                                : voucher.type === 'evacuation'
                                                ? isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-800'
                                                : voucher.type === 'concrete'
                                                ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                                                : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                                            }`}>
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className={`text-sm font-medium ${
                                                isDark ? 'text-gray-200' : 'text-gray-900'
                                              }`}>
                                                {voucher.number}
                                              </p>
                                              <p className={`text-xs ${
                                                isDark ? 'text-gray-400' : 'text-gray-500'
                                              }`}>
                                                {voucher.type === 'delivery' ? 'Livraison' :
                                                 voucher.type === 'evacuation' ? 'Évacuation' :
                                                 voucher.type === 'concrete' ? 'Béton' : 'Matériaux'}
                                                 {' • '}
                                                {voucher.amount.toLocaleString('fr-FR', {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })} CHF
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              className={`p-1.5 rounded-lg ${
                                                isDark
                                                  ? 'hover:bg-space-500 text-gray-400 hover:text-gray-300'
                                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                              }`}
                                              title="Détacher"
                                            >
                                              <Link className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className={`text-center py-4 ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Aucun bon lié à cette facture
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className={`px-3 py-8 text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Aucune facture disponible
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