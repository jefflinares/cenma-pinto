"use client";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { addCustomer, deleteCustomer, updateCustomer } from "../clientes/actions";
import { EntityListSection } from "@/components/ui/EntityListSection";
import { Customer } from "@/lib/db/schema";
import CustomerForm, {
  CustomerActionState,
} from "@/components/ui/forms/customerForm";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import NestedTable from "@/components/ui/NestedTable";
import useFetchData from "@/components/hooks/useFetchData";
import { useRouter } from "next/navigation";

export type CustomerRow = Customer;

type OrderDetailRow = {
  id: number;
  productId: number;
  productName: string;
  quantity: string;
  price: string;
};

type OrderRow = {
  id: number;
  incomeId: number;
  customerId: number;
  customerName: string;
  customerBalance: string | null;
  date: Date;
  formattedDate: string;
  status: "draft" | "pending" | "confirmed" | "paid";
  orderDetails: OrderDetailRow[];
};

export default function SalesPage() {
  const router = useRouter();
  const {
    data: customers,
    isLoading,
    currentPage: customerPage,
    setCurrentPage: setCustomerPage,
    selectedEntity: selectedCustomer,
    setSelectedEntity: setSelectedCustomer,
    isEditing,
    setIsEditing,
    isModalOpen,
    setIsModalOpen,
    setInitialState,
    formAction: formActionCustomer,
    isPending,
    handleOnDelete: handleOnDeleteCustomer,
  } = useEntityManager<CustomerRow>({
    route: "/api/customers",
    addAction: addCustomer,
    updateAction: updateCustomer,
    deleteAction: deleteCustomer,
    setComboBoxSelectedOption: () => {},
    comboBoxSelectedOption: null,
    entityName: "Cliente",
  });

  const { data: orders, isLoading: isLoadingOrders } =
    useFetchData<OrderRow>("/api/orders");

  return (
    <>
      <EntityListSection<CustomerRow>
        title="Clientes"
        addButtonText="Agregar nuevo Cliente"
        isLoading={isLoading}
        data={customers ?? []}
        columns={[
          {
            header: "Nombre",
            field: "name",
            render: (value, row) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/clientes/${(row as CustomerRow).id}`);
                }}
                className="text-orange-600 hover:underline font-medium"
              >
                {String(value)}
              </button>
            ),
          },
          { header: "Teléfono", field: "phone" },
          { header: "Email", field: "email" },
          { header: "Dirección", field: "address" },
        ]}
        currentPage={customerPage}
        totalItems={customers?.length || 0}
        pageSize={10}
        onPageChange={setCustomerPage}
        onEdit={(customer) => {
          setSelectedCustomer(customer);
          setIsEditing(true);
          setIsModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDeleteCustomer(Number(id))}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={AddOrEditEntityComponent(
          isEditing ? "Editar Cliente" : "Agregar Cliente",
          <CustomerForm
            formAction={formActionCustomer}
            state={isEditing ? (selectedCustomer as any as CustomerActionState) : ({} as any)}
            isPending={isPending}
            isEditing={isEditing}
            setIsModalOpen={setIsModalOpen}
            setIsEditing={setIsEditing}
          />,
        )}
        callBackActionWhenModalOpen={() => {
          setIsEditing(false);
          setSelectedCustomer(null);
          setInitialState({ name: "" });
        }}
      />

      <EntityListSection<OrderRow>
        title="Ventas"
        addButtonText="Agregar nueva venta"
        redirectsOnAdd={true}
        isLoading={isLoadingOrders}
        data={orders ?? []}
        columns={[
          { header: "# Orden", field: "id" },
          {
            header: "Cliente",
            field: "customerName",
            render: (value, row) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/clientes/${(row as OrderRow).customerId}`);
                }}
                className="text-orange-600 hover:underline font-medium"
              >
                {String(value)}
              </button>
            ),
          },
          { header: "Fecha", field: "formattedDate" },
          { header: "Ingreso ID", field: "incomeId" },
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
        currentPage={1}
        totalItems={orders?.length ?? 0}
        pageSize={50}
        onPageChange={() => {}}
        onEdit={(order) => router.push(`/dashboard/ventas/${order.id}`)}
        onDelete={() => {}}
        isModalOpen={false}
        setIsModalOpen={() => {}}
        modalContent={null}
        callBackActionWhenModalOpen={() => router.push("/dashboard/ventas/nueva")}
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
    </>
  );
}
