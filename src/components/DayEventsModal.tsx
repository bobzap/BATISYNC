import React from 'react';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale'; 
import type { SiteEvent } from '../types';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: SiteEvent[];
  onEditEvent?: ((event: SiteEvent) => void) | undefined;
}

export function DayEventsModal({ isOpen, onClose, date, events, onEditEvent }: DayEventsModalProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const getEventTypeStyles = (type: SiteEvent['type']) => {
    switch (type) {
      case 'livraison':
        return isDark
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-blue-100 text-blue-800';
      case 'intervention':
        return isDark
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-purple-100 text-purple-800';
      default:
        return isDark
          ? 'bg-gray-500/20 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityStyles = (priority: SiteEvent['priority']) => {
    switch (priority) {
      case 'high':
        return isDark
          ? 'bg-red-500/20 text-red-300'
          : 'bg-red-100 text-red-800';
      case 'medium':
        return isDark
          ? 'bg-yellow-500/20 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      default:
        return isDark
          ? 'bg-green-500/20 text-green-300'
          : 'bg-green-100 text-green-800';
    }
  };

  const formatEventTime = (dateStr: string | Date): string => {
    try {
      const eventDate = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return isValid(eventDate) ? format(eventDate, 'HH:mm') : '';
    } catch {
      return '';
    }
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
        <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${
          isDark ? 'bg-space-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <Calendar className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <h3 className={`text-lg font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
            </div>
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
          <div className="p-4">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEditEvent && onEditEvent(event)}
                    className={`p-4 rounded-lg border ${onEditEvent ? 'cursor-pointer' : ''} ${
                      isDark ? 'bg-space-900 border-space-700' : 'bg-white border-gray-200'
                    } hover:bg-opacity-80 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getEventTypeStyles(event.type)
                          }`}>
                            {event.type === 'livraison' ? 'Livraison'
                              : event.type === 'intervention' ? 'Intervention'
                              : 'Autre'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getPriorityStyles(event.priority)
                          }`}>
                            {event.priority === 'high' ? 'Priorité haute'
                              : event.priority === 'medium' ? 'Priorité moyenne'
                              : 'Priorité basse'}
                          </span>
                        </div>
                        <h4 className={`text-lg font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </h4>
                        <p className={`mt-1 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {event.description}
                        </p>
                        {event.start_time && (
                          <div className={`mt-2 flex items-center gap-1 text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{event.start_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Aucun événement prévu pour cette date
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}