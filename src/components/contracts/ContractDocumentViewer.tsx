import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, AlertCircle, ExternalLink, Eye } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { deleteContractDocument } from '../../lib/supabase';
import type { ContractDocument } from '../../types';

interface ContractDocumentViewerProps {
  documents: ContractDocument[];
  contractId: string;
  onDocumentDelete: (documentId: string) => void;
  onDocumentView: (document: { name: string; url: string; type: string }) => void;
  setNotification?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
}

export function ContractDocumentViewer({ 
  documents, 
  contractId, 
  onDocumentDelete, 
  onDocumentView,
  setNotification 
}: ContractDocumentViewerProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  // Générer des URLs signées pour les PDFs au chargement
  useEffect(() => {
    const generatePdfUrls = async () => {
      const pdfDocuments = documents.filter(doc => 
        doc.type === 'application/pdf' || doc.type.includes('pdf')
      );
      
      if (pdfDocuments.length === 0) return;
      
      const urls: Record<string, string> = {};
      
      for (const doc of pdfDocuments) {
        try {
          // Extraire le nom du fichier de l'URL
          const storageUrlPattern = /\/storage\/v1\/object\/public\/contracts\/([^?]+)/;
          const match = doc.url.match(storageUrlPattern);
          
          if (match && match[1]) {
            const fileName = match[1];
            
            // Obtenir une URL signée
            const { data, error } = await supabase.storage
              .from('contracts')
              .createSignedUrl(fileName, 3600); // 1 heure d'expiration

            if (!error && data?.signedUrl) {
              urls[doc.id] = data.signedUrl;
            } else {
              urls[doc.id] = doc.url; // Fallback à l'URL originale
            }
          } else {
            urls[doc.id] = doc.url; // Fallback à l'URL originale
          }
        } catch (err) {
          console.warn(`Erreur lors de la génération de l'URL signée pour ${doc.id}:`, err);
          urls[doc.id] = doc.url; // Fallback à l'URL originale
        }
      }
      
      setPdfUrls(urls);
    };
    
    generatePdfUrls();
  }, [documents]);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setLoading(documentId);
      setError(null);
      
      await deleteContractDocument(documentId);
      
      onDocumentDelete(documentId);
      
      if (setNotification) {
        setNotification({
          type: 'success',
          message: 'Document supprimé avec succès'
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du document';
      setError(message);
      
      if (setNotification) {
        setNotification({
          type: 'error',
          message
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleViewDocument = (document: ContractDocument) => {
    // Passer directement le document au visualiseur sans vérifications supplémentaires
    onDocumentView({
      name: document.nom,
      url: document.url,
      type: document.type
    });
  };

  return (
    <div className="space-y-4">
      <h4 className={`text-base font-medium mb-2 ${
        isDark ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Documents ({documents.length})
      </h4>
      
      {error && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              isDark 
                ? 'bg-space-800 hover:bg-space-700 border border-space-700' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            } transition-colors`}
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
                {document.nom}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(document.dateUpload).toLocaleDateString()}
                </span>
                
                {document.type === 'application/pdf' && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isDark 
                      ? 'bg-red-500/20 text-red-300' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    PDF
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleViewDocument(document)}
                className={`p-1.5 rounded-lg ${
                  isDark
                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Voir en prévisualisation"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              <a
                href={document.type === 'application/pdf' ? pdfUrls[document.id] || document.url : document.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg ${
                  isDark
                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <a
                href={document.url}
                download={document.nom}
                className={`p-1.5 rounded-lg ${
                  isDark
                    ? 'hover:bg-space-600 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Télécharger"
              >
                <Download className="w-4 h-4" />
              </a>
              
              <button
                onClick={() => handleDeleteDocument(document.id)}
                disabled={loading === document.id}
                className={`p-1.5 rounded-lg ${
                  isDark
                    ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                } ${loading === document.id ? 'opacity-50 cursor-wait' : ''}`}
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className={`col-span-2 text-center py-6 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Aucun document disponible
          </div>
        )}
      </div>
    </div>
  );
}