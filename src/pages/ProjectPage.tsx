import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import type { Projet } from '../types';

interface ProjectPageProps {
  selectedProject: Projet | null;
}

export function ProjectPage({ selectedProject }: ProjectPageProps) {
  const { id } = useParams();
  const { isDark } = useTheme();

  if (!selectedProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className={`rounded-xl p-8 ${
          isDark 
            ? 'bg-space-800 border border-space-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <h1 className={`text-3xl font-bold mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Projet non trouvé
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Le projet que vous recherchez n'existe pas ou vous n'avez pas les permissions nécessaires.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête du projet */}
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {selectedProject.nom}
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              N° de chantier: {selectedProject.numeroChantier}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedProject.actif
              ? isDark
                ? 'bg-green-500/20 text-green-300'
                : 'bg-green-100 text-green-800'
              : isDark
                ? 'bg-gray-500/20 text-gray-300'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {selectedProject.actif ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-6">
          <div>
            <h3 className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Direction de chantier
            </h3>
            <p className={`mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {selectedProject.directionChantier || 'Non spécifié'}
            </p>
          </div>
          <div>
            <h3 className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Responsable CTX
            </h3>
            <p className={`mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {selectedProject.responsableCTX || 'Non spécifié'}
            </p>
          </div>
          <div>
            <h3 className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              CM / CE
            </h3>
            <p className={`mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {selectedProject.cmCe || 'Non spécifié'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu du projet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section Personnel */}
        <div className={`rounded-lg p-6 ${
          isDark 
            ? 'bg-space-800 border border-space-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <h2 className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Personnel
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Gérez le personnel affecté à ce projet.
          </p>
        </div>

        {/* Section Machines */}
        <div className={`rounded-lg p-6 ${
          isDark 
            ? 'bg-space-800 border border-space-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <h2 className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Machines et Matériel
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Gérez les machines et le matériel utilisés sur ce projet.
          </p>
        </div>
      </div>
    </div>
  );
}