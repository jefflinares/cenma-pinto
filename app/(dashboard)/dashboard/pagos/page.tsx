"use client";
import { useState } from "react";
import Link from "next/link";
import { EntityListSection } from "@/components/ui/EntityListSection";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { addProviderSettlement, deleteProviderSettlement, updateProviderSettlement } from "./actions";
import { ProviderSettlement } from "@/lib/db/schema";
import { Entity } from "@/components/ui/comboBox";
import { formatIncomeDate } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export type SettlementRow = ProviderSettlement & {
  id: number;
  providerName: string;
  incomeDate: string;
};

export default function PagosPage() {

   const [comboBoxSelectedOption, setComboBoxSelectedOption] =
      useState<Entity | null>(null);

   const {
    data: settlements,
    isLoading,
    currentPage,
    setCurrentPage,
  } = useEntityManager<SettlementRow>({
    route: "/api/settlements", // Create this endpoint
    addAction: addProviderSettlement,
    updateAction: updateProviderSettlement,
    deleteAction: deleteProviderSettlement, // Create this action
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Pago",
  });
    console.log("🚀 ~ PagosPage ~ settlements:", settlements)
  
  const router = useRouter();

  const formattedSettlements = settlements?.map((s) => ({
    ...s,
    incomeDate: formatIncomeDate(s.incomeDate),
  }));
 
  

  return (
    <>
      <EntityListSection<SettlementRow>
        title="Pagos"
        addButtonText="Crear nuevo Pago"
        isLoading={isLoading}
        data={formattedSettlements ?? []}
        columns={[
          { header: "Fecha de pedido", field: "incomeDate" },
          { header: "Proveedor", field: "providerName" },
          { header: "Sub total", field: "grossAmount" },
          { header: "Comisión", field: "commissionAmount" },
          { header: "Neto", field: "netAmount" },
          { header: "Estado", field: "status" },
          // Add more columns as needed
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
