import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Lock, User } from 'lucide-react';
import logo from '../assets/logo.png';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // 1. Get Token
      const response = await api.post('/auth/login/', { username, password });
      setToken(response.data.access, response.data.refresh);
      
      // 2. Get User Details (using the new token)
      // Note: setToken updates the store, but axios interceptor uses `useAuthStore.getState().token`
      // which is immediately available if we just set it.
      const userResponse = await api.get('/auth/users/me/');
      setUser(userResponse.data);

      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response) {
         // The server responded with a status code that falls out of the range of 2xx
         if (err.response.status === 401) {
            setError('Identifiants invalides.');
         } else if (err.response.status === 404) {
            setError('Serveur injoignable (404). Vérifiez la configuration API.');
         } else {
            setError(`Erreur serveur: ${err.response.status} - ${err.response.statusText}`);
         }
      } else if (err.request) {
         // The request was made but no response was received
         setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
         // Something happened in setting up the request that triggered an Error
         setError('Erreur de configuration: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-blue/20 to-brand-red/10 animate-pulse-slow"></div>
          <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] rounded-full bg-brand-blue/5 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-red/5 blur-3xl"></div>
      </div>

      <div className="bg-white/5 p-1 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-xl border border-white/10 z-10">
        <div className="bg-white/95 p-8 rounded-xl w-full h-full shadow-inner relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-blue to-brand-red"></div>
          
          <div className="text-center mb-8 mt-4">
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Logo" className="h-24 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Bienvenue</h2>
            <p className="text-gray-500 mt-2 text-sm">Connectez-vous pour accéder à votre espace</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-brand-red text-red-700 p-4 rounded-r mb-6 animate-fade-in shadow-sm flex items-start">
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-brand-blue to-[#007EA8] hover:from-[#007EA8] hover:to-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all transform hover:-translate-y-0.5 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-4 text-white/50 text-xs">
            © {new Date().getFullYear()} MultiReseaux SARL. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};
