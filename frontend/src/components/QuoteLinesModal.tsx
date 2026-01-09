import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Trash2, Edit, Save } from 'lucide-react';
import api from '../api/axios';

interface QuoteLine {
  id: number;
  quote: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht: number;
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
    prix_unitaire: 0
  });
  const [editingLine, setEditingLine] = useState<QuoteLine | null>(null);

  const { data: lines = [], isLoading } = useQuery<QuoteLine[]>(
    ['quoteLines', quoteId],
    async () => {
      const response = await api.get(`/quotes/lines/?quote=${quoteId}`);
      return response.data.results || response.data;
    },
    {
      enabled: isOpen && !!quoteId
    }
  );

  const createMutation = useMutation(
    (line: any) => api.post('/quotes/lines/', { ...line, quote: quoteId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes'); // Update totals on main page
        setNewLine({ designation: '', quantite: 1, prix_unitaire: 0 });
      },
    }
  );

  const updateMutation = useMutation(
    (line: any) => api.put(`/quotes/lines/${line.id}/`, line),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes');
        setEditingLine(null);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/quotes/lines/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quoteLines', quoteId]);
        queryClient.invalidateQueries('quotes');
      },
    }
  );

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newLine);
  };

  const handleUpdateLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLine) {
      updateMutation.mutate(editingLine);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold">Gérer les lignes du devis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Add New Line Form */}
          <form onSubmit={handleAddLine} className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Ajouter une ligne</h3>
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">Désignation</label>
                <input
                  type="text"
                  value={newLine.designation}
                  onChange={(e) => setNewLine({ ...newLine, designation: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  value={newLine.quantite}
                  onChange={(e) => setNewLine({ ...newLine, quantite: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Prix Unitaire</label>
                <input
                  type="number"
                  step="0.01"
                  value={newLine.prix_unitaire}
                  onChange={(e) => setNewLine({ ...newLine, prix_unitaire: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </button>
              </div>
            </div>
          </form>

          {/* Lines Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 font-medium text-gray-600">Désignation</th>
                  <th className="p-3 font-medium text-gray-600 w-24 text-right">Qté</th>
                  <th className="p-3 font-medium text-gray-600 w-32 text-right">P.U.</th>
                  <th className="p-3 font-medium text-gray-600 w-32 text-right">Total HT</th>
                  <th className="p-3 font-medium text-gray-600 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Chargement...</td></tr>
                ) : lines.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">Aucune ligne</td></tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      {editingLine?.id === line.id ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <td className="p-3">{line.designation}</td>
                          <td className="p-3 text-right">{line.quantite}</td>
                          <td className="p-3 text-right">{line.prix_unitaire} DH</td>
                          <td className="p-3 text-right font-medium">{line.montant_ht} DH</td>
                          <td className="p-3 text-center space-x-1">
                            <button onClick={() => setEditingLine(line)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
                                  deleteMutation.mutate(line.id);
                                }
                              }} 
                              className="text-red-600 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
