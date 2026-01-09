import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Eye, Briefcase } from 'lucide-react';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';

interface Employee {
  id_employee: number;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  date_debut: string;
  salaire_semaine: number;
  fonction: string;
}

interface ProjectWorker {
  id: number;
  project: number;
  employee: number | null;
  employee_name: string;
  worker_name: string | null;
  daily_salary: number;
  project_details: {
    nom_projet: string;
    date_debut: string;
    date_fin: string;
    etat_projet: string;
  };
}

export const Budget = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSalaryEmployee, setViewingSalaryEmployee] = useState<Employee | null>(null);
  const [viewingProjectsEmployee, setViewingProjectsEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<any>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    cin: '',
    date_debut: '',
    salaire_semaine: 0,
    fonction: ''
  });

  // Fetch Employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>('employees', async () => {
    const response = await api.get('/budget/employees/');
    return response.data.results || response.data;
  });

  // Fetch Employee Projects
  const { data: employeeProjects = [] } = useQuery<ProjectWorker[]>(
    ['employeeProjects', viewingProjectsEmployee?.id_employee],
    async () => {
      if (!viewingProjectsEmployee) return [];
      const response = await api.get(`/projects/workers/?employee=${viewingProjectsEmployee.id_employee}`);
      return response.data.results || response.data;
    },
    {
      enabled: !!viewingProjectsEmployee
    }
  );

  // Create Employee
  const createMutation = useMutation(
    (newEmployee: any) => api.post('/budget/employees/', newEmployee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Create error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la création de l\'employé.');
      }
    }
  );

  // Update Employee
  const updateMutation = useMutation(
    (employee: any) => api.put(`/budget/employees/${employee.id_employee}/`, employee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Update error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la modification de l\'employé.');
      }
    }
  );

  // Delete Employee
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/budget/employees/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
      },
      onError: (err: any) => {
        console.error("Delete error:", err);
        alert('Une erreur est survenue lors de la suppression de l\'employé.');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (editingEmployee) {
      updateMutation.mutate({ ...formData, id_employee: editingEmployee.id_employee });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setError(null);
    setFormData({ 
      nom: '', 
      prenom: '', 
      telephone: '', 
      cin: '', 
      date_debut: '', 
      salaire_semaine: 0, 
      fonction: '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setError(null);
    setFormData({
      nom: employee.nom,
      prenom: employee.prenom,
      telephone: employee.telephone,
      cin: employee.cin,
      date_debut: employee.date_debut,
      salaire_semaine: employee.salaire_semaine,
      fonction: employee.fonction
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const openSalaryModal = (employee: Employee) => {
    setViewingSalaryEmployee(employee);
  };

  const closeSalaryModal = () => {
    setViewingSalaryEmployee(null);
  };

  const openProjectsModal = (employee: Employee) => {
    setViewingProjectsEmployee(employee);
  };

  const closeProjectsModal = () => {
    setViewingProjectsEmployee(null);
  };

  const handleDelete = (employee: Employee) => {
    // Confirmation handled in DataTable
    deleteMutation.mutate(employee.id_employee);
  };

  return (
    <div>
      <DataTable
        title="Gestion des Salariés"
        data={employees}
        isLoading={isLoading}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        renderActions={(employee) => (
          <div className="flex space-x-1">
            <button
              onClick={() => openSalaryModal(employee)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Voir Salaire"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openProjectsModal(employee)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Voir Projets"
            >
              <Briefcase className="w-4 h-4" />
            </button>
          </div>
        )}
        columns={[
          { header: 'Nom', accessor: 'nom' },
          { header: 'Prénom', accessor: 'prenom' },
          { header: 'CIN', accessor: 'cin' },
          { header: 'Téléphone', accessor: 'telephone' },
          { header: 'Fonction', accessor: 'fonction' },
          { header: 'Date Début', accessor: (item) => item.date_debut ? new Date(item.date_debut).toLocaleDateString() : '-' },
          { header: 'Salaire Semaine', accessor: (item) => `${item.salaire_semaine} DH` },
        ]}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingEmployee ? 'Modifier Employé' : 'Nouveau Employé'}
            </h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">
                    {typeof error === 'string' 
                        ? error 
                        : Object.entries(error).map(([key, value]) => (
                            <div key={key}>
                                <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                            </div>
                        ))
                    }
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CIN</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fonction</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.fonction}
                  onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date Début</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salaire Semaine</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2 border rounded"
                    value={formData.salaire_semaine}
                    onChange={(e) => setFormData({ ...formData, salaire_semaine: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSalaryEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Détails Salaire - {viewingSalaryEmployee.nom} {viewingSalaryEmployee.prenom}
            </h3>
            <div className="mb-4 bg-gray-50 p-4 rounded">
                <p className="mb-2"><strong>Salaire Semaine:</strong> {viewingSalaryEmployee.salaire_semaine} DH</p>
                <p><strong>Salaire Journalier:</strong> {(viewingSalaryEmployee.salaire_semaine / 6).toFixed(2)} DH</p>
            </div>
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                      <tr>
                          <th className="border-b p-3 text-sm font-semibold text-gray-600">Jour</th>
                          <th className="border-b p-3 text-sm font-semibold text-gray-600 text-right">Montant</th>
                      </tr>
                  </thead>
                  <tbody>
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, index) => (
                          <tr key={day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-3 border-b text-sm">{day}</td>
                              <td className="p-3 border-b text-sm text-right font-medium">
                                {(viewingSalaryEmployee.salaire_semaine / 6).toFixed(2)} DH
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={closeSalaryModal}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors"
                >
                    Fermer
                </button>
            </div>
          </div>
        </div>
      )}

      {viewingProjectsEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Projets de {viewingProjectsEmployee.nom} {viewingProjectsEmployee.prenom}
              </h3>
              <button onClick={closeProjectsModal} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border-b font-semibold text-sm">Projet</th>
                    <th className="p-3 border-b font-semibold text-sm">État</th>
                    <th className="p-3 border-b font-semibold text-sm">Période</th>
                    <th className="p-3 border-b font-semibold text-sm text-right">Salaire Journalier</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeProjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">Aucun projet assigné</td>
                    </tr>
                  ) : (
                    employeeProjects.map((worker) => (
                      <tr key={worker.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{worker.project_details?.nom_projet || 'Projet inconnu'}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            worker.project_details?.etat_projet === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                            worker.project_details?.etat_projet === 'TERMINE' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {worker.project_details?.etat_projet || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {worker.project_details ? 
                            `${new Date(worker.project_details.date_debut).toLocaleDateString()} - ${new Date(worker.project_details.date_fin).toLocaleDateString()}` 
                            : '-'}
                        </td>
                        <td className="p-3 text-sm text-right font-medium">{worker.daily_salary} DH</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={closeProjectsModal}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors"
                >
                    Fermer
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
