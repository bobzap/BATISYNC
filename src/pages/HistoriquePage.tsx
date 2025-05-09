import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, eachWeekOfInterval, eachDayOfInterval, endOfMonth, addMonths, subMonths, isSameMonth, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Info, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useEvents } from '../hooks/useEvents';
import type { SiteEvent, Rapport } from '../types';
import { getRapportsByPeriod } from '../lib/supabase';

export interface HistoriquePageProps {
  projectId: string;
}

export function HistoriquePage({ projectId }: HistoriquePageProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Charger les rapports du mois
  useEffect(() => {
    async function loadRapports() {
      try {
        setLoading(true);
        const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
        const data = await getRapportsByPeriod(projectId, startDate, endDate);
        setRapports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    loadRapports();
  }, [selectedMonth, projectId]);

  const { events, loading: eventsLoading } = useEvents(projectId);

  const getStatutRapport = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const rapport = rapports.find(r => r.date === dateStr);
    if (rapport?.visa_contremaitre) return 'valide';
    if (rapport) return 'rempli';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today ? 'manquant' : 'futur';
  };

  const getMonthData = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const firstDay = new Date(monthStart);
    // Ajuster au premier lundi si le mois commence au milieu de la semaine
    firstDay.setDate(firstDay.getDate() - firstDay.getDay() + (firstDay.getDay() === 0 ? -6 : 1));
    
    const weeks = [];
    let currentDay = firstDay;
    
    while (currentDay <= monthEnd) {
      const week = [];
      // Ajouter les 5 jours de la semaine (lundi à vendredi)
      for (let i = 0; i < 5; i++) {
        week.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      // Passer au lundi suivant
      currentDay.setDate(currentDay.getDate() + 2);
      weeks.push(week);
    }
    
    return weeks;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const renderMonth = (date: Date) => {
    const weekDays = getMonthData(date);
    
    return (
      <div className="flex-1">
        <div className={`text-center py-2 mb-3 rounded-lg ${
          isDark 
            ? 'bg-space-800 text-galaxy-100' 
            : 'bg-white text-blue-900'
        }`}>
          <h2 className="text-lg capitalize">
            {format(date, 'MMMM yyyy', { locale: fr })}
          </h2>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* En-têtes des jours */}
          {[
            { key: 'lun', label: 'L' },
            { key: 'mar', label: 'M' },
            { key: 'mer', label: 'M' },
            { key: 'jeu', label: 'J' },
            { key: 'ven', label: 'V' }
          ].map((jour) => (
            <div
              key={jour.key}
              className={`text-center p-2 text-sm font-bold tracking-wider ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              {jour.label}
            </div>
          ))}
          
          {/* Jours du mois par semaine */}
          {weekDays.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date) => {
                  const statut = getStatutRapport(date);
                  const dayEvents = events.filter(event => event.date === format(date, 'yyyy-MM-dd'));
                  
                  return (
                    <button
                      key={format(date, 'yyyy-MM-dd')}
                      onClick={() => {
                        if (statut !== 'futur') {
                          const selectedDate = format(date, 'yyyy-MM-dd');
                          const searchParams = new URLSearchParams(window.location.search);
                          searchParams.set('date', selectedDate);
                          navigate(`/rapport?${searchParams.toString()}`);
                        }
                      }}
                      disabled={statut === 'futur'}
                      className={`
                        relative p-4 rounded-lg transition-all min-h-[100px] group hover:shadow-lg
                        border ${isDark ? 'border-space-700' : 'border-gray-200'}
                        ${statut === 'valide'
                          ? isDark
                            ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30'
                            : 'bg-green-50 hover:bg-green-100 border-green-200'
                          : statut === 'rempli'
                            ? isDark
                              ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30'
                              : 'bg-orange-50 hover:bg-orange-100 border-orange-200'
                            : statut === 'manquant'
                              ? isDark
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30'
                                : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
                              : isDark
                                ? 'bg-space-800 cursor-not-allowed'
                                : 'bg-gray-50 cursor-not-allowed'
                        } ${statut === 'futur' ? 'cursor-not-allowed' : ''}
                      `}
                    >
                      <div className={`text-2xl mb-2 ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {/* Afficher le numéro de semaine uniquement pour le lundi */}
                        {format(date, 'i') === '1' && (
                          <span className={`absolute top-1 left-1 text-xs font-medium ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            S{format(date, 'w')}
                          </span>
                        )}
                        {format(date, 'd')}
                        {dayEvents.length > 0 && (
                          <span className={`ml-2 text-sm font-medium ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ({dayEvents.length})
                          </span>
                        )}
                      </div>
                      
                      {/* Liste des événements */}
                      {dayEvents.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {/* Afficher uniquement les catégories */}
                          {Array.from(new Set(dayEvents.map(e => e.type))).map((type, i) => {
                            const count = dayEvents.filter(e => e.type === type).length;
                            return (
                            <div
                              key={i}
                              className={`relative group flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                                type === 'livraison'
                                  ? isDark
                                   ? 'bg-amber-500/20 text-amber-100'
                                   : 'bg-amber-50 text-amber-800'
                                  : isDark
                                    ? 'bg-purple-500/20 text-purple-100'
                                    : 'bg-purple-50 text-purple-800'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                type === 'livraison'
                                 ? isDark ? 'bg-amber-400' : 'bg-amber-500'
                                  : isDark ? 'bg-purple-400' : 'bg-purple-500'
                              }`} />
                              <span className="flex items-center gap-1">
                                {type === 'livraison' ? 'Liv' : 'Int'}
                                <span className="opacity-75">({count})</span>
                              </span>
                              
                              {/* Info-bulle au survol */}
                              <div className={`absolute left-full ml-2 z-10 w-64 p-3 rounded-lg shadow-lg 
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 ${
                                isDark
                                  ? 'bg-space-700 border border-space-600'
                                  : 'bg-white border border-gray-200'
                              }`}>
                                <div className={`mb-2 text-sm font-medium ${
                                  type === 'livraison'
                                    ? isDark
                                     ? 'text-amber-300'
                                     : 'text-amber-600'
                                    : isDark
                                      ? 'text-purple-300'
                                      : 'text-purple-600'
                                }`}>
                                  {type === 'livraison' ? 'Livraisons' : 'Interventions'}
                                </div>
                                <div className="space-y-2">
                                  {dayEvents
                                    .filter(e => e.type === type)
                                    .map((event, j) => (
                                      <div key={j} className={`p-2 rounded-md space-y-1 ${
                                        type === 'livraison'
                                          ? isDark
                                           ? 'bg-amber-500/20'
                                           : 'bg-amber-50'
                                          : isDark
                                            ? 'bg-purple-500/20'
                                            : 'bg-purple-50'
                                      }`}>
                                        <p className={`font-medium ${
                                          isDark ? 'text-gray-200' : 'text-gray-900'
                                        }`}>
                                          {event.title}
                                        </p>
                                        <p className={`text-xs ${
                                          isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                          {event.description}
                                        </p>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                      
                      {/* Indicateur de priorité */}
                      {dayEvents.some(e => e.priority === 'high') && (
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                          isDark ? 'bg-red-400' : 'bg-red-500'
                        } animate-pulse`} />
                      )}
                     </button>
                  );
                })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête avec navigation du mois */}
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-3xl font-bold ${
            isDark ? 'text-galaxy-100' : 'text-blue-900'
          }`}>
            Historique des rapports
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                </span>
              </button>
              {isDatePickerOpen && (
                <input
                  type="month"
                  value={format(selectedMonth, 'yyyy-MM')}
                  onChange={(e) => {
                    setSelectedMonth(new Date(e.target.value));
                    setIsDatePickerOpen(false);
                  }}
                  className="absolute top-full mt-2 w-full p-2 rounded-lg border shadow-lg"
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-space-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-space-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Consultez et modifiez les rapports journaliers.
        </p>
      </div>

      {/* Légende */}
      <div className={`rounded-lg p-4 mb-8 ${
        isDark 
          ? 'bg-space-800/50 border border-space-700' 
          : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isDark ? 'text-blue-400' : 'text-blue-500'
          }`} />
          <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Rapport visé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-600"></span>
              <span>Rapport à faire</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-400"></span>
              <span>Non disponible</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-amber-400' : 'bg-amber-500'}`}></span>
                <span>Livraison</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-violet-400' : 'bg-violet-500'}`}></span>
                <span>Intervention</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                <span>Autre</span>
              </div>
            </div>
            <div className="ml-auto">
              Semaine {format(startOfMonth(selectedMonth), 'w')}
            </div>
         </div>
        </div>
      </div>

      {/* Calendriers sur deux mois */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderMonth(selectedMonth)}
        {renderMonth(addMonths(selectedMonth, 1))}
      </div>
    </div>
  );
}