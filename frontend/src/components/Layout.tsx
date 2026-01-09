import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  FolderOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface NavItem {
  label: string;
  icon: any;
  to?: string;
  children?: NavItem[];
}

export const Layout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Gestion Commerciale', 'Ressources Humaines']);

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
              <div key={item.label} className="mb-1">
                  <button
                      onClick={() => toggleGroup(item.label)}
                      className={twMerge(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                          hasActiveChild ? "bg-blue-50/50 text-blue-800" : "text-gray-700 hover:bg-gray-50",
                          !isSidebarOpen && "justify-center px-2"
                      )}
                      title={!isSidebarOpen ? item.label : undefined}
                  >
                      <div className="flex items-center overflow-hidden">
                          <item.icon className={twMerge(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              hasActiveChild ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                              isSidebarOpen ? "mr-3" : "mx-auto"
                          )} />
                          <span className={clsx("whitespace-nowrap font-medium transition-all duration-300", !isSidebarOpen && "w-0 opacity-0 hidden")}>
                              {item.label}
                          </span>
                      </div>
                      {isSidebarOpen && (
                          <ChevronDown className={twMerge(
                              "w-4 h-4 text-gray-400 transition-transform duration-200",
                              isExpanded && "transform rotate-180"
                          )} />
                      )}
                  </button>
                  {/* Submenu */}
                  <div className={twMerge(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      (isExpanded && isSidebarOpen) ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}>
                      <div className="space-y-1">
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
            "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
            isActive 
              ? "bg-blue-50 text-blue-700 font-medium" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            depth > 0 && "ml-4 border-l-2 border-gray-100 pl-4", // Indentation
            !isSidebarOpen && "justify-center ml-0 pl-3"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className={twMerge(
            "w-5 h-5 flex-shrink-0 transition-colors",
            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
            (isSidebarOpen && depth === 0) ? "mr-3" : (isSidebarOpen && depth > 0) ? "mr-3 w-4 h-4" : "mx-auto"
          )} />
          <span className={clsx(
            "whitespace-nowrap transition-all duration-300", 
            !isSidebarOpen && "lg:hidden opacity-0 w-0"
          )}>
            {item.label}
          </span>
        </Link>
      );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={twMerge(
          "fixed lg:static inset-y-0 left-0 z-30 bg-white border-r shadow-sm transition-all duration-300 ease-in-out flex flex-col",
          isSidebarOpen ? "w-72" : "w-20", // Slightly wider for submenus
          !isMobileMenuOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className={clsx("flex items-center font-bold text-xl text-blue-600 transition-all overflow-hidden whitespace-nowrap", !isSidebarOpen && "lg:hidden")}>
             {isSidebarOpen ? "System MULTISARL" : "SM"}
          </div>
           {/* Mobile Close Button */}
           <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
             <ChevronLeft className="w-6 h-6 text-gray-500" />
           </button>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map(item => renderNavItem(item))}
        </nav>
        
        <div className="p-3 border-t bg-gray-50/50">
          <button
            onClick={handleLogout}
            className={twMerge(
              "flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",
              !isSidebarOpen && "justify-center"
            )}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-700" />
            <span className={clsx("ml-3 whitespace-nowrap font-medium", !isSidebarOpen && "lg:hidden")}>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 relative">
           <div className="flex items-center">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
             >
               <Menu className="w-6 h-6" />
             </button>
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="hidden lg:flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
             >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
             </button>
           </div>
           
           <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end mr-2">
                 <span className="text-sm font-medium text-gray-700">Admin</span>
                 <span className="text-xs text-gray-500">MultiReseaux SARL</span>
             </div>
             <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm">
                A
             </div>
           </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-50/50">
           <div className="max-w-7xl mx-auto space-y-6 pb-12">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};
