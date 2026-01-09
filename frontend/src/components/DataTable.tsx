import { Edit, Trash2, Plus } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreate?: () => void;
  renderActions?: (item: T) => React.ReactNode;
  title: string;
  isLoading?: boolean;
}

export function DataTable<T extends { [key: string]: any }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onCreate,
  renderActions,
  title,
  isLoading 
}: DataTableProps<T>) {
  if (isLoading) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  const getRowKey = (item: T, index: number) => {
    return item.id || item.id_quote || item.id_client || item.id_project || item.id_invoice || item.id_budget || item.id_document || index;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="p-4 border-b bg-gray-50 font-medium text-gray-600">
                  {col.header}
                </th>
              ))}
              <th className="p-4 border-b bg-gray-50 font-medium text-gray-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">
                  Aucune donnée trouvée
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={getRowKey(item, rowIndex)} className="hover:bg-gray-50 border-b last:border-b-0">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="p-4">
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  <td className="p-4 text-right space-x-2 flex justify-end">
                    {renderActions && renderActions(item)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                            onDelete(item);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
