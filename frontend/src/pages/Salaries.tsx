import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, Search, Calendar, User, FileText, Trash2, ArrowRight, X, 
  DollarSign, Clock, AlertCircle, CheckCircle 
} from 'lucide-react';
import api from '../api/axios';
import { SalaryPeriodModal } from '../components/SalaryPeriodModal';

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

interface Leave {
  id: number;
  start_date: string;
  end_date: string;
  type: string;
  duration: number;
  reason: string;
}

interface SalaryPeriodDetail extends SalaryPeriod {
  leaves: Leave[];
}

// Side Panel Component for Details
const SalaryDetailsPanel = ({ periodId, onClose }: { periodId: number; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [newLeave, setNewLeave] = useState({
    start_date: '',
    end_date: '',
    type: 'UNP',
    reason: ''
  });

  const { data: period, isLoading } = useQuery<SalaryPeriodDetail>(
    ['salary-period', periodId],
    async () => {
      const response = await api.get(`/payroll/periods/${periodId}/`);
      return response.data;
    }
  );

  const createLeaveMutation = useMutation(
    async (leaveData: any) => {
      const start = new Date(leaveData.start_date);
      const end = new Date(leaveData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await api.post('/payroll/leaves/', {
        ...leaveData,
        duration: diffDays,
        employee: period?.employee,
        salary_period: periodId
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salary-period', periodId]);
        queryClient.invalidateQueries('salary-periods');
        setNewLeave({ start_date: '', end_date: '', type: 'UNP', reason: '' });
      },
    }
  );

  const deleteLeaveMutation = useMutation(
    async (id: number) => {
      await api.delete(`/payroll/leaves/${id}/`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salary-period', periodId]);
        queryClient.invalidateQueries('salary-periods');
      },
    }
  );

  if (isLoading || !period) return <div className="p-6">Chargement...</div>;

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveMutation.mutate(newLeave);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l shadow-xl">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Détails de la Période</h2>
          <div className="flex items-center mt-2 text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">{period.employee_name} {period.employee_prenom}</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-blue-600 uppercase mb-1">Salaire Théorique</p>
            <p className="text-lg font-bold text-gray-900">{Number(period.theoretical_salary).toFixed(2)} DH</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs font-medium text-red-600 uppercase mb-1">Déductions</p>
            <p className="text-lg font-bold text-red-700">-{Number(period.total_deductions).toFixed(2)} DH</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs font-medium text-green-600 uppercase mb-1">Salaire Net</p>
            <p className="text-lg font-bold text-green-700">{Number(period.real_salary).toFixed(2)} DH</p>
          </div>
        </div>

        {/* Leaves Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Congés & Absences
            </h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ajouter une absence</h4>
            <form onSubmit={handleSubmitLeave} className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Début</label>
                <input
                  type="date"
                  required
                  value={newLeave.start_date}
                  onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
                <input
                  type="date"
                  required
                  value={newLeave.end_date}
                  min={newLeave.start_date}
                  onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={newLeave.type}
                  onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-md"
                >
                  <option value="UNP">Congé Non Payé / Absence</option>
                  <option value="ABS">Absence Injustifiée</option>
                  <option value="PAY">Congé Payé (Pas de déduction)</option>
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Motif / Commentaire"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={createLeaveMutation.isLoading}
                  className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {period.leaves && period.leaves.length > 0 ? (
              period.leaves.map((leave) => (
                <div key={leave.id} className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        leave.type === 'PAY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {leave.type === 'PAY' ? 'Payé' : 'Non Payé'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {leave.duration} jours • {leave.reason || 'Aucun motif'}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteLeaveMutation.mutate(leave.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))) 
              : (
               <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                 Aucun congé enregistré pour cette période.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries('salary-periods');
        if (selectedPeriodId === variables) setSelectedPeriodId(null);
      },
    }
  );

  const filteredPeriods = periods.filter(p => 
    p.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    p.employee_prenom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-gray-100 -m-6 p-6">
      {/* List Panel */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pr-0 ${selectedPeriodId ? 'md:mr-4' : ''}`}>
        <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center mb-6 gap-2 xs:gap-4">
          <h1 className="text-lg xs:text-2xl font-bold text-gray-800">Gestion des Salaires</h1>
          <button
            onClick={() => setIsNewPeriodOpen(true)}
            className="w-full xs:w-auto flex items-center px-3 xs:px-4 py-2 text-sm xs:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Suivi
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type="text"
                placeholder="Rechercher par salarié..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2.5 bg-gray-50"
                />
            </div>
        </div>

        {/* Responsive Table/Card View */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredPeriods.map((period) => (
              <div key={period.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2 ${selectedPeriodId === period.id ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedPeriodId(period.id)}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                    {period.employee_name.charAt(0)}{period.employee_prenom?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {period.employee_name} {period.employee_prenom}
                    </div>
                    <div className="text-xs text-gray-500">Matricule: #{period.employee}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <div>
                    <span className="font-medium text-gray-700">{new Date(period.start_date).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-500"> au {new Date(period.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{Number(period.real_salary).toFixed(2)} DH</span>
                    {period.total_deductions > 0 && (
                      <span className="block text-xs text-red-500 font-medium">-{Number(period.total_deductions).toFixed(2)} DH (Abs)</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi ?')) {
                        deletePeriodMutation.mutate(period.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredPeriods.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                <FileText className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-lg font-medium text-gray-900">Aucune période trouvée</p>
                <p className="text-sm text-gray-500">Commencez par créer un nouveau suivi.</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salarié</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Net à Payer</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPeriods.map((period) => (
                  <tr 
                    key={period.id} 
                    onClick={() => setSelectedPeriodId(period.id)}
                    className={`cursor-pointer transition-colors ${selectedPeriodId === period.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                {period.employee_name.charAt(0)}{period.employee_prenom?.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    {period.employee_name} {period.employee_prenom}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Matricule: #{period.employee}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">
                                {new Date(period.start_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                                au {new Date(period.end_date).toLocaleDateString()}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {Number(period.real_salary).toFixed(2)} DH
                      </div>
                      {period.total_deductions > 0 && (
                          <div className="text-xs text-red-500 font-medium">
                              -{Number(period.total_deductions).toFixed(2)} DH (Abs)
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi ?')) {
                                deletePeriodMutation.mutate(period.id);
                            }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPeriods.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-900">Aucune période trouvée</p>
                                <p className="text-sm text-gray-500">Commencez par créer un nouveau suivi.</p>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel - Slide Over */}
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 ease-in-out transform ${
          selectedPeriodId ? 'w-full md:w-[500px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
        }`}
      >
        {selectedPeriodId && (
            <SalaryDetailsPanel 
                periodId={selectedPeriodId} 
                onClose={() => setSelectedPeriodId(null)} 
            />
        )}
      </div>

      <SalaryPeriodModal
        isOpen={isNewPeriodOpen}
        onClose={() => setIsNewPeriodOpen(false)}
      />
    </div>
  );
};
