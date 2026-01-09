import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Calendar, User, FileText, Trash2, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { SalaryPeriodModal } from '../components/SalaryPeriodModal';
import { LeavesModal } from '../components/LeavesModal';

interface SalaryPeriod {
  id: number;
  employee: number;
  employee_name: string;
  employee_prenom: string;
  start_date: string;
  end_date: string;
  theoretical_salary: number;
  total_deductions: number;
  real_salary: number;
}

export const Salaries = () => {
  const queryClient = useQueryClient();
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data: periods = [] } = useQuery<SalaryPeriod[]>('salary-periods', async () => {
    const response = await api.get('/payroll/periods/');
    return response.data.results || response.data;
  });

  const deletePeriodMutation = useMutation(
    async (id: number) => {
      await api.delete(`/payroll/periods/${id}/`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('salary-periods');
      },
    }
  );

  const filteredPeriods = periods.filter(p => 
    p.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    p.employee_prenom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Salaires & Congés</h1>
        <button
          onClick={() => setIsNewPeriodOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau Suivi
        </button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par salarié..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salarié</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salaire Théorique</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Déductions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salaire Réel</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPeriods.map((period) => (
              <tr key={period.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <User className="h-8 w-8 rounded-full bg-gray-100 p-1 text-gray-500 mr-3" />
                        <div>
                            <div className="text-sm font-medium text-gray-900">
                                {period.employee_name} {period.employee_prenom}
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {Number(period.theoretical_salary).toFixed(2)} DH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                  {period.total_deductions > 0 ? `-${Number(period.total_deductions).toFixed(2)}` : '0.00'} DH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700">
                  {Number(period.real_salary).toFixed(2)} DH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedPeriodId(period.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Gérer congés & détails"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi ?')) {
                            deletePeriodMutation.mutate(period.id);
                        }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredPeriods.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucune période de salaire trouvée.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <SalaryPeriodModal
        isOpen={isNewPeriodOpen}
        onClose={() => setIsNewPeriodOpen(false)}
      />

      {selectedPeriodId && (
        <LeavesModal
          isOpen={!!selectedPeriodId}
          onClose={() => setSelectedPeriodId(null)}
          periodId={selectedPeriodId}
        />
      )}
    </div>
  );
};
