import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { getEventsByProject, saveEvent, deleteEvent, supabase } from '../lib/supabase';
import type { SiteEvent } from '../types';
import { useCallback } from 'react';
import React from 'react';

export function useEvents(projectId: string) {
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const channelId = `events:${projectId}`;

  // Charger les événements
  const loadEvents = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getEventsByProject(projectId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Configurer la souscription en temps réel
  useEffect(() => {
    if (!projectId) return;

    // Charger d'abord les événements initiaux
    loadEvents();

    // Configurer la souscription en temps réel
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (!payload) return;
          
          // Mettre à jour les événements localement selon le type de changement
          if (payload.eventType === 'INSERT') {
            setEvents(prev => {
              // Vérifier si l'événement n'existe pas déjà
              const exists = prev.some(e => e.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as SiteEvent];
            });
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => 
              e.id === payload.new.id ? payload.new as SiteEvent : e
            ));
          }
          
          // Afficher la notification appropriée
          const messages = {
            INSERT: 'Événement ajouté avec succès',
            UPDATE: 'Événement mis à jour avec succès',
            DELETE: 'Événement supprimé'
          };
          
          setNotification({
            type: payload.eventType === 'DELETE' ? 'info' : 'success',
            message: messages[payload.eventType as keyof typeof messages]
          });
        }
      )
      .subscribe();

    // Nettoyer la souscription
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, loadEvents]);

  // Ajouter un événement
  const addEvent = async (eventData: Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt' | 'notified'>) => {
    try {
      setLoading(true);
      setError(null);
      // Uniquement sauvegarder, la souscription realtime gérera la mise à jour de l'état
      await saveEvent(projectId, eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un événement
  const removeEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteEvent(eventId);
      // La mise à jour sera gérée par la souscription en temps réel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setNotification({
        type: 'error',
        message: 'Erreur lors de la suppression de l\'événement'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les événements pour une date donnée
  const getEventsForDate = (date: Date) => {
    return events.filter(event => event.date === format(date, 'yyyy-MM-dd'));
  };

  // Récupérer les événements pour aujourd'hui et demain
  const getUpcomingEvents = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    return events.filter(event => 
      event.date === format(today, 'yyyy-MM-dd') ||
      event.date === format(tomorrow, 'yyyy-MM-dd')
    );
  };

  return {
    events,
    setEvents,
    loading,
    error,
    addEvent,
    notification,
    setNotification,
    removeEvent,
    getEventsForDate,
    getUpcomingEvents
  };
}