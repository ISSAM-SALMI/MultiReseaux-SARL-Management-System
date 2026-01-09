import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Trash2, Save } from 'lucide-react';
import api from '../api/axios';

interface TrackingLine {
  id: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht: number;
  tracking: number;
}

interface TrackingLinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingId: number;
  quoteNumber: string;
  initialTotalHt: number;
}

export const TrackingLinesModal = ({ isOpen, onClose, trackingId, quoteNumber, initialTotalHt }: TrackingLinesModalProps) => {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<TrackingLine[]>([]);

  const [newLine, setNewLine] = useState({
    designation: '',
    quantite: 0,
    prix_unitaire: 0,
  });

  const { isLoading } = useQuery(
    ['tracking-lines', trackingId],
    async () => {
      const response = await api.get(`/quotes/tracking-lines/?tracking=${trackingId}`);
      return response.data.results || response.data;
    },
    {
      enabled: isOpen && !!trackingId,
      onSuccess: (data) => setLines(data),
    }
  );

  const updateLineMutation = useMutation(
    async (line: TrackingLine) => {
      await api.patch(`/quotes/tracking-lines/${line.id}/`, line);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tracking-lines', trackingId]);
      },
    }
  );

  const deleteLineMutation = useMutation(
    async (lineId: number) => {
      await api.delete(`/quotes/tracking-lines/${lineId}/`);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['tracking-lines', trackingId]);
        setLines(lines.filter(l => l.id !== variables));
      },
    }
  );

  const createLineMutation = useMutation(
    async (lineData: any) => {
      await api.post('/quotes/tracking-lines/', {
        ...lineData,
        tracking: trackingId
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tracking-lines', trackingId]);
        setNewLine({
          designation: '',
          quantite: 0,
          prix_unitaire: 0,
        });
      },
    }
  );

  const handleUpdateLine = (index: number, field: keyof TrackingLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-save or wait for button? 
    // Let's calculate montant_ht locally for display
    if (field === 'quantite' || field === 'prix_unitaire') {
        newLines[index].montant_ht = newLines[index].quantite * newLines[index].prix_unitaire;
    }
    
    setLines(newLines);
  };

  const saveLine = (line: TrackingLine) => {
      updateLineMutation.mutate(line);
  };

  const currentTotalHt = lines.reduce((sum, line) => sum + (line.quantite * line.prix_unitaire), 0);
  const variance = currentTotalHt - initialTotalHt;

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-800">
            Suivi des lignes - Devis {quoteNumber}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Qté</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">P.U (DH)</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Total HT</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={line.designation}
                      onChange={(e) => handleUpdateLine(index, 'designation', e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={line.quantite}
                      onChange={(e) => handleUpdateLine(index, 'quantite', Number(e.target.value))}
                      className="w-full text-right border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={line.prix_unitaire}
                      onChange={(e) => handleUpdateLine(index, 'prix_unitaire', Number(e.target.value))}
                      className="w-full text-right border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {(line.quantite * line.prix_unitaire).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 flex justify-center space-x-2">
                    <button
                        onClick={() => saveLine(line)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Enregistrer"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteLineMutation.mutate(line.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Add New Line Row */}
              <tr className="bg-blue-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Nouvelle désignation"
                    value={newLine.designation}
                    onChange={(e) => setNewLine({ ...newLine, designation: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={newLine.quantite}
                    onChange={(e) => setNewLine({ ...newLine, quantite: Number(e.target.value) })}
                    className="w-full text-right border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newLine.prix_unitaire}
                    onChange={(e) => setNewLine({ ...newLine, prix_unitaire: Number(e.target.value) })}
                    className="w-full text-right border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2 text-right text-gray-500">
                  -
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => createLineMutation.mutate(newLine)}
                    disabled={!newLine.designation}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 p-4 bg-gray-100 rounded-md flex justify-between items-center">
            <div className="text-sm text-gray-600">
                <div>Total Initial (Devis): <span className="font-semibold">{initialTotalHt.toFixed(2)} DH</span></div>
            </div>
            
            <div className="flex items-center space-x-6">
                <div className={`px-4 py-2 rounded-md font-bold text-lg flex items-center ${
                    variance > 0 ? 'bg-green-100 text-green-700' :
                    variance < 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-200 text-gray-700'
                }`}>
                    <span className="mr-2">Écart:</span>
                    {variance > 0 && '+'}
                    {variance.toFixed(2)} DH
                </div>
                
                <div className="text-lg font-bold">
                    Total HT Réel: {currentTotalHt.toFixed(2)} DH
                </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
