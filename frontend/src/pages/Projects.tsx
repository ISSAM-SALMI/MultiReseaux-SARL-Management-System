import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { RevenueModal } from '../components/RevenueModal';
import { 
  DollarSign, 
  Users, 
  Trash2, 
  Calendar, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Search, 
  Building, 
  Layout, 
  Edit,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface Project {
  id_project: number;
  nom_projet: string;
  description: string;
  date_debut: string;
  date_fin: string;
  etat_projet: string;
  budget_total: number;
  client: number;
  client_name?: string;
  chef_projet: string;
  revenues?: any[];
}

interface Client {
  id_client: number;
  nom_client: string;
  ice?: string;
}



export const Projects = () => {
  const queryClient = useQueryClient();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  
  const [selectedProjectForRevenue, setSelectedProjectForRevenue] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [error, setError] = useState<any>(null);

  const [formData, setFormData] = useState({
    nom_projet: '',
    description: '',
    date_debut: '',
    date_fin: '',
    etat_projet: 'EN_ATTENTE',
    budget_total: 0 as number | string,
    client: '',
    chef_projet: ''
  });

  // Fetch Projects
  const { data: projects = [], isLoading } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  // Fetch Clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>('clients', async () => {
    const response = await api.get('/clients/');
    return response.data.results || response.data;
  });



  // Create Project
  const createMutation = useMutation(
    (newProject: any) => api.post('/projects/', newProject),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Create error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la création du projet.');
      }
    }
  );

  // Update Project
  const updateMutation = useMutation(
    (project: any) => api.put(`/projects/${project.id_project}/`, project),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Update error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la modification du projet.');
      }
    }
  );

  // Delete Project
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/projects/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const clientID = parseInt(formData.client as string, 10);
    if (isNaN(clientID)) {
        setError("Veuillez sélectionner un client valide.");
        return;
    }

    const payload = {
      ...formData,
      budget_total: formData.budget_total === '' ? 0 : formData.budget_total,
      client: clientID,
      date_fin: formData.date_fin === '' ? null : formData.date_fin
    };
    
    console.log("Submitting payload:", payload);

    if (editingProject) {
      updateMutation.mutate({ ...payload, id_project: editingProject.id_project });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setError(null);
    setFormData({
      nom_projet: '',
      description: '',
      date_debut: '',
      date_fin: '',
      etat_projet: 'EN_ATTENTE',
      budget_total: 0,
      client: '',
      chef_projet: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setError(null);
    setFormData({
      nom_projet: project.nom_projet,
      description: project.description,
      date_debut: project.date_debut,
      date_fin: project.date_fin,
      etat_projet: project.etat_projet,
      budget_total: project.budget_total,
      client: project.client.toString(),
      chef_projet: project.chef_projet
    });
    setIsModalOpen(true);
  };

  const openRevenueModal = (project: Project) => {
    setSelectedProjectForRevenue(project);
    setIsRevenueModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDelete = (project: Project) => {
    if(window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        deleteMutation.mutate(project.id_project);
    }
  };

  // Client-side filtering & Pagination
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.nom_projet?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || project.etat_projet === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  const paginatedProjects = useMemo(() => {
     const startIndex = (currentPage - 1) * itemsPerPage;
     return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_COURS': return 'bg-blue-100 text-blue-800';
      case 'TERMINE': return 'bg-green-100 text-green-800';
      case 'ANNULE': return 'bg-red-100 text-red-800';
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_COURS': return 'En cours';
      case 'TERMINE': return 'Terminé';
      case 'ANNULE': return 'Annulé';
      case 'EN_ATTENTE': return 'En attente';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projets</h1>
          <p className="text-gray-500 mt-1">Gérez vos chantiers, suivis et budgets.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom de projet..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                    className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer hover:border-blue-400 transition-colors min-w-[150px]"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="ALL">Tous les statuts</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                </select>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Projet</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Client</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Dates</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Budget</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-center">Statut</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucun projet trouvé</td></tr>
              ) : (
                paginatedProjects.map((project) => (
                  <tr key={project.id_project} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{project.nom_projet}</span>
                        {project.description && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{project.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center text-gray-700">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            <div className="flex flex-col">
                                <span>{project.client_name || clients.find(c => c.id_client === project.client)?.nom_client || '-'}</span>
                                {(() => {
                                    const c = clients.find(c => c.id_client === project.client);
                                    if (c && c.ice) return <span className="text-xs text-gray-400">ICE: {c.ice}</span>;
                                    return null;
                                })()}
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-gray-600 flex flex-col gap-1">
                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-green-600"/> {new Date(project.date_debut).toLocaleDateString()}</span>
                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-red-400"/> {new Date(project.date_fin).toLocaleDateString()}</span>
                        </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                        {project.budget_total.toLocaleString()} DH
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.etat_projet)}`}>
                        {getStatusLabel(project.etat_projet)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => openRevenueModal(project)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Budget & Revenus"
                        >
                            <DollarSign className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => openEditModal(project)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(project)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-500">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredProjects.length)} sur {filteredProjects.length} projets
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Précédent"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => {
                         const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                         return (
                            <Fragment key={page}>
                                {showEllipsisBefore && <span className="px-2 py-1 text-gray-400">...</span>}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {page}
                                </button>
                            </Fragment>
                         );
                    })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Suivant"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isRevenueModalOpen && selectedProjectForRevenue && (
        <RevenueModal
          isOpen={isRevenueModalOpen}
          onClose={() => setIsRevenueModalOpen(false)}
          projectId={selectedProjectForRevenue.id_project}
          budgetTotal={selectedProjectForRevenue.budget_total}
          existingRevenue={selectedProjectForRevenue.revenues && selectedProjectForRevenue.revenues.length > 0 ? selectedProjectForRevenue.revenues[0] : null}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
               {error && (
                 <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>
                    {typeof error === 'string' 
                        ? error 
                        : Object.entries(error).map(([key, value]) => (
                            <span key={key} className="block">
                                <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                        ))
                    }
                    </span>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Layout className="w-4 h-4" /> Informations
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.nom_projet}
                          onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Total (DH) *</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="number"
                              required
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={formData.budget_total}
                              onChange={(e) => setFormData({ ...formData, budget_total: parseFloat(e.target.value) })}
                            />
                          </div>
                      </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Détails & Client
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                        <select
                          required
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.client}
                          onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map((client) => (
                            <option key={client.id_client} value={client.id_client}>
                              {client.nom_client}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                              <input
                                type="date"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date_debut}
                                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin <span className="text-gray-400 text-xs">(optionnel)</span></label>
                              <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date_fin}
                                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
                            <select
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={formData.etat_projet}
                              onChange={(e) => setFormData({ ...formData, etat_projet: e.target.value })}
                            >
                              <option value="EN_ATTENTE">En attente</option>
                              <option value="EN_COURS">En cours</option>
                              <option value="TERMINE">Terminé</option>
                              <option value="ANNULE">Annulé</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chef de projet</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={formData.chef_projet}
                              onChange={(e) => setFormData({ ...formData, chef_projet: e.target.value })}
                            />
                        </div>
                      </div>
                  </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
