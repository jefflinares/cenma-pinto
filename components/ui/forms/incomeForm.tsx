"use client";
import { useState, useEffect, useTransition } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";
import {
  ComboBoxWithModal,
  ComboBoxWithModalProps,
  type Entity,
} from "../comboBox";
import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/types";
import { formatDDMMYYYYtoYYYYMMDD } from "@/lib/utils";
import SaleForm from "./saleForm";
import AddOrEditEntityComponent from "./addOrEditForm";
import NestedTable from "../NestedTable";
import { EntityListSection } from "../EntityListSection";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import {
  addOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
} from "@/app/(dashboard)/dashboard/ingresos/[id]/action";
import { mutate } from "swr";
import { useToast } from "@/components/ui/toast";
import { CheckCircle, Circle } from "lucide-react";

export type IncomeActionState = {
  id?: string | number;
  date?: string | Date;
  formattedDate?: string;
  incomeDetails?: IncomeDetailRow[];
  providerId?: string | number;
  totalAmount?: number;
  error?: string;
  success?: string;
};

type IncomeProps = ComboBoxWithModalProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  productsData: Entity[] | undefined;
  providersData?: Entity[] | undefined;
  state: IncomeActionState;
  isPending: boolean;
  isEditing: boolean;
  disabled?: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  customersData?: Entity[];
  onOrderChange?: () => void;
};

const IncomeForm = ({
  state,
  productsData,
  providersData,
  isEditing,
  disabled,
  isPending,
  selectedOption,
  modalChildren,
  onAddCallBackAction,
  setComboBoxSelectedOption,
  setIsModalOpen,
  setIsEditing,
  formAction,
  customersData,
  onOrderChange,
}: IncomeProps) => {
  const todayISO = new Date().toISOString().split("T")[0];
  const { addToast } = useToast();
  const [, startConfirmTransition] = useTransition();

  const [date, setDate] = useState<string>(
    state.formattedDate
      ? formatDDMMYYYYtoYYYYMMDD(state.formattedDate)
      : todayISO,
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    productsData?.forEach((p) => {
      const existing = state.incomeDetails?.find((d) => d.productId === p.id);
      init[String(p.id)] = existing ? Number(existing.quantity) : 0;
    });
    return init;
  });

  // Reset date and quantities when the edited record changes
  useEffect(() => {
    setDate(
      state.formattedDate
        ? formatDDMMYYYYtoYYYYMMDD(state.formattedDate)
        : todayISO,
    );
    setQuantities((prev) => {
      const next: Record<string, number> = {};
      productsData?.forEach((p) => {
        const key = String(p.id);
        const fromState = state.incomeDetails?.find(
          (d) => d.productId === p.id,
        );
        next[key] = fromState ? Number(fromState.quantity) : (prev[key] ?? 0);
      });
      return next;
    });
  }, [state]);

  // When classification filter changes productsData, preserve entered values and only add new products
  useEffect(() => {
    setQuantities((prev) => {
      const next: Record<string, number> = {};
      productsData?.forEach((p) => {
        const key = String(p.id);
        if (key in prev) {
          next[key] = prev[key];
        } else {
          const fromState = state.incomeDetails?.find(
            (d) => d.productId === p.id,
          );
          next[key] = fromState ? Number(fromState.quantity) : 0;
        }
      });
      return next;
    });
  }, [productsData]);

  type OrderDetailRow = {
    id: number;
    productId: number;
    productName: string;
    quantity: string;
    price: string;
  };
  type OrderRow = {
    id: number;
    customerId: number;
    customerName: string;
    customerBalance: string | null;
    date: Date;
    formattedDate: string;
    status: "draft" | "pending" | "confirmed" | "paid";
    orderDetails: OrderDetailRow[];
  };

  const ordersRoute =
    isEditing && state.id ? `/api/orders?incomeId=${state.id}` : "";

  const [orderComboBoxOption, setOrderComboBoxOption] = useState<Entity | null>(
    null,
  );

  const {
    data: orders,
    isLoading: isLoadingOrders,
    selectedEntity: selectedOrder,
    setSelectedEntity: setSelectedOrder,
    isEditing: isOrderEditing,
    setIsEditing: setIsOrderEditing,
    isModalOpen: isOrderModalOpen,
    setIsModalOpen: setIsOrderModalOpen,
    formAction: orderFormAction,
    isPending: isOrderPending,
    handleOnDelete: handleOnDeleteOrder,
    state: orderState,
  } = useEntityManager<OrderRow>({
    route: ordersRoute,
    addAction: addOrder as any,
    updateAction: updateOrder as any,
    deleteAction: deleteOrder as any,
    setComboBoxSelectedOption: setOrderComboBoxOption,
    comboBoxSelectedOption: orderComboBoxOption,
    entityName: "Venta",
  });

  // Notify parent when an order is created/updated/deleted so it can refresh income data
  useEffect(() => {
    if (orderState?.success && onOrderChange) {
      onOrderChange();
    }
  }, [orderState?.success]);

  const handleDeleteOrder = async (id: number) => {
    await handleOnDeleteOrder(id);
    onOrderChange?.();
  };

  const handleConfirmOrder = (orderId: number) => {
    startConfirmTransition(async () => {
      const formData = new FormData();
      formData.append("id", String(orderId));
      const result = await confirmOrder({} as any, formData);
      if (result?.success) {
        addToast("Orden confirmada", "success");
        mutate(ordersRoute);
      } else if (result?.error) {
        addToast(result.error, "error", 4000);
      }
    });
  };

  const saleProducts = (productsData ?? [])
    .map((p) => {
      const detail = state.incomeDetails?.find((d) => d.productId === p.id);
      if (!detail) return null;
      return { id: p.id, name: p.name, availableQuantity: detail.stock ?? 0 };
    })
    .filter(Boolean) as {
    id: string | number;
    name: string;
    availableQuantity: number;
  }[];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (isEditing && state.id) {
      formData.append("id", String(state.id));
    }
    formData.append("date", date);
    formData.append("providerId", String(selectedOption?.id ?? ""));
    productsData?.forEach((p) => {
      const key = String(p.id);
      formData.append(`productId_${key}`, key);
      formData.append(`quantity_${key}`, String(quantities[key] ?? 0));
    });
    formAction(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <Label htmlFor="date" className="mb-2">
            Fecha
          </Label>
          <Input
            id="date"
            type="date"
            required
            value={date}
            disabled={disabled}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Provider */}
        <div>
          <Label className="mb-2">Proveedor</Label>
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <ComboBoxWithModal
              data={providersData ?? []}
              modalChildren={modalChildren}
              onAddCallBackAction={onAddCallBackAction}
              selectedOption={selectedOption}
              setComboBoxSelectedOption={setComboBoxSelectedOption}
            />
          </div>
        </div>

        {/* Products table */}
        {productsData && productsData.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">
                      Producto
                    </th>
                    {isEditing && (
                      <th className="px-4 py-2 text-center font-medium text-gray-600">
                        Unidades disponibles
                      </th>
                    )}
                    <th className="px-4 py-2 text-center font-medium text-gray-600">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {productsData.map((product) => {
                    const detail = state.incomeDetails?.find(
                      (d) => d.productId === product.id,
                    );
                    if (disabled && detail?.quantity === undefined)
                      return null;
                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-2 text-gray-900">
                          {product.name}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-2 text-center text-gray-600">
                            {detail?.stock ?? "-"}
                          </td>
                        )}
                        <td className="px-4 py-2 text-center">
                          <input
                            type="text"
                            disabled={disabled}
                            value={quantities[String(product.id)] ?? 0}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [String(product.id)]: Number(e.target.value),
                              }))
                            }
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Errors */}
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state.success && isEditing && (
          <p className="text-sm text-green-500">{state.success}</p>
        )}

        {/* Actions — hidden when read-only */}
        {!disabled && (
          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Actualizar Ingreso"
              ) : (
                "Registrar Ingreso"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => {
                setIsModalOpen(false);
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </form>
      {isEditing &&
        state.id && 
        (() => {
          const addNewOrder = () => {
            const adjustedProducts =
              isOrderEditing && selectedOrder
                ? saleProducts.map((p) => {
                    const orig = selectedOrder.orderDetails?.find(
                      (d) => d.productId === Number(p.id),
                    );
                    return {
                      ...p,
                      availableQuantity:
                        p.availableQuantity + Number(orig?.quantity ?? 0),
                    };
                  })
                : saleProducts;

            const initialItems =
              isOrderEditing && selectedOrder
                ? selectedOrder.orderDetails?.reduce(
                    (acc, d) => {
                      acc[String(d.productId)] = {
                        amount: d.quantity,
                        salePrice: d.price,
                      };
                      return acc;
                    },
                    {} as Record<string, { amount: string; salePrice: string }>,
                  )
                : undefined;

            const initialCustomer =
              isOrderEditing && selectedOrder
                ? {
                    id: selectedOrder.customerId,
                    name: selectedOrder.customerName,
                  }
                : null;

            const orderDate =
              isOrderEditing && selectedOrder
                ? new Date(selectedOrder.date).toISOString().split("T")[0]
                : date;

            return AddOrEditEntityComponent(
              isOrderEditing ? "Editar Venta" : "Registrar Venta",
              <SaleForm
                products={adjustedProducts}
                customersData={customersData ?? []}
                defaultDate={orderDate}
                orderId={isOrderEditing ? selectedOrder?.id : undefined}
                incomeId={state.id}
                initialCustomer={initialCustomer}
                initialItems={initialItems}
                isPending={isOrderPending}
                onSubmit={orderFormAction}
                onCancel={() => {
                  setIsOrderModalOpen(false);
                  setIsOrderEditing(false);
                  setSelectedOrder(null);
                }}
                existingOrders={
                  isOrderEditing
                    ? undefined
                    : orders?.map((o) => ({ id: o.id, customerId: o.customerId }))
                }
                onEditExistingOrder={(orderId) => {
                  const order = orders?.find((o) => o.id === orderId);
                  if (order) {
                    setSelectedOrder(order);
                    setIsOrderEditing(true);
                  }
                }}
              />,
            );
          };

          return (
            <div className="mt-8" id="ventas">
              <EntityListSection<OrderRow>
                  title="Ventas registradas"
                  addButtonText="Registrar Venta"
                  addButtonDisabled={!disabled}
                  addButtonDisabledMessage="El ingreso debe ser confirmado para poder registrar una venta"
                  isLoading={isLoadingOrders}
                  data={orders ?? []}
                  columns={[
                    { header: "Cliente", field: "customerName" },
                    { header: "Fecha", field: "formattedDate" },
                    {
                      header: "Balance",
                      field: "customerBalance",
                      render: (value) => `Q. ${Number(value ?? 0).toFixed(2)}`,
                    },
                    {
                      header: "Estado",
                      field: "status",
                      render: (value) => {
                        const map: Record<string, { label: string; className: string }> = {
                          draft: { label: "Borrador", className: "text-gray-600 bg-gray-100" },
                          pending: { label: "Pendiente", className: "text-yellow-600 bg-yellow-50" },
                          confirmed: { label: "Confirmada", className: "text-green-700 bg-green-50" },
                          paid: { label: "Pagada", className: "text-blue-700 bg-blue-50" },
                        };
                        const s = map[String(value)] ?? map.draft;
                        return (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.className}`}>
                            {s.label}
                          </span>
                        );
                      },
                    },
                  ]}
                  actions={[
                    {
                      action: "confirm",
                      renderCondition: (row) => row.status !== "confirmed",
                      component: (row: OrderRow) => (
                        <button
                          onClick={() => handleConfirmOrder(row.id)}
                          className="text-green-500 hover:text-green-700"
                          title="Confirmar orden"
                        >
                          <Circle size={18} />
                        </button>
                      ),
                    },
                    {
                      action: "confirm",
                      renderCondition: (row) => row.status === "confirmed",
                      component: (
                        <span className="text-green-600" title="Orden confirmada">
                          <CheckCircle size={18} />
                        </span>
                      ),
                    },
                  ]}
                  currentPage={1}
                  totalItems={orders?.length ?? 0}
                  pageSize={50}
                  onPageChange={() => {}}
                  onEdit={(order) => {
                    setSelectedOrder(order);
                    setIsOrderEditing(true);
                    setIsOrderModalOpen(true);
                  }}
                  onDelete={(order) => handleDeleteOrder(Number(order.id))}
                  isModalOpen={isOrderModalOpen}
                  setIsModalOpen={(open) => {
                    if (open) {
                      setIsOrderEditing(false);
                      setSelectedOrder(null);
                    }
                    setIsOrderModalOpen(open);
                  }}
                  modalContent={addNewOrder()}
                  hasNestedData={(row) => row.orderDetails?.length > 0}
                  renderNestedContent={(row) => {
                    const orderTotal = row.orderDetails.reduce(
                      (sum, d) => sum + Number(d.quantity) * Number(d.price),
                      0,
                    );
                    return (
                      <NestedTable
                        title="Detalle de Venta"
                        data={row.orderDetails}
                        columns={[
                          { header: "Producto", field: "productName" },
                          { header: "Cantidad", field: "quantity" },
                          {
                            header: "Precio",
                            field: "price",
                            render: (value) => `Q. ${Number(value).toFixed(2)}`,
                          },
                          {
                            header: "Subtotal",
                            field: "price",
                            render: (value, d) =>
                              `Q. ${(Number((d as any).quantity) * Number(value)).toFixed(2)}`,
                          },
                        ]}
                        footer={["Total", "", "", `Q. ${orderTotal.toFixed(2)}`]}
                      />
                    );
                  }}
                />
            </div>
          );
        })()}
    </>
  );
};

export default IncomeForm;
