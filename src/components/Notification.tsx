import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
  showConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function Notification({ 
  type, 
  message, 
  onClose, 
  duration = 3000,
  showConfirm = false,
  onConfirm,
  onCancel 
}: NotificationProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!showConfirm) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }

    return () => clearTimeout(timer);
  }, [duration, onClose, showConfirm]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return isDark
          ? 'bg-green-500/20 text-green-300 border-green-500/30'
          : 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return isDark
          ? 'bg-red-500/20 text-red-300 border-red-500/30'
          : 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return isDark
          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
          : 'bg-orange-50 text-orange-800 border-orange-200';
      case 'info':
        return isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col gap-2 px-4 py-3 rounded-lg border shadow-lg animate-slide-up ${getStyles()}`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="text-sm">{message}</p>
        {!showConfirm && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {showConfirm && (
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              onCancel?.();
              onClose();
            }}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              isDark
                ? 'hover:bg-space-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              type === 'error' || type === 'warning'
                ? isDark
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                : isDark
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Confirmer
          </button>
        </div>
      )}
    </div>
  );
}