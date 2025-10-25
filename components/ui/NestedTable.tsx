import React from "react";

export type NestedColumn<T> = {
  header: string;
  field: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

interface NestedTableProps<T> {
  title?: string;
  columns: NestedColumn<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}

export default function NestedTable<T>({
  title,
  columns,
  data,
  className = "",
  emptyMessage = "No hay datos disponibles",
}: NestedTableProps<T>) {
  return (
    <div className={`space-y-2 ${className}`}>
      {title && <h4 className="font-semibold text-gray-700 mb-2">{title}</h4>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left border text-xs font-medium text-gray-700"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-3 py-2 border text-gray-800">
                      {col.render
                        ? col.render(row[col.field], row)
                        : (row[col.field] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-4 text-center text-gray-500 border"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
