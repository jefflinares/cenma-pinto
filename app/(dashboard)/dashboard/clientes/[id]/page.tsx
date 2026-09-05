"use client";
import { useParams, useRouter } from "next/navigation";
import useFetchData from "@/components/hooks/useFetchData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "@/components/ui/table";
import type { Column } from "@/components/ui/table";

type CustomerDetail = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: string | null;
  accountUpdatedAt: Date | null;
};

type MovementRow = {
  id: number;
  type: string;
  amount: string;
  orderId: number | null;
  paymentId: number | null;
  formattedDate: string;
  concept: string;
};

type OrderDetailRow = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
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

const movementColumns: Column<MovementRow>[] = [
  { header: "Fecha", field: "formattedDate" },
  {
    header: "Tipo",
    field: "type",
    render: (val) => {
      const isDebit = val === "DEBIT";
      return (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            isDebit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isDebit ? "DÉBITO" : "CRÉDITO"}
        </span>
      );
    },
  },
  { header: "Concepto", field: "concept" },
  {
    header: "Monto",
    field: "amount",
    render: (val) => `Q${Number(val).toFixed(2)}`,
  },
  {
    header: "Orden #",
    field: "orderId",
    render: (val) => (val != null ? String(val) : "-"),
  },
  {
    header: "Pago #",
    field: "paymentId",
    render: (val) => (val != null ? String(val) : "-"),
  },
];

const orderStatusMap: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "text-gray-600 bg-gray-100" },
  pending: { label: "Pendiente", className: "text-yellow-600 bg-yellow-50" },
  confirmed: { label: "Confirmada", className: "text-green-700 bg-green-50" },
  paid: { label: "Pagada", className: "text-blue-700 bg-blue-50" },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customerRaw, isLoading: isLoadingCustomer } =
    useFetchData<never>(`/api/customers/${customerId}`);
  const customer = customerRaw as unknown as CustomerDetail | null;

  const { data: movements, isLoading: isLoadingMovements } =
    useFetchData<MovementRow>(`/api/account-movements?customerId=${customerId}`);

  const { data: orders, isLoading: isLoadingOrders } =
    useFetchData<OrderRow>(`/api/orders?customerId=${customerId}`);

  const orderColumns: Column<OrderRow>[] = [
    { header: "# Orden", field: "id" },
    { header: "Fecha", field: "formattedDate" },
    {
      header: "Estado",
      field: "status",
      render: (val) => {
        const s = orderStatusMap[String(val)] ?? orderStatusMap.draft;
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.className}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      header: "Total",
      field: "orderDetails",
      render: (val) => {
        const details = val as unknown as OrderDetailRow[];
        const total = (details ?? []).reduce(
          (sum, d) => sum + Number(d.quantity) * Number(d.price),
          0,
        );
        return `Q${total.toFixed(2)}`;
      },
    },
  ];

  if (isLoadingCustomer) return <div className="p-8 text-gray-600">Cargando...</div>;
  if (!customer) return <div className="p-8 text-red-600">Cliente no encontrado.</div>;

  const balance = Number(customer.balance ?? 0);

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-none w-full space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/ventas")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Regresar
        </button>
        <h1 className="text-lg font-medium text-gray-900">Detalle de Cliente</h1>
      </div>

      {/* Customer info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{customer.name}</span>
            <span
              className={`text-base font-semibold px-3 py-1 rounded-full ${
                balance > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              Saldo: Q{balance.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium text-gray-500">Teléfono</span>
            <p>{customer.phone ?? "-"}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Email</span>
            <p>{customer.email ?? "-"}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Dirección</span>
            <p>{customer.address ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Movements section */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<MovementRow>
            isLoading={isLoadingMovements}
            columns={movementColumns}
            data={movements ?? []}
            actions={[]}
            currentPage={1}
            totalItems={movements?.length ?? 0}
            pageSize={50}
            onPageChange={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </CardContent>
      </Card>

      {/* Orders section */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<OrderRow>
            isLoading={isLoadingOrders}
            columns={orderColumns}
            data={orders ?? []}
            actions={[]}
            currentPage={1}
            totalItems={orders?.length ?? 0}
            pageSize={50}
            onPageChange={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onRowClick={(row) => router.push(`/dashboard/ventas/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
