import React from 'react';
import { Upload, Maximize2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { createThumbnail } from '../../lib/imageUtils';

interface Photo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  type: 'image' | 'pdf';
  size: number;
}

interface PhotosSectionProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  onPhotoSelect: (photo: Photo) => void;
}

export function PhotosSection({ photos, onPhotosChange, onPhotoSelect }: PhotosSectionProps) {
  const { isDark } = useTheme();

  const handleFileUpload = async (files: FileList) => {
    const processedPhotos = await Promise.all(
      Array.from(files).map(async (file) => {
        const isPdf = file.type === 'application/pdf';
        const thumbnailUrl = isPdf 
          ? `data:image/svg+xml,${encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#EF4444"/><text x="7" y="8" text-anchor="middle" font-size="6" fill="#fff">PDF</text></svg>')}`
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

    onPhotosChange([...photos, ...processedPhotos]);
  };

  return (
    <div>
      <div 
        className={`p-8 border-2 border-dashed rounded-lg text-center transition-all ${
          isDark ? 'border-space-700' : 'border-gray-300'
        } hover:border-blue-500`}
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
          handleFileUpload(e.dataTransfer.files);
        }}
      >
        <Upload className={`w-6 h-6 mx-auto mb-2 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Déposez vos photos ici ou cliquez pour sélectionner
        </span>
        <input
          type="file"
          id="photos"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoSelect(photo)}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border ${
              isDark ? 'border-space-700' : 'border-gray-200'
            }`}
          >
            <img
              src={photo.thumbnailUrl}
              alt={photo.name}
              className="w-full h-32 object-cover"
            />
            <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'bg-space-900/80' : 'bg-white/80'
            }`}>
              <button className={`p-2 rounded-full ${
                isDark
                  ? 'bg-space-700 text-gray-200 hover:bg-space-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}>
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}