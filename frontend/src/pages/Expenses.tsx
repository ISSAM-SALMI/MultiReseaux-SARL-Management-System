import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Briefcase, 
  Plus, 
  Calendar, 
  Edit, 
  Trash2, 
  PieChart,
  Truck,
  Car,
  Package,
  FileText
} from 'lucide-react';
import api from '../api/axios';

interface GeneralExpense {
  id_expense: number;
  label: string;
  amount: number;
  date: string;
  category: 'TRANSPORT' | 'FUEL' | 'LOGISTICS' | 'OFFICE' | 'OTHER';
  description?: string;
}

interface MonthlyLabourCost {
  id_labour: number;
  year: number;
  month: number;
  amount: number;
  description?: string;
  month_name?: string;
}

const CATEGORIES = [
  { value: 'TRANSPORT', label: 'Transport', icon: Truck },
  { value: 'FUEL', label: 'Carburant / Auto', icon: Car },
  { value: 'LOGISTICS', label: 'Logistique', icon: Package },
  { value: 'OFFICE', label: 'Bureau & Admin', icon: Briefcase },
  { value: 'OTHER', label: 'Autre', icon: FileText },
];

export const Expenses = () => {
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<GeneralExpense | null>(null);
    const [form, setForm] = useState<Partial<GeneralExpense>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: 'OTHER',
        label: ''
    });

    // Labour Cost Modal
    const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
    const [labourForm, setLabourForm] = useState({ amount: 0, description: '' });

    // Fetch Dashboard Stats
    const { data: stats } = useQuery(['expense-stats', selectedYear, selectedMonth], async () => {
        const res = await api.get(`/budget/general-expenses/monthly-dashboard/?year=${selectedYear}&month=${selectedMonth}`);
        return res.data;
    });

    // 

    // Fetch Monthly Labour Cost (manual entry)
    const { data: labourCosts = [] } = useQuery(['labour-costs', selectedYear, selectedMonth], async () => {
        const res = await api.get(`/budget/labour-costs/?year=${selectedYear}&month=${selectedMonth}`);
        return res.data.results || res.data;
    });

    const currentLabourCost = labourCosts.length > 0 ? labourCosts[0] : null;

    // Fetch List of General Expenses
    const { data: expenses = [] } = useQuery(['general-expenses', selectedYear, selectedMonth], async () => {
        const res = await api.get(`/budget/general-expenses/?year=${selectedYear}&month=${selectedMonth}`);
        return res.data.results || res.data;
    });

    // Mutations
    const mutation = useMutation(
        (data: any) => editingExpense 
            ? api.put(`/budget/general-expenses/${editingExpense.id_expense}/`, data)
            : api.post('/budget/general-expenses/', data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['expense-stats']);
                queryClient.invalidateQueries(['general-expenses']);
                setIsModalOpen(false);
            }
        }
    );

    const deleteMutation = useMutation(
        (id: number) => api.delete(`/budget/general-expenses/${id}/`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['expense-stats']);
                queryClient.invalidateQueries(['general-expenses']);
            }
        }
    );

    // Labour Cost Mutations
    const labourMutation = useMutation(
        (data: any) => currentLabourCost
            ? api.put(`/budget/labour-costs/${currentLabourCost.id_labour}/`, { ...data, year: selectedYear, month: selectedMonth })
            : api.post('/budget/labour-costs/', { ...data, year: selectedYear, month: selectedMonth }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['expense-stats']);
                queryClient.invalidateQueries(['labour-costs']);
                setIsLabourModalOpen(false);
            }
        }
    );

    const deleteLabourMutation = useMutation(
        (id: number) => api.delete(`/budget/labour-costs/${id}/`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['expense-stats']);
                queryClient.invalidateQueries(['labour-costs']);
            }
        }
    );

    const formatMoney = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

    const openModal = (expense?: GeneralExpense) => {
        setEditingExpense(expense || null);
        setForm(expense || {
            date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, // Default to selected month first day
            amount: 0,
            category: 'OTHER',
            label: ''
        });
        setIsModalOpen(true);
    };

    const openLabourModal = () => {
        setLabourForm({
            amount: currentLabourCost?.amount || 0,
            description: currentLabourCost?.description || ''
        });
        setIsLabourModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <PieChart className="mr-3 text-indigo-600" /> Gestion des Dépenses
                    </h1>
                    <p className="text-gray-500 text-sm ml-9">Vue centralisée des coûts mensuels.</p>
                </div>

                <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <select 
                        className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m-1).toLocaleString('fr-FR', {month: 'long'})}</option>
                        ))}
                    </select>
                    <select 
                        className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Briefcase className="w-16 h-16" /></div>
                    <p className="text-sm text-gray-500 font-medium">Fournisseurs</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatMoney(stats?.summary?.suppliers_total || 0)}</p>
                    <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Users className="w-16 h-16" /></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-500 font-medium">Main d'oeuvre</p>
                        <button 
                            onClick={openLabourModal}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Saisir coût manuel"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{formatMoney(stats?.summary?.labor_total || 0)}</p>
                    {stats?.summary?.labor_source && (
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                stats.summary.labor_source === 'manual' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {stats.summary.labor_source === 'manual' ? '✓ Saisi manuellement' : 'Non défini'}
                            </span>
                        </div>
                    )}
                    <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Car className="w-16 h-16" /></div>
                    <p className="text-sm text-gray-500 font-medium">Autres Dépenses</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatMoney(stats?.summary?.general_options_total || 0)}</p>
                    <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard className="w-16 h-16" /></div>
                    <p className="text-sm text-indigo-100 font-medium">Total Général Mensuel</p>
                    <p className="text-3xl font-bold mt-2">{formatMoney(stats?.summary?.grand_total || 0)}</p>
                    <p className="text-xs text-indigo-200 mt-1">
                        {new Date(selectedYear, selectedMonth-1).toLocaleString('fr-FR', {month: 'long', year: 'numeric'})}
                    </p>
                </div>
            </div>

            {/* General Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Autres Dépenses (Ajouts Manuels)</h2>
                    <button 
                        onClick={() => openModal()} 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Ajouter Dépense
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Catégorie</th>
                                <th className="px-6 py-3">Libellé</th>
                                <th className="px-6 py-3">Montant</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.map((expense: GeneralExpense) => {
                                const CategoryIcon = CATEGORIES.find(c => c.value === expense.category)?.icon || FileText;
                                return (
                                    <tr key={expense.id_expense} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                <CategoryIcon className="w-3 h-3 mr-1" />
                                                {CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.label}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatMoney(expense.amount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openModal(expense)} className="text-blue-600 hover:text-blue-800 mx-1"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { if(confirm('Supprimer ?')) deleteMutation.mutate(expense.id_expense) }} className="text-red-600 hover:text-red-800 mx-1"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Aucune dépense supplémentaire enregistrée pour ce mois.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Labour Costs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Coûts Main-d'œuvre Mensuels</h2>
                    <button 
                        onClick={openLabourModal} 
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> {currentLabourCost ? 'Modifier Coût' : 'Définir Coût'}
                    </button>
                </div>

                <div className="p-6">
                    {currentLabourCost ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Montant Main-d'œuvre</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{formatMoney(currentLabourCost.amount)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={openLabourModal}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(confirm('Supprimer le coût de main-d\'œuvre pour ce mois ?')) {
                                                deleteLabourMutation.mutate(currentLabourCost.id_labour);
                                            }
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {currentLabourCost.description && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 font-medium mb-1">Note / Détails</p>
                                    <p className="text-gray-700">{currentLabourCost.description}</p>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Coût manuel défini
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(selectedYear, selectedMonth-1).toLocaleString('fr-FR', {month: 'long', year: 'numeric'})}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Aucun coût de main-d'œuvre défini pour ce mois</p>
                            <p className="text-sm text-gray-400 mb-4">Définissez manuellement le coût de la main-d'œuvre pour ce mois</p>
                            <button 
                                onClick={openLabourModal}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center hover:bg-green-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Définir le coût
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">{editingExpense ? 'Modifier Dépense' : 'Nouvelle Dépense'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full border rounded-lg p-2"
                                    value={form.date}
                                    onChange={(e) => setForm({...form, date: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select 
                                    className="w-full border rounded-lg p-2"
                                    value={form.category}
                                    onChange={(e) => setForm({...form, category: e.target.value as any})}
                                >
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Frais carburant..." 
                                    className="w-full border rounded-lg p-2"
                                    value={form.label}
                                    onChange={(e) => setForm({...form, label: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (MAD)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-lg pl-9 p-2"
                                        value={form.amount}
                                        onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                                <textarea 
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                    value={form.description || ''}
                                    onChange={(e) => setForm({...form, description: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                                <button onClick={() => mutation.mutate(form)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Labour Cost Modal */}
            {isLabourModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {currentLabourCost ? 'Modifier' : 'Définir'} Coût Main-d'œuvre
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(selectedYear, selectedMonth-1).toLocaleString('fr-FR', {month: 'long', year: 'numeric'})}
                                </p>
                            </div>
                            {currentLabourCost && (
                                <button 
                                    onClick={() => {
                                        if(confirm('Supprimer le coût de main-d\'œuvre pour ce mois ?')) {
                                            deleteLabourMutation.mutate(currentLabourCost.id_labour);
                                            setIsLabourModalOpen(false);
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant Total (MAD)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-lg pl-9 p-2"
                                        value={labourForm.amount}
                                        onChange={(e) => setLabourForm({...labourForm, amount: parseFloat(e.target.value) || 0})}
                                        placeholder="Ex: 50000"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Montant total de la main-d'œuvre pour ce mois
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note / Détails</label>
                                <textarea 
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                    value={labourForm.description || ''}
                                    onChange={(e) => setLabourForm({...labourForm, description: e.target.value})}
                                    placeholder="Optionnel : détails, justificatifs..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    onClick={() => setIsLabourModalOpen(false)} 
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={() => labourMutation.mutate(labourForm)} 
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    {currentLabourCost ? 'Mettre à jour' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
