import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Download, Truck } from 'lucide-react';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
}

interface DeliveryLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

export const DeliveryNotes = () => {
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

    // Fetch Quotes
    const { data: quotes = [] } = useQuery<Quote[]>('quotes', async () => {
        const response = await api.get('/quotes/'); 
        return response.data.results || response.data;
    });

    // Fetch Preview Lines
    const { data: lines = [], isLoading: isLoadingLines } = useQuery<DeliveryLine[]>(
        ['delivery-preview', selectedQuoteId], 
        async () => {
             if (!selectedQuoteId) return [];
             const response = await api.get(`/quotes/${selectedQuoteId}/delivery-preview/`);
             return response.data;
        },
        { enabled: !!selectedQuoteId }
    );

    // Generate PDF
    const generateMutation = useMutation(
        async (id: number) => {
            const response = await api.post(`/quotes/${id}/generate-delivery-note/`, {}, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const quote = quotes.find(q => q.id_quote === id);
            link.setAttribute('download', `BL_${quote?.numero_devis || 'document'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        {
            onSuccess: () => {
                alert('Bon de Livraison généré et enregistré dans les documents.');
            },
            onError: (err: any) => {
                console.error("Error generating PDF", err);
                const msg = err.response?.data?.error || err.message || 'Erreur inconnue';
                alert('Erreur lors de la génération du PDF: ' + msg);
            }
        }
    );

    const handleSelectQuote = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedQuoteId(Number(e.target.value));
    };

    const columns = [
        { header: 'Désignation', accessor: 'designation' as const },
        { header: 'Quantité', accessor: 'quantite' as const },
        { 
            header: 'Prix Unitaire', 
            accessor: (line: DeliveryLine) => `${Number(line.prix_unitaire).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}`
        },
        { 
            header: 'Total HT', 
            accessor: (line: DeliveryLine) => `${(line.quantite * line.prix_unitaire).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}`
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Truck className="mr-2" /> Bon de Livraison
                </h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un Devis</label>
                <select 
                    className="w-full p-2 border rounded-md"
                    onChange={handleSelectQuote}
                    value={selectedQuoteId || ''}
                >
                    <option value="">-- Choisir un devis --</option>
                    {quotes.map((quote) => (
                        <option key={quote.id_quote} value={quote.id_quote}>
                            {quote.numero_devis} - {quote.objet}
                        </option>
                    ))}
                </select>
            </div>

            {selectedQuoteId && (
                <div className="space-y-4">
                     <DataTable 
                        title="Aperçu du Bon de Livraison"
                        data={lines}
                        columns={columns}
                        isLoading={isLoadingLines}
                    />
                    
                    {!isLoadingLines && lines.length > 0 && (
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => selectedQuoteId && generateMutation.mutate(selectedQuoteId)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                disabled={generateMutation.isLoading}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {generateMutation.isLoading ? 'Génération...' : 'Télécharger le Bon de Livraison (PDF)'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
