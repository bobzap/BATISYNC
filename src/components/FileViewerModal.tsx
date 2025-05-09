import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, FileText, Download, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
//import { PDFViewer } from '../components/PDFViewer';


interface FileViewerModalProps {
  file: {
    name: string;
    url: string;
    type: string;
  } | null;
  onClose: () => void;
}

export function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  const { isDark } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
 

  // Reset loading state when file changes
  useEffect(() => {
    if (file) {
      setLoading(true);
      setError(null);
      
      
      
      // Si c'est un PDF, on génère une URL signée
      if (file.type === 'application/pdf' || file.type.includes('pdf')) {
        generatePdfUrl(file.url);
      } else {
        setPdfUrl(null);
        setLoading(false);
      }
    }
  }, [file]);

  // Fonction pour générer une URL signée pour les PDFs
  const generatePdfUrl = async (url: string) => {
    try {
      // Extraire le nom du fichier de l'URL
      let fileName = '';
      
      // Essayer d'extraire le chemin du bucket 'contracts'
      const storageUrlPattern = /\/storage\/v1\/object\/public\/contracts\/([^?]+)/;
      const match = url.match(storageUrlPattern);
      
      if (match && match[1]) {
        fileName = match[1];
        
        // Essayer d'obtenir une URL signée
        const { data, error } = await supabase.storage
          .from('contracts')
          .createSignedUrl(fileName, 3600); // 1 heure d'expiration

        if (error) {
          console.warn('Impossible de générer une URL signée:', error);
          // Si on ne peut pas obtenir une URL signée, utiliser l'URL publique
          setPdfUrl(url);
        } else if (data?.signedUrl) {
          setPdfUrl(data.signedUrl);
        } else {
          setPdfUrl(url); // Fallback à l'URL originale
        }
      } else {
        // Si on ne peut pas extraire le chemin, utiliser l'URL originale
        setPdfUrl(url);
      }
    } catch (err) {
      console.error('Erreur lors de la génération de l\'URL du PDF:', err);
      setPdfUrl(url); // Fallback à l'URL originale
      setError('Impossible de générer une URL sécurisée pour ce PDF.');
    } finally {
      setLoading(false);
    }
  };



  if (!file) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

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
       isFullscreen ? 'fixed inset-0 max-w-none rounded-none' : ''
     } ${
       isDark ? 'bg-space-800' : 'bg-white'
     } transition-all duration-300 ${
       isFullscreen ? 'm-0' : ''
     }`}>
       {/* Header */}
       <div className={`flex items-center justify-between p-4 border-b ${
         isDark ? 'border-space-700' : 'border-gray-200'
       }`}>
         <h3 className={`text-lg font-medium ${
           isDark ? 'text-gray-200' : 'text-gray-900'
         }`}>
           {file.name}
         </h3>
         <div className="flex items-center gap-2">
           <button
             onClick={toggleFullscreen}
             className={`rounded-lg p-1 hover:bg-opacity-80 transition-colors ${
               isDark 
                 ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
                 : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
             }`}
             title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
           >
             {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
           </button>
           
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
       </div>

       {/* Content */}
       <div className="p-4">
         {loading ? (
  <div className="flex justify-center items-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
) : error ? (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-8">
    <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
    <p className={`text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      {error}
    </p>
    <div className="flex gap-3">
      <a href={file.url} target="_blank" rel="noopener noreferrer" 
         className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
        <ExternalLink className="w-4 h-4" />
        <span>Ouvrir dans un nouvel onglet</span>
      </a>
      <a href={file.url} download={file.name}
         className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
        <Download className="w-4 h-4" />
        <span>Télécharger</span>
      </a>
    </div>
  </div>
) : isImage ? (
  <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-space-900' : 'bg-gray-50'}`}>
    <img src={file.url} alt={file.name} className="mx-auto h-[calc(100vh-200px)] object-contain"
         onError={() => { setError("Impossible de charger l'image"); }} />
  </div>
) : isPdf && pdfUrl ? (
  <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-space-900' : 'bg-gray-50'}`}>
    <embed 
  src={pdfUrl}
  type="application/pdf"
  className="w-full h-full"
/>
  </div>
) : (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-8">
    <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
    <p className={`text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      Ce type de fichier ne peut pas être prévisualisé directement.
    </p>
    <div className="flex gap-3">
      <a href={file.url} target="_blank" rel="noopener noreferrer"
         className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
        <ExternalLink className="w-4 h-4" />
        <span>Ouvrir dans un nouvel onglet</span>
      </a>
      <a href={file.url} download={file.name}
         className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
        <Download className="w-4 h-4" />
        <span>Télécharger</span>
      </a>
    </div>
  </div>
)}
       </div>
     </div>
   </div>
 </div>
);
}

