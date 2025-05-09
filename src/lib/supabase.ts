import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { Machine, Personnel, SiteEvent, HeuresReference, PersonnelFonction, BasePersonnel, ProjectPersonnel, Contract, ContractAmendment, ContractDocument, ContractExtractedData, ContractDataRow } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Récupère la liste des fonctions du personnel
 */
async function getPersonnelFonctions(): Promise<PersonnelFonction[]> {
  try {
    const { data, error } = await supabase
      .from('personnel_fonctions')
      .select('*')
      .order('ordre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des fonctions:', error);
    throw error;
  }
}

/**
 * Récupère la liste du personnel de base
 */
async function getBasePersonnel(): Promise<BasePersonnel[]> {
  try {
    const { data, error } = await supabase
      .from('base_personnel')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel de base:', error);
    throw error;
  }
}

/**
 * Récupère la liste du personnel d'un projet
 */
async function getProjectPersonnel(projectId: string): Promise<ProjectPersonnel[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const { data, error } = await supabase
      .from('project_personnel')
      .select(`
        *,
        personnel:personnel_id (*)
      `)
      .eq('project_id', projectId)
      .eq('statut', 'actif')
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel du projet:', error);
    throw error;
  }
}



/**
 * Ajoute un personnel au projet
 */
async function addPersonnelToProject(
  projectId: string, 
  personnelId: string, 
  data: {
    zone?: string;
    equipe?: string;
    entreprise?: string;
    intitule_fonction?: string;
    nom?: string;
    prenom?: string;
  }
): Promise<any> {
  try {
    // Vérifier si le personnel est déjà associé au projet
    const { data: existingPersonnel, error: checkError } = await supabase
      .from('project_personnel')
      .select('*')
      .eq('project_id', projectId)
      .eq('personnel_id', personnelId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError;
    }
    
    // Si le personnel existe déjà dans le projet, mettre à jour l'entrée
    if (existingPersonnel) {
      const { data: updated, error: updateError } = await supabase
        .from('project_personnel')
        .update({
          zone: data.zone || existingPersonnel.zone,
          equipe: data.equipe || existingPersonnel.equipe,
          statut: 'actif', // Toujours activer le personnel
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPersonnel.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updated;
    }
    
    // Si le personnel n'existe pas encore dans le projet, l'ajouter
    const { data: inserted, error: insertError } = await supabase
      .from('project_personnel')
      .insert({
        project_id: projectId,
        personnel_id: personnelId,
        zone: data.zone || '',
        equipe: data.equipe || '',
        entreprise: data.entreprise || 'PFSA',
        intitule_fonction: data.intitule_fonction || '',
        nom: data.nom || '',
        prenom: data.prenom || '',
        date_debut: new Date().toISOString().split('T')[0],
        statut: 'actif'
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    return inserted;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du personnel au projet:', error);
    throw error;
  }
}

/**
 * Assigne un membre du personnel à un projet
 */
async function assignPersonnelToProject(projectId: string, personnelId: string, options: { equipe?: string; zone?: string }) {
  if (!projectId || !personnelId) {
    throw new Error('ID du projet et ID du personnel requis');
  }

  try {
    // Vérifier si un enregistrement existe déjà pour ce personnel dans ce projet
    const { data: existingRecord, error: checkError } = await supabase
      .from('project_personnel')
      .select('id')
      .eq('project_id', projectId)
      .eq('personnel_id', personnelId)
      .eq('statut', 'actif')
      .maybeSingle();

    if (checkError) throw checkError;

    // Récupérer les informations sur le personnel de base
    const { data: basePersonnel, error: baseError } = await supabase
      .from('base_personnel')
      .select('*')
      .eq('id', personnelId)
      .single();

    if (baseError) throw baseError;

    // Récupérer le code de fonction à partir du libellé si nécessaire
    let fonctionCode = basePersonnel.intitule_fonction;
    
    // Vérifier si le code existe dans personnel_fonctions
    const { data: fonctionData, error: fonctionError } = await supabase
      .from('personnel_fonctions')
      .select('code')
      .eq('code', fonctionCode)
      .maybeSingle();
    
    if (fonctionError) throw fonctionError;
    
    // Si le code n'existe pas, essayer de le récupérer par le libellé
    if (!fonctionData) {
      const { data: fonctionByLibelle, error: libelleError } = await supabase
        .from('personnel_fonctions')
        .select('code')
        .eq('libelle', fonctionCode)
        .maybeSingle();
      
      if (!libelleError && fonctionByLibelle) {
        fonctionCode = fonctionByLibelle.code;
      }
    }

    // Si l'enregistrement existe déjà, mettre à jour les informations
    if (existingRecord) {
      const { data, error } = await supabase
        .from('project_personnel')
        .update({
          equipe: options.equipe,
          zone: options.zone,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Sinon, créer un nouvel enregistrement
      const { data, error } = await supabase
        .from('project_personnel')
        .insert({
          project_id: projectId,
          personnel_id: personnelId,
          intitule_fonction: fonctionCode, // Utiliser le code correct
          equipe: options.equipe,
          zone: options.zone,
          date_debut: new Date().toISOString().split('T')[0],
          statut: 'actif'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Erreur lors de l\'assignation du personnel au projet:', error);
    throw error;
  }
}



/**
 * Ajoute un membre du personnel externe à un projet
 */
async function addExternalPersonnelToProject(projectId: string, personnel: { 
  nom: string;
  prenom: string;
  intitule_fonction: string;
  entreprise: string;
  equipe?: string;
  zone?: string;
  dateDebut?: string;
}): Promise<ProjectPersonnel> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Récupérer la fonction correspondante depuis personnel_fonctions
    const { data: fonctionData, error: fonctionError } = await supabase
      .from('personnel_fonctions')
      .select('code')
      .eq('libelle', personnel.intitule_fonction)
      .maybeSingle();

    // Si la fonction n'est pas trouvée avec le libellé, utiliser le libellé comme code (temporaire)
    const fonctionCode = fonctionData?.code || personnel.intitule_fonction;

    // Ajouter le personnel externe au projet
    const { data, error } = await supabase
      .from('project_personnel')
      .insert({
        project_id: projectId,
        personnel_id: null, // Null pour personnel externe
        nom: personnel.nom,
        prenom: personnel.prenom,
        intitule_fonction: fonctionCode, // Utiliser le code de fonction correct
        entreprise: personnel.entreprise,
        equipe: personnel.equipe,
        zone: personnel.zone,
        date_debut: personnel.dateDebut || new Date().toISOString().split('T')[0],
        statut: 'actif'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du personnel externe:', error);
    throw error;
  }
}





/**
 * Supprime un membre du personnel d'un projet
 */
async function removePersonnelFromProject(projectId: string, projectPersonnelId: string): Promise<void> {
  if (!projectId || !projectPersonnelId) {
    throw new Error('ID du projet et ID du personnel requis');
  }

  try {
    const { error } = await supabase
      .from('project_personnel')
      .delete()
      .eq('project_id', projectId)
      .eq('id', projectPersonnelId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du personnel du projet:', error);
    throw error;
  }
}

/**
 * Sauvegarde un membre du personnel externe dans un projet
 */
async function saveExternalPersonnel(projectId: string, personnel: { 
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  equipe?: string;
  zone?: string;
}): Promise<ProjectPersonnel> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const { data, error } = await supabase
      .from('project_personnel')
      .upsert({
        project_id: projectId,
        nom: personnel.nom,
        prenom: personnel.prenom,
        intitule_fonction: personnel.fonction,
        entreprise: personnel.entreprise,
        equipe: personnel.equipe,
        zone: personnel.zone,
        date_debut: new Date().toISOString().split('T')[0],
        statut: 'actif'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du personnel externe:', error);
    throw error;
  }
}

/**
 * Récupère les machines d'un projet
 */
async function getMachinesByProject(projectId: string): Promise<Machine[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('project_id', projectId)
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des machines:', error);
    throw error;
  }
}

/**
 * Sauvegarde une machine
 */
async function saveMachine(projectId: string, machine: Partial<Machine>): Promise<Machine> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const machineData = {
      project_id: projectId,
      nom: machine.nom,
      type: machine.type,
      numero_materiel: machine.numeroMateriel,
      entreprise: machine.entreprise,
      quantite: machine.quantite || 1,
      remarques: machine.remarques
    };

    const { data, error } = await supabase
      .from('machines')
      .upsert(machineData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la machine:', error);
    throw error;
  }
}

/**
 * Supprime une machine
 */
async function deleteMachine(projectId: string, numeroMateriel: string): Promise<void> {
  if (!projectId || !numeroMateriel) {
    throw new Error('ID du projet et numéro de matériel requis');
  }

  try {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('project_id', projectId)
      .eq('numero_materiel', numeroMateriel);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la machine:', error);
    throw error;
  }
}

/**
 * Récupère le personnel d'un projet
 */
async function getPersonnelByProject(projectId: string): Promise<Personnel[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Récupérer le personnel du projet (à la fois interne et externe)
    const { data, error } = await supabase
      .from('project_personnel')
      .select(`
        *,
        personnel:personnel_id (*)
      `)
      .eq('project_id', projectId)
      .eq('statut', 'actif')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convertir les données au format Personnel
    const personnel: Personnel[] = data.map(item => {
      if (item.personnel) {
        // Personnel interne
        return {
          nom: `${item.personnel.nom} ${item.personnel.prenom || ''}`.trim(),
          // Utiliser intitule_fonction du personnel si disponible, sinon celui de l'entrée project_personnel
          role: item.personnel.intitule_fonction || item.intitule_fonction || '',
          matricule: item.personnel.numero_personnel,
          entreprise: item.personnel.entreprise || item.entreprise || '',
          equipe: item.equipe || '',
          zone: item.zone || '',
          heuresPresence: 7.5
        };
      } else {
        // Personnel externe
        return {
          nom: `${item.nom} ${item.prenom || ''}`.trim(),
          role: item.intitule_fonction || '',  // S'assurer que cette valeur est bien récupérée
          matricule: item.numero_personnel || item.id,
          entreprise: item.entreprise || '',
          equipe: item.equipe || '',
          zone: item.zone || '',
          heuresPresence: 7.5
        };
      }
    });
    
    console.log("Personnel récupéré avec fonctions:", personnel);
    return personnel;
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel:', error);
    throw error;
  }
}


/**
 * Sauvegarde un membre du personnel
 */
async function savePersonnel(projectId: string, personnel: Partial<Personnel>): Promise<Personnel> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    console.log("Sauvegarde du personnel:", personnel);
    console.log("Rôle original:", personnel.role);
    
    // Récupérer toutes les fonctions disponibles pour le débogage
    const { data: allFunctions, error: allFunctionsError } = await supabase
      .from('personnel_fonctions')
      .select('*');
    
    if (allFunctionsError) throw allFunctionsError;
    console.log("Fonctions disponibles:", allFunctions);
    
    // Vérifier si le rôle existe dans personnel_fonctions et le convertir si nécessaire
    let roleCode = personnel.role || '';
    
    // D'abord, vérifier si le rôle est déjà un code valide
    const { data: roleCheck, error: roleCheckError } = await supabase
      .from('personnel_fonctions')
      .select('code')
      .eq('code', roleCode)
      .maybeSingle();
    
    if (roleCheckError) throw roleCheckError;
    console.log("Vérification du code:", roleCheck);
    
    // Si le rôle n'existe pas comme code, vérifier s'il existe comme libellé
    if (!roleCheck) {
      const { data: roleByLibelle, error: roleByLibelleError } = await supabase
        .from('personnel_fonctions')
        .select('code')
        .eq('libelle', roleCode)
        .maybeSingle();
      
      if (roleByLibelleError) throw roleByLibelleError;
      console.log("Vérification par libellé:", roleByLibelle);
      
      // Si trouvé comme libellé, utiliser le code correspondant
      if (roleByLibelle) {
        roleCode = roleByLibelle.code;
        console.log("Code trouvé par libellé:", roleCode);
      } else {
        // Si le rôle n'existe ni comme code ni comme libellé, créer une nouvelle entrée
        const codeNormalise = roleCode.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
          .replace(/[^a-z0-9]/g, '_'); // Remplacer les caractères spéciaux par _
        
        console.log("Création d'un nouveau code:", codeNormalise);
        
        const { data: newRole, error: newRoleError } = await supabase
          .from('personnel_fonctions')
          .insert({
            code: codeNormalise,
            libelle: roleCode,
            couleur_claire: 'bg-gray-100 text-gray-800',
            couleur_sombre: 'bg-gray-500/20 text-gray-300',
            ordre: 9999, // Ordre élevé pour apparaître à la fin
            actif: true
          })
          .select('code')
          .single();
        
        if (newRoleError) {
          console.error("Erreur lors de la création du rôle:", newRoleError);
          throw newRoleError;
        }
        
        roleCode = newRole.code;
        console.log("Nouveau code créé:", roleCode);
      }
    }

    console.log("Code final utilisé:", roleCode);
    
    const personnelData = {
      project_id: projectId,
      nom: personnel.nom,
      role: roleCode, // Utiliser le code vérifié ou créé
      matricule: personnel.matricule,
      equipe: personnel.equipe,
      heures_presence: personnel.heuresPresence || 7.5
    };

    console.log("Données à insérer:", personnelData);
    
    const { data, error } = await supabase
      .from('personnel')
      .upsert(personnelData)
      .select()
      .single();

    if (error) {
      console.error("Erreur d'insertion:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du personnel:', error);
    throw error;
  }
}

/**
 * Supprime un membre du personnel
 */
async function deletePersonnel(projectId: string, id: string): Promise<void> {
  if (!projectId || !id) {
    throw new Error('ID du projet et ID du personnel requis');
  }

  try {
    const { error } = await supabase
      .from('personnel')
      .delete()
      .eq('project_id', projectId)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du personnel:', error);
    throw error;
  }
}

/**
 * Récupère un rapport journalier
 */
async function getRapport(projectId: string, date: string): Promise<any> {
  if (!projectId || !date) {
    throw new Error('ID du projet et date requis');
  }

  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('project_id', projectId)
      .eq('date', date)
      .maybeSingle(); // Remplacer single() par maybeSingle()

    if (error) throw error;
    return data; // Retournera null si aucun rapport n'existe
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    throw error;
  }
}

/**
 * Récupère les rapports journaliers pour une période
 */
async function getRapportsByPeriod(projectId: string, startDate: string, endDate: string): Promise<any[]> {
  if (!projectId || !startDate || !endDate) {
    throw new Error('ID du projet, date de début et date de fin requis');
  }

  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    throw error;
  }
}

/**
 * Sauvegarde un rapport journalier
 */
async function saveRapport(projectId: string, rapport: any): Promise<any> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const rapportData = {
      project_id: projectId,
      date: rapport.date,
      nom_chantier: rapport.nomChantier,
      meteo: rapport.meteo,
      evenements_particuliers: rapport.evenementsParticuliers,
      personnel: rapport.personnel,
      taches: rapport.taches,
      machines: rapport.machines,
      bons_apport: rapport.bonsApport,
      bons_evacuation: rapport.bonsEvacuation,
      bons_beton: rapport.bonsBeton,
      bons_materiaux: rapport.bonsMateriaux,
      tiers: rapport.tiers,
      remarques: rapport.remarques,
      remarques_contremaitre: rapport.remarquesContremaitre,
      visa_contremaitre: rapport.visaContremaitre,
      photos: rapport.photos,
      created_by: userId,
      updated_by: userId
    };

    const { data, error } = await supabase
      .from('daily_reports')
      .upsert(rapportData, {
        onConflict: 'project_id,date' // Spécifier les colonnes de contrainte
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du rapport:', error);
    throw error;
  }
}

/**
 * Récupère les heures de référence pour une date donnée
 */
async function getHeuresReference(projectId: string, date: string): Promise<number | null> {
  if (!projectId || !date) {
    throw new Error('ID du projet et date requis');
  }

  try {
    const { data, error } = await supabase
      .rpc('get_reference_hours', {
        p_project_id: projectId,
        p_date: date
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des heures de référence:', error);
    throw error;
  }
}

/**
 * Ajoute des heures de référence pour un projet
 */
async function addHeuresReference(projectId: string, heures: number, dateDebut: string, dateFin?: string): Promise<void> {
  if (!projectId || !heures || !dateDebut) {
    throw new Error('ID du projet, heures et date de début requis');
  }

  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { error } = await supabase
      .from('project_reference_hours')
      .insert({
        project_id: projectId,
        heures,
        date_debut: dateDebut,
        date_fin: dateFin,
        created_by: userId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de l\'ajout des heures de référence:', error);
    throw error;
  }
}

/**
 * Récupère les événements d'un projet
 */
async function getEventsByProject(projectId: string): Promise<SiteEvent[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
}

/**
 * Sauvegarde un événement
 */
async function saveEvent(projectId: string, event: Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt' | 'notified'>): Promise<SiteEvent> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    const eventData = {
      project_id: projectId,
      type: event.type,
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      priority: event.priority
    };

    const { data, error } = await supabase
      .from('events')
      .upsert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    throw error;
  }
}

/**
 * Supprime un événement
 */
async function deleteEvent(eventId: string): Promise<void> {
  if (!eventId) {
    throw new Error('ID de l\'événement requis');
  }

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    throw error;
  }
}

/**
 * Récupère les contrats d'un projet
 */
async function getContractsByProject(projectId: string): Promise<Contract[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Récupérer les contrats
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('date_debut', { ascending: false });

    if (contractsError) throw contractsError;

    // Pour chaque contrat, récupérer les avenants et documents
    const contractsWithDetails = await Promise.all(contracts.map(async (contract) => {
      // Récupérer les avenants
      const { data: amendments, error: amendmentsError } = await supabase
        .from('contract_amendments')
        .select('*')
        .eq('contract_id', contract.id)
        .order('date', { ascending: true });

      if (amendmentsError) throw amendmentsError;

      // Récupérer les documents
      const { data: documents, error: documentsError } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contract.id)
        .order('date_upload', { ascending: false });

      if (documentsError) throw documentsError;

      // Convertir en format attendu par le frontend
      return {
        id: contract.id,
        type: contract.type,
        reference: contract.reference,
        entreprise: contract.entreprise,
        montantHT: contract.montant_ht,
        dateDebut: contract.date_debut,
        dateFin: contract.date_fin,
        statut: contract.statut,
        avenants: amendments.map(a => ({
          id: a.id,
          reference: a.reference,
          description: a.description || '',
          montantHT: a.montant_ht,
          date: a.date
        })),
        documents: documents.map(d => ({
          id: d.id,
          nom: d.nom,
          type: d.type,
          url: d.url,
          dateUpload: d.date_upload
        }))
      };
    }));

    return contractsWithDetails;
  } catch (error) {
    console.error('Erreur lors de la récupération des contrats:', error);
    throw error;
  }
}

/**
 * Récupère un contrat par son ID
 */
async function getContractById(contractId: string): Promise<Contract> {
  if (!contractId) {
    throw new Error('ID du contrat requis');
  }

  try {
    // Récupérer le contrat
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError) throw contractError;

    // Récupérer les avenants
    const { data: amendments, error: amendmentsError } = await supabase
      .from('contract_amendments')
      .select('*')
      .eq('contract_id', contractId)
      .order('date', { ascending: true });

    if (amendmentsError) throw amendmentsError;

    // Récupérer les documents
    const { data: documents, error: documentsError } = await supabase
      .from('contract_documents')
      .select('*')
      .eq('contract_id', contractId)
      .order('date_upload', { ascending: false });

    if (documentsError) throw documentsError;

    // Convertir en format attendu par le frontend
    return {
      id: contract.id,
      type: contract.type,
      reference: contract.reference,
      entreprise: contract.entreprise,
      montantHT: contract.montant_ht,
      dateDebut: contract.date_debut,
      dateFin: contract.date_fin,
      statut: contract.statut,
      avenants: amendments.map(a => ({
        id: a.id,
        reference: a.reference,
        description: a.description || '',
        montantHT: a.montant_ht,
        date: a.date
      })),
      documents: documents.map(d => ({
        id: d.id,
        nom: d.nom,
        type: d.type,
        url: d.url,
        dateUpload: d.date_upload
      }))
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du contrat:', error);
    throw error;
  }
}

/**
 * Supprime un contrat
 */
async function deleteContract(contractId: string): Promise<void> {
  if (!contractId) {
    throw new Error('ID du contrat requis');
  }

  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du contrat:', error);
    throw error;
  }
}

/**
 * Récupère les données extraites d'un contrat
 */
async function getContractExtractedData(contractId: string): Promise<ContractExtractedData[]> {
  if (!contractId) {
    throw new Error('ID du contrat requis');
  }

  try {
    // Récupérer les données extraites
    const { data: extractedData, error: extractedDataError } = await supabase
      .from('contract_extracted_data')
      .select(`
        *,
        document:document_id (nom)
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (extractedDataError) throw extractedDataError;

    // Pour chaque donnée extraite, récupérer les lignes de données
    const dataWithRows = await Promise.all(extractedData.map(async (data) => {
      const { data: rows, error: rowsError } = await supabase
        .from('contract_data_rows')
        .select('*')
        .eq('extracted_data_id', data.id);

      if (rowsError) throw rowsError;

      return {
        id: data.id,
        contractId: data.contract_id,
        documentId: data.document_id,
        documentName: data.document?.nom,
        section: data.section,
        data: rows,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }));

    return dataWithRows;
  } catch (error) {
    console.error('Erreur lors de la récupération des données extraites:', error);
    throw error;
  }
}

/**
 * Sauvegarde les données extraites d'un contrat
 */
async function saveContractExtractedData(
  contractId: string,
  documentId: string | undefined,
  section: 'articles' | 'conditions' | 'conditions_speciales',
  data: ContractDataRow[]
): Promise<void> {
  if (!contractId || !section) {
    throw new Error('ID du contrat et section requis');
  }

  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // Vérifier si une entrée existe déjà pour cette section
    const { data: existingData, error: existingDataError } = await supabase
      .from('contract_extracted_data')
      .select('id')
      .eq('contract_id', contractId)
      .eq('section', section)
      .eq('document_id', documentId || null)
      .maybeSingle();

    if (existingDataError && existingDataError.code !== 'PGRST116') throw existingDataError;

    let extractedDataId;

    if (existingData) {
      // Mettre à jour l'entrée existante
      extractedDataId = existingData.id;

      // Supprimer les lignes existantes
      const { error: deleteRowsError } = await supabase
        .from('contract_data_rows')
        .delete()
        .eq('extracted_data_id', extractedDataId);

      if (deleteRowsError) throw deleteRowsError;
    } else {
      // Créer une nouvelle entrée
      const { data: newData, error: newDataError } = await supabase
        .from('contract_extracted_data')
        .insert({
          contract_id: contractId,
          document_id: documentId,
          section,
          created_by: userId
        })
        .select()
        .single();

      if (newDataError) throw newDataError;
      extractedDataId = newData.id;
    }

    // Insérer les nouvelles lignes
    if (data.length > 0) {
      const rowsData = data.map(row => ({
        extracted_data_id: extractedDataId,
        values: row.values
      }));

      const { error: insertRowsError } = await supabase
        .from('contract_data_rows')
        .insert(rowsData);

      if (insertRowsError) throw insertRowsError;
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données extraites:', error);
    throw error;
  }
}

/**
 * Sauvegarde un contrat
 */
async function saveContract(projectId: string, contract: Omit<Contract, 'id'>): Promise<Contract> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  try {
    // Vérifier si le contrat existe (pour une mise à jour)
    const contractId = (contract as any).id;
    const isUpdate = !!contractId;

    // Si mise à jour, vérifier si la référence existe pour un autre contrat
    if (isUpdate) {
      const { data: duplicateRef } = await supabase
        .from('contracts')
        .select('id')
        .eq('project_id', projectId)
        .eq('reference', contract.reference)
        .neq('id', contractId)
        .maybeSingle();

      if (duplicateRef) {
        throw new Error('Un contrat avec cette référence existe déjà pour ce projet');
      }
    } else {
      // Pour les nouveaux contrats, vérifier si la référence existe
      const { data: duplicateRef } = await supabase
        .from('contracts')
        .select('id')
        .eq('project_id', projectId)
        .eq('reference', contract.reference)
        .maybeSingle();

      if (duplicateRef) {
        throw new Error('Un contrat avec cette référence existe déjà pour ce projet');
      }
    }

    // Préparer les données du contrat
    const contractData = {
      id: contractId, // Inclure l'ID pour les mises à jour
      project_id: projectId,
      type: contract.type,
      reference: contract.reference,
      entreprise: contract.entreprise,
      montant_ht: contract.montantHT,
      date_debut: contract.dateDebut || null,
      date_fin: contract.dateFin || null,
      statut: contract.statut,
      created_by: userId
    };

    // Insérer ou mettre à jour le contrat
    const { data: savedContract, error: contractError } = await supabase
      .from('contracts')
      .upsert(contractData)
      .select()
      .single();

    if (contractError) throw contractError;

    // Gérer les avenants
    if (contract.avenants && contract.avenants.length > 0) {
      // Supprimer les avenants existants pour ce contrat
      const { error: deleteError } = await supabase
        .from('contract_amendments')
        .delete()
        .eq('contract_id', savedContract.id);

      if (deleteError) throw deleteError;

      // Insérer les nouveaux avenants
      const amendmentsData = contract.avenants.map(a => ({
        contract_id: savedContract.id,
        reference: a.reference,
        description: a.description,
        montant_ht: a.montantHT,
        date: a.date || null,
        created_by: userId
      }));

      const { error: amendmentsError } = await supabase
        .from('contract_amendments')
        .insert(amendmentsData);

      if (amendmentsError) throw amendmentsError;
    }

    // Gérer les documents
    if (contract.documents && contract.documents.length > 0) {
      // Get existing documents for this contract
      if (isUpdate) {
        const { data: existingDocs, error: existingDocsError } = await supabase
          .from('contract_documents')
          .select('id, nom')
          .eq('contract_id', savedContract.id);
        
        if (existingDocsError) throw existingDocsError;
        
        if (existingDocs && existingDocs.length > 0) {
          // Trouver les documents à supprimer (documents qui existent en DB mais plus dans le contrat)
          const currentDocIds = new Set(contract.documents.map(doc => doc.id));
          const docsToDelete = existingDocs.filter(doc => !currentDocIds.has(doc.id));
          
          // Supprimer les documents qui ne sont plus dans le contrat
          if (docsToDelete.length > 0) {
            const docIdsToDelete = docsToDelete.map(doc => doc.id);
            
            // Supprimer d'abord les fichiers du stockage
            for (const docId of docIdsToDelete) {
              const doc = existingDocs.find(d => d.id === docId);
              if (doc) {
                try {
                  // Extraire le chemin du fichier de l'URL
                  const url = doc.url || '';
                  const pathMatch = url.match(/\/([^/]+)$/);
                  if (pathMatch && pathMatch[1]) {
                    await supabase.storage
                      .from('contracts')
                      .remove([pathMatch[1]]);
                  }
                } catch (storageError) {
                  console.warn('Erreur lors de la suppression du fichier:', storageError);
                  // Continue même si la suppression du fichier échoue
                }
              }
            }
            
            // Supprimer les enregistrements de documents
            const { error: deleteDocsError } = await supabase
              .from('contract_documents')
              .delete()
              .in('id', docIdsToDelete);
            
            if (deleteDocsError) throw deleteDocsError;
          }
        }
      }
    }

    // Ajouter les nouveaux documents
    for (const doc of contract.documents) {
      // Vérifier si le document est nouveau (pas d'ID ou ID temporaire)
      if (!doc.id || doc.id.startsWith('temp_')) {
        try {
          await addContractDocument(savedContract.id, {
            nom: doc.nom,
            type: doc.type,
            url: doc.url,
            dateUpload: doc.dateUpload
          });
        } catch (docError) {
          console.warn('Erreur lors de l\'ajout du document:', docError);
          // Continue même si l'ajout échoue
        }
      }
    }

    // Récupérer le contrat complet avec ses avenants et documents
    return getContractById(savedContract.id);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contrat:', error);
    throw error;
  }
}

/**
 * Ajoute un document à un contrat existant
 */
async function addContractDocument(contractId: string, document: Omit<ContractDocument, 'id'>): Promise<ContractDocument> {
  if (!contractId) {
    throw new Error('ID du contrat requis');
  }

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  try {
    // Vérifier si l'URL est une URL de stockage Supabase
    let finalUrl = document.url;
    let fileData = null;
    
    // Si l'URL commence par "blob:" ou "data:", c'est un fichier temporaire du navigateur
    if (finalUrl.startsWith('blob:') || finalUrl.startsWith('data:')) {
      try {
        console.log('Téléchargement du fichier depuis URL temporaire');
        // Télécharger le fichier depuis l'URL
        const response = await fetch(document.url);
        const blob = await response.blob();
        
        // Extraire le nom du fichier et l'extension
        const fileName = document.nom;
        const fileExt = fileName.split('.').pop() || '';
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;
        
        // Uploader le fichier dans Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(uniqueFileName, blob, {
            upsert: true
          }
          )
          .upload(uniqueFileName, blob, {
            upsert: true
          }
          )
          .upload(uniqueFileName, blob, {
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // Stocker les données du fichier pour débogage
        fileData = uploadData;
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(uniqueFileName);
        
        finalUrl = publicUrl;
      } catch (uploadError) {
        console.error('Erreur lors de l\'upload du fichier:', uploadError);
        // Continuer avec l'URL originale si l'upload échoue
      }
    }

    // Add new document
    const { data: savedDoc, error } = await supabase
      .from('contract_documents')
      .insert({
        contract_id: contractId,
        nom: document.nom,
        type: document.type,
        url: finalUrl,
        date_upload: document.dateUpload,
        created_by: userId,
        file_path: fileData?.path // Stocker le chemin du fichier pour faciliter la suppression
      })
      .select()
      .single();

    if (error) throw error;
    return savedDoc;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du document:', error);
    throw error;
  }
}

/**
 * Supprime un document d'un contrat
 */
async function deleteContractDocument(documentId: string): Promise<void> {
  if (!documentId) {
    throw new Error('ID du document requis');
  }

  try {
    // Récupérer les informations du document
    const { data: document, error: fetchError } = await supabase
      .from('contract_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Extraire le chemin du fichier de l'URL
    if (document && document.url) {
      try {
        // Supprimer le fichier du stockage
        const urlPath = new URL(document.url);
        const pathParts = urlPath.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        if (fileName) {
          const { error: deleteStorageError } = await supabase.storage
            .from('contracts')
            .remove([fileName]);
            
          if (deleteStorageError) {
            console.warn('Erreur lors de la suppression du fichier:', deleteStorageError);
          }
        }
      } catch (storageError) {
        console.warn('Erreur lors de l\'extraction du chemin du fichier:', storageError);
      }
    }

    // Supprimer l'entrée dans la table
    const { error: deleteError } = await supabase
      .from('contract_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    throw error;
  }
}




/**
 * Récupère les factures d'un projet
 */
export async function getInvoicesByProject(projectId: string, filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  supplier?: string;
  isPaid?: boolean;
  isOverdue?: boolean;
}): Promise<Invoice[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Construire la requête de base
    let query = supabase
      .from('invoices')
      .select(`
        *,
        validated_by (id, email, first_name, last_name),
        created_by (id, email, first_name, last_name)
      `)
      .eq('project_id', projectId);
    
    // Appliquer les filtres
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.supplier) {
      query = query.ilike('supplier', `%${filters.supplier}%`);
    }
    
    if (filters?.isPaid !== undefined) {
      if (filters.isPaid) {
        query = query.not('payment_date', 'is', null);
      } else {
        query = query.is('payment_date', null);
      }
    }
    
    // Pour les factures en retard, on ne peut pas filtrer directement
    // On récupère toutes les factures et on filtre côté client
    
    // Exécuter la requête
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    // Convertir les données au format attendu par le frontend
    const invoices: Invoice[] = await Promise.all(data.map(async (invoice) => {
      // Récupérer les documents de la facture
      const { data: documents, error: documentsError } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      if (documentsError) throw documentsError;
      
      // Récupérer les bons liés à la facture
      const { data: voucherLinks, error: voucherLinksError } = await supabase
        .from('voucher_invoice_links')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      if (voucherLinksError) throw voucherLinksError;
      
      // Récupérer les détails des bons liés
      const vouchers = [];
      if (voucherLinks && voucherLinks.length > 0) {
        for (const link of voucherLinks) {
          try {
            const voucher = await getVoucherById(link.voucher_id);
            if (voucher) {
              vouchers.push({
                ...voucher,
                amount: link.amount
              });
            }
          } catch (err) {
            console.warn(`Erreur lors de la récupération du bon ${link.voucher_id}:`, err);
          }
        }
      }
      
      // Filtrer les factures en retard si demandé
      if (filters?.isOverdue !== undefined) {
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        const isOverdue = !invoice.payment_date && dueDate < today;
        
        if (filters.isOverdue !== isOverdue) {
          return null; // Ignorer cette facture
        }
      }
      
      return {
        id: invoice.id,
        projectId: invoice.project_id,
        number: invoice.number,
        reference: invoice.reference,
        supplier: invoice.supplier,
        date: invoice.date,
        dueDate: invoice.due_date,
        amountHT: invoice.amount_ht,
        amountTTC: invoice.amount_ttc,
        vatRate: invoice.vat_rate,
        status: invoice.status,
        paymentDate: invoice.payment_date,
        paymentReference: invoice.payment_reference,
        validatedBy: invoice.validated_by?.id,
        validatedAt: invoice.validated_at,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        documents: documents?.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          date: doc.date_upload
        })) || [],
        vouchers
      };
    }));
    
    // Filtrer les factures nulles (celles qui ont été ignorées à cause du filtre isOverdue)
    return invoices.filter(Boolean) as Invoice[];
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    throw error;
  }
}

/**
 * Récupère une facture par son ID
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice> {
  if (!invoiceId) {
    throw new Error('ID de la facture requis');
  }

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        validated_by (id, email, first_name, last_name),
        created_by (id, email, first_name, last_name)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    
    // Récupérer les documents de la facture
    const { data: documents, error: documentsError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (documentsError) throw documentsError;
    
    // Récupérer les bons liés à la facture
    const { data: voucherLinks, error: voucherLinksError } = await supabase
      .from('voucher_invoice_links')
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (voucherLinksError) throw voucherLinksError;
    
    // Récupérer les détails des bons liés
    const vouchers = [];
    if (voucherLinks && voucherLinks.length > 0) {
      for (const link of voucherLinks) {
        try {
          const voucher = await getVoucherById(link.voucher_id);
          if (voucher) {
            vouchers.push({
              ...voucher,
              amount: link.amount
            });
          }
        } catch (err) {
          console.warn(`Erreur lors de la récupération du bon ${link.voucher_id}:`, err);
        }
      }
    }
    
    return {
      id: data.id,
      projectId: data.project_id,
      number: data.number,
      reference: data.reference,
      supplier: data.supplier,
      date: data.date,
      dueDate: data.due_date,
      amountHT: data.amount_ht,
      amountTTC: data.amount_ttc,
      vatRate: data.vat_rate,
      status: data.status,
      paymentDate: data.payment_date,
      paymentReference: data.payment_reference,
      validatedBy: data.validated_by?.id,
      validatedAt: data.validated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      documents: documents?.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        date: doc.date_upload
      })) || [],
      vouchers
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    throw error;
  }
}

/**
 * Sauvegarde une facture
 */
export async function saveInvoice(projectId: string, invoice: Partial<Invoice>): Promise<Invoice> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Obtenir l'ID de l'utilisateur actuel si disponible
    const authResponse = await supabase.auth.getUser();
    let userId = authResponse.data.user?.id;
    
    // Si aucun utilisateur n'est authentifié, essayez de trouver un utilisateur valide dans la base de données
    if (!userId) {
      // Récupérer le premier utilisateur disponible dans la table profiles
      const userResponse = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      
      if (userResponse.error) {
        console.error('Impossible de trouver un utilisateur valide:', userResponse.error);
        throw new Error('Aucun utilisateur disponible pour créer la facture. Veuillez vous connecter.');
      }
      
      userId = userResponse.data.id;
    }

    // Vérifier si la facture existe (pour une mise à jour)
    const invoiceId = invoice.id;
    const isUpdate = !!invoiceId;

    // Si mise à jour, vérifier si le numéro existe pour une autre facture
    if (isUpdate) {
      const { data: duplicateRef } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', projectId)
        .eq('number', invoice.number)
        .neq('id', invoiceId)
        .maybeSingle();

      if (duplicateRef) {
        throw new Error('Une facture avec ce numéro existe déjà pour ce projet');
      }
    } else {
      // Pour les nouvelles factures, vérifier si le numéro existe
      const { data: duplicateRef } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', projectId)
        .eq('number', invoice.number)
        .maybeSingle();

      if (duplicateRef) {
        throw new Error('Une facture avec ce numéro existe déjà pour ce projet');
      }
    }

    // Préparer les données de la facture
    const invoiceData = {
      id: invoiceId, // Inclure l'ID pour les mises à jour
      project_id: projectId,
      number: invoice.number,
      reference: invoice.reference,
      supplier: invoice.supplier,
      date: invoice.date,
      due_date: invoice.dueDate,
      amount_ht: invoice.amountHT,
      amount_ttc: invoice.amountTTC,
      vat_rate: invoice.vatRate,
      status: invoice.status,
      payment_date: invoice.paymentDate,
      payment_reference: invoice.paymentReference,
      validated_by: invoice.validatedBy,
      validated_at: invoice.validatedAt,
      created_by: userId // Utiliser l'ID de l'utilisateur trouvé
    };

    // Insérer ou mettre à jour la facture
    const { data: savedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .upsert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Gérer les voucher links si présent
    if (invoice.vouchers && invoice.vouchers.length > 0) {
      // Supprimer les liens existants
      const { error: deleteLinksError } = await supabase
        .from('voucher_invoice_links')
        .delete()
        .eq('invoice_id', savedInvoice.id);
      
      if (deleteLinksError) throw deleteLinksError;
      
      // Ajouter les nouveaux liens
      const linksData = invoice.vouchers.map(voucher => ({
        voucher_id: voucher.id,
        invoice_id: savedInvoice.id,
        amount: voucher.amount || (voucher.quantity || 0) * (voucher.unitPrice || 0),
        created_by: userId
      }));
      
      if (linksData.length > 0) {
        const { error: insertLinksError } = await supabase
          .from('voucher_invoice_links')
          .insert(linksData);
        
        if (insertLinksError) throw insertLinksError;
      }
    }

    // Récupérer la facture complète avec ses documents et bons
    return getInvoiceById(savedInvoice.id);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la facture:', error);
    throw error;
  }
}

/**
 * Ajoute un document à une facture existante
 */
async function addInvoiceDocument(invoiceId: string, document: {
  name: string;
  type: string;
  url: string;
  date: string;
}): Promise<any> {
  if (!invoiceId) {
    throw new Error('ID de la facture requis');
  }

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  try {
    // Vérifier si l'URL est une URL de stockage Supabase
    let finalUrl = document.url;
    let fileData = null;
    
    // Si l'URL commence par "blob:" ou "data:", c'est un fichier temporaire du navigateur
    if (finalUrl.startsWith('blob:') || finalUrl.startsWith('data:')) {
      try {
        console.log('Téléchargement du fichier depuis URL temporaire');
        // Télécharger le fichier depuis l'URL
        const response = await fetch(document.url);
        const blob = await response.blob();
        
        // Extraire le nom du fichier et l'extension
        const fileName = document.name;
        const fileExt = fileName.split('.').pop() || '';
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;
        
        // Uploader le fichier dans Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(uniqueFileName, blob, {
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // Stocker les données du fichier pour débogage
        fileData = uploadData;
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
          .getPublicUrl(uniqueFileName);
        
        finalUrl = publicUrl;
      } catch (uploadError) {
        console.error('Erreur lors de l\'upload du fichier:', uploadError);
        // Continuer avec l'URL originale si l'upload échoue
      }
    }

    // Add new document
    const { data: savedDoc, error } = await supabase
      .from('invoice_documents')
      .insert({
        invoice_id: invoiceId,
        name: document.name,
        type: document.type,
        url: finalUrl,
        date_upload: document.date,
        created_by: userId,
        file_path: fileData?.path // Stocker le chemin du fichier pour faciliter la suppression
      })
      .select()
      .single();

    if (error) throw error;
    return savedDoc;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du document:', error);
    throw error;
  }
}

/**
 * Supprime une facture
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  if (!invoiceId) {
    throw new Error('ID de la facture requis');
  }

  try {
    // Récupérer les documents de la facture
    const { data: documents, error: documentsError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (documentsError) throw documentsError;
    
    // Supprimer les fichiers du stockage
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        try {
          // Extraire le chemin du fichier de l'URL
          const url = doc.url || '';
          const pathMatch = url.match(/\/([^/]+)$/);
          if (pathMatch && pathMatch[1]) {
            await supabase.storage
              .from('invoices')
              .remove([pathMatch[1]]);
          }
        } catch (storageError) {
          console.warn('Erreur lors de la suppression du fichier:', storageError);
          // Continue même si la suppression du fichier échoue
        }
      }
    }
    
    // Supprimer les liens avec les bons
    const { error: linksError } = await supabase
      .from('voucher_invoice_links')
      .delete()
      .eq('invoice_id', invoiceId);
    
    if (linksError) throw linksError;
    
    // Supprimer la facture
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    throw error;
  }
}

  //Récupère les bons d'un projet
 
export async function getVouchersByProject(projectId: string, filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  supplier?: string;
}): Promise<Voucher[]> {
  if (!projectId) {
    throw new Error('ID du projet requis');
  }

  try {
    // Utiliser la fonction RPC pour récupérer les bons extraits des rapports
    const { data, error } = await supabase.rpc('get_extracted_vouchers_by_project', {
      p_project_id: projectId,
      p_start_date: filters?.startDate || null,
      p_end_date: filters?.endDate || null,
      p_type: filters?.type || null,
      p_status: filters?.status || null,
      p_supplier: filters?.supplier || null
    });

    if (error) throw error;

    // Convertir les données au format attendu par le frontend
    const formattedVouchers: Voucher[] = data.map(v => {
      // Calculer le montant total
      const amount = (v.quantity || 0) * (v.unit_price || 0);
      
      return {
        id: v.id,
        type: v.type,
        number: v.number,
        supplier: v.supplier,
        date: v.date,
        quantity: v.quantity,
        unit: v.unit,
        unitPrice: v.unit_price || null,
        status: v.status,
        invoiceId: null, // Pour l'instant, pas de lien avec les factures
        projectId: v.project_id,
        validatedBy: v.validated_by?.id,
        validatedAt: v.validated_at,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        // Champs spécifiques selon le type
        ...(v.type === 'delivery' || v.type === 'evacuation' ? {
          materials: v.materials,
          loadingLocation: v.loading_location,
          unloadingLocation: v.unloading_location,
          truckType: v.truck_type,
        } : {}),
        ...(v.type === 'concrete' ? {
          concreteType: v.materials, // Utiliser le champ materials pour le type de béton
          strength: '',
          additives: [],
          truckType: v.truck_type,
        } : {}),
        ...(v.type === 'materials' ? {
          materials: v.materials,
          reference: '',
        } : {}),
      };
    });

    return formattedVouchers;
  } catch (error) {
    console.error('Erreur lors de la récupération des bons:', error);
    throw error;
  }
}

/**
 * Récupère un bon par son ID
 */
export async function getVoucherById(voucherId: string): Promise<Voucher> {
  if (!voucherId) {
    throw new Error('ID du bon requis');
  }

  try {
    // Récupérer le bon depuis la vue extracted_vouchers
    const { data, error } = await supabase.rpc('get_extracted_vouchers_by_project', {
      p_project_id: null, // On ne filtre pas par projet
      p_start_date: null,
      p_end_date: null,
      p_type: null,
      p_status: null,
      p_supplier: null
    });
    
    if (error) throw error;
    
    // Trouver le bon avec l'ID correspondant
    const voucher = data.find(v => v.id === voucherId);
    
    if (!voucher) {
      throw new Error('Bon non trouvé');
    }
    
    // Convertir au format attendu par le frontend
    return {
      id: voucher.id,
      type: voucher.type,
      number: voucher.number,
      supplier: voucher.supplier,
      date: voucher.date,
      quantity: voucher.quantity,
      unit: voucher.unit,
      unitPrice: voucher.unit_price || null,
      status: voucher.status,
      invoiceId: null, // Pour l'instant, pas de lien avec les factures
      projectId: voucher.project_id,
      validatedBy: voucher.validated_by,
      validatedAt: voucher.validated_at,
      createdAt: voucher.created_at,
      updatedAt: voucher.updated_at,
      // Champs spécifiques selon le type
      ...(voucher.type === 'delivery' || voucher.type === 'evacuation' ? {
        materials: voucher.materials,
        loadingLocation: voucher.loading_location,
        unloadingLocation: voucher.unloading_location,
        truckType: voucher.truck_type,
      } : {}),
      ...(voucher.type === 'concrete' ? {
        concreteType: voucher.materials,
        strength: '',
        additives: [],
        truckType: voucher.truck_type,
      } : {}),
      ...(voucher.type === 'materials' ? {
        materials: voucher.materials,
        reference: '',
      } : {}),
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du bon:', error);
    throw error;
  }
}

export { getEventsByProject, saveEvent, deleteEvent }

export { saveRapport, getRapport, getHeuresReference }

export { getRapportsByPeriod, getProjectPersonnel }

export { savePersonnel, getPersonnelByProject }

export { saveMachine, getMachinesByProject, deleteMachine }

export { getPersonnelFonctions }

export { saveContractExtractedData, getContractExtractedData }

export { getBasePersonnel }

export { deleteContractDocument }

export { addHeuresReference }

export { getContractsByProject, saveContract, deleteContract }

export { assignPersonnelToProject }

export { addExternalPersonnelToProject }


export { addPersonnelToProject }


