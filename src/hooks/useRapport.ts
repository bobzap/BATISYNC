import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveRapport, getRapport, getHeuresReference } from '../lib/supabase';
import { Rapport, emptyRapport, Projet } from '../types'; 

// Constantes pour la gestion des sauvegardes
const AUTOSAVE_INTERVAL = 30000; // 30 secondes
const SAVE_DELAY = 1000; // Délai de 1 seconde avant sauvegarde
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 secondes

export function useRapport(projectId: string, date: string, selectedProject: Projet | null) {
  // États
  const [rapport, setRapport] = useState<Rapport>({
    ...emptyRapport,
    nomChantier: selectedProject?.nom || '',
    date
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heuresLoaded, setHeuresLoaded] = useState(false);
  const [heuresReference, setHeuresReference] = useState<number | null>(null);

  // Refs
  const saveLockRef = useRef<boolean>(false);
  const saveQueueRef = useRef<Rapport[]>([]);
  const lastSavedDataRef = useRef<string>('');
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const retryCount = useRef(0);

  const navigate = useNavigate();

  const save = useCallback(async (rapportData: Rapport) => {
    try {
      // Vérifier si une sauvegarde est déjà en cours
      if (saveLockRef.current) {
        saveQueueRef.current.push(rapportData);
        return;
      }

      // Acquérir le verrou
      saveLockRef.current = true;
      setSaving(true);
      setError(null);

      // Vérifier si les données ont changé
      const currentData = JSON.stringify(rapportData);
      if (currentData === lastSavedDataRef.current) {
        console.log('Aucun changement détecté, sauvegarde ignorée');
        saveLockRef.current = false;
        setSaving(false);
        return;
      }

      // Nettoyer les données avant la sauvegarde
      const cleanedRapport = {
        ...rapportData,
        personnel: rapportData.personnel.map(p => ({
          ...p,
          heuresPresence: p.heuresPresence || heuresReference || 7.5
        })),
        photos: rapportData.photos.map(photo => ({
          id: photo.id,
          name: photo.name,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          type: photo.type,
          size: photo.size
        }))
      };

      // Validation de base
      if (!projectId) {
        throw new Error('ID du projet manquant');
      }

      // Sauvegarder le rapport
      const savedRapport = await saveRapport(projectId, cleanedRapport);
      
      // Mettre à jour les références
      lastSavedRef.current = JSON.stringify(rapportData);
      lastSavedDataRef.current = currentData;
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      
      if (!savedRapport) {
        throw new Error('Erreur lors de la sauvegarde du rapport');
      }

      setRapport(prev => ({
        ...prev,
        id: savedRapport.id
      }));

      // Réinitialiser le compteur de tentatives après une sauvegarde réussie
      retryCount.current = 0;

      // Traiter la file d'attente
      if (saveQueueRef.current.length > 0) {
        const nextRapport = saveQueueRef.current.shift();
        if (nextRapport) {
          save(nextRapport);
        }
      }

      return savedRapport;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(message);
        
      if (retryCount.current < MAX_RETRIES) {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          retryCount.current += 1;
          save(rapportData).catch(console.error);
        }, RETRY_DELAY);
      }

      throw err;
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  }, [projectId, heuresReference]);

  // Fonction pour vérifier si une sauvegarde est nécessaire
  const shouldSave = useCallback((newRapport: Rapport) => {
    const rapportJson = JSON.stringify(newRapport);
    return rapportJson !== lastSavedRef.current;
  }, []);

  // Wrapper pour setRapport qui déclenche la sauvegarde différée
  const updateRapport = useCallback((newRapport: Rapport | ((prev: Rapport) => Rapport)) => {
    setRapport(prev => {
      const nextRapport = typeof newRapport === 'function' ? newRapport(prev) : newRapport;
      
      // Vérifier si le rapport a changé
      if (shouldSave(nextRapport)) {
        setHasUnsavedChanges(true);
        
        // Annuler le timeout précédent
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Créer un nouveau timeout pour la sauvegarde
        saveTimeoutRef.current = setTimeout(() => {
          save(nextRapport).catch(console.error);
        }, SAVE_DELAY);
      }
      
      return nextRapport;
    });
  }, [shouldSave, save]);

  // Charger le rapport
  useEffect(() => {
    async function loadRapport() {
      if (!projectId || !date) return;

      try {
        setLoading(true);
        setError(null);
        
        // Charger les heures de référence
        const heuresResult = await getHeuresReference(projectId, date);
        setHeuresReference(heuresResult);
        setHeuresLoaded(true);
        
        const data = await getRapport(projectId, date);
        
        // Si aucun rapport n'existe, initialiser avec les valeurs par défaut
        if (!data) {
          setRapport({
            ...emptyRapport,
            nomChantier: selectedProject?.nom || '',
            date,
            heuresReference: heuresResult
          });
          return;
        }
        
        // Si un rapport existe, le charger avec toutes ses données
        setRapport({
          ...emptyRapport,
          id: data.id,
          nomChantier: data.nom_chantier || selectedProject?.nom || '',
          date: data.date,
          meteo: data.meteo || emptyRapport.meteo,
          evenementsParticuliers: data.evenements_particuliers || emptyRapport.evenementsParticuliers,
          personnel: data.personnel || [],
          taches: data.taches || [],
          machines: data.machines || [],
          bonsApport: data.bons_apport || [],
          bonsEvacuation: data.bons_evacuation || [],
          bonsBeton: data.bons_beton || [],
          bonsMateriaux: data.bons_materiaux || [],
          tiers: data.tiers || [],
          remarques: data.remarques || '',
          photos: (data.photos || []).map(photo => ({
            id: photo.id || crypto.randomUUID(),
            name: photo.name,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl,
            type: photo.type,
            size: photo.size
          })),
          remarquesContremaitre: data.remarques_contremaitre || '',
          visaContremaitre: data.visa_contremaitre || false,
          heuresReference: heuresResult
        });
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du rapport');
        
        // En cas d'erreur, initialiser avec les valeurs par défaut
        setRapport({
          ...emptyRapport,
          nomChantier: selectedProject?.nom || '',
          date,
          heuresReference: heuresResult
        });
      } finally {
        setLoading(false);
      }
    }
    loadRapport();
  }, [projectId, date, selectedProject]);

  // Auto-save
  useEffect(() => {
    if (!rapport) return;

    const autoSaveTimer = setInterval(() => {
      if (shouldSave(rapport)) {
        save(rapport).catch(console.error);
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      clearInterval(autoSaveTimer);
      saveQueueRef.current = [];
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [rapport, save, shouldSave]);

  // Avertissement avant de quitter si modifications non sauvegardées
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Sauvegarder avant la navigation
  useEffect(() => {
    const handleBeforeNavigate = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?'
        );
        if (!confirmLeave) {
          return false;
        }
        save(rapport).catch(console.error);
      }
    };

    window.addEventListener('popstate', handleBeforeNavigate);
    return () => window.removeEventListener('popstate', handleBeforeNavigate);
  }, [hasUnsavedChanges, rapport, save]);

  return {
    rapport,
    setRapport: updateRapport,
    loading,
    saving,
    hasUnsavedChanges,
    error,
    save,
    heuresReference,
    heuresLoaded
  };
}