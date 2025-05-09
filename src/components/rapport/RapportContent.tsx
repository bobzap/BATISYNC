import React from 'react';
import { TachesSection } from '../TachesSection';
import { MachinesSection } from '../MachinesSection';
import { BonsSection } from '../BonsSection';
import { TiersSection } from '../TiersSection';
import type { Rapport, Projet } from '../../types';

interface RapportContentProps {
  activeTab: string;
  rapport: Rapport;
  selectedProject: Projet | null;
  projectId: string;
  heuresReference: number | null;
  onRapportUpdate: (updates: Partial<Rapport>) => void;
  onHeuresChange: (matricule: string, tacheId: string, heures: number) => void;
}

export function RapportContent({
  activeTab,
  rapport,
  selectedProject,
  projectId,
  heuresReference,
  onRapportUpdate,
  onHeuresChange
}: RapportContentProps) {
  return (
    <div className="mt-6">
      {activeTab === 'travaux' && (
        <TachesSection
          taches={rapport.taches}
          personnel={rapport.personnel}
          selectedProject={selectedProject}
          projectId={projectId}
          heuresRef={heuresReference}
          onTachesChange={(taches) => onRapportUpdate({ taches })}
          onHeuresChange={onHeuresChange}
        />
      )}
      {activeTab === 'machines' && (
        <MachinesSection
          taches={rapport.taches}
          onTachesChange={(taches) => onRapportUpdate({ taches })}
        />
      )}
      {activeTab === 'bons' && (
        <BonsSection
          bonsApport={rapport.bonsApport}
          bonsEvacuation={rapport.bonsEvacuation}
          bonsBeton={rapport.bonsBeton}
          bonsMateriaux={rapport.bonsMateriaux}
          onBonsApportChange={(bonsApport) => onRapportUpdate({ bonsApport })}
          onBonsEvacuationChange={(bonsEvacuation) => onRapportUpdate({ bonsEvacuation })}
          onBonsBetonChange={(bonsBeton) => onRapportUpdate({ bonsBeton })}
          onBonsMateriauxChange={(bonsMateriaux) => onRapportUpdate({ bonsMateriaux })}
        />
      )}
      {activeTab === 'tiers' && (
        <TiersSection
          tiers={rapport.tiers}
          onTiersChange={(tiers) => onRapportUpdate({ tiers })}
        />
      )}
    </div>
  );
}