import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Edit, 
  Trash2, 
  Building,
  Truck,
  Calendar,
  LayoutGrid,
  List,
  DollarSign
} from 'lucide-react';
import api from '../api/axios';

interface Supplier {
  id_supplier: number;
  name: string;
  type_supplier: 'GRAND' | 'PETIT';
  address?: string;
  phone?: string;
  category?: string;
}

interface SupplierInvoice {
    id_invoice: number;
    supplier: number;
    supplier_name?: string;
    date: string;
    amount: number;
    reference?: string;
    status: 'PAYE' | 'IMPAYE';
    description?: string;
}

export const Suppliers = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'purchases'>('list');
  
  // Suppliers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Purchases State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SupplierInvoice | null>(null);

  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Forms
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
     type_supplier: 'PETIT', name: '', category: ''
  });

  const [purchaseForm, setPurchaseForm] = useState<Partial<SupplierInvoice>>({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      status: 'PAYE',
      description: '',
      reference: ''
  });

  // --- QUERY HOOKS ---
  const { data: suppliers = [] } = useQuery<Supplier[]>('suppliers', async () => {
    const response = await api.get('/suppliers/');
    return response.data.results || response.data;
  });

  const { data: purchases = [] } = useQuery<SupplierInvoice[]>('supplier-invoices', async () => {
      const response = await api.get('/suppliers/invoices/');
      return response.data.results || response.data;
  });

  const { data: stats } = useQuery('supplier-stats', async () => {
      const response = await api.get('/suppliers/invoices/monthly-stats/');
      return response.data;
  });

  // --- MUTATIONS (Suppliers) ---
  const supplierMutation = useMutation(
    (data: any) => editingSupplier 
        ? api.put(`/suppliers/${editingSupplier.id_supplier}/`, data)
        : api.post('/suppliers/', data),
    {
        onSuccess: () => {
            queryClient.invalidateQueries('suppliers');
            setIsModalOpen(false);
        },
        onError: (err: any) => setError(err.response?.data)
    }
  );

  const deleteSupplierMutation = useMutation(
      (id: number) => api.delete(`/suppliers/${id}/`),
      { onSuccess: () => queryClient.invalidateQueries('suppliers') }
  );

  // --- MUTATIONS (Purchases) ---
  const purchaseMutation = useMutation(
      (data: any) => editingPurchase
        ? api.put(`/suppliers/invoices/${editingPurchase.id_invoice}/`, data)
        : api.post('/suppliers/invoices/', data),
      {
          onSuccess: () => {
              queryClient.invalidateQueries('supplier-invoices');
              queryClient.invalidateQueries('supplier-stats');
              setIsPurchaseModalOpen(false);
          },
          onError: (err: any) => setError(err.response?.data)
      }
  );
  
  const deletePurchaseMutation = useMutation(
    (id: number) => api.delete(`/suppliers/invoices/${id}/`),
    { onSuccess: () => {
        queryClient.invalidateQueries('supplier-invoices');
        queryClient.invalidateQueries('supplier-stats');
    }}
  );

  // --- HELPERS ---
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
        (filterType === 'ALL' || s.type_supplier === filterType) &&
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, filterType, searchTerm]);

  const filteredPurchases = useMemo(() => {
      return purchases.filter(p => 
          (p.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.reference?.toLowerCase().includes(searchTerm.toLowerCase()))
      ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, searchTerm]);

  const formatMoney = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  // --- MODAL HANDLERS ---
  const openSupplierModal = (supplier?: Supplier) => {
      setError(null);
      setEditingSupplier(supplier || null);
      setSupplierForm(supplier || { type_supplier: 'PETIT', name: '', category: '' });
      setIsModalOpen(true);
  };

  const openPurchaseModal = (purchase?: SupplierInvoice) => {
      setError(null);
      setEditingPurchase(purchase || null);
      setPurchaseForm(purchase || {
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          status: 'PAYE',
          description: '',
          reference: '',
          supplier: suppliers.length > 0 ? suppliers[0].id_supplier : undefined
      });
      setIsPurchaseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Truck className="mr-3 text-blue-600" /> Gestion des Achats
          </h1>
          <p className="text-gray-500 text-sm ml-9">Suivez vos fournisseurs et vos dépenses.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('list')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
                <LayoutGrid className="w-4 h-4 mr-2" /> Fournisseurs
            </button>
            <button 
                onClick={() => setActiveTab('purchases')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'purchases' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
                <List className="w-4 h-4 mr-2" /> Registre Achats
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={activeTab === 'list' ? "Rechercher un fournisseur..." : "Rechercher une facture..."}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex gap-2">
                   {activeTab === 'list' ? (
                       <>
                           <select 
                                className="px-3 py-2 border rounded-lg bg-gray-50 text-sm outline-none"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                           >
                               <option value="ALL">Tous types</option>
                               <option value="GRAND">Grands</option>
                               <option value="PETIT">Petits</option>
                           </select>
                           <button onClick={() => openSupplierModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                               <Plus className="w-4 h-4 mr-2" /> Nouveau Fournisseur
                           </button>
                       </>
                   ) : (
                       <button onClick={() => openPurchaseModal()} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                           <Plus className="w-4 h-4 mr-2" /> Nouvelle Facture Achat
                       </button>
                   )}
               </div>
          </div>

          {/* Tab Content */}
          <div className="p-0">
             {activeTab === 'list' ? (
                 // --- VIEW: SUPPLIERS LIST ---
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier.id_supplier} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openSupplierModal(supplier)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => { if(confirm('Supprimer ?')) deleteSupplierMutation.mutate(supplier.id_supplier) }} className="p-1.5 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-lg ${supplier.type_supplier === 'GRAND' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                    <Building className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                                    <span className="text-xs text-gray-500">{supplier.type_supplier} • {supplier.category || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {supplier.phone || '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> <span className="truncate">{supplier.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSuppliers.length === 0 && <div className="col-span-full text-center text-gray-500 py-10">Aucun fournisseur trouvé.</div>}
                 </div>
             ) : (
                 // --- VIEW: PURCHASES LIST ---
                 <div className="flex flex-col h-full">
                     {/* Stats Summary */}
                     <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b">
                         <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
                             <div>
                                 <p className="text-sm text-gray-500">Total ce mois</p>
                                 <p className="text-2xl font-bold text-gray-900">{formatMoney(stats?.monthly_total || 0)}</p>
                             </div>
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Calendar className="w-6 h-6"/></div>
                         </div>
                         <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
                             <div>
                                 <p className="text-sm text-gray-500">Total Annuel</p>
                                 <p className="text-2xl font-bold text-gray-900">{formatMoney(stats?.yearly_total || 0)}</p>
                             </div>
                             <div className="p-3 bg-green-50 text-green-600 rounded-full"><DollarSign className="w-6 h-6"/></div>
                         </div>
                     </div>

                     {/* Table */}
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 border-y border-gray-200">
                               <tr>
                                   <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                   <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fournisseur</th>
                                   <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Référence</th>
                                   <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant TTC</th>
                                   <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                               {filteredPurchases.map(p => (
                                   <tr key={p.id_invoice} className="hover:bg-blue-50/50 group">
                                       <td className="px-6 py-4 text-sm text-gray-900">{new Date(p.date).toLocaleDateString()}</td>
                                       <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.supplier_name}</td>
                                       <td className="px-6 py-4 text-sm text-gray-500">{p.reference || '-'}</td>
                                       <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatMoney(p.amount)}</td>
                                       <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => openPurchaseModal(p)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit className="w-4 h-4"/></button>
                                           <button onClick={() => {if(confirm('Supprimer ?')) deletePurchaseMutation.mutate(p.id_invoice)}} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4"/></button>
                                       </td>
                                   </tr>
                               ))}
                               {filteredPurchases.length === 0 && (
                                   <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Aucune facture enregistrée.</td></tr>
                               )}
                           </tbody>
                        </table>
                     </div>
                 </div>
             )}
          </div>
      </div>

      {/* --- MODAL: SUPPLIER --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                  <h2 className="text-xl font-bold mb-4">{editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                          <input type="text" className="w-full p-2 border rounded-lg" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select className="w-full p-2 border rounded-lg" value={supplierForm.type_supplier} onChange={e => setSupplierForm({...supplierForm, type_supplier: e.target.value as any})}>
                                <option value="PETIT">Petit</option>
                                <option value="GRAND">Grand</option>
                            </select>
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                             <input type="text" className="w-full p-2 border rounded-lg" value={supplierForm.category} onChange={e => setSupplierForm({...supplierForm, category: e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                          <input type="text" className="w-full p-2 border rounded-lg" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                          <textarea className="w-full p-2 border rounded-lg" rows={2} value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-6">
                          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                          <button onClick={() => supplierMutation.mutate(supplierForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: PURCHASE --- */}
      {isPurchaseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                  <h2 className="text-xl font-bold mb-4">{editingPurchase ? 'Modifier Facture' : 'Nouvelle Facture Achat'}</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                          <select 
                             className="w-full p-2 border rounded-lg" 
                             value={purchaseForm.supplier} 
                             onChange={e => setPurchaseForm({...purchaseForm, supplier: Number(e.target.value)})}
                          >
                              {suppliers.length === 0 && <option value="">Aucun fournisseur</option>}
                              {suppliers.map(s => <option key={s.id_supplier} value={s.id_supplier}>{s.name}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                              <input type="date" className="w-full p-2 border rounded-lg" value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Montant TTC *</label>
                              <input type="number" step="0.01" className="w-full p-2 border rounded-lg font-bold" value={purchaseForm.amount} onChange={e => setPurchaseForm({...purchaseForm, amount: parseFloat(e.target.value)})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Référence (N° Facture)</label>
                          <input type="text" className="w-full p-2 border rounded-lg" value={purchaseForm.reference} onChange={e => setPurchaseForm({...purchaseForm, reference: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea className="w-full p-2 border rounded-lg" rows={2} value={purchaseForm.description} onChange={e => setPurchaseForm({...purchaseForm, description: e.target.value})} />
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                          <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                          <button onClick={() => purchaseMutation.mutate(purchaseForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Enregistrer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
