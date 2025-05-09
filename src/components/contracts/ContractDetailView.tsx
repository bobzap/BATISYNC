import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, MoreVertical, Edit2, Trash2, Plus, Eye, ChevronDown, ChevronRight, Search, Download, ExternalLink, Table } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Contract, ContractDocument, ContractDataRow } from '../../types';
import { ContractDataExtractor } from './ContractDataExtractor'; 
import { ContractDataSummaryTable } from './ContractDataSummaryTable';

import { supabase } from '../../lib/supabase';
import { ContractDocumentViewer } from './ContractDocumentViewer';

interface ContractDetailViewProps {
  contracts: Contract[];
  activeContract: Contract | null;
  setActiveContract: (contract: Contract | null) => void;
  onEdit?: (contract: Contract) => void;
  onDelete?: (contractId: string) => void;
  onViewDocument: (document: { name: string; url: string; type: string }) => void;
  setNotification?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
}

export function ContractDetailView({ 
  contracts, 
  activeContract, 
  setActiveContract, 
  onEdit, 
  onDelete, 
  onViewDocument,
  setNotification
}: ContractDetailViewProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [extractedData, setExtractedData] = useState<Array<{key: string; value: string}>>([]);
  const [contractData, setContractData] = useState<Record<string, ContractDataRow[]>>({
    articles: [],
    conditions: [],
    conditions_speciales: []
  });
  const [activeTab, setActiveTab] = useState<'document' | 'data'>('document');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  

  // Effect to handle PDF URL generation when a document is selected
  useEffect(() => {
    const generatePdfUrl = async () => {
      if (!selectedDocument || !selectedDocument.url) {
        setPdfUrl(null);
        return;
      }
        
      try {
        // Extraire le nom du fichier de l'URL
        let fileName = '';
        
        // Essayer d'extraire le chemin du bucket 'contracts'
        const storageUrlPattern = /\/storage\/v1\/object\/public\/contracts\/([^?]+)/;
        const match = selectedDocument.url.match(storageUrlPattern);
        
        if (match && match[1]) {
          fileName = match[1];
          
          // Essayer d'obtenir une URL signée
          const { data, error } = await supabase.storage
            .from('contracts')
            .createSignedUrl(fileName, 3600); // 1 heure d'expiration

          if (error) {
            console.warn('Impossible de générer une URL signée:', error);
            // Si on ne peut pas obtenir une URL signée, utiliser l'URL publique
            setPdfUrl(selectedDocument.url);
          } else if (data?.signedUrl) {
            setPdfUrl(data.signedUrl);
          } else {
            setPdfUrl(selectedDocument.url); // Fallback à l'URL originale
          }
        } else {
          // Si on ne peut pas extraire le chemin, utiliser l'URL originale
          setPdfUrl(selectedDocument.url);
        }
      } catch (error) {
        console.error('Error generating PDF URL:', error);
        setPdfUrl(null);
        setPdfError('Impossible de charger le PDF. Utilisez le bouton "Voir en plein écran".');
        setNotification?.({
          type: 'error',
          message: 'Erreur lors du chargement du PDF. Utilisez le bouton "Voir en plein écran".'
        });
      } finally {
        setIsLoadingPdf(false);
      }
    };

    generatePdfUrl();
  }, [selectedDocument, setNotification]);



  // Filtrer les contrats en fonction du terme de recherche
  const filteredContracts = contracts.filter(contract => 
    contract.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.entreprise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Contract['statut']) => {
    switch (status) {
      case 'actif':
        return isDark 
          ? 'bg-green-500/20 text-green-300'
          : 'bg-green-100 text-green-800';
      case 'termine':
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
      case 'suspendu':
        return isDark
          ? 'bg-orange-500/20 text-orange-300'
          : 'bg-orange-100 text-orange-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Contract['type']) => {
    switch (type) {
      case 'fournisseur':
        return isDark
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-blue-100 text-blue-800';
      case 'sous-traitance':
        return isDark
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-purple-100 text-purple-800';
      case 'location':
        return isDark
          ? 'bg-yellow-500/20 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      case 'commande-unique':
        return isDark
          ? 'bg-pink-500/20 text-pink-300'
          : 'bg-pink-100 text-pink-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un contrat..."
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-space-900 border-space-700 text-gray-200 placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {activeContract ? (
        <div className="space-y-6">
          {/* Informations du contrat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panneau de gauche: Informations du contrat */}
            <div className={`rounded-lg border ${
              isDark ? 'border-space-700' : 'border-gray-200'
            } flex flex-col`}>
              <div className={`p-4 border-b ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-medium ${
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      Informations du contrat
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit && onEdit(activeContract)}
                      disabled={!onEdit}
                      className={`p-2 rounded-lg transition-colors ${
                        !onEdit 
                          ? 'opacity-50 cursor-not-allowed'
                          : isDark
                            ? 'hover:bg-space-700 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveContract(null);
                      }}
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Fermer"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Onglets */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('document')}
                    className={`py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'document'
                        ? isDark
                          ? 'border-blue-500 text-blue-400'
                          : 'border-blue-500 text-blue-600'
                        : isDark
                          ? 'border-transparent text-gray-400 hover:text-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Informations</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`py-2 px-4 font-medium text-sm border-b-2 ${
                      activeTab === 'data'
                        ? isDark
                          ? 'border-blue-500 text-blue-400'
                          : 'border-blue-500 text-blue-600'
                        : isDark
                          ? 'border-transparent text-gray-400 hover:text-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4" />
                      <span>Données extraites</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-6 flex-grow overflow-y-auto">
                {activeTab === 'document' ? (
                  <>
                    {/* Informations générales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Référence
                        </label>
                        <div className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {activeContract.reference}
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Type
                        </label>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getTypeColor(activeContract.type)
                          }`}>
                            {activeContract.type === 'fournisseur' ? 'Fournisseur'
                              : activeContract.type === 'sous-traitance' ? 'Sous-traitance'
                              : activeContract.type === 'location' ? 'Location'
                              : 'Commande unique'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Entreprise
                        </label>
                        <div className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {activeContract.entreprise}
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Montant HT
                        </label>
                        <div className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {activeContract.montantHT.toLocaleString('fr-FR')} CHF
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Date de début
                        </label>
                        <div className={`${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {format(new Date(activeContract.dateDebut), 'dd/MM/yyyy')}
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Date de fin
                        </label>
                        <div className={`${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {activeContract.dateFin 
                            ? format(new Date(activeContract.dateFin), 'dd/MM/yyyy')
                            : 'Non spécifiée'}
                        </div>
                      </div>
                    </div>

                    {/* Avenants */}
                    {activeContract.avenants.length > 0 && (
                      <div>
                        <h4 className={`text-base font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Avenants
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {activeContract.avenants.map((avenant) => (
                            <div
                              key={avenant.id}
                              className={`p-3 rounded-lg ${
                                isDark ? 'bg-space-900' : 'bg-gray-50'
                              }`}
                            >
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <label className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Référence
                                  </label>
                                  <div className={`text-sm ${
                                    isDark ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {avenant.reference}
                                  </div>
                                </div>
                                <div>
                                  <label className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Description
                                  </label>
                                  <div className={`text-sm ${
                                    isDark ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {avenant.description}
                                  </div>
                                </div>
                                <div>
                                  <label className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Montant HT
                                  </label>
                                  <div className={`text-sm ${
                                    isDark ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {avenant.montantHT.toLocaleString('fr-FR')} CHF
                                  </div>
                                </div>
                                <div>
                                  <label className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Date
                                  </label>
                                  <div className={`text-sm ${
                                    isDark ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {format(new Date(avenant.date), 'dd/MM/yyyy')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <h4 className={`text-base font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Documents
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {activeContract.documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                              selectedDocument?.id === doc.id
                                ? isDark
                                  ? 'bg-blue-500/20 border border-blue-500/30'
                                  : 'bg-blue-50 border border-blue-200'
                                : isDark
                                  ? 'bg-space-900 hover:bg-space-700 border border-space-700'
                                  : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${
                              isDark ? 'bg-space-700' : 'bg-gray-100'
                            }`}>
                              <FileText className={`w-4 h-4 ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-grow">
                              <div className={`text-sm font-medium ${
                                isDark ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                {doc.nom}
                              </div>
                              
                              <div className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {format(new Date(doc.dateUpload), 'dd/MM/yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewDocument({
                                    name: doc.nom,
                                    url: doc.url,
                                    type: doc.type
                                  });
                                }}
                                className={`p-1.5 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Voir en plein écran"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={doc.url}
                                download={doc.nom}
                                onClick={(e) => e.stopPropagation()}
                                className={`p-1.5 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                        {activeContract.documents.length === 0 && (
                          <div className={`text-center py-4 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Aucun document disponible
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <ContractDataExtractor
                    contractId={activeContract.id}
                    selectedDocument={selectedDocument}
                    onDataSaved={() => {
                      // Recharger les données extraites
                    }}
                  />
                )}
              </div>
            </div>

            {/* Panneau de droite: Document sélectionné */}
            <div className={`rounded-lg border ${
              isDark ? 'border-space-700' : 'border-gray-200'
            }`}>
              <div className={`p-4 border-b ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {selectedDocument ? 'Document sélectionné' : 'Aperçu du document'}
                  </h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className={`p-2 rounded-lg ${
                      isDark
                        ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {selectedDocument ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-lg font-medium ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {selectedDocument.nom}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDocument({
                            name: selectedDocument.nom,
                            url: selectedDocument.url,
                            type: selectedDocument.type
                          })}
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Voir en plein écran"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={selectedDocument.url}
                          download={selectedDocument.nom}
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    
                    <div className={`aspect-[3/4] rounded-lg border overflow-hidden ${
                      isDark ? 'border-space-700 bg-space-900' : 'border-gray-200 bg-gray-50' 
                    }`}>
                      {selectedDocument.type.startsWith('image/') ? (
  <img
    src={selectedDocument.url}
    alt={selectedDocument.nom}
    className="w-full h-full object-contain"
  />
) : selectedDocument.type === 'application/pdf' ? (
  <>
    {isLoadingPdf ? (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    ) : pdfUrl ? (
      <embed
        src={pdfUrl}
        type="application/pdf"
        className="w-full h-full"
      />
    ) : (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <p className={`text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {pdfError || "Impossible de charger le PDF"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onViewDocument({
              name: selectedDocument.nom,
              url: selectedDocument.url,
              type: selectedDocument.type
            })}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}
          >
            Voir en plein écran
          </button>
          
            <a href={selectedDocument.url}
   target="_blank"
   rel="noopener noreferrer"
   className={`px-4 py-2 rounded-lg ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-600'}`}
>
  Ouvrir dans un nouvel onglet
</a>
        </div>
      </div>
    )}
  </>
) : (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
    <p className={`text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      Ce type de document ne peut pas être prévisualisé.
    </p>
    
     <a href={selectedDocument.url}
   download={selectedDocument.nom}
   className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}
>
  Télécharger
</a>
  </div>
)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 mb-4">
                    <FileText className={`w-16 h-16 mb-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <p className={`text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Sélectionnez un document pour l'afficher ici
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Récapitulatif des données extraites - maintenant en pleine largeur */}
          {activeTab === 'document' && (
            <div className={`rounded-lg border col-span-1 lg:col-span-2 mt-6 ${
              isDark ? 'border-space-700' : 'border-gray-200'
            }`}>
              <div className={`p-4 border-b ${
                isDark ? 'border-space-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Récapitulatif des données extraites
                </h3>
              </div>
              <div className="p-4">
                <ContractDataSummaryTable contractId={activeContract.id} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant HT
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de début
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="relative px-3 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr
                  key={contract.id}
                  onClick={() => setActiveContract(contract)}
                  className={`cursor-pointer ${
                    isDark
                      ? 'hover:bg-space-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getTypeColor(contract.type)
                    }`}>
                      {contract.type === 'fournisseur' ? 'Fournisseur'
                        : contract.type === 'sous-traitance' ? 'Sous-traitance'
                        : contract.type === 'location' ? 'Location'
                        : 'Commande unique'}
                    </span>
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {contract.reference}
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {contract.entreprise}
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {contract.montantHT.toLocaleString('fr-FR')} CHF
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {format(new Date(contract.dateDebut), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(contract.statut)
                    }`}>
                      {contract.statut === 'actif' ? 'Actif'
                        : contract.statut === 'termine' ? 'Terminé'
                        : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContract(contract);
                      }}
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}