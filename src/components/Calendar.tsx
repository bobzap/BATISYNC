import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, eachWeekOfInterval, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { SiteEvent, Projet } from '../types';

interface CalendarProps {
  date: Date;
  events: SiteEvent[];
  viewMode: 'month' | 'week';
  onDateClick: (date: Date) => void;
  projectId: string;
  onAddEvent?: (date: Date) => void;
}

interface EventCount {
  livraison: number;
  intervention: number;
  autre: number;
}

export function Calendar({ date, events, viewMode, onDateClick, projectId, onAddEvent }: CalendarProps) {
  const { isDark } = useTheme();
  const today = new Date();

  const getEventCountForDate = (date: Date): EventCount => {
    const dayEvents = events.filter(event => 
      format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    return {
      livraison: dayEvents.filter(e => e.type === 'livraison').length,
      intervention: dayEvents.filter(e => e.type === 'intervention').length,
      autre: dayEvents.filter(e => e.type === 'autre').length,
    };
  };

  const renderEventIndicators = (count: EventCount) => {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {count.livraison > 0 && (
          <div className={`flex items-center ${
            isDark ? 'text-amber-300' : 'text-amber-600'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current" />
            <span className="text-xs ml-1">{count.livraison}</span>
          </div>
        )}
        {count.intervention > 0 && (
          <div className={`flex items-center ${
            isDark ? 'text-purple-300' : 'text-purple-600'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current" />
            <span className="text-xs ml-1">{count.intervention}</span>
          </div>
        )}
        {count.autre > 0 && (
          <div className={`flex items-center ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current" />
            <span className="text-xs ml-1">{count.autre}</span>
          </div>
        )}
      </div>
    );
  };

  const getEventsForDate = (date: Date): SiteEvent[] => {
    return events.filter(event => 
      format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    );

    return (
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] gap-px">
        {/* En-têtes des jours */}
        <div className="p-2 text-center text-xs font-medium text-transparent">S</div>
        {['L', 'Ma', 'Me', 'J', 'V'].map((day) => (
          <div
            key={day}
            className={`p-2 text-center text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Jours du mois */}
        {weeks.map((week) => {
          const days = eachDayOfInterval({
            start: week,
            end: new Date(week.getTime() + 4 * 24 * 60 * 60 * 1000) // Jusqu'à vendredi
          });

          return (
            <React.Fragment key={format(week, 'w')}>
              {/* Numéro de semaine */}
              <div className={`p-2 text-center text-xs font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                S{format(week, 'w')}
              </div>
              
              {/* Jours */}
              {days.map((day) => {
                const isCurrentMonth = isSameMonth(day, monthDate);
                const isToday = isSameDay(day, today);
                const eventCount = getEventCountForDate(day);
                const hasEvents = eventCount.livraison + eventCount.intervention + eventCount.autre > 0;
                const isClickable = true;

                return (
                  <button
                    key={format(day, 'yyyy-MM-dd')}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        onAddEvent?.(day);
                      } else {
                        onDateClick(day);
                      }
                    }}
                    className={`min-h-[120px] p-2 transition-colors relative ${
                      isCurrentMonth
                        ? isDark
                          ? 'bg-space-800 hover:bg-space-700'
                          : 'bg-white hover:bg-gray-50'
                        : isDark
                          ? 'bg-space-900 text-gray-600'
                          : 'bg-gray-50 text-gray-400'
                    } ${
                      isToday
                        ? isDark
                          ? 'ring-2 ring-blue-500/50'
                          : 'ring-2 ring-blue-200'
                        : 'border border-gray-200'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-base ${
                        isCurrentMonth
                          ? isDark
                            ? 'text-gray-200'
                            : 'text-gray-900'
                          : isDark
                            ? 'text-gray-600'
                            : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {hasEvents && renderEventIndicators(eventCount)}
                    </div>
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000); // Jusqu'à vendredi
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Créer des tranches horaires pour la journée (8h-18h)
    const timeSlots = Array.from({ length: 11 }, (_, i) => 8 + i);

    return (
      <div className="grid grid-cols-5 gap-px">
        {/* En-têtes des jours */}
        {days.map((day) => (
          <div
            key={`header-${format(day, 'yyyy-MM-dd')}`}
            className={`p-2 text-center font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {format(day, 'EEE', { locale: fr })}
            <br />
            {format(day, 'd')}
          </div>
        ))}

        {/* Jours de la semaine avec événements */}
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDate(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  onAddEvent?.(day);
                } else {
                  onDateClick(day);
                }
              }}
              key={`day-${format(day, 'yyyy-MM-dd')}`}
              className={`min-h-[400px] p-2 transition-colors relative ${
                isDark
                  ? 'bg-space-800'
                  : 'bg-white'
              } ${
                isToday
                  ? isDark
                    ? 'ring-2 ring-blue-500/50'
                    : 'ring-2 ring-blue-200'
                  : 'border border-gray-200'
              } cursor-pointer`}
            >
              <div className="space-y-2 mt-3">
                {dayEvents.map((event, index) => (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(day);
                    }}
                    key={event.id}
                    className={`p-2 rounded-lg text-sm ${
                      event.type === 'livraison'
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-amber-50 text-amber-800'
                        : event.type === 'intervention'
                          ? isDark
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-purple-50 text-purple-800'
                          : isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{event.start_time || '—'}</span>
                      </div>
                      {event.priority === 'high' && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          isDark
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="font-medium truncate">{event.title}</div>
                  </div>
                ))}
                {!hasEvents && (
                  <div className={`text-xs text-center py-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Aucun événement
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return viewMode === 'month' ? (
    <div className="grid grid-cols-2 gap-8">
      <div className={`rounded-lg border ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className="p-4">
          <div className="text-center mb-4">
            <h2 className={`text-xl font-semibold capitalize ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {format(date, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          {renderMonth(date)}
        </div>
      </div>
      <div className={`rounded-lg border ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className="p-4">
          <div className="text-center mb-4">
            <h2 className={`text-xl font-semibold capitalize ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {format(addMonths(date, 1), 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          {renderMonth(addMonths(date, 1))}
        </div>
      </div>
    </div>
  ) : (
    <div className={`rounded-lg border ${
      isDark ? 'border-space-700' : 'border-gray-200'
    }`}>
      <div className="p-4">
        <div className="text-center mb-4">
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Semaine {format(date, 'w')}
          </h2>
        </div>
        {renderWeek()}
      </div>
    </div>
  );
}