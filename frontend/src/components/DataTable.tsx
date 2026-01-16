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
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center px-4 py-2.5 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow active:transform active:scale-95 font-medium text-sm"
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
                <th key={index} className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              <th className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                       <span className="text-2xl text-gray-400">∅</span>
                    </div>
                    <p>Aucune donnée trouvée</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={getRowKey(item, rowIndex)} className="hover:bg-blue-50/30 border-b border-gray-50 last:border-b-0 transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-700">
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right space-x-1 flex justify-end">
                    {renderActions && renderActions(item)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
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
                        className="p-2 text-brand-red hover:bg-red-50 rounded-lg transition-colors duration-200"
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
