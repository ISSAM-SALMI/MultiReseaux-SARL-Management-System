import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, ArrowRight, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { TrackingLinesModal } from '../components/TrackingLinesModal';

interface QuoteTracking {
  id: number;
  quote: number;
  created_at: string;
  updated_at: string;
  // We might want to fetch expand data for quote details
  // but standard serializer just returns ID unless nested.
  // For display, we might need a custom serializer or fetch quotes separately. 
  // Let's assume we fetch quotes to map ID to Number.
}

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
  total_ht: number;
}

export const QuoteTracking = () => {
  const queryClient = useQueryClient();
  const [isSelectQuoteOpen, setIsSelectQuoteOpen] = useState(false);
  const [selectedTrackingId, setSelectedTrackingId] = useState<number | null>(null);
  const [selectedQuoteNumber, setSelectedQuoteNumber] = useState('');
  const [selectedQuoteTotalHt, setSelectedQuoteTotalHt] = useState<number>(0);
  const [search, setSearch] = useState('');
  
  // Fetch Trackings
  const { data: trackings = [] } = useQuery<QuoteTracking[]>('quote-trackings', async () => {
    const response = await api.get('/quotes/trackings/');
    return response.data.results || response.data;
  });

  // Fetch Quotes for mapping and selection
  const { data: quotes = [] } = useQuery<Quote[]>('quotes', async () => {
    const response = await api.get('/quotes/');
    return response.data.results || response.data;
  });

  const createTrackingMutation = useMutation(
    async (quoteId: number) => {
      const response = await api.post('/quotes/trackings/', { quote: quoteId });
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('quote-trackings');
        setIsSelectQuoteOpen(false);
        // Open the lines modal immediately
        const quote = quotes.find(q => q.id_quote === data.quote);
        handleOpenTracking(data.id, quote?.numero_devis || '', Number(quote?.total_ht || 0));
      },

    }
  );

  const deleteTrackingMutation = useMutation(
    async (id: number) => {
      await api.delete(`/quotes/trackings/${id}/`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('quote-trackings');
      },
    }
  );

  const handleOpenTracking = (trackingId: number, quoteNum: string, quoteTotal: number) => {
    setSelectedTrackingId(trackingId);
    setSelectedQuoteNumber(quoteNum);
    setSelectedQuoteTotalHt(quoteTotal);
  };

  const getQuoteDetails = (quoteId: number) => {
    return quotes.find(q => q.id_quote === quoteId);
  };

  const filteredQuotes = quotes.filter(q => 
    q.numero_devis.toLowerCase().includes(search.toLowerCase()) ||
    q.objet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Suivi des Lignes de Devis</h1>
           <p className="text-sm text-gray-500 hidden md:block">Suivez l'avancement de la production par ligne</p>
        </div>
        <button
          onClick={() => setIsSelectQuoteOpen(true)}
          className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau Suivi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Mobile View (Cards) */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50">
           {trackings.map((tracking) => {
              const quote = getQuoteDetails(tracking.quote);
              return (
                <div key={tracking.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                                {quote?.numero_devis || `ID: ${tracking.quote}`}
                            </span>
                            <h3 className="font-medium text-gray-900 line-clamp-1">{quote?.objet || 'Sans objet'}</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                            <span className="block text-xs text-gray-400">Création</span>
                            {new Date(tracking.created_at).toLocaleDateString()}
                        </div>
                         <div>
                            <span className="block text-xs text-gray-400">Mise à jour</span>
                            {new Date(tracking.updated_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
                        <button
                            onClick={() => handleOpenTracking(tracking.id, quote?.numero_devis || '', Number(quote?.total_ht || 0))}
                            className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium"
                        >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Gérer
                        </button>
                         <button
                            onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi ?')) {
                                    deleteTrackingMutation.mutate(tracking.id);
                                }
                            }}
                            className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg font-medium"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                        </button>
                    </div>
                </div>
              );
           })}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Devis</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Objet</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dernière Modif</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trackings.map((tracking) => {
              const quote = getQuoteDetails(tracking.quote);
              return (
                <tr key={tracking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-blue">
                    {quote?.numero_devis || `ID: ${tracking.quote}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {quote?.objet || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tracking.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tracking.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={() => handleOpenTracking(tracking.id, quote?.numero_devis || '', Number(quote?.total_ht || 0))}
                        className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center"
                        title="Gérer le suivi"
                    >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Gérer
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi ?')) {
                          deleteTrackingMutation.mutate(tracking.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {trackings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucun suivi en cours.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Select Quote Modal */}
      {isSelectQuoteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">Sélectionner un Devis à Suivre</h3>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un devis..."
                className="pl-10 w-full border rounded-md p-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredQuotes.map((quote) => (
                <button
                  key={quote.id_quote}
                  onClick={() => createTrackingMutation.mutate(quote.id_quote)}
                  className="w-full text-left p-3 border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex justify-between items-center"
                >
                    <div>
                        <div className="font-semibold">{quote.numero_devis}</div>
                        <div className="text-sm text-gray-500">{quote.objet}</div>
                    </div>
                    <Plus className="w-5 h-5 text-blue-500" />
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsSelectQuoteOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTrackingId && (
        <TrackingLinesModal
          isOpen={!!selectedTrackingId}
          onClose={() => setSelectedTrackingId(null)}
          trackingId={selectedTrackingId}
          quoteNumber={selectedQuoteNumber}
          initialTotalHt={selectedQuoteTotalHt}
        />
      )}
    </div>
  );
};
