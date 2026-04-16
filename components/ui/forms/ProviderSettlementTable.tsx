import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import { Provider, useEffect, useRef, useState } from "react";
import { Divide, Minus } from "lucide-react";
import {
  ProviderSettlement,
  ProviderSettlementDetail,
  ProviderSettlementExpense,
} from "@/lib/db/schema";

export type IncomeDetailRowExtended = IncomeDetailRow & {
  comission?: number;
  totalComission?: number;
  splitted?: boolean;
  subtotal?: number;
  localId: string;
};

export type ProviderSettlementRow = ProviderSettlement & {
  providerName: string;
  formattedDate: string;
  settlementDetails: ProviderSettlementDetail[];
  settlementExpenses: ProviderSettlementExpense[];
};

export type ProviderSettlementRowExtended = ProviderSettlementRow & {
  comission?: number;
  totalComission?: number;
  stock?: number;
  splitted?: boolean;
  subtotal?: number;
  localId: string;
};

export type SettlementTableRow = IncomeDetailRow | ProviderSettlementDetail;

export type SettlementTableRowExtended =
  | IncomeDetailRowExtended
  | ProviderSettlementRowExtended;

type Props<T extends SettlementTableRow = IncomeDetailRow> = {
  rows: T[];
  onChange: (
    rows: (T & {
      localId: string;
      subtotal?: number;
      splitted?: boolean;
      comission?: number;
      totalComission?: number;
    })[],
  ) => void;
  title?: string;
  mode?: "create" | "edit";
  status?: string; // we can use this to disable editing when the settlement is confirmed
};

// Helper functions to determine row type
const isIncomeDetailRow = (row: any): row is IncomeDetailRow => {
  return "stock" in row && "productName" in row;
};

const isSettlementDetailRow = (row: any): row is ProviderSettlementDetail => {
  return "incomeDetailId" in row && "unitPrice" in row && !("stock" in row);
};

export default function ProviderSettlementTable<
  T extends SettlementTableRow = IncomeDetailRow,
>({ rows, onChange, title = "Productos", mode = "create", status }: Props<T>) {
  const [items, setItems] = useState<
    (T & {
      localId: string;
      subtotal?: number;
      splitted?: boolean;
      comission?: number;
      totalComission?: number;
      stock?: number;
    })[]
  >(
    rows.map((row, index) => ({
      ...row,
      localId: `${row.id}-${index}`,
      comission: (row as any).comission ?? 0,
      totalComission: (row as any).totalComission ?? 0,
      stock: Number((row as any).stock ?? 0),
    })),
  );
  console.log("🚀 ~ ProviderSettlementTable ~ items:", items);

  useEffect(() => {
    setItems(
      rows.map((row, index) => {
        // coerce any incoming numeric-like fields to actual numbers
        const qty = Number((row as any).quantity ?? 0);
        const price = Number((row as any).unitPrice ?? 0);
        const comm = Number((row as any).comission ?? 0);
        const subtotal = Number((row as any).subtotal ?? qty * price);
        const totalComission = Number(
          (row as any).totalComission ?? qty * comm,
        );
        return {
          ...row,
          localId: `${row.id}-${index}`,
          comission: comm,
          totalComission,
          subtotal,
          stock: Number((row as any).stock ?? 0),
        };
      }),
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

        // Determine if we actually have stock information and only then run the
        // full validation.  `isIncomeDetailRow` guarantees there is a numeric
        // `.stock` property.  When editing an existing settlement stock is
        // undefined, so we simply fall through to the non‑stock branch below.
        if (isIncomeDetailRow(item) && typeof item.stock === "number") {
          const productId = (item as any).productId;
          const duplicatesWithSameProductId = items.filter(
            (i) => (i as any).productId === productId,
          );
          const totalQuantityWithDuplicates =
            duplicatesWithSameProductId.reduce(
              (sum, i) => sum + Number(i.quantity ?? 0),
              0,
            ) -
            Number(item.quantity ?? 0) +
            qty;

          // Helper: build an error-state patch for every sibling row sharing the
          // same productId (including the row being edited).
          const patchSiblingErrors = (
            errorEntry: { field: string; message: string } | null,
          ) => {
            const patch: Record<
              string,
              { field: string; message: string } | null
            > = {};
            duplicatesWithSameProductId.forEach((i) => {
              patch[i.localId] = errorEntry;
            });
            // Always include the current localId in case it was just duplicated
            // and is not yet reflected in duplicatesWithSameProductId.
            patch[localId] = errorEntry;
            return patch;
          };

          if (totalQuantityWithDuplicates > item.stock) {
            const excessAmount = totalQuantityWithDuplicates - item.stock;
            setErrors((s) => ({
              ...s,
              ...patchSiblingErrors({
                field: "quantity",
                message: `Cantidad total excede el stock. Exceso: ${excessAmount} unidades. Stock disponible: ${item.stock}`,
              }),
            }));
            // revert to previous value when exceeding
            newItem = { ...item, [field]: item.quantity };
          } else if (totalQuantityWithDuplicates < item.stock) {
            // warn if sum does not equal stock but allow input
            setErrors((s) => ({
              ...s,
              ...patchSiblingErrors({
                field: "quantity",
                message: `Cantidad total (${totalQuantityWithDuplicates}) debe igualar al stock (${item.stock})`,
              }),
            }));
            newItem = { ...item, [field]: value?.toString() ?? "0" };
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
            // Total exactly matches stock — clear errors on ALL sibling rows.
            setErrors((s) => ({ ...s, ...patchSiblingErrors(null) }));
            newItem = { ...item, [field]: value?.toString() ?? "0" };
          }
        } else {
          // Without stock information we only guard against negative numbers
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
      } else if (field === "comission") {
        if ((value ?? 0) < 0) {
          setErrors((s) => ({
            ...s,
            [localId]: {
              field: "comission",
              message: "Comisión no puede ser negativa",
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
      const comm = Number(newItem.comission ?? 0);
      newItem.subtotal = qty * price;
      newItem.totalComission = qty * comm;
      return newItem;
    });
    setItems(updated);
  };

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unitPrice ?? 0);
    return sum + qty * price;
  }, 0);
  const totalCommission = items.reduce((sum, item) => {
    const tc = Number(item.totalComission ?? 0);
    return sum + tc;
  }, 0);

  // show the stock column if any row actually supplies a numeric `stock` value
  // (editing a previous settlement also returns stock via the query).  The mode
  // check was hiding it during edits which is why you weren’t seeing it.
  const hasStockColumn = items.some((i) => !!i.stock);
  // columns: product, maybe stock, quantity, unit price, comission, total comission, subtotal, actions
  const colSpan = hasStockColumn ? 8 : 7;

  //debugger
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      {/* wrapper keeps horizontal scroll on small viewports */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
        {/* table fills available space; container controls overall width */}
        {/* fixed layout allows column width classes to be respected */}
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left w-40">Producto</th>
              {hasStockColumn && (
                <th className="px-3 py-2 text-center w-25">
                  Unidades Disponibles
                </th>
              )}
              <th className="px-3 py-2 text-center w-20">Cantidad</th>
              <th className="px-3 py-2 text-center w-24">Precio Unitario Q.</th>
              <th className="px-3 py-2 text-center w-24">Comisión Q.</th>
              <th className="px-3 py-2 text-center w-24">Total Comisión Q.</th>
              <th className="px-3 py-2 text-center w-24">Subtotal</th>
              {status !== "confirmed" && (
                <th className="px-3 py-2 text-center w-32">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-3 py-2 text-center text-gray-500"
                >
                  Cargando
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.localId} className="border-t">
                <td className="px-3 py-2 w-40">
                  {/* both row types carry a productName, but TypeScript doesn’t know it */}
                  {(item as any).productName}
                </td>
                {hasStockColumn && isIncomeDetailRow(item) && (
                  <td className="px-3 py-2 text-center text-gray-600 w-20">
                    {item.stock}
                  </td>
                )}
                {hasStockColumn && !isIncomeDetailRow(item) && (
                  <td className="px-3 py-2 text-center text-gray-600 w-20">
                    -
                  </td>
                )}
                <td className="px-3 py-2 text-center w-20">
                  <input
                    type="number"
                    readOnly={status === "confirmed"}
                    min={0}
                    max={isIncomeDetailRow(item) ? item.stock : undefined}
                    value={Math.floor(Number(item.quantity)) ?? ""}
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
                <td className="px-3 py-2 text-center w-24">
                  <input
                    type="number"
                    readOnly={status === "confirmed"}
                    min={0}
                    step={0.01}
                    value={item.unitPrice ?? ""}
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
                <td className="px-3 py-2 text-center w-24">
                  <input
                    type="number"
                    readOnly={status === "confirmed"}
                    min={0}
                    step={0.01}
                    value={item.comission ?? ""}
                    onChange={(e) =>
                      updateItem(
                        item.localId!,
                        "comission",
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    className={`w-20 sm:w-24 rounded-md border px-2 py-1 text-center focus:ring ${
                      errors[item.localId] &&
                      errors[item.localId]?.field === "comission"
                        ? "border-red-500 focus:ring-red-200"
                        : "focus:ring-blue-200"
                    }`}
                  />
                  {errors[item.localId] &&
                  errors[item.localId]?.field === "comission" ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[item.localId]?.message}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-center font-medium w-24">
                  {"Q. " + Number(item?.totalComission ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center font-medium w-24">
                  {"Q. " + Number(item?.subtotal ?? 0).toFixed(2)}
                </td>
                {status !== "confirmed" && (
                  <td className="px-3 py-2 text-center w-32">
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
                        // create a copy of the item to insert; when editing an existing
                        // settlement we must remove the `id` field so that the backend
                        // treats the new row as a brand‑new detail instead of trying to
                        // update the original one.  For create mode we keep the id since
                        // it represents the incomeDetailId needed by the insert schema.
                        const duplicatedItem: any = { ...item };
                        if (mode === "edit") {
                          delete duplicatedItem.id;
                        }
                        duplicatedItem.quantity = "0";
                        duplicatedItem.totalComission = 0;
                        duplicatedItem.splitted = true;
                        duplicatedItem.localId = `${item.id}-${itemIndex + 1}`;
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
                    {item.splitted && (
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
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={(hasStockColumn ? 5 : 4) - (status === "confirmed" ? 0 : 1)}
                className="px-3 py-2 text-right font-semibold align-middle"
              >
                Total Comisión
              </td>
              <td className="px-3 py-2 text-center font-bold align-middle min-w-[110px] sm:w-48">
                {"Q. " + Number(totalCommission).toFixed(2)}
              </td>
              <td colSpan={(hasStockColumn ? 2 : 1) - (status === "confirmed" ? 1 : 0)}></td>
            </tr>
            <tr>
              <td
                colSpan={(hasStockColumn ? 6 : 4) - (status === "confirmed" ? 1 : 0)}
                className="px-3 py-2 text-right font-semibold align-middle"
              >
                SubTotal
              </td>
              <td className="px-3 py-2 text-center font-bold align-middle min-w-[110px] sm:w-48">
                {"Q. " + Number(total).toFixed(2)}
              </td>
              <td colSpan={1}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
