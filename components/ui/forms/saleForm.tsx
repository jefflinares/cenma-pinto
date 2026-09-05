"use client";
import { useState, useEffect, useTransition, type SetStateAction } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";
import { ComboBoxWithModal, type Entity } from "../comboBox";

export type SaleProduct = {
  id: string | number;
  name: string;
  availableQuantity: number;
};

type ExistingOrder = {
  id: number;
  customerId: number;
};

type SaleFormProps = {
  products: SaleProduct[];
  customersData: Entity[];
  defaultDate: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  // Edit mode
  orderId?: number;
  incomeId?: string | number;
  initialCustomer?: Entity | null;
  initialItems?: Record<string, { amount: string; salePrice: string }>;
  // Duplicate check
  existingOrders?: ExistingOrder[];
  onEditExistingOrder?: (orderId: number) => void;
};

const SaleForm = ({
  products,
  customersData,
  defaultDate,
  onSubmit,
  onCancel,
  isPending,
  orderId,
  incomeId,
  initialCustomer,
  initialItems,
  existingOrders,
  onEditExistingOrder,
}: SaleFormProps) => {
  const [, startTransition] = useTransition();
  const [selectedCustomer, setSelectedCustomer] = useState<Entity | null>(
    initialCustomer ?? null,
  );
  const [conflictOrder, setConflictOrder] = useState<ExistingOrder | null>(null);
  const [dismissedConflictCustomerId, setDismissedConflictCustomerId] = useState<number | null>(null);
  const [date, setDate] = useState(defaultDate);

  const handleCustomerChange = (customer: SetStateAction<Entity | null>) => {
    const resolved = typeof customer === "function" ? customer(selectedCustomer) : customer;
    setSelectedCustomer(resolved);
    if (!orderId && resolved && existingOrders?.length) {
      const conflict = existingOrders.find(
        (o) => o.customerId === Number(resolved.id),
      );
      setConflictOrder(conflict ?? null);
    } else {
      setConflictOrder(null);
    }
  };

  const showConflictBanner =
    conflictOrder !== null &&
    dismissedConflictCustomerId !== Number(selectedCustomer?.id);

  // When switching to edit mode, sync state from the provided initial values
  useEffect(() => {
    if (orderId) {
      if (initialCustomer) setSelectedCustomer(initialCustomer);
      setItems((prev) => {
        const next = { ...prev };
        products.forEach((p) => {
          const key = String(p.id);
          next[key] = initialItems?.[key] ?? { amount: "0", salePrice: "" };
        });
        return next;
      });
      setConflictOrder(null);
      setDismissedConflictCustomerId(null);
    }
  }, [orderId]);
  const [items, setItems] = useState<
    Record<string, { amount: string; salePrice: string }>
  >(() => {
    const init: Record<string, { amount: string; salePrice: string }> = {};
    products.forEach((p) => {
      const key = String(p.id);
      init[key] = initialItems?.[key] ?? { amount: "0", salePrice: "" };
    });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    products.forEach((p) => {
      const key = String(p.id);
      const raw = items[key]?.amount ?? "0";
      const num = Number(raw);
      if (!Number.isInteger(num) || num < 0) {
        newErrors[`${key}_amount`] = "Debe ser un entero positivo";
      } else if (num > p.availableQuantity) {
        newErrors[`${key}_amount`] = `Máx. disponible: ${p.availableQuantity}`;
      }
      if (num > 0) {
        const price = Number(items[key]?.salePrice ?? "0");
        if (!price || price <= 0) {
          newErrors[`${key}_salePrice`] = "El precio debe ser mayor a 0";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    const formData = new FormData();
    if (orderId) formData.append("id", String(orderId));
    if (incomeId) formData.append("incomeId", String(incomeId));
    formData.append("customerId", String(selectedCustomer?.id ?? ""));
    formData.append("date", date);
    const productItems = products
      .filter((p) => Number(items[String(p.id)]?.amount) > 0)
      .map((p) => {
        const key = String(p.id);
        return { id: key, salePrice: items[key].salePrice, amount: items[key].amount };
      });
    formData.append("products", JSON.stringify(productItems));
    startTransition(() => {
      onSubmit(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer */}
      <div>
        <Label className="mb-2">Cliente</Label>
        <ComboBoxWithModal
          data={customersData}
          selectedOption={selectedCustomer}
          setComboBoxSelectedOption={handleCustomerChange}
        />
      </div>

      {/* Conflict warning */}
      {showConflictBanner && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800">
            Este cliente ya tiene una venta registrada en este ingreso.
          </p>
          <p className="mt-1 text-amber-700">
            ¿Deseas crear una nueva venta o actualizar la existente?
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDismissedConflictCustomerId(Number(selectedCustomer?.id))
              }
            >
              Crear nueva venta
            </Button>
            <Button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => onEditExistingOrder?.(conflictOrder!.id)}
            >
              Actualizar venta existente
            </Button>
          </div>
        </div>
      )}

      {/* Date */}
      <div>
        <Label htmlFor="sale-date" className="mb-2">
          Fecha
        </Label>
        <Input
          id="sale-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Products table */}
      {products.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">
                  Producto
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">
                  Disponibles
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">
                  Cantidad
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">
                  Precio Venta
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {products.map((product) => {
                const key = String(product.id);
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-2 text-gray-900">{product.name}</td>
                    <td className="px-4 py-2 text-center text-gray-600">
                      {product.availableQuantity}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={items[key]?.amount ?? "0"}
                        onChange={(e) =>
                          setItems((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], amount: e.target.value },
                          }))
                        }
                        className={`w-24 rounded-md border px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                          errors[`${key}_amount`]
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`${key}_amount`] && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors[`${key}_amount`]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={items[key]?.salePrice ?? ""}
                        onChange={(e) =>
                          setItems((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], salePrice: e.target.value },
                          }))
                        }
                        className={`w-28 rounded-md border px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                          errors[`${key}_salePrice`]
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`${key}_salePrice`] && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors[`${key}_salePrice`]}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isPending || !selectedCustomer}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Registrar Venta"
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
