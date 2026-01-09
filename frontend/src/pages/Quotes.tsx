import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FileText, List } from 'lucide-react';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';
import { QuoteLinesModal } from '../components/QuoteLinesModal';

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
  date_livraison: string;
  total_ht: number;
  total_ttc: number;
  project: number;
  tva: number;
}

interface Project {
  id_project: number;
  nom_projet: string;
}

export const Quotes = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinesModalOpen, setIsLinesModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<any>(null);
  const [formData, setFormData] = useState({
    numero_devis: '',
    objet: '',
    date_livraison: '',
    tva: 20,
    project: ''
  });

  // Fetch Quotes
  const { data: quotes = [], isLoading } = useQuery<Quote[]>('quotes', async () => {
    const response = await api.get('/quotes/');
    return response.data.results || response.data;
  });

  // Fetch Projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  // Create Quote
  const createMutation = useMutation(
    (newQuote: any) => api.post('/quotes/', newQuote),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('quotes');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Create error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la création du devis.');
      }
    }
  );

  // Update Quote
  const updateMutation = useMutation(
    (quote: any) => api.put(`/quotes/${quote.id_quote}/`, quote),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('quotes');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Update error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la modification du devis.');
      }
    }
  );

  // Delete Quote
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/quotes/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('quotes');
      },
      onError: (err: any) => {
        console.error("Delete error:", err);
        alert('Une erreur est survenue lors de la suppression du devis.');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (editingQuote) {
      updateMutation.mutate({ ...formData, id_quote: editingQuote.id_quote });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingQuote(null);
    setError(null);
    setFormData({
      numero_devis: `DEV-${Date.now()}`, // Auto-generate simple ID
      objet: '',
      date_livraison: '',
      tva: 20,
      project: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote);
    setError(null);
    setFormData({
      numero_devis: quote.numero_devis,
      objet: quote.objet,
      date_livraison: quote.date_livraison,
      tva: quote.tva,
      project: quote.project.toString()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuote(null);
  };

  const handleDelete = (quote: Quote) => {
    // Confirmation handled in DataTable
    deleteMutation.mutate(quote.id_quote);
  };

  const handleOpenLines = (quote: Quote) => {
    setSelectedQuoteId(quote.id_quote);
    setIsLinesModalOpen(true);
  };

  const handleDownloadPdf = async (quote: Quote) => {
    try {
      const response = await api.get(`/quotes/${quote.id_quote}/pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis_${quote.numero_devis}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  return (
    <div>
      <DataTable
        title="Gestion des Devis"
        data={quotes}
        isLoading={isLoading}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        renderActions={(quote) => (
          <>
            <button
              onClick={() => handleOpenLines(quote)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Gérer les lignes"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownloadPdf(quote)}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
              title="Télécharger PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </>
        )}
        columns={[
          { header: 'N° Devis', accessor: 'numero_devis' },
          { header: 'Objet', accessor: 'objet' },
          { header: 'Projet', accessor: (item) => projects.find(p => p.id_project === item.project)?.nom_projet || item.project },
          { header: 'Total HT', accessor: (item) => `${item.total_ht} DH` },
          { header: 'Total TTC', accessor: (item) => `${item.total_ttc} DH` },
          { header: 'Livraison', accessor: (item) => new Date(item.date_livraison).toLocaleDateString() },
        ]}
      />
{error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">
                    {typeof error === 'string' 
                        ? error 
                        : Object.entries(error).map(([key, value]) => (
                            <div key={key}>
                                <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                            </div>
                        ))
                    }
                </span>
              </div>
            )}
            
      {isLinesModalOpen && selectedQuoteId && (
        <QuoteLinesModal
          quoteId={selectedQuoteId}
          isOpen={isLinesModalOpen}
          onClose={() => setIsLinesModalOpen(false)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingQuote ? 'Modifier Devis' : 'Nouveau Devis'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Numéro Devis</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.numero_devis}
                  onChange={(e) => setFormData({ ...formData, numero_devis: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Projet</label>
                <select
                  required
                  className="w-full p-2 border rounded"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((project) => (
                    <option key={project.id_project} value={project.id_project}>
                      {project.nom_projet}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Objet</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Livraison</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.date_livraison}
                  onChange={(e) => setFormData({ ...formData, date_livraison: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TVA (%)</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.tva}
                  onChange={(e) => setFormData({ ...formData, tva: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
