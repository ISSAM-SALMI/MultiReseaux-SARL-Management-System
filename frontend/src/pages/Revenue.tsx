import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Activity, 
  Calendar, 
  Search,
  Filter,
  Save,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import api from '../api/axios';

// Project interface matching backend
interface Project {
  id_project: number;
  nom_projet: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  etat_projet: string;
  billing_status: 'NON_FACTURE' | 'EN_COURS' | 'FACTURE';
  budget_total: number;
  client_name?: string;
}

export const Revenue = () => {
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Fetch Stats
    const { data: stats } = useQuery(['revenue-stats', selectedYear, selectedMonth], async () => {
        const res = await api.get(`/projects/financial_overview/?year=${selectedYear}&month=${selectedMonth}`);
        return res.data;
    });

    // Fetch Projects
    const { data: projects = [] } = useQuery('projects', async () => {
        const res = await api.get('/projects/');
        return res.data.results || res.data;
    });

    // Mutation to update project billing status/amount
    const updateProjectMutation = useMutation(
        ({ id, data }: { id: number, data: Partial<Project> }) => api.patch(`/projects/${id}/`, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['projects']);
                queryClient.invalidateQueries(['revenue-stats']);
            }
        }
    );

    const formatMoney = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

    // Filter projects relevant to the selected period + Search
    const filteredProjects = useMemo(() => {
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0);

        return projects.filter((p: Project) => {
            const pStart = new Date(p.date_debut);
            const pEnd = p.date_fin ? new Date(p.date_fin) : null;
            
            // Period Overlap Logic
            const isActive = pStart <= endOfMonth && (!pEnd || pEnd >= startOfMonth);
            
            // Search & Status Logic
            const matchesSearch = p.nom_projet.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || p.billing_status === statusFilter;

            return isActive && matchesSearch && matchesStatus;
        });
    }, [projects, selectedYear, selectedMonth, searchTerm, statusFilter]);

    const handleStatusChange = (project: Project, newStatus: string) => {
        updateProjectMutation.mutate({
            id: project.id_project,
            data: { billing_status: newStatus as any }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <TrendingUp className="mr-3 text-emerald-600" /> Revenus & Marges
                    </h1>
                    <p className="text-gray-500 text-sm ml-9">Suivi de la facturation et rentabilité par projet.</p>
                </div>

                <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <select 
                        className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m-1).toLocaleString('fr-FR', {month: 'long'})}</option>
                        ))}
                    </select>
                    <select 
                        className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Facturé */}
                <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Facturé</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(stats?.revenue?.billed || 0)}</p>
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-2 opacity-50 absolute top-4 right-4" />
                </div>

                {/* 2. Non Facturé */}
                <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-red-400">
                    <p className="text-xs text-gray-500 font-bold uppercase">Non Facturé</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(stats?.revenue?.unbilled || 0)}</p>
                    <AlertCircle className="w-4 h-4 text-red-500 mt-2 opacity-50 absolute top-4 right-4" />
                </div>

                {/* 3. En Cours */}
                <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-blue-400">
                    <p className="text-xs text-gray-500 font-bold uppercase">En Cours</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(stats?.revenue?.in_progress || 0)}</p>
                    <Clock className="w-4 h-4 text-blue-500 mt-2 opacity-50 absolute top-4 right-4" />
                </div>

                {/* 4. Marge Brute */}
                <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-indigo-500 bg-indigo-50/50">
                    <p className="text-xs text-indigo-600 font-bold uppercase">Marge Brute</p>
                    <p className="text-xl font-bold text-indigo-900 mt-1">{formatMoney(stats?.revenue?.gross_margin || 0)}</p>
                    <span className="text-[10px] text-indigo-400">Total Projets</span>
                </div>

                {/* 5. Marge Nette */}
                <div className={`p-4 rounded-xl border shadow-sm border-l-4 ${stats?.net_margin >= 0 ? 'border-l-green-600 bg-green-50' : 'border-l-red-600 bg-red-50'}`}>
                    <p className={`text-xs font-bold uppercase ${stats?.net_margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Marge Nette</p>
                    <p className={`text-xl font-bold mt-1 ${stats?.net_margin >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatMoney(stats?.net_margin || 0)}</p>
                    <span className={`text-[10px] ${stats?.net_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>Après dépenses ({formatMoney(stats?.expenses?.total || 0)})</span>
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet..." 
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tous les statuts</option>
                        <option value="NON_FACTURE">Non Facturé</option>
                        <option value="EN_COURS">En Cours</option>
                        <option value="FACTURE">Facturé</option>
                    </select>
                </div>

                <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50">
                     {filteredProjects.map((project: Project) => (
                        <div key={project.id_project} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{project.nom_projet}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1">{project.description}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                                            ${project.billing_status === 'FACTURE' ? 'bg-green-100 text-green-800' : 
                                              project.billing_status === 'EN_COURS' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-red-100 text-red-800'}`}>
                                            {project.billing_status === 'FACTURE' ? 'Facturé' : 
                                             project.billing_status === 'EN_COURS' ? 'En Cours' : 'Non Facturé'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-3">
                                <div className="text-gray-500 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(project.date_debut).toLocaleDateString()}
                                </div>
                                <div className="font-bold text-gray-900">
                                    {formatMoney(Number(project.budget_total))}
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Changer Statut:</label>
                                <select 
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-brand-blue focus:ring-brand-blue"
                                    value={project.billing_status}
                                    onChange={(e) => handleStatusChange(project, e.target.value)}
                                >
                                    <option value="NON_FACTURE">Non Facturé</option>
                                    <option value="EN_COURS">En Cours</option>
                                    <option value="FACTURE">Facturé</option>
                                </select>
                            </div>
                        </div>
                     ))}
                     {filteredProjects.length === 0 && (
                        <div className="text-center p-8 text-gray-500">Aucun projet trouvé.</div>
                     )}
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Projet</th>
                                <th className="px-6 py-3">Date Début</th>
                                <th className="px-6 py-3">Montant Projet (Budget)</th>
                                <th className="px-6 py-3">Statut Facturation</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProjects.map((project: Project) => (
                                <tr key={project.id_project} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{project.nom_projet}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-xs">{project.description}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(project.date_debut).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                        {formatMoney(Number(project.budget_total))}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${project.billing_status === 'FACTURE' ? 'bg-green-100 text-green-800' : 
                                              project.billing_status === 'EN_COURS' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-red-100 text-red-800'}`}>
                                            {project.billing_status === 'FACTURE' ? 'Facturé' : 
                                             project.billing_status === 'EN_COURS' ? 'En Cours' : 'Non Facturé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select 
                                            className="text-xs border-gray-300 rounded shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                            value={project.billing_status}
                                            onChange={(e) => handleStatusChange(project, e.target.value)}
                                        >
                                            <option value="NON_FACTURE">Non Facturé</option>
                                            <option value="EN_COURS">En Cours</option>
                                            <option value="FACTURE">Facturé</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {filteredProjects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        Aucun projet trouvé pour cette période.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
