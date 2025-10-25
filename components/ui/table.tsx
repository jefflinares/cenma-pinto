import React, { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Modal } from "./modal";
import { Input } from "./input";
import { EntityWithId } from "./EntityListSection";

export type Column<T> = {
  header: string;
  field: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export interface DataTableProps<T> {
  isLoading: boolean;
  columns: Column<T>[];
  data: T[];
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  // New props for nested/expandable rows
  expandable?: boolean;
  renderNestedContent?: (row: T) => React.ReactNode;
  hasNestedData?: (row: T) => boolean;
}

export default function DataTable<T extends EntityWithId>({
  isLoading,
  columns,
  data,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  expandable = false,
  renderNestedContent,
  hasNestedData,
}: DataTableProps<T>) {
  console.log("🚀 ~ DataTable ~ data:", data)
  const totalPages = Math.ceil(totalItems / pageSize);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [query, setQuery] = useState("");
  const [itemToDelete, setItemToDelete] = React.useState<T | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

const filteredData = data.filter(row => {
  const rowText = Object.entries(row)
    .filter(([key, value]) => {
      // Exclude specific fields that contain objects/arrays
      const excludedFields = ['trucks', 'orders', 'items', 'payments', 'nestedData'];
      return !excludedFields.includes(key) && 
             (typeof value === "string" || 
              typeof value === "number" || 
              typeof value === "boolean");
    })
    .map(([key, value]) => String(value))
    .join(" ")
    .toLowerCase();
  return rowText.includes(query.toLowerCase());
});
  console.log("🚀 ~ DataTable ~ filteredData:", filteredData)

  const toggleRowExpansion = (rowId: string | number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const isRowExpanded = (rowId: string | number) => expandedRows.has(rowId);

  return (
    <div>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribe para buscar..."
      />
      <br />
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              {expandable && (
                <th className="px-4 py-2 text-sm font-semibold text-gray-700 w-8">
                  {/* Empty header for expand/collapse column */}
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 && !isLoading ? (
              filteredData.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b hover:bg-gray-50">
                    {expandable && (
                      <td className="px-4 py-2">
                        {hasNestedData && hasNestedData(row) ? (
                          <button
                            onClick={() => toggleRowExpansion(row.id!)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            
                            {isRowExpanded(row.id!) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4"></div>
                        )}
                      </td>
                    )}
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-4 py-2 text-sm text-gray-800">
                        {col.render
                          ? col.render(row[col.field], row)
                          : (row[col.field] as React.ReactNode)}
                      </td>
                    ))}
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => onEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => { setItemToDelete(row); setIsModalOpen(true); }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                  {/* Expanded row content */}
                  {expandable && isRowExpanded(row.id!) && renderNestedContent && (
                    <tr>
                      <td 
                        colSpan={columns.length + 2} 
                        className="px-4 py-4 bg-gray-50 border-b"
                      >
                        <div className="pl-6">
                          {renderNestedContent(row)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (expandable ? 2 : 1)}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  {isLoading ? "Cargando..." : "No hay datos disponibles"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal
          setIsModalOpen={setIsModalOpen}
          onCancelAction={() => {
            setIsModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirmationText="Eliminar"
          onConfirmAction={() => {
            itemToDelete && onDelete(itemToDelete);
            setIsModalOpen(false);
            setItemToDelete(null);
          }}
        >
          {"¿Estás seguro de que deseas eliminar este elemento? " + itemToDelete?.name}
        </Modal>
      )}
    </div>
  );
}
