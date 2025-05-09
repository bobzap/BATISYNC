import React from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, subWeeks, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface WeeklyTabsProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  rapports?: {
    date: string;
    visa_contremaitre: boolean;
  }[];
}

export function WeeklyTabs({ selectedDate, onDateChange, rapports = [] }: WeeklyTabsProps) {
  const { isDark } = useTheme();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const rapport = rapports.find(r => r.date === dateStr);
    const isSelected = isSameDay(selectedDate, date);
    
    return {
      date,
      dayName: format(date, 'EEEE', { locale: fr }),
      dayNumber: format(date, 'd'),
      month: format(date, 'MMMM', { locale: fr }),
      rapport,
      isSelected,
    };
  });

  return (
    <div className="mb-6">
      {/* En-tête avec navigation de semaine */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onDateChange(subWeeks(selectedDate, 1))}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-space-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className={`text-lg font-medium ${
          isDark ? 'text-gray-200' : 'text-gray-900'
        }`}>
          Semaine {format(selectedDate, 'w')}
        </h2>
        <button
          onClick={() => onDateChange(addWeeks(selectedDate, 1))}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-space-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="border-b border-gray-200 mt-4">
        <nav className="-mb-px flex space-x-4" aria-label="Jours de la semaine">
          {weekDays.map((day) => (
            <button
              key={format(day.date, 'yyyy-MM-dd')}
              onClick={() => onDateChange(day.date)}
              className={`
                flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${day.isSelected
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-gray-300'
                }
              `}
            >
              <div className="flex flex-col items-center">
                <span className={`capitalize ${
                  day.isSelected ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}>
                  {day.dayName}
                </span>
                <div className="mt-1">
                  <span className={`inline-flex items-center justify-center w-8 h-8 text-lg rounded-full ${
                    day.rapport?.visa_contremaitre
                      ? 'bg-green-500 text-white'
                      : day.rapport
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {day.dayNumber}
                  </span>
                </div>
                <span className={`text-xs mt-1 capitalize ${
                  day.isSelected ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {day.month}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </div>
  );
}