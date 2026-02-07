import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
    Download, 
    Truck, 
    History, 
    Plus, 
    FileText, 
    Calendar, 
    Search,
    Printer,
    Eye,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { Fragment } from 'react/jsx-runtime';

interface Quote {
  id_quote: number;
  numero_devis: string;
  objet: string;
  date_livraison: string;
  client_name?: string;
  project_name?: string;
}

interface QuoteGroup {
  id: number;
  name: string;
  lines: DeliveryLine[];
  total_ht: number;
}

interface DeliveryLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht?: number;
}

interface DeliveryPreview {
  groups: QuoteGroup[];
  ungrouped_lines: DeliveryLine[];
  has_groups: boolean;
}

interface Document {
    id_document: number;
    name: string;
    type_document: string;
    created_at: string;
    file_url: string;
    project: number;
}

export const DeliveryNotes = () => {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [blNumber, setBlNumber] = useState('');
    const [bcNumber, setBcNumber] = useState('');

    // Fetch Quotes (Only Validated ones normally, but here all)
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

    // Filter Documents for "Bon de Livraison"
    const deliveryNotes = useMemo(() => {
        return documents.filter((doc: Document) => 
            doc.name.toLowerCase().includes('bon de livraison') || 
            doc.name.toLowerCase().startsWith('bl')
        ).sort((a: Document, b: Document) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [documents]);

    // Fetch Preview Data (Groups + Lines)
    const { data: previewData, isLoading: isLoadingLines } = useQuery<DeliveryPreview>(
        ['delivery-preview', selectedQuoteId], 
        async () => {
             if (!selectedQuoteId) return {groups: [], ungrouped_lines: [], has_groups: false};
             const response = await api.get(`/quotes/${selectedQuoteId}/delivery-preview/`);
             return response.data;
        },
        { enabled: !!selectedQuoteId }
    );

    // Generate PDF
    const generateMutation = useMutation(
        async (id: number) => {
            const response = await api.post(`/quotes/${id}/generate-delivery-note/`, {
                bl_number: blNumber,
                bc_number: bcNumber
            }, {
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
                setActiveTab('history'); // Switch to history tab to show the new doc
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

    const selectedQuote = useMemo(() => 
        quotes.find(q => q.id_quote === selectedQuoteId), 
    [quotes, selectedQuoteId]);

    // Format utility
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val);
    };

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Truck className="mr-3 text-blue-600" /> Gestion des Bons de Livraison
                    </h1>
                    <p className="text-gray-500 mt-1 ml-9">Générez et suivez vos bons de livraison.</p>
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
                        Nouveau BL
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
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-12rem)]">
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
                                        Seuls les articles du devis sélectionné seront inclus.
                                    </p>
                                </div>

                                {selectedQuote && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">N° Bon de Livraison</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Saisir le N° BL..."
                                                value={blNumber}
                                                onChange={(e) => setBlNumber(e.target.value)}
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
                                {previewData && !isLoadingLines && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {previewData.groups.reduce((sum, g) => sum + g.lines.length, 0) + previewData.ungrouped_lines.length} articles
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto">
                                {isLoadingLines ? (
                                    <div className="h-40 flex items-center justify-center text-gray-500">
                                        Chargement de l'aperçu...
                                    </div>
                                ) : !selectedQuoteId ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                                        <p>Veuillez sélectionner un devis pour voir l'aperçu</p>
                                    </div>
                                ) : !previewData || (previewData.groups.length === 0 && previewData.ungrouped_lines.length === 0) ? (
                                    <div className="p-8 text-center text-gray-500 bg-yellow-50 rounded-lg">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                        Aucun article trouvé pour ce devis.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Render Groups */}
                                        {previewData.groups.map((group, groupIdx) => (
                                            <div key={groupIdx} className="border rounded-lg overflow-hidden">
                                                <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                                                    <h4 className="font-semibold text-gray-700">{group.name}</h4>
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                                                        {group.lines.length} ligne{group.lines.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                            <th className="py-2 px-3">Désignation</th>
                                                            <th className="py-2 px-3 text-center">Qté</th>
                                                            <th className="py-2 px-3 text-right">P.U (HT)</th>
                                                            <th className="py-2 px-3 text-right">Total (HT)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.lines.map((line, lineIdx) => (
                                                            <tr key={lineIdx} className="hover:bg-gray-50 transition-colors">
                                                                <td className="py-2 px-3 text-sm text-gray-900">{line.designation}</td>
                                                                <td className="py-2 px-3 text-sm text-center text-gray-600">{line.quantite}</td>
                                                                <td className="py-2 px-3 text-sm text-right text-gray-600">{formatCurrency(line.prix_unitaire)}</td>
                                                                <td className="py-2 px-3 text-sm text-right text-gray-900 font-medium">
                                                                    {formatCurrency(line.quantite * line.prix_unitaire)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50 border-t">
                                                        <tr>
                                                            <td colSpan={3} className="py-2 px-3 text-right text-sm font-semibold text-gray-700">S/Total:</td>
                                                            <td className="py-2 px-3 text-right text-sm font-bold text-gray-900">
                                                                {formatCurrency(group.lines.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire), 0))}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ))}

                                        {/* Render Ungrouped Lines */}
                                        {previewData.ungrouped_lines.length > 0 && (
                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                                                    <h4 className="font-semibold text-gray-700">Lignes sans groupe</h4>
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                                                        {previewData.ungrouped_lines.length} ligne{previewData.ungrouped_lines.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                            <th className="py-2 px-3">Désignation</th>
                                                            <th className="py-2 px-3 text-center">Qté</th>
                                                            <th className="py-2 px-3 text-right">P.U (HT)</th>
                                                            <th className="py-2 px-3 text-right">Total (HT)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {previewData.ungrouped_lines.map((line, lineIdx) => (
                                                            <tr key={lineIdx} className="hover:bg-gray-50 transition-colors">
                                                                <td className="py-2 px-3 text-sm text-gray-900">{line.designation}</td>
                                                                <td className="py-2 px-3 text-sm text-center text-gray-600">{line.quantite}</td>
                                                                <td className="py-2 px-3 text-sm text-right text-gray-600">{formatCurrency(line.prix_unitaire)}</td>
                                                                <td className="py-2 px-3 text-sm text-right text-gray-900 font-medium">
                                                                    {formatCurrency(line.quantite * line.prix_unitaire)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Total Global */}
                                        <div className="bg-gray-50 border rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold text-gray-700">Total HT Estimé:</span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    {formatCurrency(
                                                        previewData.groups.reduce((sum, g) => 
                                                            sum + g.lines.reduce((lineSum, l) => lineSum + (l.quantite * l.prix_unitaire), 0), 0
                                                        ) + previewData.ungrouped_lines.reduce((sum, l) => sum + (l.quantite * l.prix_unitaire), 0)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => selectedQuoteId && generateMutation.mutate(selectedQuoteId)}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-sm transition-all ${
                                        !selectedQuoteId || isLoadingLines || !previewData || (previewData.groups.length === 0 && previewData.ungrouped_lines.length === 0)
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
                                    }`}
                                    disabled={!selectedQuoteId || isLoadingLines || !previewData || (previewData.groups.length === 0 && previewData.ungrouped_lines.length === 0) || generateMutation.isLoading}
                                >
                                    {generateMutation.isLoading ? (
                                        <>Génération en cours...</>
                                    ) : (
                                        <>
                                            <Printer className="w-5 h-5 mr-2" />
                                            Générer le Bon de Livraison
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
                    
                     {/* Mobile Cards for History */}
                     <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50">
                        {isLoadingHistory ? (
                            <div className="text-center p-8 text-gray-500">Chargement...</div>
                        ) : deliveryNotes.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">Aucun bon de livraison.</div>
                        ) : (
                            deliveryNotes.map((doc) => (
                                <div key={doc.id_document} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{doc.name}</p>
                                                <p className="text-xs text-gray-500">Projet #{doc.project}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <a 
                                        href={doc.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Télécharger
                                    </a>
                                </div>
                            ))
                        )}
                     </div>

                    <div className="hidden md:block overflow-x-auto">
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
                                ) : deliveryNotes.length === 0 ? (
                                    <tr><td colSpan={3} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <History className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Aucun bon de livraison généré pour le moment.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    deliveryNotes.map((doc) => (
                                        <tr key={doc.id_document} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3">
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
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Download className="w-4 h-4 mr-2 text-gray-500" />
                                                    Télécharger
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

