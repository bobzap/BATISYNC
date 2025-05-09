import React from 'react';
import { Upload } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { createThumbnail } from '../../lib/imageUtils';

interface FileUploadSectionProps {
  files: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    type: 'image' | 'pdf';
    size: number;
  }>;
  onFilesChange: (files: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    type: 'image' | 'pdf';
    size: number;
  }>) => void;
  onFileSelect: (file: { name: string; url: string; type: 'image' | 'pdf' }) => void;
}

export function FileUploadSection({ files, onFilesChange, onFileSelect }: FileUploadSectionProps) {
  const { isDark } = useTheme();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length === 0) return;

    const processedFiles = await Promise.all(
      uploadedFiles.map(async (file) => {
        const isPdf = file.type === 'application/pdf';
        
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
        }

        const thumbnailUrl = isPdf 
          ? `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#EF4444"/><text x="16" y="20" text-anchor="middle" font-size="12" fill="#fff">PDF</text></svg>')}`
          : await createThumbnail(file);
        
        return {
          id: crypto.randomUUID(),
          name: file.name,
          url: URL.createObjectURL(file),
          thumbnailUrl,
          type: isPdf ? 'pdf' : 'image',
          size: file.size
        };
      })
    );
    
    try {
      onFilesChange([...files, ...processedFiles]);
    } catch (error) {
      console.error('Erreur lors du traitement des fichiers:', error);
      // Vous pouvez ajouter ici une notification d'erreur pour l'utilisateur
    }
  };

  return (
    <div className="space-y-4">
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
        <label htmlFor="files" className="block cursor-pointer">
          <Upload className={`w-6 h-6 mx-auto mb-2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Déposez vos fichiers ici ou cliquez pour sélectionner
          </span>
        </label>
        <input
          type="file"
          id="files"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border ${
              isDark ? 'border-space-700' : 'border-gray-200'
            }`}
          >
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-32 object-cover"
            />
            <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'bg-space-900/80' : 'bg-white/80'
            }`}>
              <span className={`text-sm font-medium px-4 truncate ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {file.name}
              </span>
            </div>
            {file.type === 'pdf' && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                PDF
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}