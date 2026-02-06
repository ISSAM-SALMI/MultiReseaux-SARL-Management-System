import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, Search, Plus, Trash2, Save, X, Briefcase, 
  User, Calendar, DollarSign, Phone, CreditCard, Building
} from 'lucide-react';
import api from '../api/axios';

interface Employee {
  id_employee: number;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  date_debut: string;
  salaire_semaine: number;
    fonction: string;
    type: string;
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

const EmployeeDetailsPanel = ({ 
  employeeId, 
  onClose,
  isCreating = false 
}: { 
  employeeId?: number | null; 
  onClose: () => void;
  isCreating?: boolean;
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'projects'>('profile');
  const [error, setError] = useState<any>(null);
  
  // Fetch details if not creating
  const { data: employee, isLoading } = useQuery<Employee>(
    ['employee', employeeId],
    async () => {
      if (!employeeId) return null;
      // We can use the list endpoint or fetch individually if endpoint exists
      // For now let's assume valid REST
      const response = await api.get(`/budget/employees/${employeeId}/`);
      return response.data;
    },
    {
      enabled: !!employeeId && !isCreating
    }
  );

  // Initial Form State
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    cin: '',
    date_debut: '',
    salaire_semaine: 0,
        fonction: '',
        type: 'principale'
  });

  // Load data into form when employee loads
  useQuery(
    ['employee-form-sync', employee],
    () => {
      if (employee) {
        setFormData({
            nom: employee.nom,
            prenom: employee.prenom,
            telephone: employee.telephone,
            cin: employee.cin,
            date_debut: employee.date_debut,
            salaire_semaine: employee.salaire_semaine,
                        fonction: employee.fonction,
                        type: employee.type || 'principale'
        });
      }
      return null;
    },
    { enabled: !!employee }
  );

  const { data: employeeProjects = [] } = useQuery<ProjectWorker[]>(
    ['employeeProjects', employeeId],
    async () => {
      if (!employeeId) return [];
      const response = await api.get(`/projects/workers/?employee=${employeeId}`);
      return response.data.results || response.data;
    },
    {
      enabled: !!employeeId && !isCreating && activeTab === 'projects'
    }
  );

  const createMutation = useMutation(
    (newEmployee: any) => api.post('/budget/employees/', newEmployee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        onClose();
      },
      onError: (err: any) => setError(err.response?.data || 'Erreur lors de la création')
    }
  );

  const updateMutation = useMutation(
    (data: any) => api.put(`/budget/employees/${employeeId}/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        queryClient.invalidateQueries(['employee', employeeId]);
        alert('Modifications enregistrées');
      },
      onError: (err: any) => setError(err.response?.data || 'Erreur lors de la modification')
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isCreating) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="h-full flex flex-col bg-white shadow-2xl border-l border-gray-100">
      {/* Header */}
      <div className="px-6 py-6 border-b bg-gray-50 flex justify-between items-start">
        <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mr-4 ${
                isCreating ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
                {isCreating ? <Plus className="w-6 h-6" /> : (
                    formData.nom && formData.prenom ? `${formData.nom[0]}${formData.prenom[0]}` : <User />
                )}
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">
                    {isCreating ? 'Nouveau Salarié' : `${formData.nom} ${formData.prenom}`}
                </h2>
                <p className="text-sm text-gray-500 flex items-center">
                    {formData.fonction || 'Fonction non définie'}
                </p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Stats (Only in Edit Mode) */}
      {!isCreating && (
        <div className="grid grid-cols-2 divide-x border-b bg-white">
            <div className="p-4 text-center hover:bg-gray-50 transition-colors">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Salaire Hebdo</span>
                <span className="block text-lg font-bold text-gray-900">{formData.salaire_semaine} DH</span>
            </div>
            <div className="p-4 text-center hover:bg-gray-50 transition-colors">
                 <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Taux Journalier</span>
                 <span className="block text-lg font-bold text-green-600">{(formData.salaire_semaine / 6).toFixed(2)} DH</span>
            </div>
        </div>
      )}

      {/* Tabs */}
      {!isCreating && (
        <div className="flex border-b">
            <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <User className="w-4 h-4 inline-block mr-2" />
                Informations
            </button>
            <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'projects' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <Briefcase className="w-4 h-4 inline-block mr-2" />
                Projets ({isLoading ? '...' : employeeProjects.length})
            </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100 animate-pulse">
                {String(error)}
            </div>
        )}

        {isCreating || activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom</label>
                        <input
                            type="text"
                            required
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prénom</label>
                        <input
                            type="text"
                            required
                            value={formData.prenom}
                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fonction / Poste</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={formData.fonction}
                            onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                            className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Chef de chantier"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
                    <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="brocoleurs">Brocôleurs</option>
                        <option value="principale">Principale</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CIN</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                value={formData.cin}
                                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Téléphone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date d'embauche</label>
                        <input
                            type="date"
                            value={formData.date_debut}
                            onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Salaire Hebdomadaire</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">DH</span>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.salaire_semaine}
                                onChange={(e) => setFormData({ ...formData, salaire_semaine: parseFloat(e.target.value) })}
                                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isCreating ? 'Créer le salarié' : 'Enregistrer modifications'}
                    </button>
                </div>
            </form>
        ) : (
            <div className="space-y-4">
                {employeeProjects.map((worker) => (
                    <div key={worker.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <h4 className="font-bold text-gray-900 mb-1">{worker.project_details?.nom_projet}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                             <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                worker.project_details?.etat_projet === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                                worker.project_details?.etat_projet === 'TERMINE' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-600'
                             }`}>
                                {worker.project_details?.etat_projet}
                             </span>
                        </div>
                        <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                            <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(worker.project_details?.date_debut).toLocaleDateString()}
                            </span>
                            <span className="flex items-center justify-end">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {worker.daily_salary} DH/jour
                            </span>
                        </div>
                    </div>
                ))}
                
                {employeeProjects.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 border border-dashed rounded-lg">
                        <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>Aucun projet assigné pour le moment.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export const Budget = () => {
    const queryClient = useQueryClient();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [search, setSearch] = useState('');

    const { data: employees = [], isLoading } = useQuery<Employee[]>('employees', async () => {
        const response = await api.get('/budget/employees/');
        return response.data.results || response.data;
    });

    const deleteMutation = useMutation(
        (id: number) => api.delete(`/budget/employees/${id}/`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('employees');
                if (selectedEmployeeId === id) setSelectedEmployeeId(null);
            },
            onError: (err) => alert('Erreur suppression')
        }
    );

    const filteredEmployees = employees.filter(emp =>
        emp.nom.toLowerCase().includes(search.toLowerCase()) ||
        emp.prenom.toLowerCase().includes(search.toLowerCase()) ||
        emp.fonction?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-gray-100 -m-6 p-6">
            {/* List Panel */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pr-0 ${selectedEmployeeId || isCreating ? 'mr-4' : ''}`}>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Users className="w-8 h-8 mr-3 text-blue-600" />
                        Gestion des Salariés
                    </h1>
                    <button
                        onClick={() => {
                            setSelectedEmployeeId(null);
                            setIsCreating(true);
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nouveau Salarié
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, fonction..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-full border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2.5 bg-gray-50"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fonction</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CIN</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredEmployees.map((employee) => (
                                    <tr 
                                        key={employee.id_employee}
                                        onClick={() => {
                                            setIsCreating(false);
                                            setSelectedEmployeeId(employee.id_employee);
                                        }}
                                        className={`cursor-pointer transition-colors ${
                                            selectedEmployeeId === employee.id_employee ? 'bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                                                    {employee.nom[0]}{employee.prenom[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {employee.nom} {employee.prenom}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {employee.telephone || 'Sans téléphone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {employee.fonction || 'Non défini'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {employee.type === 'brocoleurs' ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Brocôleurs</span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Principale</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {employee.cin}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Supprimer cet employé ?')) deleteMutation.mutate(employee.id_employee);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <Building className="w-12 h-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-900">Aucun salarié trouvé</p>
                                                <p className="text-sm text-gray-500">Commencez par ajouter votre premier collaborateur.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Slide-over Details Panel */}
            <div 
                className={`bg-white shadow-2xl transition-all duration-300 ease-in-out transform ${
                (selectedEmployeeId || isCreating) ? 'w-[500px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
                }`}
            >
                {(selectedEmployeeId || isCreating) && (
                    <EmployeeDetailsPanel 
                        employeeId={selectedEmployeeId} 
                        isCreating={isCreating}
                        onClose={() => {
                            setSelectedEmployeeId(null);
                            setIsCreating(false);
                        }} 
                    />
                )}
            </div>
        </div>
    );
};
