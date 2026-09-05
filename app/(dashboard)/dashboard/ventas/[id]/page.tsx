"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useFetchData from "@/components/hooks/useFetchData";
import OrderForm from "@/components/ui/forms/orderForm";
import { Entity } from "@/components/ui/comboBox";
import { CustomerRow } from "../page";
import { updateOrder } from "../nueva/actions";
import { useToast } from "@/components/ui/toast";
import { IncomeRow } from "../../proveedores/page";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { EntityListSection } from "@/components/ui/EntityListSection";
import CustomerPaymentForm, { CustomerPaymentActionState } from "@/components/ui/forms/CustomerPaymentForm";
import { addCustomerPayment, updateCustomerPayment, deleteCustomerPayment } from "../actions";
import { Column } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

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

  const { data: orderRaw, isLoading: isLoadingOrder } =
    useFetchData<never>(`/api/orders?orderId=${orderId}`);
  // API returns a single OrderRow object (not an array)
  const order = (orderRaw as unknown) as OrderRow | null | undefined;

  const { data: customers, isLoading: isLoadingCustomers } =
    useFetchData<CustomerRow>("/api/customers");

  const isLocked = order?.status === "confirmed" || order?.status === "paid";

  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    isEditing: isEditingPayment,
    setIsEditing: setIsEditingPayment,
    isModalOpen: isPaymentModalOpen,
    setIsModalOpen: setIsPaymentModalOpen,
    selectedEntity: selectedPayment,
    setSelectedEntity: setSelectedPayment,
    state: paymentState,
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

  const handleFormAction = async (formData: FormData) => {
    formData.set("id", orderId);
    setIsPending(true);
    try {
      const result = await (updateOrder as any)({}, formData);
      if (result?.error) {
        addToast(result.error, "error", 4000);
      } else if (result?.success) {
        addToast(result.success, "success");
        router.push("/dashboard/ventas");
      }
    } catch {
      addToast("Error al actualizar la venta", "error", 4000);
    } finally {
      setIsPending(false);
    }
  };

  const isLoading = isLoadingOrder || isLoadingCustomers;

  if (isLoading) return <div className="p-8 text-gray-600">Cargando...</div>;
  if (!order || !syntheticIncome) return <div className="p-8 text-red-600">Venta no encontrada.</div>;

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-none w-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/ventas")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Regresar
        </button>
        <h1 className="text-lg font-medium text-gray-900">
          Editar Venta #{order.id}
        </h1>
      </div>

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

      {isLocked && (
        <div className="mt-8">
          <EntityListSection<PaymentRow>
            title="Pagos"
            subtitle={`Total: Q${orderTotal.toFixed(2)} · Pagado: Q${totalPaid.toFixed(2)} · Pendiente: Q${(orderTotal - totalPaid).toFixed(2)}`}
            addButtonText="+ Registrar Pago"
            addButtonDisabled={remaining <= 0}
            addButtonDisabledMessage={remaining <= 0 ? "La venta ya está completamente pagada" : undefined}
            isLoading={isLoadingPayments}
            data={paymentsData ?? []}
            columns={paymentColumns}
            actions={[
              {
                action: "edit",
                component: <Pencil size={16} />,
              },
              {
                action: "delete",
                component: <Trash2 size={16} />,
              },
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
        </div>
      )}
    </div>
  );
};

export default EditSale;
