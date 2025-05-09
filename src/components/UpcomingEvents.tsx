import React, { useState } from 'react';
import { Calendar, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';
import type { SiteEvent } from '../types';

interface UpcomingEventsProps {
  events: SiteEvent[];
  onEventClick?: (event: SiteEvent) => void;
}

export function UpcomingEvents({ events, onEventClick }: UpcomingEventsProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = React.useState(true);
  const [hoveredEvent, setHoveredEvent] = React.useState<string | null>(null);

  if (events.length === 0 || !isOpen) {
    return null;
  }

  // Grouper les événements par type
  const eventsByType = events.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = [];
    }
    acc[event.type].push(event);
    return acc;
  }, {} as Record<string, SiteEvent[]>);

  return (
    <div className={`fixed top-24 right-4 w-96 rounded-lg shadow-lg transform transition-all duration-300 ${
      isDark 
        ? 'bg-space-800 border border-space-700' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`flex items-center justify-between p-3 border-b ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          <h3 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
            Événements à venir
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-space-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto p-3">
        {Object.entries(eventsByType).map(([type, typeEvents]) => (
          <div
            key={type}
            className="relative group"
          >
            {/* Carte de pile */}
            <div className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 
              hover:scale-[1.02] hover:shadow-lg ${typeEvents.length > 1 ? 'pl-6' : ''} ${
              type === 'livraison' ? 'event-livraison'
                : type === 'intervention' ? 'event-intervention'
                : 'event-autre'
            }`}>
              {/* Indicateurs de pile pour plusieurs événements */}
              {typeEvents.length > 1 && (
                <>
                  <div className={`absolute left-1.5 top-1.5 w-full h-full rounded-lg -z-20 transform rotate-2 ${
                    type === 'livraison' ? 'event-livraison-pile'
                      : type === 'intervention' ? 'event-intervention-pile'
                      : 'event-autre-pile'
                  }`} />
                  <div className={`absolute left-3 top-3 w-full h-full rounded-lg -z-10 transform -rotate-2 ${
                    type === 'livraison' ? 'event-livraison-pile'
                      : type === 'intervention' ? 'event-intervention-pile'
                      : 'event-autre-pile'
                  }`} />
                </>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${
                  type === 'livraison' ? 'event-text-livraison'
                    : type === 'intervention' ? 'event-text-intervention'
                    : 'event-text-autre'
                }`}>
                  {type === 'livraison' ? 'Livr.'
                    : type === 'intervention' ? 'Inter.'
                    : 'Autre'}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {typeEvents.length}
                </span>
              </div>
              
              {/* Date (Aujourd'hui/Demain) */}
              <div className={`text-xs mb-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {(() => {
                  const today = new Date();
                  const eventDate = new Date(typeEvents[0].date);
                  today.setHours(0, 0, 0, 0);
                  eventDate.setHours(0, 0, 0, 0);
                  
                  return today.getTime() === eventDate.getTime()
                    ? "Aujourd'hui"
                    : "Demain";
                })()}
              </div>

              <div className={`text-sm font-medium truncate ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {typeEvents[0].title}
                {typeEvents.length > 1 && '...'}
              </div>
            </div>

            {/* Liste déroulante au survol */}
            <div className={`invisible group-hover:visible opacity-0 group-hover:opacity-100
              absolute left-0 mt-1 w-64 z-[60] transition-all duration-200 transform origin-top-left
              rounded-lg shadow-lg ${
              isDark ? 'bg-space-800 border border-space-700' : 'bg-white border border-gray-200'
            }`}>
              {typeEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    type === 'livraison' ? 'event-livraison'
                      : type === 'intervention' ? 'event-intervention'
                      : 'event-autre'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {format(new Date(event.date), 'HH:mm')}
                    </span>
                    {event.priority === 'high' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        Urgent
                      </span>
                    )}
                  </div>
                  <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {event.title}
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}