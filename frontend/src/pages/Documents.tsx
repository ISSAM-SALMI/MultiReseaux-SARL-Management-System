import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { DataTable } from '../components/DataTable';
import { FileText, Image, File } from 'lucide-react';

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

export const Documents = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
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

  // Fetch Projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/projects/');
    return response.data.results || response.data;
  });

  // Create Document (Upload)
  const createMutation = useMutation(
    (data: FormData) => api.post('/documents/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        closeModal();
        alert("Document uploadé avec succès !");
      },
      onError: (error: any) => {
        console.error("Erreur upload:", error);
        const message = error.response?.data?.detail || "Une erreur est survenue lors de l'upload.";
        alert(`Erreur: ${message}`);
      }
    }
  );

  // Update Document (Rename)
  const updateMutation = useMutation(
    (data: { id: number, name: string }) => api.patch(`/documents/${data.id}/`, { name: data.name }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        closeModal();
      },
      onError: (error: any) => {
        console.error("Erreur modification:", error);
        alert("Erreur lors de la modification du document.");
      }
    }
  );

  // Delete Document
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/documents/${id}/`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
      },
      onError: (error: any) => {
        console.error("Delete error:", error);
        alert('Une erreur est survenue lors de la suppression du document.');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id_document, name: formData.name });
      return;
    }

    if (!selectedFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }
    if (!formData.project) {
      alert("Veuillez sélectionner un projet");
      return;
    }

    const data = new FormData();
    data.append('file_url', selectedFile);
    data.append('name', formData.name || selectedFile.name); // Use file name if no name provided
    data.append('type_document', formData.type_document);
    data.append('project', formData.project);

    createMutation.mutate(data);
  };

  const openCreateModal = () => {
    setEditingDocument(null);
    setSelectedFile(null);
    setFormData({ name: '', type_document: 'PDF', project: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      type_document: doc.type_document,
      project: doc.project.toString()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setEditingDocument(null);
  };

  const handleDelete = (doc: Document) => {
    // Confirmation handled in DataTable
    deleteMutation.mutate(doc.id_document);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />;
      case 'IMAGE': return <Image className="w-5 h-5 text-blue-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div>
      <DataTable
        title="Gestion des Documents"
        data={documents}
        isLoading={isLoading}
        onCreate={openCreateModal}
        onDelete={handleDelete}
        onEdit={openEditModal}
        columns={[
          { header: 'Type', accessor: (item) => <div className="flex items-center">{getIcon(item.type_document)} <span className="ml-2">{item.type_document}</span></div> },
          { header: 'Projet', accessor: (item) => projects.find(p => p.id_project === item.project)?.nom_projet || item.project },
          { header: 'Date', accessor: (item) => new Date(item.created_at).toLocaleDateString() },
          { header: 'Nom', accessor: 'name' },
          { header: 'Fichier', accessor: (item) => <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Télécharger</a> },
        ]}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingDocument ? 'Modifier Document' : 'Nouveau Document'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={editingDocument ? "Nom du document" : "Nom du document (optionnel)"}
                />
              </div>
              {!editingDocument && (
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
              )}
              {!editingDocument && (
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.type_document}
                    onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
                  >
                    <option value="PDF">PDF</option>
                    <option value="IMAGE">Image</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              )}
              {!editingDocument && (
                <div>
                  <label className="block text-sm font-medium mb-1">Fichier</label>
                  <input
                    type="file"
                    required
                    className="w-full p-2 border rounded"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
              )}
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
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${(createMutation.isLoading || updateMutation.isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editingDocument ? (updateMutation.isLoading ? 'Modification...' : 'Modifier') : (createMutation.isLoading ? 'Upload en cours...' : 'Uploader')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
