import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import { Provider, useEffect, useRef, useState } from "react";
import { Divide, Minus } from 'lucide-react'
import { ProviderSettlement, ProviderSettlementDetail, ProviderSettlementExpense } from "@/lib/db/schema";

export type IncomeDetailRowExtended = IncomeDetailRow & {
  duplicated?: boolean;
  subtotal?: number;
  localId: string;
};

export type ProviderSettlementRow = ProviderSettlement & {
  providerName: string;
  formattedDate: string;
  settlementDetails: ProviderSettlementDetail[];
  settlementExpenses: ProviderSettlementExpense[];
}

export type ProviderSettlementRowExtended = ProviderSettlementRow & {
  duplicated?: boolean;
  subtotal?: number;
  localId: string;
}

export type SettlementTableRow = IncomeDetailRow | ProviderSettlementDetail;
export type SettlementTableRowExtended = IncomeDetailRowExtended | ProviderSettlementRowExtended;

type Props<T extends SettlementTableRow = IncomeDetailRow> = {
  rows: T[];
  onChange: (rows: (T & { localId: string; subtotal?: number; duplicated?: boolean })[]) => void;
  title?: string;
  mode?: "create" | "edit";
};

// Helper functions to determine row type
const isIncomeDetailRow = (row: any): row is IncomeDetailRow => {
  return 'stock' in row && 'productName' in row;
};

const isSettlementDetailRow = (row: any): row is ProviderSettlementDetail => {
  return 'incomeDetailId' in row && 'unitPrice' in row && !('stock' in row);
};

export default function ProviderSettlementTable<T extends SettlementTableRow = IncomeDetailRow>(
  { rows, onChange, title = "Productos", mode = "create" }: Props<T>
) {
  const [items, setItems] = useState<(T & { localId: string; subtotal?: number; duplicated?: boolean })[]>(
    rows.map((row, index) => ({ ...row, localId: `${row.id}-${index}` })),
  );
  console.log("🚀 ~ ProviderSettlementTable ~ items:", items)

  useEffect(() => {
    setItems(
      rows.map((row, index) => ({ ...row, localId: `${row.id}-${index}` })),
    );
  }, [rows]);

  useEffect(() => {
    if (items.length === 0) return;
    onChange(items);
  }, [items, onChange]);

  const [errors, setErrors] = useState<
    Record<string, { field: string; message: string | null } | null>
  >({});

  const updateItem = (
    localId: string,
    field: string,
    value: number | undefined,
  ) => {
    const updated = items.map((item) => {
      if (item.localId !== localId) return item;
      let newItem = { ...item } as any;
      
      if (field === "quantity") {
        const qty = value ?? 0;
        
        // For income detail rows, validate against stock
        if (isIncomeDetailRow(item)) {
          const duplicatesWithSameProductId = items.filter(
            (i) => isIncomeDetailRow(i) && i.id === item.id,
          );
          const totalQuantityWithDuplicates =
            duplicatesWithSameProductId.reduce(
              (sum, i) => sum + Number(i.quantity ?? 0),
              0,
            ) -
            Number(item.quantity ?? 0) +
            qty;

          if (totalQuantityWithDuplicates > item.stock) {
            const excessAmount = totalQuantityWithDuplicates - item.stock;
            setErrors((s) => ({
              ...s,
              [localId]: {
                field: "quantity",
                message: `Cantidad total excede el stock. Exceso: ${excessAmount} unidades. Stock disponible: ${item.stock}`,
              },
            }));
            newItem = { ...item, [field]: item.quantity };
          } else if (qty < 0) {
            setErrors((s) => ({
              ...s,
              [localId]: {
                field: "quantity",
                message: "Cantidad no puede ser negativa",
              },
            }));
            newItem = { ...item, [field]: "0" };
          } else {
            setErrors((s) => ({ ...s, [localId]: null }));
            newItem = { ...item, [field]: value?.toString() ?? "0" };
          }
        } else {
          // For settlement detail rows, no stock validation
          if (qty < 0) {
            setErrors((s) => ({
              ...s,
              [localId]: {
                field: "quantity",
                message: "Cantidad no puede ser negativa",
              },
            }));
            newItem = { ...item, [field]: "0" };
          } else {
            setErrors((s) => ({ ...s, [localId]: null }));
            newItem = { ...item, [field]: value?.toString() ?? "0" };
          }
        }
      } else if (field === "unitPrice") {
        if ((value ?? 0) < 0) {
          setErrors((s) => ({
            ...s,
            [localId]: {
              field: "unitPrice",
              message: "Precio no puede ser negativo",
            },
          }));
          newItem = { ...item, [field]: 0 };
        } else {
          setErrors((s) => ({ ...s, [localId]: null }));
          newItem = { ...item, [field]: value };
        }
      }
      const qty = Number(newItem.quantity ?? 0);
      const price = Number(newItem.unitPrice ?? 0);
      newItem.subtotal = qty * price;
      return newItem;
    });
    setItems(updated);
  };
  
  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unitPrice ?? 0);
    return sum + (qty * price);
  }, 0);
  
  const hasStockColumn = mode === "create" && items.some(isIncomeDetailRow);
  const colSpan = hasStockColumn ? 6 : 5;

  debugger
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Producto</th>
            {hasStockColumn && (
              <th className="px-3 py-2 text-center">Unidades Disponibles</th>
            )}
            <th className="px-3 py-2 text-center">Cantidad</th>
            <th className="px-3 py-2 text-center">Precio Unitario Q.</th>
            <th className="px-3 py-2 text-center min-w-[110px] sm:w-48">
              Subtotal
            </th>
            <th className="px-3 py-2 text-center min-w-[110px] sm:w-48">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-3 py-2 text-center text-gray-500">
                Cargando
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.localId} className="border-t">
              <td className="px-3 py-2">{isIncomeDetailRow(item) ? item.productName : item.productName}</td>
              {hasStockColumn && isIncomeDetailRow(item) && (
                <td className="px-3 py-2 text-center text-gray-600">
                  {item.stock}
                </td>
              )}
              {hasStockColumn && !isIncomeDetailRow(item) && (
                <td className="px-3 py-2 text-center text-gray-600">
                  -
                </td>
              )}
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  max={isIncomeDetailRow(item) ? item.stock : undefined}
                  value={Math.floor(Number(item.quantity)) ?? ''}
                  step={1}
                  pattern="\d*"
                  inputMode="numeric"
                  className={`w-14 sm:w-20 rounded-md border px-2 py-1 text-center focus:ring ${
                    errors[item.localId] &&
                    errors[item.localId]?.field === "quantity"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                  onChange={(e) =>
                    updateItem(
                      item.localId!,
                      "quantity",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                />
                {errors[item.localId] &&
                errors[item.localId]?.field === "quantity" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.localId]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice ?? ''}
                  onChange={(e) =>
                    updateItem(
                      item.localId!,
                      "unitPrice",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                  className={`w-20 sm:w-24 rounded-md border px-2 py-1 text-center focus:ring ${
                    errors[item.localId] &&
                    errors[item.localId]?.field === "unitPrice"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                />
                {errors[item.localId] &&
                errors[item.localId]?.field === "unitPrice" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.localId]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center font-medium min-w-[110px] sm:w-48">
                {"Q. " + Number(item?.subtotal ?? 0).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center min-w-[110px] sm:w-48">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    const itemIndex = items.findIndex(
                      (i) => i.localId === item.localId,
                    );
                    const newItems = items.map((i, idx) => ({
                      ...i,
                      localId: `${i.id}-${idx < itemIndex + 1 ? idx : idx + 1}`,
                    }));
                    const duplicatedItem = {
                      ...item,
                      quantity: "0",
                      duplicated: true,
                      localId: `${item.id}-${itemIndex + 1}`,
                    };
                    setItems([
                      ...newItems.slice(0, itemIndex + 1),
                      duplicatedItem,
                      ...newItems.slice(itemIndex + 1),
                    ]);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                  title="Dividir fila"
                >
                  <Divide size={16} />
                </button>
                {item.duplicated && (
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      const itemIndex = items.findIndex(
                        (i) => i.localId === item.localId,
                      );
                      const newItems = items.filter(
                        (i) => i.localId !== item.localId,
                      );
                      setItems(
                        newItems.map((i, idx) => ({
                          ...i,
                          localId: `${i.id}-${idx}`,
                        })),
                      );
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    title="Eliminar fila"
                  >
                    <Minus size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td
              colSpan={hasStockColumn ? 4 : 3}
              className="px-3 py-2 text-right font-semibold align-middle"
            >
              SubTotal
            </td>
            <td className="px-3 py-2 text-center font-bold align-middle min-w-[110px] sm:w-48">
              {"Q. " + Number(total).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}
