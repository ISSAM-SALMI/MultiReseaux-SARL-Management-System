import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  FileCheck, 
  Files, 
  Bell, 
  LogOut,
  Calculator,
  UserCog,
  ClipboardList,
  Banknote,
  Truck,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  PieChart,
  FolderOpen,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import logo from '../assets/logo.png';

interface NavItem {
  label: string;
  icon: any;
  to?: string;
  children?: NavItem[];
}

export const Layout = () => {
  const { logout, user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Gestion Commerciale', 'Ressources Humaines']);

  useEffect(() => {
    // Refresh user data on mount to ensure permissions are up to date
    api.get('/auth/users/me/')
      .then(res => setUser(res.data))
      .catch((err) => {
        console.error("Failed to refresh user data", err);
        if (err.response?.status === 401) {
            handleLogout();
        }
      });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (label: string) => {
    if (!isSidebarOpen) setIsSidebarOpen(true);
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const navItems: NavItem[] = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    
    { 
        label: 'Gestion Projets',
        icon: Briefcase,
        children: [
            { to: '/clients', icon: Users, label: 'Clients' },
            { to: '/projects', icon: FolderOpen, label: 'Projets' },
        ]
    },

    {
        label: 'Gestion Commerciale',
        icon: ShoppingBag,
        children: [
            { to: '/quotes', icon: FileText, label: 'Devis' },
            { to: '/quote-tracking', icon: PieChart, label: 'Suivi Devis' },
            { to: '/delivery-notes', icon: Truck, label: 'Bons de Livraison' },
            { to: '/invoices', icon: FileCheck, label: 'Factures' },
            { to: '/revenue', icon: TrendingUp, label: 'Revenus & Marges' },
        ]
    },

    {
        label: 'Gestion Achats',
        icon: ShoppingCart,
        children: [
            { to: '/suppliers', icon: Truck, label: 'Fournisseurs' },
            { to: '/expenses', icon: PieChart, label: 'Dépenses' },
        ]
    },

    {
        label: 'Ressources Humaines',
        icon: UserCog,
        children: [
            { to: '/budget', icon: Users, label: 'Salariés' },
            { to: '/salaries', icon: Banknote, label: 'Paie & Congés' },
            { to: '/hr-estimation', icon: Calculator, label: 'Estimation RH' },
        ]
    },

    { to: '/documents', icon: Files, label: 'Documents' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  // Admin Only Menu
  if (user?.is_superuser || user?.is_staff) {
      navItems.push({ to: '/users', icon: UserCog, label: 'Utilisateurs' });
  }

  // Auto-expand group if active child
  useEffect(() => {
     navItems.forEach(group => {
         if (group.children) {
             const hasActiveChild = group.children.some(child => child.to === location.pathname);
             if (hasActiveChild && !expandedGroups.includes(group.label)) {
                 setExpandedGroups(prev => [...prev, group.label]);
             }
         }
     });
  }, [location.pathname]);

  const renderNavItem = (item: NavItem, depth = 0) => {
      if (item.children) {
          const isExpanded = expandedGroups.includes(item.label);
          const hasActiveChild = item.children.some(child => child.to === location.pathname);
          
          return (
              <div key={item.label} className="mb-2">
                  <button
                      onClick={() => toggleGroup(item.label)}
                      className={twMerge(
                          "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group border border-transparent",
                          hasActiveChild ? "text-white bg-white/5 border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white",
                          !isSidebarOpen && "justify-center px-2"
                      )}
                      title={!isSidebarOpen ? item.label : undefined}
                  >
                      <div className="flex items-center overflow-hidden">
                          <item.icon className={twMerge(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              hasActiveChild ? "text-brand-blue" : "text-slate-500 group-hover:text-brand-blue",
                              isSidebarOpen ? "mr-3" : "mx-auto"
                          )} />
                          <span className={clsx("whitespace-nowrap font-medium transition-all duration-300", !isSidebarOpen && "w-0 opacity-0 hidden")}>
                              {item.label}
                          </span>
                      </div>
                      {isSidebarOpen && (
                          <ChevronDown className={twMerge(
                              "w-4 h-4 text-slate-500 transition-transform duration-200 group-hover:text-white",
                              isExpanded && "transform rotate-180"
                          )} />
                      )}
                  </button>
                  {/* Submenu */}
                  <div className={twMerge(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      (isExpanded && isSidebarOpen) ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}>
                      <div className="space-y-1 py-1">
                        {item.children.map(child => renderNavItem(child, depth + 1))}
                      </div>
                  </div>
              </div>
          );
      }

      const isActive = location.pathname === item.to;
      return (
        <Link
          key={item.to}
          to={item.to!}
          title={!isSidebarOpen ? item.label : undefined}
          className={twMerge(
            "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
            isActive 
              ? "bg-gradient-to-r from-brand-blue to-cyan-500 text-white shadow-soft font-semibold" 
              : "text-slate-400 hover:bg-white/5 hover:text-white",
            depth > 0 && "ml-4 pl-4 border-l border-white/10", // Indentation with guide line
            !isSidebarOpen && "justify-center ml-0 pl-3"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className={twMerge(
            "w-5 h-5 flex-shrink-0 transition-colors",
            isActive ? "text-white" : "text-slate-500 group-hover:text-brand-blue",
            (isSidebarOpen && depth === 0) ? "mr-3" : (isSidebarOpen && depth > 0) ? "mr-3 w-4 h-4" : "mx-auto"
          )} />
          <span className={clsx(
            "whitespace-nowrap transition-all duration-300", 
            !isSidebarOpen && "lg:hidden opacity-0 w-0"
          )}>
            {item.label}
          </span>
          {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-l-full" />}
        </Link>
      );
  };

  return (
    <div className="flex h-screen bg-brand-surface font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={twMerge(
          "fixed lg:static inset-y-0 left-0 z-30 bg-brand-navy border-r border-brand-navy shadow-2xl lg:shadow-xl transition-all duration-300 ease-in-out flex flex-col scale-100",
          isSidebarOpen ? "w-72" : "w-20", // Slightly wider for submenus
          !isMobileMenuOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center justify-center px-4 border-b border-white/10 bg-black/10">
          <div className={clsx("flex items-center transition-all overflow-hidden", !isSidebarOpen && "lg:hidden")}>
             <img src={logo} alt="MultiReseaux" className="h-12 w-auto object-contain drop-shadow-md" />
          </div>
          {!isSidebarOpen && (
              <img src={logo} alt="MR" className="h-8 w-auto object-contain lg:block hidden" />
          )}

           {/* Mobile Close Button */}
           <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 rounded-md text-white hover:bg-white/10 ml-auto transition-colors">
             <ChevronLeft className="w-6 h-6" />
           </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => renderNavItem(item))}
        </nav>
        
        <div className="p-3 border-t border-white/10 bg-black/10">
          <button
            onClick={handleLogout}
            className={twMerge(
              "flex items-center w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 group",
              !isSidebarOpen && "justify-center"
            )}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={clsx("ml-3 whitespace-nowrap font-medium", !isSidebarOpen && "lg:hidden")}>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-brand-surface">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
           <div className="flex items-center">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue"
             >
               <Menu className="w-6 h-6" />
             </button>
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="hidden lg:flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
             >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
             </button>
           </div>
           
           <div className="flex items-center space-x-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                 <span className="text-sm font-semibold text-gray-700">Admin</span>
                 <span className="text-xs text-gray-500">MultiReseaux SARL</span>
             </div>
             <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center text-white font-bold border border-white shadow-md ring-2 ring-brand-blue/10">
                A
             </div>
           </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
           <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};
