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
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const getRowKey = (item: T, index: number) => {
    return item.id || item.id_quote || item.id_client || item.id_project || item.id_invoice || item.id_budget || item.id_document || index;
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white sticky top-0 z-10">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow active:transform active:scale-95 font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </button>
        )}
      </div>

      {/* Mobile Card View (visible < md) */}
      <div className="md:hidden">
        {data.length === 0 ? (
           <div className="p-8 text-center text-gray-400">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">∅</span>
                </div>
                <p>Aucune donnée trouvée</p>
              </div>
           </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <div key={getRowKey(item, index)} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="space-y-3">
                  {columns.map((col, colIndex) => {
                    // Skip if the accessor returns null/empty for certain design choices, or always show
                    const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
                    return (
                        <div key={colIndex} className="flex justify-between items-start gap-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0 mt-1">
                                {col.header}
                            </span>
                            <span className="text-sm text-gray-700 text-right break-words">
                                {val as React.ReactNode}
                            </span>
                        </div>
                    );
                  })}
                  
                  {/* Actions Row */}
                  <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end gap-2">
                    {renderActions && renderActions(item)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-brand-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                        className="p-2 text-brand-red bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (visible >= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              <th className="px-6 py-4 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right w-24">
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
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
                    </div>
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
