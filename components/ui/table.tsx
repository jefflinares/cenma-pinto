import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { Input } from "./input";
import { EntityWithId } from "./EntityListSection";

export type Column<T> = {
  header: string;
  field: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  isLoading: boolean;
  columns: Column<T>[];
  data: T[];
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
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
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [query, setQuery] = useState("")
  const [itemToDelete, setItemToDelete] = React.useState<T | null>(null);
  console.log("🚀 ~ DataTable ~ itemToDelete:", itemToDelete)
  const filteredData = data.filter(row => {
  // Concatenate all string fields
  const rowText = Object.values(row)
    .filter(val => typeof val === "string")
    .join(" ")
    .toLowerCase();
  return rowText.includes(query.toLowerCase());
});
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
              <tr key={row.id} className="border-b hover:bg-gray-50">
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
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-6 text-center text-gray-500"
              >
                {isLoading ? "Cargando..." : "No hay datos disponibles"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paginación */}
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
          { "¿Estás seguro de que deseas eliminar este elemento? " + itemToDelete?.name }
        </Modal>
      )}
    </div>
    </div>
  );
}
