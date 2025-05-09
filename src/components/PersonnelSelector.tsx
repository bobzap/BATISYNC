@@ .. @@
 interface PersonnelSelectorProps {
   isOpen: boolean;
   onClose: () => void;
-  onSelect: (personnel: BasePersonnel) => void;
+  onSelect: (personnel: ProjectPersonnel) => void;
   selectedIds?: string[];
+  projectId: string;
 }
 
 export function PersonnelSelector({ 
   isOpen, 
   onClose, 
   onSelect, 
-  selectedIds = []
+  selectedIds = [],
+  projectId
 }: PersonnelSelectorProps) {
@@ .. @@
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
-  const [basePersonnel, setBasePersonnel] = useState<BasePersonnel[]>([]);
+  const [projectPersonnel, setProjectPersonnel] = useState<ProjectPersonnel[]>([]);
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

@@ .. @@
   // Charger le personnel de base
   useEffect(() => {
     async function loadBasePersonnel() {
       try {
         setLoading(true);
-        const data = await getBasePersonnel();
-        setBasePersonnel(data);
+        const data = await getProjectPersonnel(projectId);
+        setProjectPersonnel(data);
         console.log('Personnel de base chargé:', data);
       } catch (err) {
         console.error('Erreur lors du chargement du personnel:', err);
@@ -  }, []);
+  }, [projectId]);

   // Filtrer le personnel
-  const filteredPersonnel = basePersonnel.filter(p => {
+  const filteredPersonnel = projectPersonnel.filter(p => {
+    if (!p.personnel) return false;
+    
     const searchLower = debouncedSearchTerm.toLowerCase();
     const matchesSearch = !debouncedSearchTerm || 
-      p.nom.toLowerCase().includes(searchLower) ||
-      
-      p.numero_personnel.toLowerCase().includes(searchLower);
+      p.personnel.nom.toLowerCase().includes(searchLower) ||
+      
+      p.personnel.numero_personnel.toLowerCase().includes(searchLower);

-    const matchesRole = !filters.role || p.role === filters.role;
-    const matchesDepartement = !filters.departement || p.departement === filters.departement;
+    const matchesRole = !filters.role || p.personnel.intitule_fonction === filters.role;
+    const matchesDepartement = !filters.departement || p.personnel.code_departement === filters.departement;

     return matchesSearch && matchesRole && matchesDepartement;
   });