import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { saveEvent } from '../lib/supabase';
import { format } from 'date-fns';
import type { SiteEvent } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Partial<SiteEvent> | null;
  onSave: (event: Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt' | 'notified'>) => void;
  projectId: string;
}

export function EventModal({ isOpen, onClose, event, onSave, projectId }: EventModalProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt' | 'notified'>>(() => ({
    type: event?.type || 'livraison',
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || format(new Date(), 'yyyy-MM-dd'),
    start_time: event?.start_time || null,
    end_time: event?.end_time || null,
    status: event?.status || 'pending',
    priority: event?.priority || 'medium'
  }));

  // Update form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type || 'livraison',
        title: event.title || '',
        description: event.description || '',
        date: event.date || format(new Date(), 'yyyy-MM-dd'),
        start_time: event.start_time || null,
        end_time: event.end_time || null,
        status: event.status || 'pending',
        priority: event.priority || 'medium'
      });
    }
  }, [event]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data with null for empty time fields
      const eventData = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null
      };
      
      onSave(eventData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

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
        <div className={`relative w-full max-w-lg rounded-lg shadow-xl ${
          isDark ? 'bg-space-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {event?.id ? 'Modifier l\'événement' : 'Nouvel événement'}
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
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type d'événement
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as SiteEvent['type'] }))}
                className="form-select w-full"
              >
                <option value="livraison">Livraison</option>
                <option value="intervention">Intervention</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="form-input w-full"
                placeholder="Titre de l'événement"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input w-full min-h-[100px]"
                placeholder="Description détaillée"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, date: e.target.value }));
                    }}
                    className="form-input w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Heure (optionnelle)
                </label>
                <div className="relative">
                  <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      start_time: e.target.value || null 
                    }))}
                    className="form-input w-full pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Priorité
                </label>
                <div className="relative">
                  <AlertTriangle className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as SiteEvent['priority'] }))}
                    className="form-select w-full pl-10"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-2 p-4 border-t ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className="button-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="button-primary"
              disabled={loading}
            >
              {loading ? 'Chargement...' : event?.id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}