import React, { useState, useEffect } from 'react';
import { Calendar, ClipboardList, FileText, Calculator, BarChart3, Plus, Filter } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { EventModal } from '../components/EventModal';
import { DayEventsModal } from '../components/DayEventsModal';
import { ContractModal } from '../components/contracts/ContractModal';
import { VouchersPage } from './VouchersPage';
import { InvoicesPage } from './InvoicesPage';
import { ContractDocumentViewer } from '../components/contracts/ContractDocumentViewer';
import { FileViewerModal } from '../components/FileViewerModal';
import { Calendar as CalendarComponent } from '../components/Calendar';
import { getEventsByProject, saveEvent, deleteEvent, getContractsByProject, saveContract, deleteContract } from '../lib/supabase';
import type { SiteEvent, Contract } from '../types';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';
import { Notification } from '../components/Notification';
import { ContractDetailView } from '../components/contracts/ContractDetailView';

interface SiteMonitoringPageProps {
  projectId: string;
}

export function SiteMonitoringPage({ projectId }: SiteMonitoringPageProps) {
  const { isDark } = useTheme();
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState('planning');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<SiteEvent> | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);
  
  // Charger les contrats au chargement de la page
  useEffect(() => {
    async function loadContracts() {
      try {
        setLoading(true);
        const data = await getContractsByProject(projectId);
        setContracts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des contrats');
        setNotification({
          type: 'error',
          message: 'Erreur lors du chargement des contrats'
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId && activeTab === 'contracts') {
      loadContracts();
    }
  }, [projectId, activeTab]);

  // Récupérer les événements via le hook
  const { 
    events, 
    loading: eventsLoading, 
    notification,
    setNotification,
    addEvent, 
    removeEvent,
    setEvents 
  } = useEvents(projectId);

  // Filtrer les événements passés
  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() < today.getTime();
  });

  // Filtrer les événements à venir (aujourd'hui et demain seulement)
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    return isSameDay(eventDate, today) || isSameDay(eventDate, tomorrow);
  });


const handleSaveEvent = async (eventData: Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt' | 'notified'>) => {
  try {
    setLoading(true);
    // Utiliser la fonction du hook plutôt que d'appeler directement saveEvent
    if (selectedEvent?.id) {
      await addEvent({ ...eventData, id: selectedEvent.id });
    } else {
      await addEvent(eventData);
    }
    setIsEventModalOpen(false);
    setNotification({
      type: 'success',
      message: selectedEvent?.id ? 'Événement mis à jour avec succès' : 'Événement créé avec succès'
    });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    setNotification({
      type: 'error',
      message: 'Erreur lors de la sauvegarde de l\'événement'
    });
  } finally {
    setLoading(false);
  }
};

  const handleDeleteEvent = async (eventId: string) => {
    setNotification({
      type: 'warning',
      message: 'Voulez-vous vraiment supprimer cet événement ?',
      showConfirm: true,
      onConfirm: async () => {
        try {
          await removeEvent(eventId);
          setNotification({
            type: 'success',
            message: 'L\'événement a été supprimé avec succès'
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
          setNotification({
            type: 'error',
            message: 'Une erreur est survenue lors de la suppression'
          });
        }
      }
    });
  };

  const handleSaveContract = async (contractData: Omit<Contract, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const savedContract = await saveContract(projectId, contractData);
      
      if (selectedContract) {
        // Mise à jour d'un contrat existant
        setContracts(prev => prev.map(c => 
          c.id === selectedContract.id ? savedContract : c
        ));
        setNotification({
          type: 'success',
          message: 'Contrat mis à jour avec succès'
        });
        
        // Si c'était le contrat actif, mettre à jour
        if (activeContract?.id === selectedContract.id) {
          setActiveContract(savedContract);
        }
      } else {
        // Ajout d'un nouveau contrat
        setContracts(prev => [...prev, savedContract]);
        setNotification({
          type: 'success',
          message: 'Contrat créé avec succès'
        });
      }
      
      // Fermer le modal
      setIsContractModalOpen(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du contrat');
      setNotification({
        type: 'error',
        message: 'Erreur lors de la sauvegarde du contrat'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    setNotification({
      type: 'warning',
      message: 'Êtes-vous sûr de vouloir supprimer ce contrat ?',
      showConfirm: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteContract(contractId);
          
          // Mettre à jour l'état local
          setContracts(prev => prev.filter(c => c.id !== contractId));
          
          // Si c'était le contrat actif, le désélectionner
          if (activeContract?.id === contractId) {
            setActiveContract(null);
          }
          
          setNotification({
            type: 'success',
            message: 'Contrat supprimé avec succès'
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du contrat');
          setNotification({
            type: 'error',
            message: 'Erreur lors de la suppression du contrat'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const tabs = [
    { id: 'planning', label: 'Planning (PLI)', icon: Calendar, permission: 'viewPlanning' },
    { id: 'contracts', label: 'Contrats', icon: FileText, permission: 'viewContracts' },
    { id: 'vouchers', label: 'Suivi des bons', icon: ClipboardList, permission: 'viewVouchers', component: VouchersPage },
    { id: 'invoices', label: 'Suivi des factures', icon: Calculator, permission: 'viewInvoices' },
    { id: 'costs', label: 'Prix de revient', icon: BarChart3, permission: 'viewCosts' },
  ];

  // Filter tabs based on user permissions
  const availableTabs = tabs.filter(tab => permissions[tab.permission as keyof typeof permissions]);

  // If the current tab is not available, set it to the first available tab
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const renderPlanningContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <PermissionGuard requiredPermission="editPlanning">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </button>
            </PermissionGuard>
            
            <div className={`inline-flex rounded-lg overflow-hidden border ${
              isDark ? 'border-space-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'month'
                    ? isDark
                      ? 'bg-space-700 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-300 hover:bg-space-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'week'
                    ? isDark
                      ? 'bg-space-700 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-300 hover:bg-space-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semaine
              </button>
            </div>
          </div>
          
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDark
                ? 'bg-space-700 hover:bg-space-600 text-gray-200'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
        </div>

        {error && (
          <div className={`p-4 mb-4 rounded-lg ${
            isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}

        {loading && (
          <div className={`text-center py-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Chargement...
          </div>
        )}

        <CalendarComponent
          date={selectedDate}
          events={events}
          viewMode={viewMode}
          onDateClick={(date) => {            
            setSelectedDate(date);
            setIsDayEventsModalOpen(true);
          }}
          onAddEvent={(date) => {
            setSelectedEvent({
              date: format(date, 'yyyy-MM-dd'),
              type: 'livraison',
              priority: 'medium',
              status: 'pending'
            });
            setIsEventModalOpen(true);
          }}
          projectId={projectId}
        />

        {/* Section des événements à venir */}
        <div className="space-y-4 mb-8">
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Événements à venir
          </h3>
          
          <div className="space-y-2 mb-8">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setSelectedDate(new Date(event.date));
                  setIsEventModalOpen(true);
                }}
                className={`p-4 rounded-lg border hover:scale-[1.01] ${
                  isDark ? 'bg-space-800 border-space-700' : 'bg-white border-gray-200'
                } cursor-pointer hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.type === 'livraison' ? 'event-text-livraison'
                          : event.type === 'intervention'
                            ? isDark
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-purple-100 text-purple-800'
                            : isDark
                              ? 'bg-gray-500/20 text-gray-300'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type === 'livraison' ? 'Livr.'
                          : event.type === 'intervention' ? 'Inter.'
                          : 'Autre'} 
                      </span>
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {format(new Date(event.date), 'EEEE d MMMM', { locale: fr })}
                      </span>
                    </div>
                    <h4 className={`text-lg font-medium mt-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {event.title}
                    </h4>
                    <p className={`mt-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {event.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.type === 'livraison' ? 'event-text-livraison'
                      : event.type === 'intervention' ? 'event-text-intervention'
                      : 'event-text-autre'
                  }`}>
                    {event.priority === 'high' ? 'Priorité haute'
                      : event.priority === 'medium' ? 'Priorité moyenne'
                      : 'Priorité basse'}
                  </span>
                </div>
                <PermissionGuard requiredPermission="editPlanning">
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        isDark
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Supprimer
                    </button>
                  </div>
                </PermissionGuard>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className={`text-center py-4 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Aucun événement à venir
              </div>
            )}
          </div>
        </div>

        {/* Événements passés */}
        <div className="space-y-4">
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Événements passés
          </h3>
          
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setSelectedDate(new Date(event.date));
                  setIsEventModalOpen(true);
                }}
                className={`p-4 rounded-lg border opacity-75 ${
                  event.type === 'livraison' ? 'event-livraison'
                    : event.type === 'intervention' ? 'event-intervention'
                    : 'event-autre'
                } cursor-pointer hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.type === 'livraison' ? 'event-text-livraison'
                          : event.type === 'intervention' ? 'event-text-intervention'
                          : 'event-text-autre'
                      }`}>
                        {event.type === 'livraison' ? 'Livr.'
                          : event.type === 'intervention' ? 'Inter.'
                          : 'Autre'}
                      </span>
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {format(new Date(event.date), 'EEEE d MMMM', { locale: fr })}
                      </span>
                    </div>
                    <h4 className={`text-lg font-medium mt-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {event.title}
                    </h4>
                    <p className={`mt-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {pastEvents.length === 0 && (
              <div className={`text-center py-4 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Aucun événement passé
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <h1 className={`text-3xl font-bold mb-4 ${
          isDark ? 'text-galaxy-100' : 'text-blue-900'
        }`}>
          Suivi de chantier
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Gérez et suivez l'avancement de votre chantier, les livraisons, et les interventions.
        </p>
      </div>

      <div className={`border-b ${isDark ? 'border-space-700' : 'border-gray-200'}`}>
        <nav className="-mb-px flex space-x-8" aria-label="Sections">
          {availableTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? isDark
                      ? 'border-galaxy-500 text-galaxy-100'
                      : 'border-blue-500 text-blue-600'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`
                  mr-2 h-5 w-5
                  ${activeTab === tab.id
                    ? isDark
                      ? 'text-galaxy-400'
                      : 'text-blue-500'
                    : isDark
                      ? 'text-gray-400 group-hover:text-gray-300'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'planning' && (
          renderPlanningContent()
        )}
        {activeTab === 'contracts' && (<>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Contrats
              </h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Gérez vos contrats fournisseurs, sous-traitants et locations
              </p>
            </div>
            <PermissionGuard requiredPermission="editContracts">
              <button
                onClick={() => {
                  setSelectedContract(null);
                  setIsContractModalOpen(true);
                }}
                className="button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau contrat
              </button>
            </PermissionGuard>
          </div>
          
          <ContractDetailView
            contracts={contracts}
            activeContract={activeContract}
            setActiveContract={setActiveContract}
            onEdit={permissions.editContracts ? (contract) => {
                setSelectedContract(contract);
                setIsContractModalOpen(true);
              } : undefined}
            onDelete={permissions.editContracts ? handleDeleteContract : undefined}
            onViewDocument={setSelectedDocument}
            setNotification={setNotification}
          />
          
          {permissions.editContracts && (
            <ContractModal
              isOpen={isContractModalOpen}
              onClose={() => setIsContractModalOpen(false)}
              contract={selectedContract}
              onSave={handleSaveContract}
            />
          )}
        </>)}
        {activeTab === 'vouchers' && (
          <PermissionGuard requiredPermission="viewVouchers">
            <VouchersPage projectId={projectId} />
          </PermissionGuard>
        )}
        {activeTab === 'invoices' && (
          <PermissionGuard requiredPermission="viewInvoices">
            <InvoicesPage projectId={projectId} />
          </PermissionGuard>
        )}
        {activeTab === 'costs' && (
          <PermissionGuard requiredPermission="viewCosts">
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Le suivi des prix de revient sera implémenté ici
            </div>
          </PermissionGuard>
        )}
      </div>

      {permissions.editPlanning && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent || { date: format(selectedDate, 'yyyy-MM-dd') }}
          onSave={handleSaveEvent}
          projectId={projectId}
        />
      )}

      <DayEventsModal
        isOpen={isDayEventsModalOpen}
        onClose={() => setIsDayEventsModalOpen(false)}
        onEditEvent={permissions.editPlanning ? (event) => {
            setSelectedEvent(event);
            setIsEventModalOpen(true);
          } : undefined}
        date={selectedDate}
        events={events.filter(event => 
          format(new Date(event.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        )}
      />

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          showConfirm={notification.showConfirm}
          onConfirm={notification.onConfirm}
        />
      )}
      
      {/* Document Viewer */}
      <FileViewerModal
        file={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  );
}