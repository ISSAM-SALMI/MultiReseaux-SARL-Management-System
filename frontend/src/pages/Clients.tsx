import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  User, 
  Building,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../api/axios';

interface Client {
  id_client: number;
  nom_client: string;
  type_client: 'PARTICULIER' | 'ENTREPRISE';
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  statut: 'ACTIF' | 'INACTIF';
  created_at: string;
}

export const Clients = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState<any>(null);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    nom_client: '',
    type_client: 'ENTREPRISE',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    statut: 'ACTIF'
  });

  // Fetch Clients
  const { data: clients = [], isLoading } = useQuery<Client[]>('clients', async () => {
    const response = await api.get('/clients/');
    return response.data.results || response.data;
  });

  // Create Client
  const createMutation = useMutation(
    (newClient: any) => api.post('/clients/', newClient),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Create error:", err);
        setError(err.response?.data || 'Une erreur est survenue.');
      }
    }
  );

  // Update Client
  const updateMutation = useMutation(
    (client: any) => api.put(`/clients/${client.id_client}/`, client),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Update error:", err);
        setError(err.response?.data || 'Une erreur est survenue.');
      }
    }
  );

  // Delete Client
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/clients/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
      },
      onError: (err: any) => {
        alert('Erreur lors de la suppression.');
      }
    }
  );

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.nom_client?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.telephone?.includes(searchTerm);
      const matchesType = filterType === 'ALL' || client.type_client === filterType;
      const matchesStatus = filterStatus === 'ALL' || client.statut === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [clients, searchTerm, filterType, filterStatus]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ ...formData, id_client: editingClient.id_client });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      nom_client: '',
      type_client: 'ENTREPRISE',
      telephone: '',
      email: '',
      adresse: '',
      ville: '',
      statut: 'ACTIF'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nom_client: client.nom_client,
      type_client: client.type_client,
      telephone: client.telephone,
      email: client.email,
      adresse: client.adresse,
      ville: client.ville,
      statut: client.statut
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Clients</h1>
          <p className="text-gray-500 text-sm">Gérez votre base de données clients</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher (Nom, Email, Tél)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tous les types</option>
            <option value="ENTREPRISE">Entreprise</option>
            <option value="PARTICULIER">Particulier</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Client</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Contact</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider hidden md:table-cell">Ville</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-center">Statut</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucun client trouvé</td></tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id_client} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${client.type_client === 'ENTREPRISE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {client.type_client === 'ENTREPRISE' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{client.nom_client}</p>
                          <span className="text-xs text-gray-500">{client.type_client}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {client.telephone && (
                            <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-2" /> {client.telephone}
                            </div>
                        )}
                        {client.email && (
                            <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-2" /> {client.email}
                            </div>
                        )}
                        {!client.telephone && !client.email && <span className="text-gray-400 text-sm">-</span>}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center text-gray-600">
                        {client.ville ? (
                          <>
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {client.ville}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.statut === 'ACTIF' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => openEditModal(client)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm('Supprimer ce client ?')) deleteMutation.mutate(client.id_client);
                            }}
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
          {filteredClients.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-500">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                 <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {typeof error === 'string' ? error : 'Une erreur est survenue'}
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section Informations */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Informations</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Raison Sociale *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.nom_client}
                      onChange={(e) => setFormData({...formData, nom_client: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de Client</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.type_client}
                      onChange={(e) => setFormData({...formData, type_client: e.target.value as 'ENTREPRISE' | 'PARTICULIER'})}
                    >
                      <option value="ENTREPRISE">Entreprise</option>
                      <option value="PARTICULIER">Particulier</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value as 'ACTIF' | 'INACTIF'})}
                    >
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* Section Contact & Adresse */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact & Localisation</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <textarea
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.adresse}
                          onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        />
                     </div>
                     <div className="col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                         <input
                           type="text"
                           className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           value={formData.ville}
                           onChange={(e) => setFormData({...formData, ville: e.target.value})}
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
                  {editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
