import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { X } from 'lucide-react';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  budgetTotal: number;
  existingRevenue?: any;
}

export const RevenueModal = ({ isOpen, onClose, projectId, budgetTotal, existingRevenue }: RevenueModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    avance: 0,
    montant_en_cours: 0,
  });

  useEffect(() => {
    if (existingRevenue) {
      setFormData({
        avance: parseFloat(existingRevenue.avance) || 0,
        montant_en_cours: parseFloat(existingRevenue.montant_en_cours) || 0,
      });
    } else {
        setFormData({
            avance: 0,
            montant_en_cours: 0,
        });
    }
  }, [existingRevenue]);

  // Automatic calculation of "Montant en cours" (Remaining)
  useEffect(() => {
    const avance = formData.avance || 0;
    // Logic: Remaining = Budget - Avance
    const calculatedEnCours = Math.max(0, budgetTotal - avance);
    
    setFormData(prev => {
        if (prev.montant_en_cours !== calculatedEnCours) {
            return { ...prev, montant_en_cours: calculatedEnCours };
        }
        return prev;
    });
  }, [formData.avance, budgetTotal]);

  const mutation = useMutation(
    (data: any) => {
      if (existingRevenue) {
        return api.put(`/projects/revenues/${existingRevenue.id_revenue}/`, { ...data, project: projectId });
      } else {
        return api.post('/projects/revenues/', { ...data, project: projectId });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        onClose();
        alert('Revenu enregistré avec succès !');
      },
      onError: (error: any) => {
        console.error("Erreur revenu:", error);
        const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : "Erreur lors de l'enregistrement du revenu.";
        alert(`Erreur: ${errorMessage}`);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
        
        <h3 className="text-lg font-bold mb-4">Gestion des Revenus</h3>
        
        <div className="mb-4 p-3 bg-blue-50 rounded text-blue-800 text-sm">
            <strong>Budget Total du Projet:</strong> {budgetTotal.toLocaleString()} DH
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Avance (DH)</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded"
              value={formData.avance}
              onChange={(e) => setFormData({ ...formData, avance: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant en cours / Reste à payer (Calculé)</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded bg-gray-100"
              value={formData.montant_en_cours}
              readOnly
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {mutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
