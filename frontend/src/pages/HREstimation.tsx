import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Save, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';

interface EstimationRow {
  id?: number;
  fonction: string;
  nbr_salaries: number;
  taux_affectation: number;
  duree_travail_mois: number;
  jours_par_mois: number;
  salaire_journalier: number;
}

export const HREstimation = () => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<EstimationRow[]>([]);
  const [totalCost, setTotalCost] = useState<number | null>(null);

  // Fetch existing data
  const { isLoading } = useQuery<EstimationRow[]>('hr-estimation', async () => {
    const response = await api.get('/hr-estimation/');
    return response.data.results || response.data;
  }, {
    onSuccess: (data) => {
      if (data.length > 0) {
        setRows(data);
      } else if (rows.length === 0) {
        // Initialize with one empty row if nothing saved and nothing in state
        setRows([{
          id: Date.now(),
          fonction: '',
          nbr_salaries: 1,
          taux_affectation: 100,
          duree_travail_mois: 1,
          jours_par_mois: 26,
          salaire_journalier: 0
        }]);
      }
    }
  });

  // Save Mutation
  const saveMutation = useMutation(
    (data: EstimationRow[]) => api.post('/hr-estimation/bulk_update_rows/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
        alert('Estimation sauvegardée avec succès !');
      },
      onError: (error: any) => {
        console.error("Save error:", error);
        const detail = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
        alert(`Erreur lors de la sauvegarde: ${detail}`);
      }
    }
  );

  // Clear Mutation
  const clearMutation = useMutation(
    () => api.delete('/hr-estimation/clear_all/'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
        setRows([{
          id: Date.now(),
          fonction: '',
          nbr_salaries: 1,
          taux_affectation: 100,
          duree_travail_mois: 1,
          jours_par_mois: 26,
          salaire_journalier: 0
        }]);
        setTotalCost(null);
        alert('Tableau vidé avec succès !');
      },
      onError: () => {
        alert('Erreur lors du vidage du tableau.');
      }
    }
  );

  const calculateDurationDays = (row: EstimationRow) => {
    return row.nbr_salaries * (row.taux_affectation / 100) * row.duree_travail_mois * row.jours_par_mois;
  };

  const calculatePartialCost = (row: EstimationRow) => {
    const durationDays = calculateDurationDays(row);
    return durationDays * row.salaire_journalier;
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now(), // Temporary ID for key
        fonction: '',
        nbr_salaries: 1,
        taux_affectation: 100,
        duree_travail_mois: 1,
        jours_par_mois: 26,
        salaire_journalier: 0
      }
    ]);
  };

  const handleDeleteRow = (id: number | undefined) => {
    if (!id) return;
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: number | undefined, field: keyof EstimationRow, value: any) => {
    if (!id) return;
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleEstimate = () => {
    const total = rows.reduce((sum, row) => sum + calculatePartialCost(row), 0);
    setTotalCost(total);
  };

  const handleSave = () => {
    // Remove temporary IDs before sending if they are large numbers (Date.now())
    // Actually, the backend replaces everything, so we can just send the data.
    // But we should probably strip the 'id' if it's a temporary one to avoid validation errors if backend expects existing IDs?
    // The backend serializer might ignore ID if we don't include it, or we can just send it and let backend handle it.
    // Since we are doing a full replace (delete all + create all), we don't need to send IDs.
    const dataToSend = rows.map(({ id, ...rest }) => rest);
    saveMutation.mutate(dataToSend as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Estimation des Besoins RH</h1>
        <div className="space-x-2">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isLoading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
          <button
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir vider le tableau ?')) {
                clearMutation.mutate();
              }
            }}
            disabled={clearMutation.isLoading}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Vider
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600">Fonction</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-24">Nbr Salariés</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-24">Taux (%)</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-24">Durée (Mois)</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-24">Jours/Mois</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-32">Durée (Jours)</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-32">Salaire Jr (DH)</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-32">Coût Partiel</th>
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={row.fonction}
                    onChange={(e) => updateRow(row.id, 'fonction', e.target.value)}
                    placeholder="Fonction"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={row.nbr_salaries}
                    onChange={(e) => updateRow(row.id, 'nbr_salaries', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2 border rounded"
                    value={row.taux_affectation}
                    onChange={(e) => updateRow(row.id, 'taux_affectation', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={row.duree_travail_mois}
                    onChange={(e) => updateRow(row.id, 'duree_travail_mois', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={row.jours_par_mois}
                    onChange={(e) => updateRow(row.id, 'jours_par_mois', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4 font-medium text-gray-700">
                  {calculateDurationDays(row).toFixed(2)}
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={row.salaire_journalier}
                    onChange={(e) => updateRow(row.id, 'salaire_journalier', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4 font-medium text-blue-600">
                  {calculatePartialCost(row).toFixed(2)} DH
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end space-y-4">
        <button
          onClick={handleEstimate}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-lg font-semibold"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculer Total
        </button>

        {totalCost !== null && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-green-100">
            <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold">Coût Total Estimé</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {totalCost.toFixed(2)} DH
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
