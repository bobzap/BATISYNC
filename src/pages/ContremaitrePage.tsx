import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  Users, 
  Truck, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Camera, 
  MessageSquare, 
  ShieldAlert, 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  Send,
  Upload
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Projet, Personnel, Rapport } from '../types';

interface ContremaitrePageProps {
  projectId: string;
  selectedProject: Projet | null;
}

export function ContremaitrePage({ projectId, selectedProject }: ContremaitrePageProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<Rapport[]>([]);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    personnel: true,
    materials: true,
    progress: true,
    communication: true,
    safety: true,
    forms: true
  });
  const [newMaterialRequest, setNewMaterialRequest] = useState({
    material: '',
    quantity: '',
    unit: '',
    urgency: 'normal',
    notes: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [safetyChecks, setSafetyChecks] = useState<{id: string, label: string, checked: boolean}[]>([
    { id: 'ppe', label: 'Équipements de protection individuelle', checked: false },
    { id: 'signage', label: 'Signalisation conforme', checked: false },
    { id: 'equipment', label: 'Équipements vérifiés', checked: false },
    { id: 'area', label: 'Zone de travail sécurisée', checked: false },
    { id: 'briefing', label: 'Briefing sécurité effectué', checked: false }
  ]);
  const [incident, setIncident] = useState({
    description: '',
    severity: 'low',
    location: '',
    actions: ''
  });
  const [technicalNotes, setTechnicalNotes] = useState<{id: string, title: string, content: string, date: string}[]>([
    { 
      id: '1', 
      title: 'Instructions de montage', 
      content: 'Procédure détaillée pour le montage des structures préfabriquées.',
      date: '2025-05-01'
    },
    { 
      id: '2', 
      title: 'Spécifications béton', 
      content: 'Caractéristiques techniques du béton à utiliser pour les fondations.',
      date: '2025-05-02'
    }
  ]);
  
  // Récupérer les données du personnel
  useEffect(() => {
    async function loadPersonnel() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('project_personnel')
          .select(`
            id,
            personnel_id,
            nom,
            prenom,
            intitule_fonction,
            entreprise,
            equipe,
            zone,
            statut,
            personnel:personnel_id (
              id,
              nom,
              prenom,
              intitule_fonction,
              entreprise,
              code_departement,
              statut
            )
          `)
          .eq('project_id', projectId)
          .eq('statut', 'actif');
          
        if (error) throw error;
        
        // Transformer les données en format Personnel
        const personnelData = data.map(item => {
          if (item.personnel) {
            return {
              nom: `${item.personnel.nom} ${item.personnel.prenom || ''}`.trim(),
              role: item.personnel.intitule_fonction,
              matricule: item.personnel.id,
              entreprise: item.personnel.entreprise,
              equipe: item.equipe || '',
              zone: item.zone || '',
              heuresPresence: 7.5 // Valeur par défaut
            };
          } else {
            return {
              nom: `${item.nom || ''} ${item.prenom || ''}`.trim(),
              role: item.intitule_fonction || '',
              matricule: item.id,
              entreprise: item.entreprise || '',
              equipe: item.equipe || '',
              zone: item.zone || '',
              heuresPresence: 7.5 // Valeur par défaut
            };
          }
        });
        
        setPersonnel(personnelData);
      } catch (err) {
        console.error('Erreur lors du chargement du personnel:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    
    loadPersonnel();
  }, [projectId]);
  
  // Récupérer les rapports de la semaine
  useEffect(() => {
    async function loadWeeklyReports() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const today = new Date();
        const startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('project_id', projectId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });
          
        if (error) throw error;
        
        setWeeklyReports(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des rapports:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadWeeklyReports();
  }, [projectId]);
  
  // Simuler des demandes de matériaux
  useEffect(() => {
    setMaterialRequests([
      {
        id: '1',
        material: 'Ciment CEM II',
        quantity: '20',
        unit: 'sacs',
        date: '2025-05-01',
        status: 'delivered',
        urgency: 'normal'
      },
      {
        id: '2',
        material: 'Treillis soudé',
        quantity: '15',
        unit: 'unités',
        date: '2025-05-02',
        status: 'pending',
        urgency: 'high'
      },
      {
        id: '3',
        material: 'Sable 0/4',
        quantity: '5',
        unit: 'm³',
        date: '2025-05-03',
        status: 'ordered',
        urgency: 'normal'
      }
    ]);
  }, []);
  
  // Simuler des photos
  useEffect(() => {
    setPhotos([
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
        description: 'Fondations terminées',
        location: 'Zone A',
        date: '2025-05-01'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2071&auto=format&fit=crop',
        description: 'Installation des coffrages',
        location: 'Zone B',
        date: '2025-05-02'
      }
    ]);
  }, []);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleAddMaterialRequest = () => {
    if (!newMaterialRequest.material || !newMaterialRequest.quantity || !newMaterialRequest.unit) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const newRequest = {
      id: crypto.randomUUID(),
      material: newMaterialRequest.material,
      quantity: newMaterialRequest.quantity,
      unit: newMaterialRequest.unit,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      urgency: newMaterialRequest.urgency
    };
    
    setMaterialRequests(prev => [newRequest, ...prev]);
    setNewMaterialRequest({
      material: '',
      quantity: '',
      unit: '',
      urgency: 'normal',
      notes: ''
    });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPhoto(e.target.files[0]);
    }
  };
  
  const handleAddPhoto = () => {
    if (!selectedPhoto || !photoDescription) {
      setError('Veuillez sélectionner une photo et ajouter une description');
      return;
    }
    
    // Dans une application réelle, vous téléchargeriez la photo vers Supabase Storage
    // Pour cette démo, nous simulons l'ajout avec une URL statique
    const newPhoto = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(selectedPhoto),
      description: photoDescription,
      location: photoLocation,
      date: format(new Date(), 'yyyy-MM-dd')
    };
    
    setPhotos(prev => [newPhoto, ...prev]);
    setSelectedPhoto(null);
    setPhotoDescription('');
    setPhotoLocation('');
  };
  
  const handleSafetyCheckChange = (id: string, checked: boolean) => {
    setSafetyChecks(prev => 
      prev.map(check => 
        check.id === id ? { ...check, checked } : check
      )
    );
  };
  
  const handleAddIncident = () => {
    if (!incident.description || !incident.location) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Dans une application réelle, vous enregistreriez l'incident dans la base de données
    // Pour cette démo, nous affichons simplement un message de succès
    alert('Incident signalé avec succès');
    setIncident({
      description: '',
      severity: 'low',
      location: '',
      actions: ''
    });
  };
  
  const renderWeeklyAttendance = () => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startOfWeekDate, end: endOfWeekDate });
    
    // Limiter aux jours de la semaine (lundi à vendredi)
    const weekdays = days.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    });
    
    // Simuler des données de présence
    const attendanceData = [
      { type: 'Présent', counts: [12, 14, 13, 15, 11] },
      { type: 'Absent', counts: [1, 0, 2, 0, 1] },
      { type: 'Congé', counts: [2, 1, 0, 0, 3] },
      { type: 'Maladie', counts: [0, 0, 0, 0, 0] }
    ];
    
    return (
      <div className={`rounded-lg border ${
        isDark ? 'border-space-700' : 'border-gray-200'
      }`}>
        <div className={`p-4 border-b ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <h3 className={`font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            Présence hebdomadaire
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className={`min-w-full divide-y ${
            isDark ? 'divide-space-700' : 'divide-gray-200'
          }`}>
            <thead>
              <tr>
                <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Type
                </th>
                {weekdays.map((day, index) => (
                  <th key={index} className={`px-3 py-2 text-center text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {format(day, 'EEE dd', { locale: fr })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-space-700' : 'divide-gray-200'
            }`}>
              {attendanceData.map((row, rowIndex) => (
                <tr key={rowIndex} className={
                  isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                }>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {row.type}
                  </td>
                  {row.counts.map((count, colIndex) => (
                    <td key={colIndex} className={`px-3 py-2 whitespace-nowrap text-sm text-center ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {count}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={`font-medium ${
                isDark ? 'bg-space-700 text-gray-200' : 'bg-gray-50 text-gray-900'
              }`}>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  Total
                </td>
                {[0, 1, 2, 3, 4].map(colIndex => (
                  <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-center">
                    {attendanceData.reduce((sum, row) => sum + row.counts[colIndex], 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 flex justify-end">
            <button className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}>
              <Plus className="w-4 h-4" />
              Ajouter une entrée
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Vue d'ensemble */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('overview')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Vue d'ensemble
            </h3>
            {expandedSections.overview ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.overview && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Personnel présent
                      </p>
                      <p className={`text-2xl font-semibold ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {personnel.length}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <Users className={`w-6 h-6 ${
                        isDark ? 'text-blue-300' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Rapports à valider
                      </p>
                      <p className={`text-2xl font-semibold ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {weeklyReports.filter(r => !r.visa_contremaitre).length}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                    }`}>
                      <ClipboardList className={`w-6 h-6 ${
                        isDark ? 'text-amber-300' : 'text-amber-600'
                      }`} />
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-space-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Commandes en attente
                      </p>
                      <p className={`text-2xl font-semibold ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {materialRequests.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      isDark ? 'bg-green-500/20' : 'bg-green-100'
                    }`}>
                      <Truck className={`w-6 h-6 ${
                        isDark ? 'text-green-300' : 'text-green-600'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Rapports de la semaine
                </h4>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {eachDayOfInterval({
                    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
                    end: endOfWeek(new Date(), { weekStartsOn: 1 })
                  })
                  .filter(date => date.getDay() >= 1 && date.getDay() <= 5) // Lundi à vendredi
                  .map((date, index) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const report = weeklyReports.find(r => r.date === dateStr);
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => navigate(`/rapport?date=${dateStr}`)}
                        className={`flex-shrink-0 w-32 p-3 rounded-lg cursor-pointer transition-all ${
                          isToday
                            ? isDark
                              ? 'bg-blue-500/20 border border-blue-500/30'
                              : 'bg-blue-50 border border-blue-200'
                            : isDark
                              ? 'bg-space-700 border border-space-600 hover:bg-space-600'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <p className={`text-xs mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {format(date, 'EEEE', { locale: fr })}
                        </p>
                        <p className={`text-lg font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {format(date, 'd MMM', { locale: fr })}
                        </p>
                        <div className="mt-2 flex items-center">
                          {report ? (
                            report.visa_contremaitre ? (
                              <div className={`flex items-center gap-1 text-xs ${
                                isDark ? 'text-green-300' : 'text-green-600'
                              }`}>
                                <CheckCircle className="w-3 h-3" />
                                <span>Validé</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1 text-xs ${
                                isDark ? 'text-amber-300' : 'text-amber-600'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>À valider</span>
                              </div>
                            )
                          ) : (
                            <div className={`flex items-center gap-1 text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>À créer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Gestion des équipes */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('personnel')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Gestion des équipes
            </h3>
            {expandedSections.personnel ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.personnel && (
            <div className="p-4">
              {renderWeeklyAttendance()}
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Personnel actif sur le chantier
                </h4>
                <div className={`rounded-lg border ${
                  isDark ? 'border-space-700' : 'border-gray-200'
                }`}>
                  <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${
                    isDark ? 'bg-space-700 text-gray-300' : 'bg-gray-50 text-gray-700'
                  } text-sm font-medium`}>
                    <div className="col-span-3">Nom</div>
                    <div className="col-span-2">Fonction</div>
                    <div className="col-span-2">Entreprise</div>
                    <div className="col-span-2">Équipe</div>
                    <div className="col-span-3">Zone</div>
                  </div>
                  
                  <div className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'} max-h-80 overflow-y-auto`}>
                    {personnel.length > 0 ? (
                      personnel.map((personne, index) => (
                        <div 
                          key={index} 
                          className={`grid grid-cols-12 gap-2 items-center p-3 ${
                            isDark 
                              ? 'hover:bg-space-700' 
                              : 'hover:bg-gray-50'
                          } transition-colors`}
                        >
                          <div className="col-span-3 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              isDark ? 'bg-space-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {personne.nom.charAt(0).toUpperCase()}
                            </div>
                            <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                              {personne.nom}
                            </span>
                          </div>
                          
                          <div className="col-span-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              personne.role === 'contremaitre'
                                ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                                : personne.role === 'chef_equipe'
                                  ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                  : isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                            }`}>
                              {personne.role}
                            </span>
                          </div>
                          
                          <div className="col-span-2">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                              {personne.entreprise}
                            </span>
                          </div>
                          
                          <div className="col-span-2">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                              {personne.equipe || '-'}
                            </span>
                          </div>
                          
                          <div className="col-span-3">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                              {personne.zone || '-'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aucun personnel assigné à ce chantier
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => navigate('/')}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Gérer le personnel
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Compétences et habilitations
                </h4>
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                } text-center`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Cette fonctionnalité est en cours de développement
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Rendement
                </h4>
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                } text-center`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Cette fonctionnalité est en cours de développement
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Approvisionnement et matériel */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('materials')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Approvisionnement et matériel
            </h3>
            {expandedSections.materials ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.materials && (
            <div className="p-4">
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Demande de matériaux
                </h4>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Matériau *
                      </label>
                      <input
                        type="text"
                        value={newMaterialRequest.material}
                        onChange={(e) => setNewMaterialRequest(prev => ({ ...prev, material: e.target.value }))}
                        className={`w-full rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ex: Ciment, Sable, Treillis..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Quantité *
                        </label>
                        <input
                          type="text"
                          value={newMaterialRequest.quantity}
                          onChange={(e) => setNewMaterialRequest(prev => ({ ...prev, quantity: e.target.value }))}
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ex: 10"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Unité *
                        </label>
                        <input
                          type="text"
                          value={newMaterialRequest.unit}
                          onChange={(e) => setNewMaterialRequest(prev => ({ ...prev, unit: e.target.value }))}
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ex: kg, m³, unités"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Urgence
                      </label>
                      <select
                        value={newMaterialRequest.urgency}
                        onChange={(e) => setNewMaterialRequest(prev => ({ ...prev, urgency: e.target.value }))}
                        className={`w-full rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="low">Basse</option>
                        <option value="normal">Normale</option>
                        <option value="high">Haute</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Notes
                      </label>
                      <input
                        type="text"
                        value={newMaterialRequest.notes}
                        onChange={(e) => setNewMaterialRequest(prev => ({ ...prev, notes: e.target.value }))}
                        className={`w-full rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Précisions supplémentaires..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddMaterialRequest}
                      className={`px-4 py-2 rounded-lg ${
                        isDark
                          ? 'bg-blue-500 hover:bg-blue-400 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Envoyer la demande
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Suivi des commandes
                </h4>
                <div className={`rounded-lg border ${
                  isDark ? 'border-space-700' : 'border-gray-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={isDark ? 'bg-space-700' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Matériau
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Urgence
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-space-700' : 'divide-gray-200'}`}>
                        {materialRequests.map((request, index) => (
                          <tr key={index} className={
                            isDark ? 'hover:bg-space-700' : 'hover:bg-gray-50'
                          }>
                            <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                              isDark ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {request.material}
                            </td>
                            <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                              isDark ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {request.quantity} {request.unit}
                            </td>
                            <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                              isDark ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {request.date}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                request.urgency === 'high'
                                  ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                                  : request.urgency === 'normal'
                                    ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                                    : isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                              }`}>
                                {request.urgency === 'high' ? 'Haute' : 
                                 request.urgency === 'normal' ? 'Normale' : 'Basse'}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                request.status === 'delivered'
                                  ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                                  : request.status === 'ordered'
                                    ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                    : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {request.status === 'delivered' ? 'Livré' : 
                                 request.status === 'ordered' ? 'Commandé' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bon de commande express
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Inventaire matériel
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Planification des livraisons
                </h4>
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                } text-center`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Cette fonctionnalité est en cours de développement
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Suivi d'avancement */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('progress')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Suivi d'avancement
            </h3>
            {expandedSections.progress ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.progress && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Jalons du chantier
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Rapport d'avancement simplifié
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Photothèque
                </h4>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Photo *
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        isDark 
                          ? 'border-space-600 hover:border-space-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Camera className={`w-8 h-8 mx-auto mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedPhoto ? selectedPhoto.name : 'Cliquez pour sélectionner une photo'}
                          </p>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description *
                      </label>
                      <input
                        type="text"
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        className={`w-full rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ex: Fondations terminées zone A"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={photoLocation}
                      onChange={(e) => setPhotoLocation(e.target.value)}
                      className={`w-full rounded-lg border ${
                        isDark
                          ? 'bg-space-900 border-space-700 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Ex: Zone A, Bâtiment B, etc."
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddPhoto}
                      disabled={!selectedPhoto || !photoDescription}
                      className={`px-4 py-2 rounded-lg ${
                        !selectedPhoto || !photoDescription
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      } ${
                        isDark
                          ? 'bg-blue-500 hover:bg-blue-400 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Ajouter la photo
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div 
                      key={index}
                      className={`rounded-lg border overflow-hidden ${
                        isDark ? 'border-space-700' : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.description}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <p className={`font-medium ${
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {photo.description}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {photo.location}
                          </p>
                          <p className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {photo.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Comparaison planning/réel
                </h4>
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                } text-center`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Cette fonctionnalité est en cours de développement
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Communication */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('communication')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Communication
            </h3>
            {expandedSections.communication ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.communication && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Messagerie interne
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Demandes de validation
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Journal de décisions
                </h4>
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                } text-center`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Cette fonctionnalité est en cours de développement
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes techniques
                </h4>
                <div className={`rounded-lg border ${
                  isDark ? 'border-space-700' : 'border-gray-200'
                }`}>
                  <div className="overflow-hidden">
                    {technicalNotes.map((note, index) => (
                      <div 
                        key={index}
                        className={`p-4 ${
                          index !== technicalNotes.length - 1
                            ? isDark ? 'border-b border-space-700' : 'border-b border-gray-200'
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className={`font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {note.title}
                            </h5>
                            <p className={`mt-1 text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {note.content}
                            </p>
                          </div>
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {note.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`p-4 border-t ${
                    isDark ? 'border-space-700' : 'border-gray-200'
                  }`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter une note technique..."
                        className={`flex-grow rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <button className={`px-3 py-2 rounded-lg ${
                        isDark
                          ? 'bg-blue-500 hover:bg-blue-400 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sécurité et qualité */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('safety')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Sécurité et qualité
            </h3>
            {expandedSections.safety ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.safety && (
            <div className="p-4">
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Points de contrôle
                </h4>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="space-y-3">
                    {safetyChecks.map((check) => (
                      <div key={check.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={check.id}
                          checked={check.checked}
                          onChange={(e) => handleSafetyCheckChange(check.id, e.target.checked)}
                          className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                            isDark ? 'bg-space-800 border-space-700' : ''
                          }`}
                        />
                        <label
                          htmlFor={check.id}
                          className={`ml-2 block text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {check.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Déclaration d'incidents
                </h4>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description de l'incident *
                      </label>
                      <textarea
                        value={incident.description}
                        onChange={(e) => setIncident(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full rounded-lg border ${
                          isDark
                            ? 'bg-space-900 border-space-700 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        rows={3}
                        placeholder="Décrivez l'incident en détail..."
                      />
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Gravité
                        </label>
                        <select
                          value={incident.severity}
                          onChange={(e) => setIncident(prev => ({ ...prev, severity: e.target.value }))}
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="low">Mineure</option>
                          <option value="medium">Modérée</option>
                          <option value="high">Grave</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Localisation *
                        </label>
                        <input
                          type="text"
                          value={incident.location}
                          onChange={(e) => setIncident(prev => ({ ...prev, location: e.target.value }))}
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ex: Zone A, Bâtiment B, etc."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Actions prises ou à prendre
                    </label>
                    <textarea
                      value={incident.actions}
                      onChange={(e) => setIncident(prev => ({ ...prev, actions: e.target.value }))}
                      className={`w-full rounded-lg border ${
                        isDark
                          ? 'bg-space-900 border-space-700 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={2}
                      placeholder="Décrivez les actions prises ou à prendre..."
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddIncident}
                      disabled={!incident.description || !incident.location}
                      className={`px-4 py-2 rounded-lg ${
                        !incident.description || !incident.location
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      } ${
                        isDark
                          ? 'bg-blue-500 hover:bg-blue-400 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Signaler l'incident
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Audits qualité
                  </h4>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-gray-50'
                  } text-center`}>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Cette fonctionnalité est en cours de développement
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Documents HSE
                  </h4>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-space-700 hover:bg-space-600' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors cursor-pointer`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                              PHSE du chantier
                            </span>
                          </div>
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            PDF
                          </span>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-space-700 hover:bg-space-600' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors cursor-pointer`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                              Analyse de risques
                            </span>
                          </div>
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            PDF
                          </span>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-space-700 hover:bg-space-600' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors cursor-pointer`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                              Fiches de signatures
                            </span>
                          </div>
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            PDF
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <button className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                        isDark
                          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}>
                        <Upload className="w-4 h-4" />
                        Ajouter un document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Formulaires et rapports rapides */}
        <div className={`rounded-lg border ${
          isDark ? 'border-space-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-space-700' : 'border-gray-200'
          } flex justify-between items-center cursor-pointer`}
          onClick={() => toggleSection('forms')}>
            <h3 className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Formulaires et rapports rapides
            </h3>
            {expandedSections.forms ? 
              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : 
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            }
          </div>
          
          {expandedSections.forms && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Demande d'intervention
                  </h4>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Type d'intervention
                        </label>
                        <select
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Sélectionner un type</option>
                          <option value="mechanical">Mécanique</option>
                          <option value="electrical">Électrique</option>
                          <option value="plumbing">Plomberie</option>
                          <option value="structural">Structurelle</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          rows={3}
                          placeholder="Décrivez l'intervention nécessaire..."
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Urgence
                        </label>
                        <select
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-lg ${
                          isDark
                            ? 'bg-blue-500 hover:bg-blue-400 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}>
                          Envoyer la demande
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Fiche d'observation
                  </h4>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'border-space-700 bg-space-800/50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Type d'observation
                        </label>
                        <select
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Sélectionner un type</option>
                          <option value="quality">Qualité</option>
                          <option value="safety">Sécurité</option>
                          <option value="technical">Technique</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          rows={3}
                          placeholder="Décrivez votre observation..."
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Localisation
                        </label>
                        <input
                          type="text"
                          className={`w-full rounded-lg border ${
                            isDark
                              ? 'bg-space-900 border-space-700 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ex: Zone A, Bâtiment B, etc."
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-lg ${
                          isDark
                            ? 'bg-blue-500 hover:bg-blue-400 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}>
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className={`rounded-xl p-8 mb-8 ${
        isDark 
          ? 'bg-space-800 border border-space-700' 
          : 'bg-white border border-blue-100 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <HardHat className={isDark ? 'text-blue-400' : 'text-blue-500'} />
          <h1 className={`text-3xl font-bold ${
            isDark ? 'text-galaxy-100' : 'text-blue-900'
          }`}>
            Espace Contremaître
          </h1>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-blue-600'}>
          Gérez efficacement votre chantier, vos équipes et vos ressources
        </p>
      </div>
      
      {/* Contenu principal */}
      <div className="space-y-6">
        {renderDashboard()}
      </div>
    </div>
  );
}