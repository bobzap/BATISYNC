// Types de base
export interface PersonnelFonction {
  id: string;
  code: string;
  libelle: string;
  couleur_claire: string;
  couleur_sombre: string;
  ordre: number;
  actif: boolean;
}

export interface Personnel {
  nom: string;
  role: string;
  matricule: string;
  entreprise: string;
  equipe: string;
  zone?: string;
  heuresPresence: number;
}

export interface Machine {
  nom: string;
  type: string;
  numeroMateriel: string;
  entreprise: string;
  quantite: number;
  remarques: string;
}

export interface Projet {
  id: string;
  nom: string;
  numeroChantier: string;
  directionChantier: string;
  responsableCTX: string;
  cmCe: string;
  actif: boolean;
  dateCreation: string;
  dateMiseAJour: string;
}

export interface HeuresReference {
  id: string;
  projectId: string;
  heures: number;
  dateDebut: string;
  dateFin?: string;
  createdAt: string;
  createdBy: string;
}

// Types pour le personnel de base
export interface BasePersonnel {
  id: string;
  numero_personnel: string;
  nom: string;
  prenom: string;
  intitule_fonction: string;
  entreprise: string;
  code_departement: string;
  siege: string;
  statut: string;
  time_add: string;
}

// Types pour le personnel projet
export interface ProjectPersonnel {
  id: string;
  project_id: string;
  personnel_id?: string | null;
  nom?: string;
  prenom?: string;
  intitule_fonction?: string;
  entreprise?: string;
  zone: string;
  equipe: string;
  date_debut: string;
  date_fin?: string;
  statut: string;
  created_at: string;
  updated_at: string;
  // Relations
  personnel?: BasePersonnel;
}

// Types pour les bons
export interface BonBase {
  fournisseur: string;
  numeroBon: string;
  prixUnitaire?: number;
  quantite: number;
  unite: string;
}

export interface BonApport extends BonBase {
  materiaux: string;
  lieuChargement: string;
  lieuDechargement: string;
  typeCamion: string;
}

export interface BonEvacuation extends BonBase {
  materiaux: string;
  lieuChargement: string;
  lieuDechargement: string;
  typeCamion: string;
}

export interface BonBeton extends BonBase {
  articles: string;
  typeFourniture: string;
  typeCamion: string;
}

export interface BonMateriaux extends BonBase {
  fournitures: string;
}

// Types pour le suivi de chantier
export interface SiteEvent {
  id: string;
  type: 'livraison' | 'intervention' | 'autre';
  title: string;
  description: string;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  notified: boolean;
}

export interface Contract {
  id: string;
  type: 'fournisseur' | 'sous-traitance' | 'location' | 'commande-unique';
  reference: string;
  entreprise: string;
  montantHT: number;
  dateDebut: string;
  dateFin?: string;
  statut: 'actif' | 'termine' | 'suspendu';
  avenants: ContractAmendment[];
  documents: ContractDocument[];
}

export interface ContractAmendment {
  id: string;
  reference: string;
  description: string;
  montantHT: number;
  date: string;
}

export interface ContractDocument {
  id: string;
  nom: string;
  type: string;
  url: string;
  dateUpload: string;
}

// Types pour les données extraites des contrats
export interface ContractExtractedData {
  id: string;
  contractId: string;
  documentId?: string;
  documentName?: string | null;
  section: 'articles' | 'conditions' | 'conditions_speciales';
  data: ContractDataRow[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractDataRow {
  id: string;
  values: Record<string, string | number>;
}

// Colonnes par section
export const SECTION_COLUMNS = {
  articles: [
    { id: 'poste', name: 'Poste', type: 'text' },
    { id: 'description', name: 'Description de l\'article', type: 'text' },
    { id: 'quantite', name: 'Quantité', type: 'number' },
    { id: 'unite', name: 'Unité', type: 'text' },
    { id: 'prix_unitaire', name: 'Prix unitaire (CHF)', type: 'number' },
    { id: 'montant_total', name: 'Montant total (CHF)', type: 'number' }
  ],
  conditions: [
    { id: 'type', name: 'Type', type: 'text' },
    { id: 'valeur', name: 'Valeur', type: 'text' },
    { id: 'description', name: 'Description', type: 'text' }
  ],
  conditions_speciales: [
    { id: 'type', name: 'Type', type: 'text' },
    { id: 'valeur', name: 'Valeur', type: 'text' },
    { id: 'remarques', name: 'Remarques', type: 'text' }
  ]
};

// Valeurs par défaut pour les sections
export const DEFAULT_SECTION_VALUES = {
  conditions: [
    { type: 'Transport livraison', valeur: '', description: '' },
    { type: 'RPLP', valeur: '', description: '' },
    { type: 'Majoration de prix', valeur: '', description: '' },
    { type: 'Rabais', valeur: '', description: '' }
  ],
  conditions_speciales: [
    { type: 'Escompte', valeur: '', remarques: '' },
    { type: 'RG', valeur: '', remarques: '' },
    { type: 'Remarques', valeur: '', remarques: '' }
  ]
};

export interface Invoice {
  id: string;
  projectId: string;
  number: string;
  reference?: string;
  supplier: string;
  date: string;
  dueDate: string;
  amountHT: number;
  amountTTC: number;
  vatRate: number;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  paymentDate?: string;
  paymentReference?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    date: string;
    size?: number;
  }[];
  vouchers?: (Voucher & { amount: number })[];
}

export interface CostTracking {
  periode: string;
  salaires: {
    montant: number;
    details: {
      categorie: string;
      montant: number;
    }[];
  };
  materiaux: {
    montant: number;
    details: {
      categorie: string;
      montant: number;
    }[];
  };
  inventaires: {
    montant: number;
    details: {
      categorie: string;
      montant: number;
    }[];
  };
  tiers: {
    montant: number;
    details: {
      categorie: string;
      montant: number;
    }[];
  };
  total: number;
}

// Types pour les tâches et le personnel
export interface TacheMachine {
  numeroMateriel: string;
  entreprise: string;
  heures: number;
  remarques: string;
}

export interface TachePersonnel {
  matricule: string;
  heures: Record<string, number>; // Map des heures par zone/tâche
}

export interface Tache {
  zone: string;
  description: string;
  machines: TacheMachine[];
  totalHeures?: number;
}

export interface PersonnelHeures {
  matricule: string;
  nom: string;
  role: string;
  heuresReference: number;
  heuresParTache: Record<string, number>; // Map des heures par tâche (zone + description)
  totalHeures: number;
}

export interface Tiers {
  entreprise: string;
  activite: string;
  nombrePersonnes: number;
  heuresPresence: number;
  zone: string;
}

// Type pour le rapport journalier
export interface Rapport {
  nomChantier: string;
  date: string;
  heuresReference?: number;
  meteo: {
    condition: string;
    temperature: number;
  };
  evenementsParticuliers: {
    betonnage: boolean;
    essais: boolean;
    poseEnrobe: boolean;
    controleExtInt: boolean;
    reception: boolean;
  };
  personnel: Personnel[];
  taches: Tache[];
  machines: Machine[];
  securite: {
    incidents: string[];
    mesuresPrises: string[];
  };
  materiaux: any[];
  bonsApport: BonApport[];
  bonsEvacuation: BonEvacuation[];
  bonsBeton?: BonBeton[];
  bonsMateriaux?: BonMateriaux[];
  tiers: Tiers[];
  remarques: string;
  photos: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    type: 'image' | 'pdf';
    size: number;
  }[];
  remarquesContremaitre: string;
  visaContremaitre: boolean;
}

export const emptyRapport: Rapport = {
  id: '',
  nomChantier: '',
  date: '',
  meteo: {
    condition: 'ensoleille',
    temperature: 20,
  },
  evenementsParticuliers: {
    betonnage: false,
    essais: false,
    poseEnrobe: false,
    controleExtInt: false,
    reception: false,
  },
  personnel: [],
  taches: [],
  machines: [],
  securite: {
    incidents: [],
    mesuresPrises: [],
  },
  materiaux: [],
  bonsApport: [],
  bonsEvacuation: [],
  bonsBeton: [],
  bonsMateriaux: [],
  tiers: [],
  remarques: '',
  photos: [],
  remarquesContremaitre: '',
  visaContremaitre: false
};
// Types pour le suivi des bons
export interface VoucherBase {
  id: string;
  projectId: string;
  type: 'delivery' | 'evacuation' | 'concrete' | 'materials';
  number: string;
  supplier: string;
  date: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedAt?: string;
  invoiceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryVoucher extends VoucherBase {
  type: 'delivery';
  materials: string;
  loadingLocation: string;
  unloadingLocation: string;
  truckType: string;
}

export interface EvacuationVoucher extends VoucherBase {
  type: 'evacuation';
  materials: string;
  loadingLocation: string;
  unloadingLocation: string;
  truckType: string;
}

export interface ConcreteVoucher extends VoucherBase {
  type: 'concrete';
  concreteType: string;
  strength: string;
  additives?: string[];
  truckType: string;
}

export interface MaterialsVoucher extends VoucherBase {
  type: 'materials';
  materials: string;
  reference?: string;
}

export type Voucher = DeliveryVoucher | EvacuationVoucher | ConcreteVoucher | MaterialsVoucher;

// Types pour le suivi des factures
export interface Invoice {
  id: string;
  projectId: string;
  number: string;
  supplier: string;
  date: string;
  dueDate: string;
  amountHT: number;
  amountTTC: number;
  vatRate: number;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  paymentDate?: string;
  paymentReference?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  vouchers?: VoucherLink[];
}

export interface VoucherLink {
  voucherId: string;
  amount: number;
}

// Types pour le suivi des coûts
export interface CostCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  categoryId: string;
  date: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostBudget {
  id: string;
  projectId: string;
  categoryId: string;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  category: CostCategory;
  budget: number;
  actual: number;
  variance: number;
  percentageComplete: number;
}

// Types pour l'authentification
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'conducteur' | 'contremaitre';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  createProject: boolean;
  editProject: boolean;
  viewPlanning: boolean;
  editPlanning: boolean;
  viewContracts: boolean;
  editContracts: boolean;
  viewVouchers: boolean;
  editVouchers: boolean;
  viewInvoices: boolean;
  editInvoices: boolean;
  viewCosts: boolean;
  editCosts: boolean;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  permissions: UserPermissions;
}