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
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Activity,
  Layers
} from 'lucide-react';
import clsx from 'clsx';

export const Dashboard = () => {
  const { data: kpis, isLoading } = useQuery('kpis', async () => {
    const response = await api.get('/dashboard/kpis/');
    return response.data;
  }, {
    refetchInterval: 30000, 
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  // Helper pour formater l'argent
  const formatMoney = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount || 0);

  // Helper pour calculer la variation
  const getVariation = (metricKey: string) => {
    if (!kpis?.monthly_evolution || kpis.monthly_evolution.length < 2) return null;
    
    const currentMonth = kpis.monthly_evolution[kpis.monthly_evolution.length - 1];
    const prevMonth = kpis.monthly_evolution[kpis.monthly_evolution.length - 2];
    
    let currentVal = 0;
    let prevVal = 0;

    switch(metricKey) {
        case 'total_expenses':
            currentVal = currentMonth.expenses;
            prevVal = prevMonth.expenses;
            break;
        case 'suppliers':
            currentVal = currentMonth.suppliers_expenses;
            prevVal = prevMonth.suppliers_expenses;
            break;
        case 'labour':
            currentVal = currentMonth.labour_expenses;
            prevVal = prevMonth.labour_expenses;
            break;
        case 'general':
            currentVal = currentMonth.general_expenses;
            prevVal = prevMonth.general_expenses;
            break;
        case 'margin':
            currentVal = currentMonth.margin;
            prevVal = prevMonth.margin;
            break;
        default:
            return null;
    }

    if (prevVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
  };

  const cards = [
    {
      title: "Dépenses Totales",
      value: kpis?.total_expenses,
      icon: TrendingDown,
      color: "bg-red-50 text-red-600",
      metricKey: 'total_expenses'
    },
    {
      title: "Fournisseurs",
      value: kpis?.expenses_breakdown?.suppliers,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      metricKey: 'suppliers'
    },
    {
      title: "Main-d'œuvre",
      value: kpis?.expenses_breakdown?.labour,
      icon: Users,
      color: "bg-orange-50 text-orange-600",
      metricKey: 'labour'
    },
    {
      title: "Autres",
      value: kpis?.expenses_breakdown?.general,
      icon: Layers,
      color: "bg-purple-50 text-purple-600",
      metricKey: 'general'
    },
    {
      title: "Marge Brute",
      value: kpis?.profit_margin,
      icon: Activity,
      color: kpis?.profit_margin >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
      metricKey: 'margin'
    }
  ];

  const quickActions = [
    { to: '/quotes', label: 'Créer un Devis', icon: Plus, color: 'bg-blue-600 hover:bg-blue-700' },
    { to: '/delivery-notes', label: 'Générer BL', icon: Truck, color: 'bg-green-600 hover:bg-green-700' },
    { to: '/clients', label: 'Nouveau Client', icon: UserPlus, color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord</h1>
           <p className="text-gray-500 mt-1 text-lg">Vue d'ensemble et indicateurs de performance</p>
        </div>
        <div className="flex gap-3">
            {quickActions.map((action, idx) => (
                <Link 
                    key={idx} 
                    to={action.to} 
                    className={`${action.color} text-white px-4 py-2.5 rounded-lg font-medium flex items-center shadow-lg transform transition hover:-translate-y-0.5`}
                >
                    <action.icon className="w-5 h-5 mr-2" />
                    {action.label}
                </Link>
            ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
            const variation = getVariation(card.metricKey);
            const valueClass = card.value === 0 ? 'text-gray-400' : (card.metricKey === 'margin' && card.value < 0 ? 'text-red-600' : 'text-gray-900');
            
            return (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${card.color}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        {variation !== null && (
                            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${variation >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {variation >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Math.abs(variation).toFixed(1)}%
                            </span>
                        )}
                        {variation === null && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                --
                            </span>
                        )}
                    </div>

                    {/* Value & Title */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">{card.title}</h3>
                        <div className={`text-2xl font-bold ${valueClass}`}>
                            {formatMoney(card.value)}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Section Secondaire: Graphs & Projets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graphique Evolution Mensuelle */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Évolution Financière</h3>
                <p className="text-xs text-gray-500 mt-1">Revenus vs Dépenses sur les 6 derniers mois</p>
              </div>
              <ArrowUpRight className="text-gray-400 w-5 h-5" />
           </div>
           
           <div className="h-64 flex items-end justify-between space-x-2 px-2">
              {kpis?.monthly_evolution?.map((item: any, idx: number) => {
                 const maxAmount = Math.max(
                   ...kpis.monthly_evolution.map((m: any) => Math.max(m.revenue || 0, m.expenses || 0)), 1
                 );
                 const revenueHeight = Math.max((item.revenue / maxAmount) * 100, 2);
                 const expensesHeight = Math.max((item.expenses / maxAmount) * 100, 2);
                 const hasProfit = (item.revenue || 0) >= (item.expenses || 0);
                 
                 return (
                    <div key={idx} className="flex flex-col items-center flex-1 group h-full justify-end relative">
                       {/* Bars Container */}
                       <div className="w-full flex items-end justify-center space-x-1 h-full">
                            {/* Revenue Bar */}
                            <div 
                                className="w-1/3 bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 relative"
                                style={{ height: `${revenueHeight}%` }}
                            ></div>
                            {/* Expenses Bar */}
                            <div 
                                className="w-1/3 bg-red-400 rounded-t-lg transition-all duration-500 group-hover:bg-red-500 relative"
                                style={{ height: `${expensesHeight}%` }}
                            ></div>
                       </div>
                       
                       {/* Label */}
                       <p className="text-xs text-gray-500 mt-2 font-medium">{item.month?.split('-')[1]}/{item.month?.split('-')[0].slice(2)}</p>
                       
                       {/* Tooltip */}
                       <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-lg">
                           <div className="font-bold mb-1 border-b border-gray-700 pb-1">{item.month}</div>
                           <div className="flex justify-between gap-4"><span className="text-blue-300">Revenus:</span> <span>{formatMoney(item.revenue)}</span></div>
                           <div className="flex justify-between gap-4"><span className="text-red-300">Dépenses:</span> <span>{formatMoney(item.expenses)}</span></div>
                           <div className={`flex justify-between gap-4 font-bold mt-1 ${hasProfit ? 'text-green-400' : 'text-red-400'}`}>
                               <span>Marge:</span> <span>{formatMoney(item.margin)}</span>
                           </div>
                       </div>
                    </div>
                 )
              })}
              {(!kpis?.monthly_evolution || kpis.monthly_evolution.length === 0) && (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                    Pas de données suffisantes pour l'historique
                 </div>
              )}
           </div>
        </div>

        {/* Colonne Droite: Projets & Activité */}
        <div className="space-y-6">
            {/* Project Stats Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-gray-400" />
                    Projets
                </h3>
                <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</div>
                        <div className="text-2xl font-bold text-gray-800">{kpis?.total_projects || 0}</div>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div>
                        <div className="text-xs text-blue-500 font-bold uppercase tracking-wider">En Cours</div>
                        <div className="text-2xl font-bold text-blue-600">{kpis?.active_projects || 0}</div>
                    </div>
                </div>
                
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Derniers Projets</h4>
                <div className="space-y-3">
                    {kpis?.recent_projects?.slice(0, 3).map((p: any) => (
                        <div key={p.id_project} className="flex justify-between items-center p-2 rounded hover:bg-gray-50 transition-colors">
                             <div className="flex items-center truncate">
                                 <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${p.etat_projet === 'EN_COURS' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                 <span className="font-medium text-gray-700 text-sm truncate">{p.nom_projet}</span>
                             </div>
                             <span className="text-xs text-gray-400 ml-2">{new Date(p.date_debut).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
                <Link to="/projects" className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                   Gérer les projets &rarr;
                </Link>
            </div>

            {/* Répartition Dépenses (Mini Bar Chart) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Ratio Dépenses</h3>
                 <div className="space-y-4">
                     {kpis?.total_expenses > 0 ? (
                       <>
                         <div>
                             <div className="flex justify-between text-xs mb-1">
                                 <span className="text-gray-600 font-medium">Fournisseurs</span>
                                 <span className="text-gray-900">{Math.round((kpis?.expenses_breakdown?.suppliers / kpis?.total_expenses * 100) || 0)}%</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-1.5">
                                 <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(kpis?.expenses_breakdown?.suppliers / kpis?.total_expenses * 100) || 0}%` }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-xs mb-1">
                                 <span className="text-gray-600 font-medium">Main-d'œuvre</span>
                                 <span className="text-gray-900">{Math.round((kpis?.expenses_breakdown?.labour / kpis?.total_expenses * 100) || 0)}%</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-1.5">
                                 <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(kpis?.expenses_breakdown?.labour / kpis?.total_expenses * 100) || 0}%` }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-xs mb-1">
                                 <span className="text-gray-600 font-medium">Autres</span>
                                 <span className="text-gray-900">{Math.round((kpis?.expenses_breakdown?.general / kpis?.total_expenses * 100) || 0)}%</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-1.5">
                                 <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(kpis?.expenses_breakdown?.general / kpis?.total_expenses * 100) || 0}%` }}></div>
                             </div>
                         </div>
                       </>
                     ) : (
                       <p className="text-sm text-gray-400 text-center py-4">Aucune dépense enregistrée</p>
                     )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

