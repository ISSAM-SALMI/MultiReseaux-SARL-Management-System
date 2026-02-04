import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  Briefcase, 
  FileText, 
  FileCheck, 
  AlertCircle,
  Plus,
  Truck,
  UserPlus,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { clsx } from 'clsx';

export const Dashboard = () => {
  const { data: kpis, isLoading } = useQuery('kpis', async () => {
    const response = await api.get('/dashboard/kpis/');
    return response.data;
  }, {
    refetchInterval: 60000, 
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const stats = [
    { label: 'Projets Totaux', value: kpis?.total_projects, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { label: 'Projets En Cours', value: kpis?.active_projects, icon: AlertCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Montant Devis', value: `${Number(kpis?.total_quotes_amount).toLocaleString('fr-MA')} MAD`, icon: FileText, color: 'bg-purple-100 text-purple-600' },
    { label: 'Montant Facturé', value: `${Number(kpis?.total_invoices_amount).toLocaleString('fr-MA')} MAD`, icon: FileCheck, color: 'bg-orange-100 text-orange-600' },
  ];

  const quickActions = [
    { to: '/quotes', label: 'Créer un Devis', icon: Plus, color: 'bg-blue-600 hover:bg-blue-700' },
    { to: '/delivery-notes', label: 'Générer BL', icon: Truck, color: 'bg-green-600 hover:bg-green-700' },
    { to: '/clients', label: 'Nouveau Client', icon: UserPlus, color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  // Simple calculation for chart scaling
  const maxQuoteAmount = kpis?.monthly_evolution 
    ? Math.max(...kpis.monthly_evolution.map((m: any) => m.quotes_amount)) 
    : 1;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
           <p className="text-gray-500">Bienvenue sur votre espace de gestion.</p>
        </div>
        <div className="flex flex-wrap gap-3">
           {quickActions.map((action, idx) => (
             <Link 
               key={idx} 
               to={action.to}
               className={clsx("flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm", action.color)}
             >
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
             </Link>
           ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-transform hover:scale-[1.02]">
            <div className={`p-4 rounded-full ${stat.color} mr-5`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Evolution Chart (Simple CSS Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Évolution Mensuelle des Devis</h3>
              <ArrowUpRight className="text-gray-400 w-5 h-5" />
           </div>
           
           <div className="h-64 flex items-end justify-between space-x-2 sm:space-x-4 px-2">
              {kpis?.monthly_evolution?.map((item: any, idx: number) => {
                 const heightPercentage = item.quotes_amount > 0 ? (item.quotes_amount / maxQuoteAmount) * 100 : 0;
                 return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                       <div className="w-full h-full flex items-end">
                            <div 
                                className="w-full bg-blue-100 rounded-t-lg relative transition-all duration-500 group-hover:bg-blue-200"
                                style={{ height: `${heightPercentage}%` }}
                            >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                    {Number(item.quotes_amount).toLocaleString('fr-MA')} MAD
                                </div>
                            </div>
                       </div>
                       <p className="text-xs text-gray-500 mt-2 font-medium">{item.month}</p>
                    </div>
                 )
              })}
              {(!kpis?.monthly_evolution || kpis.monthly_evolution.length === 0) && (
                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Pas de données disponibles
                 </div>
              )}
           </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
           <h3 className="text-lg font-bold text-gray-800 mb-4">Projets Récents</h3>
           <div className="flex-1 overflow-auto space-y-4 max-h-[300px]">
              {kpis?.recent_projects?.map((project: any) => (
                 <div key={project.id_project} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                    <div>
                       <p className="text-sm font-semibold text-gray-800">{project.nom_projet}</p>
                       <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {project.date_debut}
                       </p>
                    </div>
                    <span className={clsx(
                       "text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2",
                       project.etat_projet === 'EN_COURS' ? "bg-blue-100 text-blue-700" :
                       project.etat_projet === 'TERMINE' ? "bg-green-100 text-green-700" :
                       project.etat_projet === 'ANNULE' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                    )}>
                       {project.etat_projet?.replace('_', ' ')}
                    </span>
                 </div>
              ))}
              {!kpis?.recent_projects?.length && (
                 <p className="text-sm text-gray-400 text-center py-4">Aucun projet récent</p>
              )}
           </div>
           <Link to="/projects" className="mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 border-t">
              Voir tous les projets
           </Link>
        </div>
      </div>
      
      {/* Recent Quotes */}
      <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-gray-800">Derniers Devis</h3>
             <Link to="/quotes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout</Link>
         </div>
         
         {/* Mobile List View */}
         <div className="md:hidden space-y-3">
            {kpis?.recent_quotes?.map((quote: any) => (
                <div key={quote.id_quote} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-800">{quote.numero_devis}</p>
                        <p className="text-xs text-gray-500">{quote.date_livraison}</p>
                    </div>
                    <span className="font-bold text-brand-blue">
                        {Number(quote.total_ttc).toLocaleString('fr-MA')} MAD
                    </span>
                </div>
            ))}
             {!kpis?.recent_quotes?.length && (
                 <p className="text-center py-4 text-gray-400">Aucun devis récent.</p>
             )}
         </div>

         {/* Desktop Table View */}
         <div className="hidden md:block overflow-x-auto">
             <table className="w-full text-left">
                 <thead>
                     <tr className="text-gray-500 text-sm border-b border-gray-100">
                         <th className="pb-3 font-medium px-4">Référence</th>
                         <th className="pb-3 font-medium px-4">Date Livraison</th>
                         <th className="pb-3 font-medium text-right px-4">Total TTC</th>
                     </tr>
                 </thead>
                 <tbody className="text-sm">
                     {kpis?.recent_quotes?.map((quote: any) => (
                         <tr key={quote.id_quote} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                             <td className="py-3 text-gray-800 font-medium px-4">{quote.numero_devis}</td>
                             <td className="py-3 text-gray-500 px-4">{quote.date_livraison}</td>
                             <td className="py-3 text-right font-bold text-brand-blue px-4">
                                {Number(quote.total_ttc).toLocaleString('fr-MA')} MAD
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
             {!kpis?.recent_quotes?.length && (
                 <p className="text-center py-8 text-gray-400">Aucun devis récent.</p>
             )}
         </div>
      </div>
    </div>
  );
};

