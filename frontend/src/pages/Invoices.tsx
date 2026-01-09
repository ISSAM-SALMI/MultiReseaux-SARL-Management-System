import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FileText, Plus, Search, Trash2, Calendar, Building, 
  DollarSign, X, Filter, ArrowUpRight, Save, Receipt
} from 'lucide-react';
import api from '../api/axios';

interface Project {
  id_project: number;
  nom_projet: string;
}

interface Invoice {
  id_invoice: number;
  date: string;
  fournisseur: string;
  montant: number;
  project: number;
}

const InvoiceDetailsPanel = ({ 
  invoice, 
  projects,
  onClose,
  isCreating = false 
}: { 
  invoice: Invoice | null; 
  projects: Project[];
  onClose: () => void;
  isCreating: boolean;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Invoice>>({
    fournisseur: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    project: undefined
  });

  // Load data
  useMemo(() => {
    if (invoice && !isCreating) {
      setFormData(invoice);
    } else if (isCreating) {
      setFormData({
        fournisseur: '',
        montant: 0,
        date: new Date().toISOString().split('T')[0],
        project: undefined
      });
    }
  }, [invoice, isCreating]);

  const createMutation = useMutation(
    (data: any) => api.post('/invoices/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        onClose();
      },
      onError: (err: any) => alert("Erreur lors de la création")
    }
  );

  const updateMutation = useMutation(
    (data: any) => api.put(`/invoices/${invoice?.id_invoice}/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
      onError: (err: any) => alert("Erreur lors de la modification")
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      createMutation.mutate(formData);
    } else if (invoice?.id_invoice) {
      updateMutation.mutate({ ...formData, id_invoice: invoice.id_invoice });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l shadow-2xl">
      <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-gray-900">{isCreating ? 'Nouvelle Facture' : 'Détails Facture'}</h2>
           <p className="text-sm text-gray-500">{isCreating ? 'Saisir les informations' : `Réf: #${invoice?.id_invoice}`}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
         <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                 <div className="relative">
                     <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                         type="text"
                         required
                         value={formData.fournisseur}
                         onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
                         className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                         placeholder="Nom du fournisseur"
                     />
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Projet Concerné</label>
                 <div className="relative">
                     <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <select
                         required
                         value={formData.project || ''}
                         onChange={(e) => setFormData({...formData, project: parseInt(e.target.value)})}
                         className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                     >
                         <option value="">Sélectionner un projet...</option>
                         {projects.map(p => (
                             <option key={p.id_project} value={p.id_project}>{p.nom_projet}</option>
                         ))}
                     </select>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Date Facture</label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                     </div>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DH)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.montant}
                            onChange={(e) => setFormData({...formData, montant: parseFloat(e.target.value)})}
                            className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors font-semibold text-gray-900"
                        />
                     </div>
                 </div>
             </div>

             <div className="pt-6">
                 <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-[1.02]"
                 >
                    <Save className="w-5 h-5 mr-2" />
                    {isCreating ? 'Enregistrer la facture' : 'Mettre à jour'}
                 </button>
             </div>
         </form>

         {!isCreating && invoice && (
            <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Informations Système</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                    <div>
                        <dt className="text-gray-500">ID Unique</dt>
                        <dd className="font-mono text-gray-900">#{invoice.id_invoice}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Créé le</dt>
                        <dd className="text-gray-900">{new Date().toLocaleDateString()}</dd>
                    </div>
                </dl>
            </div>
         )}
      </div>
    </div>
  );
};

export const Invoices = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Data
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>('invoices', async () => {
    const response = await api.get('/invoices/');
    return response.data.results || response.data;
  });

  const { data: projects = [] } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/invoices/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        if (selectedId === id) setSelectedId(null);
      },
    }
  );

  // Derived State
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id_invoice.toString().includes(searchTerm) ||
      projects.find(p => p.id_project === inv.project)?.nom_projet.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm, projects]);

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, curr) => acc + curr.montant, 0);
    const count = invoices.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [invoices]);

  const selectedInvoice = invoices.find(i => i.id_invoice === selectedId) || null;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-gray-100 -m-6 p-6">
      {/* Left Panel: List & Stats */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pr-0 ${selectedId || isCreating ? 'mr-4' : ''}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Receipt className="w-8 h-8 mr-3 text-blue-600" />
                    Gestion des Factures
                </h1>
                <p className="text-sm text-gray-500 mt-1">Suivi des paiements fournisseurs et dépenses projets</p>
            </div>
            <button
                onClick={() => {
                    setSelectedId(null);
                    setIsCreating(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle Facture
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between">
                     <div>
                         <p className="text-sm font-medium text-gray-500">Dépenses Totales</p>
                         <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()} DH</p>
                     </div>
                     <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                         <DollarSign className="w-6 h-6" />
                     </div>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between">
                     <div>
                         <p className="text-sm font-medium text-gray-500">Nombre de Factures</p>
                         <p className="text-2xl font-bold text-gray-900 mt-1">{stats.count}</p>
                     </div>
                     <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                         <FileText className="w-6 h-6" />
                     </div>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between">
                     <div>
                         <p className="text-sm font-medium text-gray-500">Moyenne par Facture</p>
                         <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} DH</p>
                     </div>
                     <div className="p-3 rounded-full bg-green-50 text-green-600">
                         <ArrowUpRight className="w-6 h-6" />
                     </div>
                 </div>
             </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex items-center justify-between">
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Rechercher par fournisseur, projet..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>
            <div className="flex items-center text-sm text-gray-500">
                <Filter className="w-4 h-4 mr-2" />
                {filteredInvoices.length} résultat(s)
            </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden flex-1 relative">
            <div className="absolute inset-0 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-gray-400">
                        Chargement des factures...
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400">
                        <Receipt className="w-16 h-16 mb-4 opacity-20" />
                        <p>Aucune facture trouvée</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Projet</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredInvoices.map((invoice) => (
                                <tr 
                                    key={invoice.id_invoice}
                                    onClick={() => {
                                        setIsCreating(false);
                                        setSelectedId(invoice.id_invoice);
                                    }}
                                    className={`cursor-pointer transition-colors group ${selectedId === invoice.id_invoice ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${selectedId === invoice.id_invoice ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                                                <Building className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-900">{invoice.fournisseur}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {projects.find(p => p.id_project === invoice.project)?.nom_projet}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="font-bold text-gray-900">{invoice.montant.toLocaleString()} DH</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm('Supprimer cette facture ?')) deleteMutation.mutate(invoice.id_invoice);
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>

      {/* Right Panel: Detail View */}
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 ease-in-out transform border-l border-gray-200 ${
            (selectedId || isCreating) ? 'w-[400px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
        }`}
      >
        {(selectedId || isCreating) && (
             <InvoiceDetailsPanel 
                invoice={selectedInvoice}
                projects={projects}
                isCreating={isCreating}
                onClose={() => {
                    setSelectedId(null);
                    setIsCreating(false);
                }}
             />
        )}
      </div>
    </div>
  );
};
