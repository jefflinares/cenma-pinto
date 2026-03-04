import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type Expense = {
  id: string;
  concept: string;
  amount: string | number;
};

type Props = {
  expenses: Expense[];
  onChange: (expenses: Expense[]) => void;
  title?: string;
};

export default function ProviderSettlementExpenses({
  expenses,
  onChange,
  title = "Gastos",
}: Props) {
  const [items, setItems] = useState<Expense[]>(expenses);
  const [errors, setErrors] = useState<
    Record<string, { field: string; message: string | null } | null>
  >({});

  useEffect(() => {
    setItems(expenses);
  }, [expenses]);

  const addExpense = () => {
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      concept: "",
      amount: "",
    };
    const newItems = [...items, newExpense];
    setItems(newItems);
    onChange(newItems);
  };

  const updateExpense = (
    id: string,
    field: keyof Expense,
    value: string | number
  ) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;

      let newItem = { ...item };

      if (field === "concept") {
        if ((value as string).trim() === "") {
          setErrors((s) => ({
            ...s,
            [id]: {
              field: "concept",
              message: "El concepto no puede estar vacío",
            },
          }));
          return item;
        } else {
          setErrors((s) => ({ ...s, [id]: null }));
          newItem = { ...item, [field]: value as string };
        }
      } else if (field === "amount") {
        const amount = Number(value);
        if (amount < 0) {
          setErrors((s) => ({
            ...s,
            [id]: {
              field: "amount",
              message: "El monto no puede ser negativo",
            },
          }));
          return item;
        } else {
          setErrors((s) => ({ ...s, [id]: null }));
          newItem = { ...item, [field]: amount };
        }
      }

      return newItem;
    });
    setItems(updated);
    onChange(updated);
  };

  const removeExpense = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    onChange(newItems);
  };

  const total = items.reduce((sum, item) => sum + (Number(item.amount ?? 0)), 0);

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Concepto</th>
            <th className="px-3 py-2 text-center">Monto Q.</th>
            <th className="px-3 py-2 text-center min-w-[110px] sm:w-48">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-2 text-center text-gray-500">
                Sin gastos
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-3 py-2 text-center">
                <input
                  type="text"
                  value={item.concept}
                  onChange={(e) => updateExpense(item.id, "concept", e.target.value)}
                  placeholder="Ej: Transporte, Almacenaje..."
                  className={`w-full rounded-md border px-2 py-1 focus:ring ${
                    errors[item.id] && errors[item.id]?.field === "concept"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                />
                {errors[item.id] && errors[item.id]?.field === "concept" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.id]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={item.amount ?? ''}
                  onChange={(e) =>
                    updateExpense(
                      item.id,
                      "amount",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className={`w-24 rounded-md border px-2 py-1 text-center focus:ring ${
                    errors[item.id] && errors[item.id]?.field === "amount"
                      ? "border-red-500 focus:ring-red-200"
                      : "focus:ring-blue-200"
                  }`}
                />
                {errors[item.id] && errors[item.id]?.field === "amount" ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[item.id]?.message}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-center min-w-[110px] sm:w-48">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    removeExpense(item.id);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  title="Eliminar gasto"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-3 py-2 text-right font-semibold align-middle">
              Total
            </td>
            <td className="px-3 py-2 text-center font-bold align-middle">
              {"Q. " + total.toFixed(2)}
            </td>
            <td className="px-3 py-2 text-center align-middle">
              <button
                onClick={(event) => {
                  event.preventDefault();
                  addExpense();
                }}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                title="Agregar gasto"
              >
                <Plus size={16} />
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}
