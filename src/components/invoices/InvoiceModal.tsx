import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Link, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { saveInvoice, getVouchersByProject, supabase } from '../../lib/supabase';
import type { Invoice, Voucher } from '../../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  projectId: string;
  onSave: (invoice: Invoice) => void;
}

export function InvoiceModal({ isOpen, onClose, invoice, projectId, onSave }: InvoiceModalProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Partial<Invoice>>({
    number: '',
    reference: '',
    supplier: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // +30 jours
    amountHT: 0,
    amountTTC: 0,
    vatRate: 7.7,
    status: 'draft',
    documents: [],
    vouchers: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isVoucherSelectorOpen, setIsVoucherSelectorOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVouchers, setSelectedVouchers] = useState<Voucher[]>([]);

  // Mettre à jour le formulaire quand la facture change
  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        // Convertir les dates au format YYYY-MM-DD pour les inputs
        date: invoice.date.split('T')[0],
        dueDate: invoice.dueDate.split('T')[0],
        paymentDate: invoice.paymentDate ? invoice.paymentDate.split('T')[0] : undefined
      });
      
      // Si la facture a des bons liés, les ajouter à la sélection
      if (invoice.vouchers && invoice.vouchers.length > 0) {
        setSelectedVouchers(invoice.vouchers);
      }
    } else {
      // Réinitialiser le formulaire pour une nouvelle facture
      setFormData({
        number: '',
        reference: '',
        supplier: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        amountHT: 0,
        amountTTC: 0,
        vatRate: 7.7,
        status: 'draft',
        documents: [],
        vouchers: []
      });
      setSelectedVouchers([]);
    }
  }, [invoice, isOpen]);

  // Charger les bons disponibles
  useEffect(() => {
    async function loadVouchers() {
      if (!projectId || !isVoucherSelectorOpen) return;
      
      try {
        setLoading(true);
        const data = await getVouchersByProject(projectId);
        
        // Filtrer les bons qui ne sont pas déjà liés à une facture
        const availableVouchers = data.filter(v => !v.invoiceId);
        setAvailableVouchers(availableVouchers);
      } catch (err) {
        console.error('Erreur lors du chargement des bons:', err);
        setError('Erreur lors du chargement des bons');
      } finally {
        setLoading(false);
      }
    }
    
    loadVouchers();
  }, [projectId, isVoucherSelectorOpen]);

  // Filtrer les bons disponibles en fonction du terme de recherche
  const filteredVouchers = React.useMemo(() => {
    if (!searchTerm) return availableVouchers;
    
    return availableVouchers.filter(voucher => 
      voucher.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.materials && voucher.materials.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableVouchers, searchTerm]);

  // Calculer le montant TTC à partir du montant HT et du taux de TVA
  useEffect(() => {
    if (formData.amountHT !== undefined && formData.vatRate !== undefined) {
      const amountTTC = formData.amountHT * (1 + formData.vatRate / 100);
      setFormData(prev => ({ ...prev, amountTTC }));
    }
  }, [formData.amountHT, formData.vatRate]);

  // Gérer l'upload de fichiers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);
      
      const newDocuments = [];
      
      // Traiter chaque fichier
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / files.length) * 50));
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `invoices/${fileName}`;
        
        // Créer un objet document avec un ID temporaire
        newDocuments.push({
          id: `temp_${crypto.randomUUID()}`,
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          date: new Date().toISOString(),
          size: file.size
        });
        
        setUploadProgress(50 + Math.round((i / files.length) * 50));
      }

      // Mettre à jour les données du formulaire avec les nouveaux documents
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocuments]
      }));
      
      setUploadProgress(100);
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      setError(`Erreur lors de l'upload des fichiers: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
      // Réinitialiser le champ de fichier
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation des champs requis
      if (!formData.number || !formData.supplier || !formData.date || !formData.dueDate || formData.amountHT === undefined || formData.amountTTC === undefined || formData.vatRate === undefined) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      
      // Préparer les données de la facture
      const invoiceData = {
  ...formData,
  projectId,
  vouchers: selectedVouchers.map(v => ({
    id: v.id, // Utiliser "id" au lieu de "voucherId"
    type: v.type,
    number: v.number,
    supplier: v.supplier,
    date: v.date,
    materials: v.materials || '',
    quantity: v.quantity || 0,
    unit: v.unit || '',
    unitPrice: v.unitPrice || 0,
    amount: (v.quantity || 0) * (v.unitPrice || 0)
  }))
};
      
      // Sauvegarder la facture
      const savedInvoice = await saveInvoice(projectId, invoiceData);
      
      onSave(savedInvoice);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la facture:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un bon à la facture
  const addVoucherToInvoice = (voucher: Voucher) => {
     const completeVoucher = {
    ...voucher,
    // Assurez-vous que ces propriétés existent, sinon fournissez des valeurs par défaut
    quantity: voucher.quantity || 0,
    unitPrice: voucher.unitPrice || 0,
    materials: voucher.materials || '',
    concreteType: voucher.concreteType || ''
  };
    
    
    // Vérifier si le bon n'est pas déjà sélectionné
    if (!selectedVouchers.some(v => v.id === voucher.id)) {
      setSelectedVouchers(prev => [...prev, completeVoucher]);
    }
  };

  // Retirer un bon de la facture
  const removeVoucherFromInvoice = (voucherId: string) => {
    setSelectedVouchers(prev => prev.filter(v => v.id !== voucherId));
  };

  // Calculer le montant total des bons sélectionnés
  const selectedVouchersAmount = React.useMemo(() => {
    return selectedVouchers.reduce((sum, voucher) => {
      return sum + (voucher.quantity || 0) * (voucher.unitPrice || 0);
    }, 0);
  }, [selectedVouchers]);

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
              {invoice ? 'Modifier la facture' : 'Nouvelle facture'}
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

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Numéro de facture *
                </label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="ex: F-2025-001"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Référence interne ou bon de commande"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Fournisseur *
                </label>
                <input
                  type="text"
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Nom du fournisseur"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Statut *
                </label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as Invoice['status']
                  }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
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
                  Date de facture *
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date d'échéance *
                </label>
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Montant HT *
                </label>
                <input
                  type="number"
                  value={formData.amountHT || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    amountHT: parseFloat(e.target.value) || 0
                  }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Taux de TVA (%) *
                </label>
                <input
                  type="number"
                  value={formData.vatRate || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vatRate: parseFloat(e.target.value) || 0
                  }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="7.7"
                  step="0.1"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Montant TTC
                </label>
                <input
                  type="number"
                  value={formData.amountTTC?.toFixed(2) || ''}
                  readOnly
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  } opacity-75`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date de paiement
                </label>
                <input
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value || undefined }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Référence de paiement
                </label>
                <input
                  type="text"
                  value={formData.paymentReference || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value || undefined }))}
                  className={`w-full rounded-lg border ${
                    isDark
                      ? 'bg-space-900 border-space-700 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="ex: VIR-2025-001"
                />
              </div>
            </div>

            {/* Message d'erreur d'upload */}
            {error && (
              <div className={`p-4 rounded-lg mb-4 ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {error}
              </div>
            )}

            {/* Indicateur de progression */}
            {loading && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload en cours...
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-space-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-blue-500" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="mt-6">
              <h4 className={`text-lg font-medium mb-4 ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Documents
              </h4>

              <div className="space-y-4">
                {formData.documents && formData.documents.map((doc, index) => (
                  <div
                    key={doc.id || index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isDark ? 'bg-space-900' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        isDark ? 'bg-space-800' : 'bg-white'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {doc.name}
                        </div>
                        <div className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(doc.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          documents: prev.documents?.filter((_, i) => i !== index)
                        }));
                      }}
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div 
                  className={`relative p-8 border-2 border-dashed rounded-lg text-center transition-all ${
                    isDark ? 'border-space-700' : 'border-gray-300'
                  } hover:border-blue-500 relative`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('border-blue-500');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-blue-500');
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                      handleFileUpload({ target: { files } } as any);
                    }
                  }}
                >
                  <label htmlFor="invoice-files" className="block cursor-pointer">
                    <Upload className={`w-6 h-6 mx-auto mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Déposez vos fichiers ici ou cliquez pour sélectionner
                    </span>
                  </label>
                  <input
                    type="file"
                    id="invoice-files"
                    multiple
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>

            {/* Bons liés */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-lg font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Bons liés
                </h4>
                <button
                  onClick={() => setIsVoucherSelectorOpen(true)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Lier des bons</span>
                </button>
              </div>

              <div className="space-y-4">
                {selectedVouchers.length > 0 ? (
                  <div className={`rounded-lg border overflow-x-auto ${
                    isDark ? 'border-space-700' : 'border-gray-200'
                  }`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Numéro
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fournisseur
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Matériaux
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix unitaire
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant
                          </th>
                          <th className="relative px-3 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
                        {selectedVouchers.map((voucher) => {
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
                                  voucher.type === 'delivery'
                                    ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                    : voucher.type === 'evacuation'
                                    ? isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-800'
                                    : voucher.type === 'concrete'
                                    ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                                    : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {voucher.type === 'delivery' ? 'Livraison' :
                                   voucher.type === 'evacuation' ? 'Évacuation' :
                                   voucher.type === 'concrete' ? 'Béton' : 'Matériaux'}
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
                                {format(new Date(voucher.date), 'dd/MM/yyyy')}
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
                              <td className="px-3 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => removeVoucherFromInvoice(voucher.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark
                                      ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                      : 'hover:bg-red-50 text-red-500 hover:text-red-700'
                                  }`}
                                  title="Retirer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Ligne de total */}
                        <tr className={`font-medium ${
                          isDark ? 'bg-space-700 text-gray-200' : 'bg-gray-100 text-gray-900'
                        }`}>
                          <td className="px-3 py-4 whitespace-nowrap" colSpan={7}>
                            Total ({selectedVouchers.length} bons)
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right">
                            {selectedVouchersAmount.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`p-8 rounded-lg border-2 border-dashed text-center ${
                    isDark 
                      ? 'border-space-700 hover:border-space-600' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <Link className={`w-8 h-8 mx-auto mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucun bon lié à cette facture
                    </p>
                    <button
                      onClick={() => setIsVoucherSelectorOpen(true)}
                      className={`mt-4 px-4 py-2 rounded-lg ${
                        isDark
                          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      Lier des bons
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-2 p-4 border-t ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className="button-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className={`button-primary ${
                loading ? 'opacity-50 cursor-wait' : ''
              }`}
              disabled={loading || !formData.number || !formData.supplier || !formData.date || !formData.dueDate}
            >
              {loading 
                ? 'Chargement...' 
                : invoice ? 'Mettre à jour' : 'Créer'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Modal de sélection des bons */}
      {isVoucherSelectorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/70 transition-opacity" 
              onClick={() => setIsVoucherSelectorOpen(false)}
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
                  Sélectionner des bons
                </h3>
                <button
                  onClick={() => setIsVoucherSelectorOpen(false)}
                  className={`rounded-lg p-1 hover:bg-opacity-80 transition-colors ${
                    isDark 
                      ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
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

                {/* Liste des bons disponibles */}
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
                  <div className={`rounded-lg border overflow-x-auto max-h-96 ${
                    isDark ? 'border-space-700' : 'border-gray-200'
                  }`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={`sticky top-0 ${isDark ? 'bg-space-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Numéro
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fournisseur
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Matériaux
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix unitaire
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant
                          </th>
                          <th className="relative px-3 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
                        {filteredVouchers.length > 0 ? (
                          filteredVouchers.map((voucher) => {
                            // Déterminer les matériaux à afficher selon le type
                            let materials = '';
                            if (voucher.type === 'delivery' || voucher.type === 'evacuation' || voucher.type === 'materials') {
                              materials = voucher.materials || '';
                            } else if (voucher.type === 'concrete') {
                              materials = voucher.concreteType || '';
                            }

                            // Calculer le montant
                            const amount = (voucher.quantity || 0) * (voucher.unitPrice || 0);
                            
                            // Vérifier si le bon est déjà sélectionné
                            const isSelected = selectedVouchers.some(v => v.id === voucher.id);

                            return (
                              <tr
                                key={voucher.id}
                                className={`transition-colors ${
                                  isSelected
                                    ? isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                                    : isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    voucher.type === 'delivery'
                                      ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                      : voucher.type === 'evacuation'
                                      ? isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-800'
                                      : voucher.type === 'concrete'
                                      ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                                      : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {voucher.type === 'delivery' ? 'Livraison' :
                                     voucher.type === 'evacuation' ? 'Évacuation' :
                                     voucher.type === 'concrete' ? 'Béton' : 'Matériaux'}
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
                                  {format(new Date(voucher.date), 'dd/MM/yyyy')}
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
                                <td className="px-3 py-4 whitespace-nowrap text-right">
                                  <button
                                    onClick={() => addVoucherToInvoice(voucher)}
                                    disabled={isSelected}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSelected
                                        ? isDark
                                          ? 'bg-blue-500/20 text-blue-300'
                                          : 'bg-blue-100 text-blue-600'
                                        : isDark
                                          ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-300'
                                          : 'hover:bg-blue-50 text-gray-500 hover:text-blue-600'
                                    }`}
                                    title={isSelected ? 'Déjà sélectionné' : 'Ajouter'}
                                  >
                                    {isSelected ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Plus className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={9}
                              className={`px-3 py-8 text-center ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {searchTerm
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

              {/* Footer */}
              <div className={`flex justify-between items-center gap-2 p-4 border-t ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedVouchers.length} bon{selectedVouchers.length !== 1 ? 's' : ''} sélectionné{selectedVouchers.length !== 1 ? 's' : ''}
                  {selectedVouchers.length > 0 && (
                    <span className="ml-2">
                      pour un montant total de {selectedVouchersAmount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} CHF
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsVoucherSelectorOpen(false)}
                    className="button-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      // Mettre à jour le montant HT de la facture avec le montant des bons
                      if (selectedVouchers.length > 0 && selectedVouchersAmount > 0) {
                        setFormData(prev => ({
                          ...prev,
                          amountHT: selectedVouchersAmount
                        }));
                      }
                      setIsVoucherSelectorOpen(false);
                    }}
                    className="button-primary"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}