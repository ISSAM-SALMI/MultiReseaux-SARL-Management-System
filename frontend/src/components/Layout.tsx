import { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Layout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/projects', icon: Briefcase, label: 'Projets' },
    { to: '/quotes', icon: FileText, label: 'Devis' },
    { to: '/quote-tracking', icon: ClipboardList, label: 'Suivi Devis' },
    { to: '/delivery-notes', icon: Truck, label: 'Bon de Livraison' },
    { to: '/salaries', icon: Banknote, label: 'Salaires & Congés' },
    { to: '/budget', icon: UserCog, label: 'Salariés' },
    { to: '/invoices', icon: FileCheck, label: 'Factures' },
    { to: '/documents', icon: Files, label: 'Documents' },
    { to: '/hr-estimation', icon: Calculator, label: 'Estimation RH' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ];

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
          isSidebarOpen ? "w-64" : "w-20",
          !isMobileMenuOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className={clsx("flex items-center font-bold text-xl text-blue-600 transition-all overflow-hidden whitespace-nowrap", !isSidebarOpen && "lg:hidden")}>
             {isSidebarOpen ? "MultiReseaux" : "MR"}
          </div>
           {/* Mobile Close Button */}
           <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
             <ChevronLeft className="w-6 h-6 text-gray-500" />
           </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={!isSidebarOpen ? item.label : undefined}
                className={twMerge(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-medium" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={twMerge(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                  isSidebarOpen ? "mr-3" : "mx-auto"
                )} />
                <span className={clsx(
                  "whitespace-nowrap transition-all duration-300", 
                  !isSidebarOpen && "lg:hidden opacity-0 w-0"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className={twMerge(
              "flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
              !isSidebarOpen && "justify-center"
            )}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={clsx("ml-3 whitespace-nowrap", !isSidebarOpen && "lg:hidden")}>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
           <div className="flex items-center">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
             >
               <Menu className="w-6 h-6" />
             </button>
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="hidden lg:flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
             >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
             </button>
           </div>
           
           <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end mr-2">
                 <span className="text-sm font-medium text-gray-700">Admin</span>
                 <span className="text-xs text-gray-500">MultiReseaux SARL</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                A
             </div>
           </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};
