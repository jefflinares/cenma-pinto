"use client";
import React, { useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import useFetchData from "@/components/hooks/useFetchData";
import OrderForm from "@/components/ui/forms/orderForm";
import { Entity, ComboBoxWithModal } from "@/components/ui/comboBox";
import { CustomerRow } from "../page";
import { updateOrder } from "../nueva/actions";
import { useToast } from "@/components/ui/toast";
import { IncomeRow, IncomeDetailRow } from "../../proveedores/page";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import CustomerPaymentForm, { CustomerPaymentActionState } from "@/components/ui/forms/CustomerPaymentForm";
import { addCustomerPayment, updateCustomerPayment, deleteCustomerPayment, confirmOrder } from "../actions";
import { Column } from "@/components/ui/table";
import { EntityListSection } from "@/components/ui/EntityListSection";
import { Pencil, Trash2 } from "lucide-react";
import OrderItemsTable from "@/components/ui/forms/OrderItemsTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { generateCustomerOrderReceiptPdf } from "@/lib/payments/customerOrderReceiptPdf";

type OrderDetailRow = {
  id: number;
  incomeDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  containerId: number;
  remainingQuantity: number | null;
};

type OrderRow = {
  id: number;
  incomeId: number;
  customerId: number;
  customerName: string;
  formattedDate: string;
  status: string;
  orderDetails: OrderDetailRow[];
};

type PaymentRow = {
  id: number;
  orderId: number | null;
  customerId: number;
  amount: string;
  date: Date | null;
  formattedDate: string | null;
  paymentType: string;
  reference: string | null;
};

const paymentTypeLabel: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
};

const paymentColumns: Column<PaymentRow>[] = [
  { header: "Fecha", field: "formattedDate" },
  {
    header: "Monto",
    field: "amount",
    render: (val) => `Q${Number(val).toFixed(2)}`,
  },
  {
    header: "Tipo",
    field: "paymentType",
    render: (val) => paymentTypeLabel[String(val)] ?? String(val),
  },
  { header: "Referencia", field: "reference", render: (val) => String(val ?? "-") },
];

const EditSale = () => {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const orderId = params.id as string;

  const [comboBoxSelectedOption, setComboBoxSelectedOption] = useState<Entity | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [extraIncomes, setExtraIncomes] = useState<IncomeRow[]>([]);
  const [extraOrderRows, setExtraOrderRows] = useState<IncomeDetailRow[]>([]);
  const [showIncomePicker, setShowIncomePicker] = useState(false);
  const [pickerSelectedIncome, setPickerSelectedIncome] = useState<Entity | null>(null);
  const [duplicateProducts, setDuplicateProducts] = useState<string[]>([]);
  const pendingFormDataRef = useRef<FormData | null>(null);

  const { data: orderRaw, isLoading: isLoadingOrder } =
    useFetchData<never>(`/api/orders?orderId=${orderId}`);
  // API returns a single OrderRow object (not an array)
  const order = (orderRaw as unknown) as OrderRow | null | undefined;

  const { data: customers, isLoading: isLoadingCustomers } =
    useFetchData<CustomerRow>("/api/customers");

  const { data: availableIncomes } = useFetchData<IncomeRow>("/api/incomes?withAvailableStock=true");

  const effectiveStatus = localStatus ?? order?.status;
  const isLocked = effectiveStatus === "confirmed" || effectiveStatus === "paid";

  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    isEditing: isEditingPayment,
    setIsEditing: setIsEditingPayment,
    isModalOpen: isPaymentModalOpen,
    setIsModalOpen: setIsPaymentModalOpen,
    selectedEntity: selectedPayment,
    setSelectedEntity: setSelectedPayment,
    formAction: paymentFormAction,
    isPending: isPaymentPending,
    handleOnDelete: handlePaymentDelete,
    currentPage: paymentPage,
    setCurrentPage: setPaymentPage,
  } = useEntityManager<PaymentRow>({
    route: `/api/orders/payments?orderId=${orderId}`,
    addAction: addCustomerPayment as any,
    updateAction: updateCustomerPayment as any,
    deleteAction: deleteCustomerPayment as any,
    setComboBoxSelectedOption: () => {},
    comboBoxSelectedOption: null,
    entityName: "Pago",
  });

  // Build a synthetic IncomeRow from the order so OrderForm can render it
  const syntheticIncome = useMemo((): IncomeRow | null => {
    if (!order) return null;
    return {
      id: order.incomeId,
      formattedDate: order.formattedDate,
      providerName: "",
      incomeDetails: order.orderDetails.map((d) => ({
        id: d.incomeDetailId,
        incomeId: order.incomeId,
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        stock: (d.remainingQuantity ?? 0) + d.quantity,
        unitPrice: Number(d.price),
        containerId: d.containerId,
        price: d.price,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
    } as unknown as IncomeRow;
  }, [order]);

  const orderTotal = useMemo(() => {
    if (!order) return 0;
    return order.orderDetails.reduce((sum, d) => sum + d.quantity * Number(d.price), 0);
  }, [order]);

  const totalPaid = useMemo(() => {
    if (!paymentsData) return 0;
    return paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [paymentsData]);

  const editingPaymentAmount = isEditingPayment && selectedPayment
    ? Number((selectedPayment as PaymentRow).amount ?? 0)
    : 0;
  const remaining = orderTotal - totalPaid + editingPaymentAmount;
  const remainingText = `Q${remaining.toFixed(2)}`;

  const handleConfirmOrder = async () => {
    setIsPending(true);
    try {
      const fd = new FormData();
      fd.set("id", orderId);
      const result = await (confirmOrder as any)({}, fd);
      if (result?.error) addToast(result.error, "error", 4000);
      else if (result?.success) { addToast(result.success, "success"); setLocalStatus("confirmed"); }
    } finally {
      setIsPending(false);
    }
  };

  const executeUpdate = async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await (updateOrder as any)({}, formData);
      if (result?.error) {
        addToast(result.error, "error", 4000);
      } else if (result?.success) {
        addToast(result.success, "success");
      }
    } catch {
      addToast("Error al actualizar la venta", "error", 4000);
    } finally {
      setIsPending(false);
    }
  };

  const handleFormAction = async (formData: FormData) => {
    formData.set("id", orderId);
    const existingDetails = JSON.parse((formData.get("orderDetails") as string) ?? "[]");
    const activeExtra = extraOrderRows.filter(
      (r) => Number(r.quantity) > 0 && Number(r.unitPrice ?? 0) > 0,
    );
    formData.set("orderDetails", JSON.stringify([...existingDetails, ...activeExtra]));

    const existingProductIds = new Set((order?.orderDetails ?? []).map((d) => d.productId));
    const dupes = activeExtra
      .filter((r) => existingProductIds.has(r.productId))
      .map((r) => r.productName ?? String(r.productId));

    if (dupes.length > 0) {
      pendingFormDataRef.current = formData;
      setDuplicateProducts(dupes);
      return;
    }

    await executeUpdate(formData);
  };

  const isLoading = isLoadingOrder || isLoadingCustomers;

  if (isLoading) return <div className="p-8 text-gray-600">Cargando...</div>;
  if (!order || !syntheticIncome) return <div className="p-8 text-red-600">Venta no encontrada.</div>;

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-none w-full">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => router.push("/dashboard/ventas")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Regresar
        </button>
        <h1 className="text-lg font-medium text-gray-900 flex-1">
          Editar Venta #{order.id}
        </h1>
        {!isLocked && (
          <Button onClick={() => setShowIncomePicker((v) => !v)} variant="outline">
            + Agregar más productos
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() =>
            generateCustomerOrderReceiptPdf({
              id: order.id,
              customerName: order.customerName,
              formattedDate: order.formattedDate,
              orderDetails: order.orderDetails.map((d) => ({
                productName: d.productName,
                quantity: d.quantity,
                price: d.price,
              })),
              payments: (paymentsData ?? []).map((p) => ({
                ...p,
                formattedDate: p.formattedDate ?? undefined,
                date: p.date ?? undefined,
              })),
            })
          }
        >
          Imprimir Orden
        </Button>
        {!isLocked && (
          <Button
            onClick={handleConfirmOrder}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmar Venta
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 w-full space-y-6">
        {!isLocked && showIncomePicker && (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Seleccionar ingreso</Label>
              <ComboBoxWithModal
                name="extraIncomeId"
                selectedOption={pickerSelectedIncome}
                setComboBoxSelectedOption={setPickerSelectedIncome}
                data={(availableIncomes ?? [])
                  .filter(
                    (i) =>
                      i.id !== order.incomeId &&
                      !extraIncomes.some((e) => e.id === i.id),
                  )
                  .map((i) => ({
                    id: i.id!,
                    name: `#${i.id} – ${i.providerName} (${i.formattedDate})`,
                  }))}
              />
            </div>
            <Button
              onClick={() => {
                const found = availableIncomes?.find(
                  (i) => i.id === pickerSelectedIncome?.id,
                );
                if (found) {
                  setExtraIncomes((prev) => [...prev, found]);
                  setPickerSelectedIncome(null);
                  setShowIncomePicker(false);
                }
              }}
              disabled={!pickerSelectedIncome}
            >
              Agregar sección
            </Button>
          </div>
        )}

        <OrderForm
          isLoading={false}
          isPending={isPending}
          isEditing={true}
          preserveValues={true}
          readOnly={isLocked}
          customersData={customers?.map((c) => ({ id: c.id, name: c.name })) ?? []}
          incomes={[syntheticIncome]}
          productsData={[]}
          data={[]}
          formAction={handleFormAction}
          state={order as any}
          setIsModalOpen={() => {}}
          setIsEditing={() => {}}
          selectedOption={
            comboBoxSelectedOption ?? { id: order.customerId, name: order.customerName }
          }
          setComboBoxSelectedOption={setComboBoxSelectedOption}
          modalChildren={<></>}
        />

        {extraIncomes.map((income) => (
          <div key={income.id}>
            <hr className="border-gray-200" />
            <Label className="mt-4 block">
              Proveedor: {income.providerName} · {income.formattedDate} · #{income.id}
            </Label>
            <div className="mt-3">
              <OrderItemsTable
                rows={income.incomeDetails as IncomeDetailRow[]}
                preserveValues={false}
                readOnly={false}
                onValidationChange={() => {}}
                onChange={(updatedRow) => {
                  setExtraOrderRows((prev) => {
                    const idx = prev.findIndex((r) => r.id === updatedRow.id);
                    if (idx !== -1) {
                      const next = [...prev];
                      next[idx] = updatedRow;
                      return next;
                    }
                    return [...prev, updatedRow];
                  });
                }}
              />
            </div>
          </div>
        ))}

        {isLocked && (
          <EntityListSection<PaymentRow>
            className="p-0"
            title="Pagos"
            subtitle={`Total: Q${orderTotal.toFixed(2)} · Pagado: Q${totalPaid.toFixed(2)} · Pendiente: Q${(orderTotal - totalPaid).toFixed(2)}`}
            addButtonText="+ Registrar Pago"
            addButtonDisabled={remaining <= 0}
            addButtonDisabledMessage={remaining <= 0 ? "La venta ya está completamente pagada" : undefined}
            isLoading={isLoadingPayments}
            data={paymentsData ?? []}
            columns={paymentColumns}
            actions={[
              { action: "edit", component: <Pencil size={16} /> },
              { action: "delete", component: <Trash2 size={16} /> },
            ]}
            currentPage={paymentPage}
            totalItems={paymentsData?.length ?? 0}
            pageSize={20}
            onPageChange={setPaymentPage}
            onEdit={(row) => {
              setSelectedPayment(row);
              setIsEditingPayment(true);
              setIsPaymentModalOpen(true);
            }}
            onDelete={(row) => handlePaymentDelete(row.id!)}
            isModalOpen={isPaymentModalOpen}
            setIsModalOpen={(open) => {
              setIsPaymentModalOpen(open);
              if (!open) {
                setIsEditingPayment(false);
                setSelectedPayment(null);
              }
            }}
            modalContent={
              <CustomerPaymentForm
                formAction={paymentFormAction}
                state={(isEditingPayment ? selectedPayment ?? {} : {}) as CustomerPaymentActionState}
                isPending={isPaymentPending}
                isEditing={isEditingPayment}
                setIsModalOpen={setIsPaymentModalOpen}
                setIsEditing={setIsEditingPayment}
                orderId={Number(orderId)}
                customerId={order.customerId}
                remainingAmount={remainingText}
              />
            }
          />
        )}
      </div>
      {duplicateProducts.length > 0 && (
        <Modal
          title="Producto duplicado"
          setIsModalOpen={() => setDuplicateProducts([])}
          onCancelText="Cancelar"
          onCancelAction={() => {
            setDuplicateProducts([]);
            pendingFormDataRef.current = null;
          }}
          onConfirmationText="Continuar de todas formas"
          onConfirmAction={() => {
            const fd = pendingFormDataRef.current;
            pendingFormDataRef.current = null;
            setDuplicateProducts([]);
            if (fd) executeUpdate(fd);
          }}
          width="max-w-md"
        >
          <div className="space-y-3">
            <p className="text-amber-700 font-medium">
              El ingreso seleccionado contiene productos que ya están en esta orden con diferente precio:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {duplicateProducts.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className="text-sm text-gray-500">
              ¿Desea continuar de todas formas?
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EditSale;
