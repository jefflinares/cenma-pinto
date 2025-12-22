import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import { useEffect, useState } from "react";

type Props = {
  rows: IncomeDetailRow[];
  onChange: (rows: IncomeDetailRow[]) => void;
};

export default function OrderItemsTable({ rows, onChange }: Props) {
  const [items, setItems] = useState<IncomeDetailRow[]>(rows);

  useEffect(() => {
    setItems(rows);
  }, [rows]);

  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const updateItem = (
    id: number,
    field: keyof IncomeDetailRow,
    value: number | undefined
  ) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      // if updating quantity, validate against stock
      if (field === "quantity") {
        const qty = value ?? 0;
        if (qty > item.stock) {
          // set error and clamp quantity to stock (optional)
          setErrors((s) => ({ ...s, [id]: `Cantidad máxima: ${item.stock}` }));
          return { ...item, [field]: item.stock };
        } else {
          setErrors((s) => ({ ...s, [id]: null }));
          return { ...item, [field]: value };
        }
      }
      return { ...item, [field]: value };
    });
    setItems(updated);
    onChange(updated);
  };
  const total = items.reduce(
    (sum, item) => sum + +item.quantity * (item.unitPrice ?? 0),
    0
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Producto</th>
            {/*<th className="px-3 py-2 text-left">Contenedor</th>*/}
            <th className="px-3 py-2 text-center">Unidades Disponibles</th>
            <th className="px-3 py-2 text-center">Cantidad</th>
            <th className="px-3 py-2 text-center">Precio Unitario Q.</th>
            <th className="px-3 py-2 text-center">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-3 py-2">{item.productName}</td>
              {/*<td className="px-3 py-2">{item.container}</td>*/}
              <td className="px-3 py-2 text-center text-gray-600">
                {item.stock}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  max={item.stock}
                  value={item.quantity ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "quantity",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  className={`w-20 rounded-md border px-2 py-1 text-center focus:ring ${
                    errors[item.id] ? "border-red-500 focus:ring-red-200" : "focus:ring-blue-200"
                  }`}
                />
                {errors[item.id] ? (
                  <p className="mt-1 text-xs text-red-600">{errors[item.id]}</p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "unitPrice",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  className="w-24 rounded-md border px-2 py-1 text-center focus:ring focus:ring-blue-200"
                />
              </td>
              <td className="px-3 py-2 text-center font-medium">
                {"Q. " + (+item.quantity * (item.unitPrice ?? 0)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={6} className="px-3 py-2 text-right font-semibold">
              Total
            </td>
            <td className="px-3 py-2 text-right font-bold">
              {"Q. " + total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
