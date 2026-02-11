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
      title: "Charges",
      value: kpis?.expenses_breakdown?.general,
      icon: Layers,
      color: "bg-purple-50 text-purple-600",
      metricKey: 'general'
    },
    {
      title: "Marge Nette",
      value: kpis?.net_margin || kpis?.profit_margin,
      icon: Activity,
      color: (kpis?.net_margin || kpis?.profit_margin || 0) >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
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
           
           <div className="h-72 relative">
              {kpis?.monthly_evolution && kpis.monthly_evolution.length > 0 ? (
                <>
                  <svg className="w-full h-full" viewBox="0 0 600 260" preserveAspectRatio="none">
                    {/* Gradient definitions */}
                    <defs>
                      {/* Revenue gradient */}
                      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.05 }} />
                      </linearGradient>
                      
                      {/* Expenses gradient */}
                      <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#f87171', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#f87171', stopOpacity: 0.05 }} />
                      </linearGradient>
                      
                      {/* Glow filter */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      {/* Shadow */}
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        y1={220 - (y * 2)}
                        x2="580"
                        y2={220 - (y * 2)}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="5 5"
                        opacity="0.5"
                      />
                    ))}
                    
                    {(() => {
                      const maxAmount = Math.max(
                        ...kpis.monthly_evolution.map((m: any) => Math.max(m.revenue || 0, m.expenses || 0)), 1
                      );
                      const points = kpis.monthly_evolution.length;
                      const spacing = 540 / (points > 1 ? points - 1 : 1);
                      
                      // Revenue area path
                      const revenueAreaPath = kpis.monthly_evolution
                        .map((item: any, idx: number) => {
                          const x = 40 + idx * spacing;
                          const y = 220 - ((item.revenue / maxAmount) * 200);
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ') + ` L ${40 + (points - 1) * spacing} 220 L 40 220 Z`;
                      
                      // Revenue line path
                      const revenuePath = kpis.monthly_evolution
                        .map((item: any, idx: number) => {
                          const x = 40 + idx * spacing;
                          const y = 220 - ((item.revenue / maxAmount) * 200);
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ');
                      
                      // Expenses area path
                      const expensesAreaPath = kpis.monthly_evolution
                        .map((item: any, idx: number) => {
                          const x = 40 + idx * spacing;
                          const y = 220 - ((item.expenses / maxAmount) * 200);
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ') + ` L ${40 + (points - 1) * spacing} 220 L 40 220 Z`;
                      
                      // Expenses line path
                      const expensesPath = kpis.monthly_evolution
                        .map((item: any, idx: number) => {
                          const x = 40 + idx * spacing;
                          const y = 220 - ((item.expenses / maxAmount) * 200);
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ');
                      
                      return (
                        <g>
                          {/* Revenue area with gradient */}
                          <path
                            d={revenueAreaPath}
                            fill="url(#revenueGradient)"
                            className="transition-all duration-700"
                          />
                          
                          {/* Expenses area with gradient */}
                          <path
                            d={expensesAreaPath}
                            fill="url(#expensesGradient)"
                            className="transition-all duration-700"
                          />
                          
                          {/* Revenue line with glow */}
                          <path
                            d={revenuePath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                            className="transition-all duration-700"
                          />
                          
                          {/* Expenses line with glow */}
                          <path
                            d={expensesPath}
                            fill="none"
                            stroke="#f87171"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                            className="transition-all duration-700"
                          />
                          
                          {/* Data points */}
                          {kpis.monthly_evolution.map((item: any, idx: number) => {
                            const x = 40 + idx * spacing;
                            const revenueY = 220 - ((item.revenue / maxAmount) * 200);
                            const expensesY = 220 - ((item.expenses / maxAmount) * 200);
                            const hasProfit = (item.revenue || 0) >= (item.expenses || 0);
                            
                            return (
                              <g key={idx}>
                                {/* Revenue point */}
                                <circle 
                                  cx={x} 
                                  cy={revenueY} 
                                  r="6" 
                                  fill="#3b82f6" 
                                  stroke="white" 
                                  strokeWidth="3"
                                  filter="url(#shadow)"
                                  className="cursor-pointer transition-all duration-300 hover:r-8"
                                  style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
                                >
                                  <title>Revenus: {formatMoney(item.revenue)}</title>
                                </circle>
                                
                                {/* Expenses point */}
                                <circle 
                                  cx={x} 
                                  cy={expensesY} 
                                  r="6" 
                                  fill="#f87171" 
                                  stroke="white" 
                                  strokeWidth="3"
                                  filter="url(#shadow)"
                                  className="cursor-pointer transition-all duration-300 hover:r-8"
                                  style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1 + 0.05}s both` }}
                                >
                                  <title>Dépenses: {formatMoney(item.expenses)}</title>
                                </circle>
                                
                                {/* Hover area for tooltip */}
                                <rect
                                  x={x - 20}
                                  y="0"
                                  width="40"
                                  height="220"
                                  fill="transparent"
                                  className="cursor-pointer peer"
                                />
                                
                                {/* Vertical line on hover */}
                                <line
                                  x1={x}
                                  y1="20"
                                  x2={x}
                                  y2="220"
                                  stroke="#94a3b8"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                  opacity="0"
                                  className="peer-hover:opacity-100 transition-opacity pointer-events-none"
                                />
                                
                                {/* Tooltip on hover */}
                                <g className="opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none">
                                  <rect
                                    x={x - 60}
                                    y={Math.min(revenueY, expensesY) - 70}
                                    width="120"
                                    height="60"
                                    rx="8"
                                    fill="#1e293b"
                                    filter="url(#shadow)"
                                  />
                                  <text
                                    x={x}
                                    y={Math.min(revenueY, expensesY) - 52}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="11"
                                    fontWeight="bold"
                                  >
                                    {item.month?.split('-')[1]}/{item.month?.split('-')[0]}
                                  </text>
                                  <text
                                    x={x}
                                    y={Math.min(revenueY, expensesY) - 38}
                                    textAnchor="middle"
                                    fill="#93c5fd"
                                    fontSize="9"
                                  >
                                    Rev: {(item.revenue / 1000).toFixed(1)}K
                                  </text>
                                  <text
                                    x={x}
                                    y={Math.min(revenueY, expensesY) - 26}
                                    textAnchor="middle"
                                    fill="#fca5a5"
                                    fontSize="9"
                                  >
                                    Dép: {(item.expenses / 1000).toFixed(1)}K
                                  </text>
                                  <text
                                    x={x}
                                    y={Math.min(revenueY, expensesY) - 14}
                                    textAnchor="middle"
                                    fill={hasProfit ? '#86efac' : '#fca5a5'}
                                    fontSize="10"
                                    fontWeight="bold"
                                  >
                                    Δ {((item.margin || 0) / 1000).toFixed(1)}K
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="flex justify-between mt-3 px-10">
                    {kpis.monthly_evolution.map((item: any, idx: number) => (
                      <div key={idx} className="text-center flex-1">
                        <div className="text-xs font-semibold text-gray-700">
                          {item.month?.split('-')[1]}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          '{item.month?.split('-')[0].slice(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend with stats */}
                  <div className="flex justify-center gap-8 mt-6 pb-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg"></div>
                      <span className="text-xs font-semibold text-blue-700">Revenus</span>
                      <span className="text-xs font-bold text-blue-900">
                        {formatMoney(kpis.monthly_evolution.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) / kpis.monthly_evolution.length)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-lg"></div>
                      <span className="text-xs font-semibold text-red-700">Dépenses</span>
                      <span className="text-xs font-bold text-red-900">
                        {formatMoney(kpis.monthly_evolution.reduce((sum: number, m: any) => sum + (m.expenses || 0), 0) / kpis.monthly_evolution.length)}
                      </span>
                    </div>
                  </div>
                  
                  {/* CSS Animation */}
                  <style>{`
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                        transform: scale(0);
                      }
                      to {
                        opacity: 1;
                        transform: scale(1);
                      }
                    }
                  `}</style>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">📊</div>
                    <div className="text-gray-400 text-sm">Pas de données suffisantes pour l'historique</div>
                  </div>
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

