"use client";
import { useState } from "react";
import Link from "next/link";
import { EntityListSection } from "@/components/ui/EntityListSection";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import {
  addProviderSettlement,
  deleteProviderSettlement,
  updateProviderSettlement,
  updateProviderSettlementStatus,
} from "./actions";
import { ProviderSettlement } from "@/lib/db/schema";
import { Entity } from "@/components/ui/comboBox";
import { formatIncomeDate } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { Check, Plus, Receipt } from "lucide-react";  // icon for confirm button
import { Modal } from "@/components/ui/modal";
import { downloadProviderSettlementReceipt } from "@/lib/utils/providerSettlementReceipt";

export type SettlementRow = ProviderSettlement & {
  id: number;
  providerName: string;
  incomeDate: string;
  settlementDetails?: Array<{
    productName?: string;
    quantity?: string | number;
    unitPrice?: string | number;
    subtotal?: string | number;
  }>;
  settlementExpenses?: Array<{
    concept?: string;
    amount?: string | number;
  }>;
  netAmountRaw?: string | number;
  // total commission summed from details (added locally) as a formatted string
  totalDetailComission?: string;
};

export default function PagosPage() {

   const [comboBoxSelectedOption, setComboBoxSelectedOption] =
      useState<Entity | null>(null);

   const {
    data: settlements,
    isLoading,
    currentPage,
    setCurrentPage,
    handleOnUpdate,
  } = useEntityManager<SettlementRow>({
    route: "/api/settlements", // Create this endpoint
    addAction: addProviderSettlement,
    updateAction: updateProviderSettlement,
    deleteAction: deleteProviderSettlement, // Create this action
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Pago",
  });

  // local state for confirm modal
  const [localModal, setLocalModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] =
    useState<SettlementRow | null>(null);
    console.log("🚀 ~ PagosPage ~ settlements:", settlements)
  
  const router = useRouter();

  const formattedSettlements = settlements?.map((s) => {
    // calculate total commission from any attached details
    const totalDetailComission = (s as any).settlementDetails
      ? (s as any).settlementDetails.reduce(
          (sum: number, d: any) => sum + Number(d.totalComission || 0),
          0,
        )
      : 0;
    const currency = (n: number) => "Q. " + n.toFixed(2);
    return {
      ...s,
      incomeDate: formatIncomeDate(s.incomeDate),
      totalDetailComission: currency(totalDetailComission),
      grossAmount: currency(Number(s.grossAmount)),
      netAmountRaw: s.netAmount,
      netAmount: currency(Number(s.netAmount)),
      otherDeductions: currency(Number(s.otherDeductions)),
    };
  });
 
  

  return (
    <>
      {localModal && selectedSettlement && (
        <Modal
          title={"Desea confirmar el recibo de pago ?"}
          setIsModalOpen={() => setLocalModal(false)}
          onConfirmationText="Confirmar recibo de Pago"
          onCancelText="Cancelar"
          onCancelAction={() => setLocalModal(false)}
          onConfirmAction={async () => {
            if (selectedSettlement) {
              await handleOnUpdate(
                {
                  ...selectedSettlement,
                  id: selectedSettlement.id,
                  status: "confirmed",
                } as any,
                updateProviderSettlementStatus,
              );
              setSelectedSettlement(null);
              setLocalModal(false);
            }
          }}
        >
          Esta acción no se puede deshacer.
        </Modal>
      )}

      <EntityListSection<SettlementRow>
        title="Pagos"

        addButtonText="Crear nuevo Pago"
        isLoading={isLoading}
        data={formattedSettlements ?? []}
        columns={[
          { header: "Fecha de pedido", field: "incomeDate" },
          { header: "Proveedor", field: "providerName" },
          { header: "Sub total", field: "grossAmount" },
          { header: "Comisión", field: "totalDetailComission" },
          { header: "Comisión fija", field: "otherDeductions" },
          { header: "Neto", field: "netAmount" },
          { header: "Estado", field: "status" },
          // Add more columns as needed
        ]}
        actions={[
          {
            action: "confirm",
            component: (payment: SettlementRow) => (
              <button
                onClick={() => {
                  setSelectedSettlement(payment);
                  setLocalModal(true);
                }}
                className="text-green-500 hover:text-green-700"
              >
                <Check size={20} />
              </button>
            ),
            renderCondition: (payment: SettlementRow) =>
              payment.status === "draft",
          } as any,
          {
            action: "edit",
            renderCondition: (payment: SettlementRow) => payment.status === "draft",
          },
          {
            action: "delete",
            renderCondition: (payment: SettlementRow) => payment.status === "draft",
          },
          {
            action: "generateReceipt",
            component: (payment: SettlementRow) => (
              <button
                onClick={() =>
                  downloadProviderSettlementReceipt({
                    id: payment.id,
                    providerName: payment.providerName,
                    netAmount: payment.netAmountRaw,
                    settlementDetails: payment.settlementDetails,
                    settlementExpenses: payment.settlementExpenses,
                  })
                }
              >
                <Receipt size={20} />
                Generar Recibo
              </button>
            ),
            renderCondition: (payment: SettlementRow) => payment.status === "confirmed",
          },
           {
            action: "addPayment",
            component: (payment: SettlementRow) => (
              <Link
                href={`/dashboard/pagos/${payment.id}`}
              >
                <Plus size={20} />
                Agregar Pago
              </Link>
            ),
            renderCondition: (payment: SettlementRow) => payment.status === "confirmed",
          }
        ]}
        currentPage={currentPage}
        totalItems={settlements?.length || 0}
        pageSize={10}
        onPageChange={(page) => setCurrentPage(page)}
        onEdit={(payment) => { router.push(`/dashboard/pagos/${payment.id}`) }} // Handle edit if needed
        onDelete={() => {}} // Handle delete if needed
        isModalOpen={false}
        setIsModalOpen={() => {}}
        redirectsOnAdd={true}
        modalContent={<></>}
        callBackActionWhenModalOpen = {() => {
          // Redirect to /pagos/nuevo when the add button is clicked
          router.push("/dashboard/pagos/nuevo/0");
        }}
        // Override the add button to redirect to /pagos/nuevo/[id]
        // You might need to customize EntityListSection or create custom button
      />
    </>
  );
}
