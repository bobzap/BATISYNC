import { useState } from 'react';
import { Personnel } from '../types';

export function usePersonnel() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPersonnel = async (newPersonnel: Omit<Personnel, 'id'>) => {
    try {
      setPersonnel(prev => [...prev, newPersonnel as Personnel]);
      return newPersonnel;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  const updatePersonnel = async (id: string, updates: Partial<Personnel>) => {
    try {
      setPersonnel(prev => prev.map(p => p.nom === id ? { ...p, ...updates } : p));
      return updates;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  const deletePersonnel = async (id: string) => {
    try {
      setPersonnel(prev => prev.filter(p => p.nom !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  return {
    personnel,
    loading,
    error,
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
  };
}