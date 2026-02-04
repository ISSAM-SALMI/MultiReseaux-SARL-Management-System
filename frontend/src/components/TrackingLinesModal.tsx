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
  const [highlightedEditedIds, setHighlightedEditedIds] = useState<Set<number>>(new Set());
  const [highlightedAddedIds, setHighlightedAddedIds] = useState<Set<number>>(new Set());

  const HIGHLIGHTS_KEY = 'tracking_line_highlights_v1';

  const loadHighlightsForTracking = (trackId: number) => {
    try {
      const raw = localStorage.getItem(HIGHLIGHTS_KEY);
      if (!raw) return { edited: new Set<number>(), added: new Set<number>() };
      const parsed = JSON.parse(raw || '{}');
      const obj = parsed[trackId] || { edited: [], added: [] };
      return { edited: new Set<number>(obj.edited || []), added: new Set<number>(obj.added || []) };
    } catch (e) {
      return { edited: new Set<number>(), added: new Set<number>() };
    }
  };

  const saveHighlightsForTracking = (trackId: number, editedSet: Set<number>, addedSet: Set<number>) => {
    try {
      const raw = localStorage.getItem(HIGHLIGHTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[trackId] = { edited: Array.from(editedSet), added: Array.from(addedSet) };
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
  };

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

  useEffect(() => {
    if (isOpen && trackingId) {
      const loaded = loadHighlightsForTracking(trackingId);
      setHighlightedEditedIds(loaded.edited);
      setHighlightedAddedIds(loaded.added);
    }
  }, [isOpen, trackingId]);

  const updateLineMutation = useMutation(
    async (line: TrackingLine) => {
      const response = await api.patch(`/quotes/tracking-lines/${line.id}/`, line);
      return response.data;
    },
    {
      onSuccess: (updatedLine: TrackingLine) => {
        setLines((prev) => {
          // Keep the exact same index: find existing index and replace
          const idx = prev.findIndex((l) => l.id === updatedLine.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = updatedLine;
          return next;
        });

        // Persistently mark this line as edited for this tracking
        setHighlightedEditedIds((prevEdited) => {
          const nextEdited = new Set(prevEdited);
          nextEdited.add(updatedLine.id);
          // also remove from added set if present
          setHighlightedAddedIds((prevAdded) => {
            const nextAdded = new Set(prevAdded);
            nextAdded.delete(updatedLine.id);
            saveHighlightsForTracking(trackingId, nextEdited, nextAdded);
            return nextAdded;
          });
          return nextEdited;
        });
      },
      onError: () => {
        // Optionally, show error (kept silent here)
      }
    }
  );

  const deleteLineMutation = useMutation(
    async (lineId: number) => {
      await api.delete(`/quotes/tracking-lines/${lineId}/`);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['tracking-lines', trackingId]);
        setLines((prev) => prev.filter(l => l.id !== variables));
        // Remove highlight from both sets if present
        setHighlightedEditedIds((prev) => {
          const next = new Set(prev);
          next.delete(variables as number);
          return next;
        });
        setHighlightedAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(variables as number);
          saveHighlightsForTracking(trackingId, highlightedEditedIds, next);
          return next;
        });
      },
    }
  );

  const createLineMutation = useMutation(
    async (lineData: any) => {
      const response = await api.post('/quotes/tracking-lines/', {
        ...lineData,
        tracking: trackingId
      });
      return response.data;
    },
    {
      onSuccess: (createdLine: TrackingLine) => {
        // Append new line to the end to preserve order
        setLines((prev) => [...prev, createdLine]);
        // Mark as added (persistently)
        setHighlightedAddedIds((prev) => {
          const next = new Set(prev);
          next.add(createdLine.id);
          saveHighlightsForTracking(trackingId, highlightedEditedIds, next);
          return next;
        });

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
    // If the user starts editing a line that was previously highlighted,
    // remove the persistent highlight (it will be re-added on successful save)
    const editedId = newLines[index]?.id;
    if (editedId) {
      // remove from added
      setHighlightedAddedIds((prev) => {
        if (!prev.has(editedId)) return prev;
        const next = new Set(prev);
        next.delete(editedId);
        saveHighlightsForTracking(trackingId, highlightedEditedIds, next);
        return next;
      });
      // remove from edited (user action implies transient change)
      setHighlightedEditedIds((prev) => {
        if (!prev.has(editedId)) return prev;
        const next = new Set(prev);
        next.delete(editedId);
        saveHighlightsForTracking(trackingId, next, highlightedAddedIds);
        return next;
      });
    }
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
                <tr key={line.id} className={`${highlightedEditedIds.has(line.id) ? 'bg-yellow-100' : highlightedAddedIds.has(line.id) ? 'bg-blue-100' : ''}`}>
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
                      readOnly
                      disabled
                      aria-readonly="true"
                      className="w-full text-right border-gray-200 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
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
