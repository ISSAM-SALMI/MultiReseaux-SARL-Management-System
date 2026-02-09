import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  XCircle,
  Key,
  Shield,
  CheckCircle,
  X
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
}

export const Users = () => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    is_staff: false
  });

  // Redirect if not admin
  if (currentUser && !currentUser.is_staff && !currentUser.is_superuser) {
      return <Navigate to="/" replace />;
  }

  // Fetch Users
  const { data: users = [], isLoading } = useQuery<UserData[]>('users', async () => {
    const response = await api.get('/auth/users/');
    return response.data; // Depending on pagination could be response.data.results
  });

  const createMutation = useMutation(
    (newUser: any) => api.post('/auth/users/', newUser),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        closeModal();
      },
      onError: (err: any) => {
        setError(err.response?.data || 'Erreur lors de la création');
      }
    }
  );

  const updateMutation = useMutation(
    (data: any) => api.patch(`/auth/users/${data.id}/`, data.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        closeModal();
      },
      onError: (err: any) => {
        setError(err.response?.data || 'Erreur lors de la mise à jour');
      }
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/auth/users/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
      },
      onError: (err: any) => {
        alert('Erreur: ' + JSON.stringify(err.response?.data));
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate
    if (!formData.username) {
        setError({ detailed: "L'identifiant est requis" });
        return;
    }

    if (editingUser) {
        // For update, only send password if it's set
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        
        updateMutation.mutate({ id: editingUser.id, payload });
    } else {
        if (!formData.password) {
            setError({ detailed: "Le mot de passe est requis pour un nouvel utilisateur" });
            return;
        }
        createMutation.mutate(formData);
    }
  };

  const openModal = (user: UserData | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '', // Password empty on edit
        is_active: user.is_active,
        is_staff: user.is_staff
      });
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_active: true,
        is_staff: false
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    // Handle potential pagination format if API returns { results: [] }
    const list = Array.isArray(users) ? users : (users as any).results || [];
    
    return list.filter((user: UserData) => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Chargement...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Aucun utilisateur trouvé</td></tr>
              ) : (
                filteredUsers.map((user: UserData) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      {user.is_staff ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <User size={12} /> Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={12} /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        {user.id !== currentUser.id && (
                            <button
                            onClick={() => {
                                if(window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                                    deleteMutation.mutate(user.id);
                                }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                            >
                            <Trash2 size={18} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error.detailed || "Une erreur est survenue"}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} 
                    {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Compte Actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={formData.is_staff}
                    onChange={e => setFormData({ ...formData, is_staff: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Administrateur</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
