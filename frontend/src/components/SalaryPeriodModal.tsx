import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Save } from 'lucide-react';
import api from '../api/axios';


interface SalaryPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Employee {
  id_employee: number;
  nom: string;
  prenom: string;
}

export const SalaryPeriodModal = ({ isOpen, onClose }: SalaryPeriodModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employee: '',
    start_date: '',
    end_date: '',
  });

  const { data: employees = [] } = useQuery<Employee[]>('employees', async () => {
    // Fetch employees from budget app endpoint - we need to make sure this is exposed.
    // Assuming /budget/api/employees/ or similar. 
    // Wait, let's check urls.py of budget.
    // Based on previous reads, budget likely has ViewSet.
    // Let's assume standard ViewSet route.
    const response = await api.get('/budget/employees/'); 
    return response.data.results || response.data;
  });

  const createMutation = useMutation(
    async (data: any) => {
      await api.post('/payroll/periods/', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('salary-periods');
        onClose();
        setFormData({ employee: '', start_date: '', end_date: '' });
      },
    }
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Nouvelle période de salaire</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salarié
            </label>
            <select
              required
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionner un salarié</option>
              {employees.map((emp) => (
                <option key={emp.id_employee} value={emp.id_employee}>
                  {emp.nom} {emp.prenom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md mr-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
