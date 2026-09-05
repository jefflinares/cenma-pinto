import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import { useEffect, useRef, useState } from "react";

type Props = {
  rows: IncomeDetailRow[];
  onChange: (row: IncomeDetailRow) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  preserveValues?: boolean;
  readOnly?: boolean;
};

export default function OrderItemsTable({ rows, onChange, onValidationChange, preserveValues = false, readOnly = false }: Props) {
  const [items, setItems] = useState<IncomeDetailRow[]>(() =>
    preserveValues ? rows : rows.map((r) => ({ ...r, quantity: 0, unitPrice: 0 }))
  );

  useEffect(() => {
    setItems(preserveValues ? rows : rows.map((r) => ({ ...r, quantity: 0, unitPrice: 0 })));
    setErrors({});
  }, [rows]);

  const [errors, setErrors] = useState<
    Record<number, { field: string; message: string | null; blocking?: boolean } | null>
  >({});

  const updateItem = (
    id: number,
    field: keyof IncomeDetailRow,
    value: number | undefined
  ) => {
    let nextErrors = { ...errors };
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      let newItem = { ...item };

      if (field === "quantity") {
        const qty = value ?? 0;
        if (qty > item.stock) {
          // Clamp to max, show informational warning but don't block submission
          nextErrors = { ...nextErrors, [id]: { field: "quantity", message: `Cantidad máxima: ${item.stock}`, blocking: false } };
          newItem = { ...item, [field]: item.stock };
        } else if (qty < 0) {
          nextErrors = { ...nextErrors, [id]: { field: "quantity", message: "Cantidad no puede ser negativa" } };
          newItem = { ...item, [field]: 0 };
        } else if (qty === 0 && (item.unitPrice ?? 0) > 0) {
          nextErrors = { ...nextErrors, [id]: { field: "quantity", message: "Debe ingresar una cantidad si el precio es mayor a 0" } };
          newItem = { ...item, [field]: 0 };
        } else {
          nextErrors = { ...nextErrors, [id]: null };
          newItem = { ...item, [field]: qty };
        }
      } else if (field === "unitPrice") {
        const price = value ?? 0;
        if (price < 0) {
          nextErrors = { ...nextErrors, [id]: { field: "unitPrice", message: "Precio no puede ser negativo" } };
          newItem = { ...item, [field]: 0 };
        } else if (price > 0 && +item.quantity === 0) {
          nextErrors = { ...nextErrors, [id]: { field: "quantity", message: "Debe ingresar una cantidad si el precio es mayor a 0" } };
          newItem = { ...item, [field]: price };
        } else {
          nextErrors = { ...nextErrors, [id]: null };
          newItem = { ...item, [field]: price };
        }
      }
      onChange(newItem);
      return newItem;
    });
    setItems(updated);
    setErrors(nextErrors);
    onValidationChange?.(Object.values(nextErrors).some((e) => e !== null && e.blocking !== false));
  };
  const total = items.reduce(
    (sum, item) => sum + +item.quantity * (item.unitPrice ?? 0),
    0
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Producto</th>
            <th className="px-3 py-2 text-center">Unidades Disponibles</th>
            <th className="px-3 py-2 text-center">Cantidad</th>
            <th className="px-3 py-2 text-center">Precio Unitario Q.</th>
            <th className="px-3 py-2 text-center min-w-[110px] sm:w-48">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-3 py-2">{item.productName}</td>
              <td className="px-3 py-2 text-center text-gray-600">
                {item.stock}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  max={item.stock}
                  value={+item.quantity === 0 ? "" : Math.floor(Number(item.quantity))}
                  step={1}
                  pattern="\d*"
                  inputMode="numeric"
                  placeholder="0"
                  disabled={readOnly}
                  className={`w-14 sm:w-20 rounded-md border px-2 py-1 text-center focus:ring ${
                    readOnly
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : errors[item.id] && errors[item.id]?.field === "quantity"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "quantity",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                />
                {!readOnly && errors[item.id] && errors[item.id]?.field === "quantity" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.id]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={(item.unitPrice ?? 0) === 0 ? "" : item.unitPrice}
                  placeholder="0.00"
                  disabled={readOnly}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "unitPrice",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className={`w-20 sm:w-24 rounded-md border px-2 py-1 text-center focus:ring ${
                    readOnly
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : errors[item.id] && errors[item.id]?.field === "unitPrice"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                />
                {!readOnly && errors[item.id] && errors[item.id]?.field === "unitPrice" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.id]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center font-medium min-w-[110px] sm:w-48">
                {"Q. " + (+item.quantity * (item.unitPrice ?? 0)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td
              colSpan={4}
              className="px-3 py-2 text-right font-semibold align-middle"
            >
              SubTotal
            </td>
            <td className="px-3 py-2 text-center font-bold align-middle min-w-[110px] sm:w-48">
              {"Q. " + total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
