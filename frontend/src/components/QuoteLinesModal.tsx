import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Trash2, Edit, Save, List } from 'lucide-react';
import api from '../api/axios';

interface QuoteGroup {
  id: number;
  quote: number;
  name: string;
}

interface QuoteLine {
  id: number;
  quote: number;
  group: number | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht: number;
  change_status?: 'unchanged' | 'modified' | 'new';
  original_designation?: string;
  original_quantite?: number;
  original_prix_unitaire?: number;
}

interface QuoteLinesModalProps {
  quoteId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteLinesModal = ({ quoteId, isOpen, onClose }: QuoteLinesModalProps) => {
  const queryClient = useQueryClient();
  const [newLine, setNewLine] = useState({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    group: '' as string | number // Empty string for "No Group"
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [editingLine, setEditingLine] = useState<QuoteLine | null>(null);

  // Fetch Lines
  const { data: lines = [], isLoading: isLoadingLines } = useQuery<QuoteLine[]>(
    ['quoteLines', quoteId],
    async () => {
      try {
        const response = await api.get(`/quotes/lines/?quote=${quoteId}`);
        const data = response.data.results || response.data;
        const linesData = Array.isArray(data) ? data : [];
        // Debug: Vérifier les données reçues
        console.log('📊 QuoteLines received:', linesData.length, 'lines');
        if (linesData.length > 0) {
          console.log('   First line change_status:', linesData[0].change_status);
        }
        return linesData;
      } catch (e) {
        console.warn('Lines API error', e);
        return [];
      }
    },
    { 
      enabled: isOpen && !!quoteId,
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }
  );

  // Fetch Groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<QuoteGroup[]>(
    ['quoteGroups', quoteId],
    async () => {
      try {
        const response = await api.get(`/quotes/groups/?quote=${quoteId}`);
        const data = response.data.results || response.data;
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn('Groups API not available yet, defaulting to empty list', e);
        return [];
      }
    },
    { enabled: isOpen && !!quoteId }
  );

  const isLoading = isLoadingLines || isLoadingGroups;

  // Mutations
  const createLineMutation = useMutation(
    (line: any) => api.post('/quotes/lines/', { 
        ...line, 
        quote: quoteId,
        group: line.group === '' ? null : line.group 
    }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes');
        setNewLine(prev => ({ ...prev, designation: '', quantite: 1, prix_unitaire: 0 }));
        console.log('✅ New line created, queries invalidated');
      },
      onError: (err) => console.error('❌ Create line error:', err)
    }
  );

  const updateLineMutation = useMutation(
    (line: any) => api.put(`/quotes/lines/${line.id}/`, line),
    {
      onSuccess: async (response) => {
        // Update cache immediately with the returned data to prevent jumping and show highlight
        const updatedLine = response.data;
        queryClient.setQueryData<QuoteLine[]>(['quoteLines', quoteId], (oldLines) => {
          if (!oldLines) return [];
          return oldLines.map(line => line.id === updatedLine.id ? updatedLine : line);
        });
        
        await queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes');
        setEditingLine(null);
        console.log('✅ Line updated, cache updated and queries invalidated');
      },
      onError: (err) => console.error('❌ Update line error:', err)
    }
  );

  const deleteLineMutation = useMutation(
    (id: number) => api.delete(`/quotes/lines/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes');
      },
    }
  );

  const createGroupMutation = useMutation(
    (name: string) => {
      console.log('Creating group with quoteId:', quoteId, 'name:', name);
      return api.post('/quotes/groups/', { quote: quoteId, name });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteGroups', quoteId]);
        setNewGroupName('');
        setShowGroupInput(false);
      },
      onError: (error: any) => {
        console.error('Error creating group:', error.response?.data || error.message);
        alert('Erreur lors de la création du groupe: ' + (error.response?.data?.quote?.[0] || error.message));
      }
    }
  );

  const deleteGroupMutation = useMutation(
    (id: number) => api.delete(`/quotes/groups/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteGroups', quoteId]);
        queryClient.invalidateQueries(['quoteLines', quoteId]);
      }
    }
  );

  const resetTrackingMutation = useMutation(
    () => api.post('/quotes/lines/reset-tracking/', { quote_id: quoteId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteLines', quoteId]);
        alert('Suivi des modifications réinitialisé avec succès !');
      },
      onError: (error: any) => {
        alert('Erreur lors de la réinitialisation: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Handlers
  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    createLineMutation.mutate(newLine);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroupMutation.mutate(newGroupName);
    }
  };

  const handleUpdateLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLine) {
      updateLineMutation.mutate(editingLine);
    }
  };

  // Organize Data
  const groupedLines = useMemo(() => {
    const map = new Map<number | 'ungrouped', QuoteLine[]>();
    
    // Initialize groups securely
    if (Array.isArray(groups)) {
      groups.forEach(g => map.set(g.id, []));
    }
    map.set('ungrouped', []);

    if (Array.isArray(lines)) {
      lines.forEach(line => {
        // Filtrer les nouvelles lignes (créées dans le suivi)
        // Le devis original ne doit pas afficher les lignes ajoutées post-validation
        if (line.change_status === 'new') return;

        if (line.group) {
          if (map.has(line.group)) {
            map.get(line.group)?.push(line);
          } else {
            map.get('ungrouped')?.push(line);
          }
        } else {
          map.get('ungrouped')?.push(line);
        }
      });
    }
    return map;
  }, [lines, groups]);

  const renderLineRow = (line: QuoteLine) => {
     const isEditing = editingLine?.id === line.id && !!editingLine;
     
     const displayDesignation = line.designation;
     const displayQuantite = line.quantite;
     const displayPrix = Number(line.prix_unitaire);
     const displayTotal = displayQuantite * displayPrix;

     if (isEditing) {
       return (
        <tr key={line.id} className="bg-blue-50">
           <td className="p-2">
             <input
               type="text"
               value={editingLine.designation}
               onChange={(e) => setEditingLine({ ...editingLine, designation: e.target.value })}
               className="w-full p-1 border rounded"
             />
           </td>
           <td className="p-2">
             <input
               type="number"
               value={editingLine.quantite}
               onChange={(e) => setEditingLine({ ...editingLine, quantite: parseInt(e.target.value) })}
               className="w-full p-1 border rounded text-right"
             />
           </td>
           <td className="p-2">
             <input
               type="number"
               step="0.01"
               value={editingLine.prix_unitaire}
               onChange={(e) => setEditingLine({ ...editingLine, prix_unitaire: parseFloat(e.target.value) })}
               className="w-full p-1 border rounded text-right"
             />
           </td>
           <td className="p-3 text-right font-medium">
             {(editingLine.quantite * editingLine.prix_unitaire).toFixed(2)} DH
           </td>
           <td className="p-2 text-center text-nowrap">
              <button onClick={handleUpdateLine} className="text-green-600 hover:bg-green-100 p-1 rounded mx-1">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingLine(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded mx-1">
                <X className="w-4 h-4" />
              </button>
           </td>
        </tr>
       );
     }

     return (
       <tr key={line.id} className="hover:bg-gray-50 border-b last:border-0 border-gray-100 transition-colors">
         <td className="p-3 text-sm">
           {displayDesignation}
         </td>
         <td className="p-3 text-right text-sm">
           {displayQuantite}
         </td>
         <td className="p-3 text-right text-sm">
           {displayPrix.toFixed(2)} DH
         </td>
         <td className="p-3 text-right font-medium text-sm">{displayTotal.toFixed(2)} DH</td>
         <td className="p-3 text-center text-nowrap">
             <>
               <button onClick={() => setEditingLine(line)} className="text-blue-600 hover:bg-blue-50 p-1 rounded mx-1">
                 <Edit className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => {
                   if (window.confirm('Supprimer cette ligne ?')) deleteLineMutation.mutate(line.id);
                 }} 
                 className="text-red-600 hover:bg-red-50 p-1 rounded mx-1"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </>
         </td>
       </tr>
     );
  };

  const renderSection = (title: string, lines: QuoteLine[], groupId?: number) => {
    if (lines.length === 0 && !groupId) return null; // Don't show empty ungrouped section
    
    const subTotal = lines.reduce((sum, line) => {
      const montant = Number(line.montant_ht) || 0;
      return sum + montant;
    }, 0);

    return (
      <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 flex items-center">
              <List className="w-4 h-4 mr-2" />
              {title}
              <span className="ml-2 text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                {lines.length} lignes
              </span>
            </h4>
            <div className="flex items-center gap-4">
               <span className="text-sm font-bold text-gray-700">
                 S/Total: {subTotal.toFixed(2)} DH
               </span>
               {groupId && (
                 <button 
                  onClick={() => {
                    if(window.confirm('Supprimer ce groupe ? Les lignes deviendront sans groupe.')) deleteGroupMutation.mutate(groupId);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Supprimer le groupe"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 border-b bg-gray-50/50">
                <th className="p-2 pl-3">Désignation</th>
                <th className="p-2 text-right">Qté</th>
                <th className="p-2 text-right">P.U.</th>
                <th className="p-2 text-right">Total HT</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
               {lines.length === 0 ? (
                 <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic text-sm">Aucune ligne dans ce groupe</td></tr>
               ) : (
                 lines.map(renderLineRow)
               )}
            </tbody>
          </table>
        </div>
        {/* Quick Add Button logic could go here */}
      </div>
    );
  };


  if (!isOpen) return null;

  const ungroupedLines = groupedLines.get('ungrouped') || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestion des lignes du devis</h2>
            <p className="text-sm text-gray-500">Ajoutez des lignes simples ou organisez-les par groupes.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
          
          {/* Main Form */}
          <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-blue-600" />
              Ajouter une nouvelle ligne
            </h3>
            <form onSubmit={handleAddLine}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Désignation</label>
                  <input
                    type="text"
                    value={newLine.designation}
                    onChange={(e) => setNewLine({ ...newLine, designation: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Ex: Câble réseau..."
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Groupe (Optionnel)</label>
                  <select
                    value={newLine.group}
                    onChange={(e) => setNewLine({ ...newLine, group: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">-- Aucun groupe --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    value={newLine.quantite}
                    onChange={(e) => setNewLine({ ...newLine, quantite: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm text-right"
                    required
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prix Unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLine.prix_unitaire}
                    onChange={(e) => setNewLine({ ...newLine, prix_unitaire: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm text-right"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="submit"
                    disabled={createLineMutation.isLoading}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Group Management */}
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-800">Contenu du devis</h3>
             {!showGroupInput ? (
               <button 
                onClick={() => setShowGroupInput(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 Créer un groupe
               </button>
             ) : (
               <form onSubmit={handleAddGroup} className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Nom du groupe..." 
                   value={newGroupName}
                   onChange={e => setNewGroupName(e.target.value)}
                   className="text-sm p-1.5 border rounded w-48 focus:ring-2 focus:ring-blue-500"
                 />
                 <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">OK</button>
                 <button type="button" onClick={() => setShowGroupInput(false)} className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-300">X</button>
               </form>
             )}
          </div>

          {/* Render Groups and Lines */}
          {isLoading ? (
             <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
             <div className="space-y-4">
                {/* Ungrouped Lines (First) */}
                {renderSection("Lignes sans groupe", ungroupedLines)}

                {/* Groups */}
                {groups.map(group => (
                  <div key={group.id}>
                    {renderSection(group.name, groupedLines.get(group.id) || [], group.id)}
                  </div>
                ))}

                {lines.length === 0 && groups.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                    <p className="text-gray-500 mb-2">Le devis est vide.</p>
                    <p className="text-sm text-gray-400">Ajoutez des lignes via le formulaire ci-dessus.</p>
                  </div>
                )}
             </div>
          )}

        </div>
        
        <div className="p-4 border-t bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition shadow-sm">
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
};
