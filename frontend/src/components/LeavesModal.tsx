import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import api from '../api/axios';

interface LeavesModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: number;
}

interface Leave {
  id: number;
  start_date: string;
  end_date: string;
  type: string;
  duration: number;
  reason: string;
}

interface SalaryPeriodDetail {
    id: number;
    employee: number;
    employee_name: string;
    start_date: string;
    end_date: string;
    theoretical_salary: number;
    total_deductions: number;
    real_salary: number;
}

export const LeavesModal = ({ isOpen, onClose, periodId }: LeavesModalProps) => {
  const queryClient = useQueryClient();
  const [newLeave, setNewLeave] = useState({
    start_date: '',
    end_date: '',
    type: 'UNP', // Default to Unpaid as it affects salary
    reason: ''
  });

  // Get Period Details (re-fetch to be sure + calculating totals)
  const { data: period } = useQuery<SalaryPeriodDetail>(
      ['salary-period', periodId],
      async () => {
          const response = await api.get(`/payroll/periods/${periodId}/`);
          return response.data;
      },
      {
          enabled: !!periodId
      }
  );

  const leaves: Leave[] = (period as any)?.leaves || [];

  const createLeaveMutation = useMutation(
    async (leaveData: any) => {
        // Calculate duration simply
        const start = new Date(leaveData.start_date);
        const end = new Date(leaveData.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

        await api.post('/payroll/leaves/', {
            ...leaveData,
            duration: diffDays, 
            employee: period?.employee, // We need to link to employee too
            salary_period: periodId
        });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salary-period', periodId]); // Reload period to update calculation
        queryClient.invalidateQueries('salary-periods'); // Reload main list
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

  if (!isOpen || !period) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Gérer les congés
            </h3>
            <p className="text-sm text-gray-600">
                Période: {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-blue-600 font-medium">Salaire Théorique</div>
                    <div className="text-lg font-bold text-blue-800">{Number(period.theoretical_salary).toFixed(2)} DH</div>
                </div>
                <div className="bg-red-50 p-3 rounded-md">
                    <div className="text-sm text-red-600 font-medium">Déductions</div>
                    <div className="text-lg font-bold text-red-800">-{Number(period.total_deductions).toFixed(2)} DH</div>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-sm text-green-600 font-medium">Salaire Net</div>
                    <div className="text-lg font-bold text-green-800">{Number(period.real_salary).toFixed(2)} DH</div>
                </div>
            </div>

            {/* Existing Leaves */}
            <div>
                <h4 className="font-medium mb-2">Historique des congés sur la période</h4>
                {leaves.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Aucun congé enregistré.</p>
                ) : (
                    <div className="space-y-2">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                                <div>
                                    <div className="font-medium flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        {new Date(leave.start_date).toLocaleDateString()} au {new Date(leave.end_date).toLocaleDateString()}
                                        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-700">
                                            {leave.duration} jours
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Type: {
                                            leave.type === 'PAY' ? 'Congé Payé (Pas de déduction)' : 
                                            leave.type === 'UNP' ? 'Congé Non Payé (Déduction)' : 
                                            'Absence (Déduction)'
                                        }
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteLeaveMutation.mutate(leave.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add New Leave */}
            <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Ajouter un congé / absence</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
                        <input
                            type="date"
                            value={newLeave.start_date}
                            onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
                        <input
                            type="date"
                            value={newLeave.end_date}
                            onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={newLeave.type}
                            onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="PAY">Congé Payé (0 impact)</option>
                            <option value="UNP">Congé Non Payé</option>
                            <option value="ABS">Absence</option>
                        </select>
                    </div>
                     <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => createLeaveMutation.mutate(newLeave)}
                            disabled={!newLeave.start_date || !newLeave.end_date}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
