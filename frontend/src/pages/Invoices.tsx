import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';

interface Invoice {
  id_invoice: number;
  date: string;
  fournisseur: string;
  montant: number;
  project: number;
}

interface Project {
  id_project: number;
  nom_projet: string;
}

export const Invoices = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: '',
    fournisseur: '',
    montant: 0,
    project: ''
  });

  // Fetch Invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>('invoices', async () => {
    const response = await api.get('/invoices/');
    return response.data.results || response.data;
  });

  // Fetch Projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  // Create Invoice
  const createMutation = useMutation(
    (newInvoice: any) => api.post('/invoices/', newInvoice),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Create error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la création de la facture.');
      }
    }
  );

  // Update Invoice
  const updateMutation = useMutation(
    (invoice: any) => api.put(`/invoices/${invoice.id_invoice}/`, invoice),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        closeModal();
      },
      onError: (err: any) => {
        console.error("Update error:", err);
        setError(err.response?.data || 'Une erreur est survenue lors de la modification de la facture.');
      }
    }
  );

  // Delete Invoice
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/invoices/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
      onError: (err: any) => {
        console.error("Delete error:", err);
        alert('Une erreur est survenue lors de la suppression de la facture.');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (editingInvoice) {
      updateMutation.mutate({ ...formData, id_invoice: editingInvoice.id_invoice });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    setError(null);
    setFormData({
      date: '',
      fournisseur: '',
      montant: 0,
      project: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setError(null);
    setFormData({
      date: invoice.date,
      fournisseur: invoice.fournisseur,
      montant: invoice.montant,
      project: invoice.project.toString()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleDelete = (invoice: Invoice) => {
    // Confirmation handled in DataTable
    deleteMutation.mutate(invoice.id_invoice);
  };

  return (
    <div>
      <DataTable
        title="Gestion des Factures"
        data={invoices}
        isLoading={isLoading}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        columns={[
          { header: 'Fournisseur', accessor: 'fournisseur' },
          { header: 'Montant', accessor: (item) => `${item.montant} DH` },
          { header: 'Date', accessor: (item) => new Date(item.date).toLocaleDateString() },
          { header: 'Projet', accessor: (item) => projects.find(p => p.id_project === item.project)?.nom_projet || item.project },
        ]}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingInvoice ? 'Modifier Facture' : 'Nouvelle Facture'}
            </h3>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fournisseur</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montant</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
