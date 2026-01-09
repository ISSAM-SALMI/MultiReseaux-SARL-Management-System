import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FileText, Image as ImageIcon, File, Search, Plus, Trash2, 
  Download, Eye, Filter, Calendar, Folder, HardDrive, Upload
} from 'lucide-react';
import api from '../api/axios';

interface Document {
  id_document: number;
  name: string;
  type_document: string;
  file_url: string;
  project: number;
  created_at: string;
}

interface Project {
  id_project: number;
  nom_projet: string;
}

const DocumentPreview = ({ doc }: { doc: Document }) => {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => doc.file_url?.toLowerCase().endsWith(ext));
  const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');

  if (isImage) {
    return (
      <div className="bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center p-4 h-96">
        <img src={doc.file_url} alt={doc.name} className="max-w-full max-h-full object-contain shadow-sm" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="bg-gray-100 rounded-lg overflow-hidden border h-96">
        <iframe src={`${doc.file_url}#toolbar=0`} className="w-full h-full" title={doc.name} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 h-64 flex flex-col items-center justify-center text-gray-400">
      <File className="w-16 h-16 mb-4" />
      <p>Aperçu non disponible pour ce type de fichier</p>
    </div>
  );
};

export const Documents = () => {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type_document: 'PDF',
    project: ''
  });

  // Fetch Documents
  const { data: documents = [], isLoading } = useQuery<Document[]>('documents', async () => {
    const response = await api.get('/documents/');
    return response.data.results || response.data;
  });

  // Fetch Projects
  const { data: projects = [] } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  const selectedDocument = documents.find(d => d.id_document === selectedDocId);

  // Mutations
  const createMutation = useMutation(
    (data: FormData) => api.post('/documents/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        setIsUploading(false);
        setFormData({ name: '', type_document: 'PDF', project: '' });
        setSelectedFile(null);
        alert("Document uploadé avec succès !");
      },
      onError: (err: any) => alert(`Erreur: ${err.response?.data?.detail || 'Upload échoué'}`)
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/documents/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        if (selectedDocId === id) setSelectedDocId(null);
      },
    }
  );

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("Veuillez choisir un fichier");
        return;
    }

    const data = new FormData();
    data.append('file_url', selectedFile);
    data.append('name', formData.name);
    data.append('type_document', formData.type_document);
    data.append('project', formData.project);

    createMutation.mutate(data);
  };

  const getFileIcon = (fileName: string) => {
      const ext = fileName?.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon className="w-10 h-10 text-purple-500" />;
      if (ext === 'pdf') return <FileText className="w-10 h-10 text-red-500" />;
      return <File className="w-10 h-10 text-blue-500" />;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || 
                        (filterType === 'IMAGE' && ['jpg','png','jpeg'].some(e => doc.file_url.toLowerCase().endsWith(e))) ||
                        (filterType === 'PDF' && doc.file_url.toLowerCase().endsWith('.pdf'));
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-gray-100 -m-6 p-6">
      {/* Left Panel: List */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pr-0 ${selectedDocId || isUploading ? 'mr-4' : ''}`}>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Folder className="w-8 h-8 mr-3 text-blue-600" />
                Gestion des Documents
            </h1>
            <button
                onClick={() => {
                    setSelectedDocId(null);
                    setIsUploading(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-transform hover:scale-105"
            >
                <Upload className="w-5 h-5 mr-2" />
                Nouveau Document
            </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex space-x-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Rechercher un document..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-2.5 bg-gray-50"
                />
            </div>
            <div className="flex space-x-2">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${filterType === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Tous
                </button>
                <button 
                    onClick={() => setFilterType('PDF')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${filterType === 'PDF' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                    PDF
                </button>
                <button 
                    onClick={() => setFilterType('IMAGE')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${filterType === 'IMAGE' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                >
                    Images
                </button>
            </div>
        </div>

        {/* Grid List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map((doc) => (
                    <div 
                        key={doc.id_document}
                        onClick={() => {
                            setIsUploading(false);
                            setSelectedDocId(doc.id_document);
                        }}
                        className={`group relative border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedDocId === doc.id_document ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                {getFileIcon(doc.file_url)}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                    href={doc.file_url} 
                                    download 
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(confirm('Supprimer ce document ?')) deleteMutation.mutate(doc.id_document);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate mb-1" title={doc.name}>{doc.name}</h3>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                             <Calendar className="w-3 h-3 mr-1" />
                             {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.project && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 truncate max-w-full">
                                <HardDrive className="w-3 h-3 mr-1" />
                                Projet #{doc.project}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Folder className="w-16 h-16 text-gray-200 mb-4" />
                    <p>Aucun document trouvé</p>
                </div>
            )}
        </div>
      </div>

      {/* Right Panel: Preview or Upload */}
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 ease-in-out transform ${
            (selectedDocId || isUploading) ? 'w-[450px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
        }`}
      >
        {isUploading ? (
             <div className="h-full flex flex-col bg-white border-l">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Nouveau Document</h3>
                    <button onClick={() => setIsUploading(false)} className="text-gray-400 hover:text-gray-600">
                        <Plus className="w-6 h-6 transform rotate-45" />
                    </button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                             <input 
                                type="file" 
                                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                             <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                             {selectedFile ? (
                                <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
                             ) : (
                                <>
                                    <p className="text-sm font-medium text-gray-900">Cliquez pour upload ou glissez-déposez</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG jusqu'à 10MB</p>
                                </>
                             )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Contrat Client X"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={formData.type_document}
                                onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="PDF">PDF / Document</option>
                                <option value="IMAGE">Image / Photo</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lier au projet (Optionnel)</label>
                            <select
                                value={formData.project}
                                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Aucun projet</option>
                                {projects.map((p) => (
                                    <option key={p.id_project} value={p.id_project}>{p.nom_projet}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={createMutation.isLoading}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                {createMutation.isLoading ? 'Envoi en cours...' : 'Enregistrer le document'}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        ) : selectedDocument ? (
            <div className="h-full flex flex-col bg-white border-l">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                    <div>
                         <h2 className="text-xl font-bold text-gray-900 break-all">{selectedDocument.name}</h2>
                         <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                             <span className="flex items-center">
                                 <Calendar className="w-4 h-4 mr-1" />
                                 {new Date(selectedDocument.created_at).toLocaleDateString()}
                             </span>
                             <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                 {selectedDocument.type_document}
                             </span>
                         </div>
                    </div>
                    <button onClick={() => setSelectedDocId(null)} className="text-gray-400 hover:text-gray-600">
                        <Plus className="w-6 h-6 transform rotate-45" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <DocumentPreview doc={selectedDocument} />

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-2">Informations</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-xs text-blue-500 uppercase">Projet Lié</span>
                                <span className="font-medium text-gray-900">
                                    {projects.find(p => p.id_project === selectedDocument.project)?.nom_projet || 'Non lié'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs text-blue-500 uppercase">Format</span>
                                <span className="font-medium text-gray-900 truncate">
                                    {selectedDocument.file_url.split('.').pop()?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex space-x-3">
                        <a 
                            href={selectedDocument.file_url} 
                            download 
                            className="flex-1 flex items-center justify-center py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                        </a>
                        <button 
                            onClick={() => {
                                if(confirm("Confirmer la suppression ?")) deleteMutation.mutate(selectedDocument.id_document);
                            }}
                            className="flex-1 flex items-center justify-center py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        ) : null}
      </div>
    </div>
  );
};
