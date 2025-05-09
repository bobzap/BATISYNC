import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Contract, ContractAmendment } from '../../types';
import { supabase } from '../../lib/supabase';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Partial<Contract> | null;
  onSave: (contract: Omit<Contract, 'id'>) => void;
}

export function ContractModal({ isOpen, onClose, contract, onSave }: ContractModalProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Omit<Contract, 'id'>>({
    type: 'fournisseur',
    reference: '',
    entreprise: '',
    montantHT: 0,
    dateDebut: new Date().toISOString().split('T')[0], // Set default to today's date
    dateFin: '',
    statut: 'actif',
    avenants: [],
    documents: [],
    ...(contract || {})
  });

  const [newAmendment, setNewAmendment] = useState<Omit<ContractAmendment, 'id'>>({
    reference: '',
    description: '',
    montantHT: 0,
    date: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mettre à jour le formulaire quand le contrat change
  useEffect(() => {
    if (contract) {
      setFormData({
        type: contract.type || 'fournisseur',
        reference: contract.reference || '',
        entreprise: contract.entreprise || '',
        montantHT: contract.montantHT || 0,
        dateDebut: contract.dateDebut || new Date().toISOString().split('T')[0],
        dateFin: contract.dateFin || '',
        statut: contract.statut || 'actif',
        avenants: contract.avenants || [],
        documents: contract.documents || [],
        id: contract.id // Conserver l'ID pour les mises à jour
      });
    } else {
      // Réinitialiser le formulaire pour un nouveau contrat
      setFormData({
        type: 'fournisseur',
        reference: '',
        entreprise: '',
        montantHT: 0,
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        statut: 'actif',
        avenants: [],
        documents: []
      });
    }
  }, [contract, isOpen]);

  if (!isOpen) return null;

  const handleAddAmendment = () => {
    if (newAmendment.reference && newAmendment.montantHT) {
      setFormData(prev => ({
        ...prev,
        avenants: [...prev.avenants, { ...newAmendment, id: crypto.randomUUID() }],
        montantHT: prev.montantHT + newAmendment.montantHT
      }));
      setNewAmendment({
        reference: '',
        description: '',
        montantHT: 0,
        date: ''
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      const newDocuments = [];
      
      // Traiter chaque fichier séquentiellement pour éviter les problèmes de concurrence
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / files.length) * 50)); // 0-50% pour les préparations
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `contracts/${fileName}`;
        
        // Uploader le fichier dans Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
        }
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(filePath);
        
        // Créer un objet document avec un ID temporaire
        newDocuments.push({
          id: `temp_${crypto.randomUUID()}`,
          nom: file.name,
          type: file.type,
          url: publicUrl,
          dateUpload: new Date().toISOString()
        });
        
        setUploadProgress(50 + Math.round((i / files.length) * 50)); // 50-100% pour les uploads
      }

      // Mettre à jour les données du formulaire avec les nouveaux documents
      try {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, ...newDocuments]
        }));
      } catch (err) {
        console.error('Erreur lors de la mise à jour des documents:', err);
      }
      
      setUploadProgress(100);
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      setUploadError(`Erreur lors de l'upload des fichiers: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsUploading(false);
      // Réinitialiser le champ de fichier
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = () => {
    // S'assurer que dateDebut n'est pas vide avant de soumettre
    if (!formData.dateDebut) {
      setFormData(prev => ({
        ...prev,
        dateDebut: new Date().toISOString().split('T')[0]
      }));
    }
    onSave(formData);
    onClose();
  };

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
              {contract ? 'Modifier le contrat' : 'Nouveau contrat'}
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
                  Type de contrat *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as Contract['type']
                  }))}
                  className="form-select w-full"
                >
                  <option value="fournisseur">Fournisseur</option>
                  <option value="sous-traitance">Sous-traitance</option>
                  <option value="location">Location</option>
                  <option value="commande-unique">Commande unique</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Référence *
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reference: e.target.value 
                  }))}
                  className="form-input w-full"
                  placeholder="ex: CTR-2024-001"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Entreprise *
                </label>
                <input
                  type="text"
                  value={formData.entreprise}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    entreprise: e.target.value 
                  }))}
                  className="form-input w-full"
                  placeholder="Nom de l'entreprise"
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
                  value={formData.montantHT}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    montantHT: parseFloat(e.target.value) 
                  }))}
                  className="form-input w-full"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dateDebut: e.target.value || new Date().toISOString().split('T')[0]
                  }))}
                  className="form-input w-full"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.dateFin || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dateFin: e.target.value 
                  }))}
                  className="form-input w-full"
                  min={formData.dateDebut} // Prevent end date before start date
                />
              </div>
            </div>

            {/* Avenants */}
            <div className="mt-6">
              <h4 className={`text-lg font-medium mb-4 ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Avenants
              </h4>
              
              <div className="space-y-4">
                {formData.avenants.map((avenant, index) => (
                  <div key={avenant.id} className={`p-4 rounded-lg ${
                    isDark ? 'bg-space-900' : 'bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Référence</label>
                        <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                          {avenant.reference}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Description</label>
                        <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                          {avenant.description}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Montant HT</label>
                        <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                          {avenant.montantHT.toLocaleString('fr-FR')} CHF
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Date</label>
                        <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                          {new Date(avenant.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-900' : 'bg-gray-50'
                }`}>
                  <div className="grid grid-cols-4 gap-4">
                    <input
                      type="text"
                      value={newAmendment.reference}
                      onChange={(e) => setNewAmendment(prev => ({
                        ...prev,
                        reference: e.target.value
                      }))}
                      className="form-input"
                      placeholder="Référence"
                    />
                    <input
                      type="text"
                      value={newAmendment.description}
                      onChange={(e) => setNewAmendment(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      className="form-input"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      value={newAmendment.montantHT}
                      onChange={(e) => setNewAmendment(prev => ({
                        ...prev,
                        montantHT: parseFloat(e.target.value)
                      }))}
                      className="form-input"
                      placeholder="Montant HT"
                      step="0.01"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newAmendment.date}
                        onChange={(e) => setNewAmendment(prev => ({
                          ...prev,
                          date: e.target.value
                        }))}
                        className="form-input flex-grow"
                      />
                      <button
                        onClick={handleAddAmendment}
                        className={`p-2 rounded-lg ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message d'erreur d'upload */}
            {uploadError && (
              <div className={`p-4 rounded-lg mb-4 ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {uploadError}
              </div>
            )}

            {/* Indicateur de progression */}
            {isUploading && (
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
                {formData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isDark ? 'bg-space-900' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        isDark ? 'bg-space-800' : 'bg-white'
                      }`}>
                        <Upload className={`w-5 h-5 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {doc.nom}
                        </div>
                        <div className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          documents: prev.documents.filter(d => d.id !== doc.id)
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

                <div className={`p-8 rounded-lg border-2 border-dashed text-center ${
                  isDark 
                    ? 'border-space-700 hover:border-space-600' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="documents"
                    className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-wait' : ''} ${
                      isDark ? 'text-gray-400' : 'text-gray-600' 
                    }`}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="block text-sm">
                      {isUploading 
                        ? 'Upload en cours...' 
                        : 'Déposez vos documents ici ou cliquez pour sélectionner'
                      }
                    </span>
                  </label>
                </div>
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
                isUploading ? 'opacity-50 cursor-wait' : ''
              }`}
              disabled={!formData.reference || !formData.entreprise || !formData.dateDebut || isUploading}
            >
              {isUploading 
                ? 'Chargement...' 
                : contract ? 'Mettre à jour' : 'Créer'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}