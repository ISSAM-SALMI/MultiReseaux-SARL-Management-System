import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
    Download, 
    FileText, 
    History, 
    Plus, 
    Calendar, 
    Printer,
    ChevronRight,
    AlertCircle,
    Receipt
} from 'lucide-react';
import api from '../api/axios';

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
  date_livraison: string;
  client_name?: string;
  project_name?: string;
}

interface DeliveryLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

interface Document {
    id_document: number;
    name: string;
    type_document: string;
    created_at: string;
    file_url: string;
    project: number;
}

export const Invoices = () => {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [bcNumber, setBcNumber] = useState('');

    // Fetch Quotes (All)
    const { data: quotes = [] } = useQuery<Quote[]>('quotes', async () => {
        const response = await api.get('/quotes/'); 
        return response.data.results || response.data;
    });

    // Fetch Documents for History
    const { data: documents = [], isLoading: isLoadingHistory } = useQuery<Document[]>('documents', async () => {
        const response = await api.get('/documents/');
        return response.data.results || response.data;
    }, {
        enabled: activeTab === 'history'
    });

    // Filter Documents for "Facture"
    const invoices = useMemo(() => {
        return documents.filter((doc: Document) => 
            doc.name.toLowerCase().includes('facture') || 
            doc.name.toLowerCase().startsWith('fac')
        ).sort((a: Document, b: Document) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [documents]);

    // Fetch Preview Lines (Same as Delivery Logic)
    const { data: lines = [], isLoading: isLoadingLines } = useQuery<DeliveryLine[]>(
        ['delivery-preview', selectedQuoteId], 
        async () => {
             if (!selectedQuoteId) return [];
             const response = await api.get(`/quotes/${selectedQuoteId}/delivery-preview/`);
             return response.data;
        },
        { enabled: !!selectedQuoteId }
    );

    // Generate PDF (Invoice)
    const generateMutation = useMutation(
        async (id: number) => {
            const response = await api.post(`/quotes/${id}/generate-invoice/`, {
                invoice_number: invoiceNumber,
                bc_number: bcNumber
            }, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const quote = quotes.find(q => q.id_quote === id);
            link.setAttribute('download', `Facture_${quote?.numero_devis || 'document'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        {
            onSuccess: () => {
                alert('Facture générée et enregistrée dans les documents.');
                setActiveTab('history');
            },
            onError: (err: any) => {
                console.error("Error generating Invoice PDF", err);
                const msg = err.response?.data?.error || err.message || 'Erreur inconnue';
                alert('Erreur lors de la génération de la facture: ' + msg);
            }
        }
    );

    const handleSelectQuote = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedQuoteId(Number(e.target.value));
    };

    const selectedQuote = useMemo(() => 
        quotes.find(q => q.id_quote === selectedQuoteId), 
    [quotes, selectedQuoteId]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val);
    };

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Receipt className="mr-3 text-blue-600" /> Gestion des Factures
                    </h1>
                    <p className="text-gray-500 mt-1 ml-9">Générez et suivez vos factures clients.</p>
                </div>
                
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'create' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle Facture
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                         className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'history' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History className="w-4 h-4 mr-2" />
                        Historique
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'create' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-gray-500" /> Source
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un Devis Validé</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                            onChange={handleSelectQuote}
                                            value={selectedQuoteId || ''}
                                        >
                                            <option value="">-- Choisir un devis --</option>
                                            {quotes.map((quote) => (
                                                <option key={quote.id_quote} value={quote.id_quote}>
                                                    {quote.numero_devis} {quote.objet ? `- ${quote.objet}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                           <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        La facture sera générée à partir du devis sélectionné.
                                    </p>
                                </div>

                                {selectedQuote && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">N° Facture</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Saisir le N° Facture..."
                                                value={invoiceNumber}
                                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">N° Bon de Commande</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Saisir le N° BC..."
                                                value={bcNumber}
                                                onChange={(e) => setBcNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedQuote && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <h3 className="text-sm font-semibold text-blue-800 mb-2">Détails du Devis</h3>
                                        <div className="space-y-2 text-sm text-blue-700">
                                            <div className="flex justify-between">
                                                <span>Numéro:</span>
                                                <span className="font-medium">{selectedQuote.numero_devis}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date Devis:</span>
                                                <span>{selectedQuote.date_livraison ? new Date(selectedQuote.date_livraison).toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div className="pt-2 border-t border-blue-200 mt-2">
                                                <p className="font-medium truncate">{selectedQuote.objet || 'Sans objet'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800">Aperçu du contenu</h2>
                                {lines.length > 0 && !isLoadingLines && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {lines.length} articles
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 p-6">
                                {isLoadingLines ? (
                                    <div className="h-40 flex items-center justify-center text-gray-500">
                                        Chargement de l'aperçu...
                                    </div>
                                ) : !selectedQuoteId ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                                        <p>Veuillez sélectionner un devis pour voir l'aperçu</p>
                                    </div>
                                ) : lines.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 bg-yellow-50 rounded-lg">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                        Aucun article trouvé pour ce devis.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <th className="py-3 px-2">Désignation</th>
                                                    <th className="py-3 px-2 text-center">Quantité</th>
                                                    <th className="py-3 px-2 text-right">P.U (HT)</th>
                                                    <th className="py-3 px-2 text-right">Total (HT)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {lines.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-2 text-sm text-gray-900 font-medium">{line.designation}</td>
                                                        <td className="py-3 px-2 text-sm text-center text-gray-600">{line.quantite}</td>
                                                        <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(line.prix_unitaire)}</td>
                                                        <td className="py-3 px-2 text-sm text-right text-gray-900 font-medium">
                                                            {formatCurrency(line.quantite * line.prix_unitaire)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan={3} className="py-3 px-4 text-right font-bold text-gray-700">Total HT Estimé:</td>
                                                    <td className="py-3 px-2 text-right font-bold text-blue-600">
                                                        {formatCurrency(lines.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire), 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => selectedQuoteId && generateMutation.mutate(selectedQuoteId)}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-sm transition-all ${
                                        !selectedQuoteId || isLoadingLines || lines.length === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
                                    }`}
                                    disabled={!selectedQuoteId || isLoadingLines || lines.length === 0 || generateMutation.isLoading}
                                >
                                    {generateMutation.isLoading ? (
                                        <>Génération en cours...</>
                                    ) : (
                                        <>
                                            <Printer className="w-5 h-5 mr-2" />
                                            Générer la Facture
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            ) : (
                // History Tab
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Document</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Date création</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoadingHistory ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">Chargement de l'historique...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={3} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <History className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Aucune facture générée pour le moment.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    invoices.map((doc) => (
                                        <tr key={doc.id_document} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{doc.name}</p>
                                                        <p className="text-xs text-gray-500">PDF • Projet #{doc.project}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <a 
                                                    href={doc.file_url} 
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                    title="Télécharger"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
