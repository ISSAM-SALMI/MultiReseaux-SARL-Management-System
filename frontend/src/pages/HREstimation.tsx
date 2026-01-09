import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, Calculator, Plus, Trash2, Save, X, RotateCcw,
  Briefcase, Clock, Calendar, DollarSign, TrendingUp, PieChart
} from 'lucide-react';
import api from '../api/axios';

interface EstimationRow {
  id: number;
  fonction: string;
  nbr_salaries: number;
  taux_affectation: number;
  duree_travail_mois: number;
  jours_par_mois: number;
  salaire_journalier: number;
}

const EstimationDetailsPanel = ({ 
  row, 
  onClose,
  isCreating = false 
}: { 
  row: EstimationRow | null; 
  onClose: () => void;
  isCreating: boolean;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<EstimationRow>>({
    fonction: '',
    nbr_salaries: 1,
    taux_affectation: 100,
    duree_travail_mois: 1,
    jours_par_mois: 26,
    salaire_journalier: 0
  });

  // Load data
  useMemo(() => {
    if (row && !isCreating) {
      setFormData(row);
    } else if (isCreating) {
      setFormData({
        fonction: '',
        nbr_salaries: 1,
        taux_affectation: 100,
        duree_travail_mois: 1,
        jours_par_mois: 26,
        salaire_journalier: 0
      });
    }
  }, [row, isCreating]);

  // Calculations
  const calculated = useMemo(() => {
    const days = (formData.nbr_salaries || 0) * ((formData.taux_affectation || 0) / 100) * (formData.duree_travail_mois || 0) * (formData.jours_par_mois || 0);
    const cost = days * (formData.salaire_journalier || 0);
    return { days, cost };
  }, [formData]);

  const createMutation = useMutation(
    (data: any) => api.post('/hr-estimation/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
        onClose();
      },
      onError: (err: any) => alert("Erreur création")
    }
  );

  const updateMutation = useMutation(
    (data: any) => api.patch(`/hr-estimation/${row?.id}/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
      },
      onError: (err: any) => alert("Erreur modification")
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      createMutation.mutate(formData);
    } else if (row?.id) {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l shadow-2xl">
      <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-gray-900">{isCreating ? 'Nouvelle Estimation' : 'Modifier Ligne'}</h2>
           <p className="text-sm text-gray-500">{isCreating ? 'Ajouter une fonction' : formData.fonction}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
         {/* Live Calculation Cards */}
         <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="block text-xs font-bold text-blue-600 uppercase mb-1">Jours Calculés</span>
                <span className="block text-2xl font-bold text-gray-900">{calculated.days.toFixed(1)} j</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <span className="block text-xs font-bold text-green-600 uppercase mb-1">Coût Total</span>
                <span className="block text-2xl font-bold text-gray-900">{calculated.cost.toFixed(2)} DH</span>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fonction / Poste</label>
                 <div className="relative">
                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                         type="text"
                         required
                         value={formData.fonction}
                         onChange={(e) => setFormData({...formData, fonction: e.target.value})}
                         className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Ex: Ingénieur Étude"
                     />
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Nb. Salariés</label>
                     <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="number"
                            min="1"
                            value={formData.nbr_salaries}
                            onChange={(e) => setFormData({...formData, nbr_salaries: parseInt(e.target.value)})}
                            className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Affectation (%)</label>
                     <div className="relative">
                        <PieChart className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.taux_affectation}
                            onChange={(e) => setFormData({...formData, taux_affectation: parseFloat(e.target.value)})}
                            className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Durée (Mois)</label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="number"
                            step="0.1"
                            value={formData.duree_travail_mois}
                            onChange={(e) => setFormData({...formData, duree_travail_mois: parseFloat(e.target.value)})}
                            className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Jours / Mois</label>
                     <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="number"
                            value={formData.jours_par_mois}
                            onChange={(e) => setFormData({...formData, jours_par_mois: parseInt(e.target.value)})}
                            className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Salaire Journalier (DH)</label>
                 <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                     <input
                         type="number"
                         step="0.01"
                         value={formData.salaire_journalier}
                         onChange={(e) => setFormData({...formData, salaire_journalier: parseFloat(e.target.value)})}
                         className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                     />
                 </div>
             </div>

             <div className="pt-4">
                 <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                    <Save className="w-5 h-5 mr-2" />
                    {isCreating ? 'Ajouter à l\'estimation' : 'Mettre à jour'}
                 </button>
             </div>
         </form>
      </div>
    </div>
  );
};

export const HREstimation = () => {
  const queryClient = useQueryClient();
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: rows = [], isLoading } = useQuery<EstimationRow[]>('hr-estimation', async () => {
    const response = await api.get('/hr-estimation/');
    return response.data.results || response.data;
  });

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/hr-estimation/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
        if (selectedRowId === id) setSelectedRowId(null);
      },
    }
  );

  const clearAllMutation = useMutation(
    () => api.delete('/hr-estimation/clear_all/'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hr-estimation');
        setSelectedRowId(null);
      },
    }
  );

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
        const days = row.nbr_salaries * (row.taux_affectation / 100) * row.duree_travail_mois * row.jours_par_mois;
        const cost = days * row.salaire_journalier;
        return {
            cost: acc.cost + cost,
            days: acc.days + days,
            people: acc.people + row.nbr_salaries
        };
    }, { cost: 0, days: 0, people: 0 });
  }, [rows]);

  const selectedRow = rows.find(r => r.id === selectedRowId) || null;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-gray-100 -m-6 p-6">
      {/* Left Panel */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pr-0 ${selectedRowId || isCreating ? 'mr-4' : ''}`}>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Calculator className="w-8 h-8 mr-3 text-blue-600" />
                Estimation RH
            </h1>
            <div className="flex space-x-3">
                <button
                    onClick={() => {
                        if (confirm('Voulez-vous vraiment vider tout le tableau ?')) clearAllMutation.mutate();
                    }}
                    className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm flex items-center"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                </button>
                <button
                    onClick={() => {
                        setSelectedRowId(null);
                        setIsCreating(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-transform hover:scale-105"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter Ligne
                </button>
            </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center">
                     <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                         <DollarSign className="w-6 h-6" />
                     </div>
                     <div>
                         <p className="text-sm font-medium text-gray-500">Coût Estimé</p>
                         <p className="text-xl font-bold text-gray-900">{totals.cost.toFixed(2)} DH</p>
                     </div>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center">
                     <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                         <Clock className="w-6 h-6" />
                     </div>
                     <div>
                         <p className="text-sm font-medium text-gray-500">Total Jours/Homme</p>
                         <p className="text-xl font-bold text-gray-900">{totals.days.toFixed(1)} j</p>
                     </div>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center">
                     <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                         <Users className="w-6 h-6" />
                     </div>
                     <div>
                         <p className="text-sm font-medium text-gray-500">Effectif Total</p>
                         <p className="text-xl font-bold text-gray-900">{totals.people} Pers.</p>
                     </div>
                 </div>
             </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fonction</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Effectif</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Coût Total</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {rows.map((row) => {
                            const rowCost = (row.nbr_salaries * (row.taux_affectation / 100) * row.duree_travail_mois * row.jours_par_mois) * row.salaire_journalier;
                            
                            return (
                                <tr 
                                    key={row.id}
                                    onClick={() => {
                                        setIsCreating(false);
                                        setSelectedRowId(row.id);
                                    }}
                                    className={`cursor-pointer transition-colors ${selectedRowId === row.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <span className="ml-3 font-medium text-gray-900">{row.fonction}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {row.nbr_salaries} Pers. 
                                            <span className="text-gray-400 ml-1">({row.taux_affectation}%)</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-bold text-gray-900">{rowCost.toFixed(2)} DH</span>
                                        <div className="text-xs text-gray-500">
                                            {row.duree_travail_mois} mois ({row.salaire_journalier}/j)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(row.id);
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <Calculator className="w-12 h-12 text-gray-300 mb-4" />
                                        <p className="text-lg font-medium text-gray-900">Aucune estimation</p>
                                        <p className="text-sm text-gray-500">Commencez par ajouter une ligne de besoin RH.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 ease-in-out transform border-l border-gray-200 ${
            (selectedRowId || isCreating) ? 'w-[400px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
        }`}
      >
        {(selectedRowId || isCreating) && (
             <EstimationDetailsPanel 
                row={selectedRow}
                isCreating={isCreating}
                onClose={() => {
                    setSelectedRowId(null);
                    setIsCreating(false);
                }}
             />
        )}
      </div>
    </div>
  );
};
