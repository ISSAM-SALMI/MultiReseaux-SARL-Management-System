import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';
import { FileText, Save, Edit, Plus, Trash2 } from 'lucide-react';

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
  lines: QuoteLine[];
}

interface QuoteLine {
  id: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht: number;
}

interface SupplierOrder {
  id: number;
  quote: number;
  quote_numero: string;
  date_created: string;
  total_ht_fournisseur: number;
  lines: SupplierOrderLine[];
}

interface SupplierOrderLine {
  id?: number;
  quote_line_id?: number | null;
  designation: string;
  qte_commande: number;
  pu_ht_fournisseur: number;
  total_ht: number;
}

export const SupplierOrders = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [orderLines, setOrderLines] = useState<SupplierOrderLine[]>([]);
  const [viewingOrder, setViewingOrder] = useState<SupplierOrder | null>(null);

  // Fetch Supplier Orders
  const { data: orders = [], isLoading } = useQuery<SupplierOrder[]>('supplierOrders', async () => {
    const response = await api.get('/quotes/supplier-orders/');
    return response.data.results || response.data;
  });

  // Fetch Quotes for dropdown
  const { data: quotes = [] } = useQuery<Quote[]>('quotes', async () => {
    const response = await api.get('/quotes/');
    return response.data.results || response.data;
  });

  // Fetch Quote Lines when a quote is selected (only for creation)
  useQuery<Quote>(
    ['quote', selectedQuoteId],
    async () => {
      const response = await api.get(`/quotes/${selectedQuoteId}/`);
      return response.data;
    },
    {
      enabled: !!selectedQuoteId && !editingOrderId,
      onSuccess: (data) => {
        // Initialize order lines from quote lines
        const initialLines = data.lines.map((line: QuoteLine) => ({
          quote_line_id: line.id,
          designation: line.designation,
          qte_commande: line.quantite,
          pu_ht_fournisseur: 0,
          total_ht: 0
        }));
        setOrderLines(initialLines);
      }
    }
  );

  // Create Supplier Order Mutation
  const createMutation = useMutation(
    (data: any) => api.post('/quotes/supplier-orders/create-from-quote/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('supplierOrders');
        closeModal();
      },
      onError: (err) => {
        console.error("Error creating order:", err);
        alert("Erreur lors de la création de la commande.");
      }
    }
  );

  // Update Supplier Order Mutation
  const updateMutation = useMutation(
    (data: any) => api.patch(`/quotes/supplier-orders/${editingOrderId}/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('supplierOrders');
        closeModal();
      },
      onError: (err) => {
        console.error("Error updating order:", err);
        alert("Erreur lors de la modification de la commande.");
      }
    }
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrderId(null);
    setSelectedQuoteId('');
    setOrderLines([]);
  };

  const handleEdit = (order: SupplierOrder) => {
    setEditingOrderId(order.id);
    setSelectedQuoteId(order.quote.toString());
    // Map existing lines
    if (order.lines) {
      const lines = order.lines.map((line: any) => ({
        id: line.id,
        quote_line_id: line.quote_line, // Map backend field to frontend expectation
        designation: line.designation,
        qte_commande: Number(line.qte_commande),
        pu_ht_fournisseur: Number(line.pu_ht_fournisseur),
        total_ht: Number(line.total_ht)
      }));
      setOrderLines(lines);
    } else {
      setOrderLines([]);
    }
    setIsModalOpen(true);
  };

  const handleLineChange = (index: number, field: keyof SupplierOrderLine, value: any) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Recalculate total for line
    if (field === 'qte_commande' || field === 'pu_ht_fournisseur') {
      newLines[index].total_ht = newLines[index].qte_commande * newLines[index].pu_ht_fournisseur;
    }
    
    setOrderLines(newLines);
  };

  const handleAddLine = () => {
    setOrderLines([
      ...orderLines,
      {
        designation: 'Nouvelle ligne',
        qte_commande: 1,
        pu_ht_fournisseur: 0,
        total_ht: 0,
        quote_line_id: null
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = [...orderLines];
    newLines.splice(index, 1);
    setOrderLines(newLines);
  };

  const calculateTotalGeneral = () => {
    return orderLines.reduce((sum, line) => sum + line.total_ht, 0);
  };

  const handleSubmit = () => {
    if (!selectedQuoteId) return;
    
    const linesPayload = orderLines.map(line => ({
      ...line,
      quote_line: line.quote_line_id, // For standard serializer (update)
      quote_line_id: line.quote_line_id // For custom create view
    }));

    const payload = {
      quote_id: parseInt(selectedQuoteId), // For creation, ignored for update usually but good to have
      lines: linesPayload
    };

    if (editingOrderId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <DataTable
        title="Commandes Fournisseurs"
        data={orders}
        isLoading={isLoading}
        onCreate={() => setIsModalOpen(true)}
        renderActions={(order) => (
          <div className="flex space-x-2">
            <button
              onClick={() => setViewingOrder(order)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Voir détails"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEdit(order)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )}
        columns={[
          { header: 'N° Devis', accessor: 'quote_numero' },
          { header: 'Date Création', accessor: (item) => new Date(item.date_created).toLocaleDateString() },
          { header: 'Total HT Fournisseur', accessor: (item) => `${item.total_ht_fournisseur} DH` },
        ]}
      />

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-5xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingOrderId ? 'Modifier la commande' : 'Proposer une commande fournisseur'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Choisir un devis</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
                disabled={!!editingOrderId} // Disable changing quote when editing
              >
                <option value="">Sélectionner un devis...</option>
                {quotes.map((quote) => (
                  <option key={quote.id_quote} value={quote.id_quote}>
                    {quote.numero_devis} - {quote.objet}
                  </option>
                ))}
              </select>
            </div>

            {selectedQuoteId && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={handleAddLine}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une ligne
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 border-b font-semibold text-sm w-1/3">Désignation</th>
                        <th className="p-3 border-b font-semibold text-sm w-1/6">Qté à commander</th>
                        <th className="p-3 border-b font-semibold text-sm w-1/6">PU HT Fournisseur</th>
                        <th className="p-3 border-b font-semibold text-sm w-1/6 text-right">Total HT</th>
                        <th className="p-3 border-b font-semibold text-sm w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="p-3">
                            <input
                              type="text"
                              className="w-full p-2 border rounded text-sm"
                              value={line.designation}
                              onChange={(e) => handleLineChange(index, 'designation', e.target.value)}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              className="w-full p-2 border rounded text-sm"
                              value={line.qte_commande}
                              onChange={(e) => handleLineChange(index, 'qte_commande', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              className="w-full p-2 border rounded text-sm"
                              value={line.pu_ht_fournisseur}
                              onChange={(e) => handleLineChange(index, 'pu_ht_fournisseur', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-3 text-sm text-right font-medium">
                            {line.total_ht.toFixed(2)} DH
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveLine(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={3} className="p-3 text-right border-t">Total HT Général:</td>
                        <td className="p-3 text-right border-t text-blue-600">
                          {calculateTotalGeneral().toFixed(2)} DH
                        </td>
                        <td className="border-t"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingOrderId ? 'Mettre à jour' : 'Enregistrer la commande'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Détails Commande - {viewingOrder.quote_numero}</h3>
              <button 
                onClick={() => setViewingOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Date de création: {new Date(viewingOrder.date_created).toLocaleDateString()}</p>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border-b font-semibold text-sm">Désignation</th>
                    <th className="p-3 border-b font-semibold text-sm text-right">Qté commandée</th>
                    <th className="p-3 border-b font-semibold text-sm text-right">PU HT Fournisseur</th>
                    <th className="p-3 border-b font-semibold text-sm text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrder.lines.map((line) => (
                    <tr key={line.id} className="border-b last:border-b-0">
                      <td className="p-3 text-sm">{line.designation}</td>
                      <td className="p-3 text-sm text-right">{line.qte_commande}</td>
                      <td className="p-3 text-sm text-right">{line.pu_ht_fournisseur} DH</td>
                      <td className="p-3 text-sm text-right font-medium">{line.total_ht} DH</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={3} className="p-3 text-right border-t">Total HT Général:</td>
                    <td className="p-3 text-right border-t text-blue-600">
                      {viewingOrder.total_ht_fournisseur} DH
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
