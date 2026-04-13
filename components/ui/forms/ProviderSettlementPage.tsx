import React, { useState } from "react";
import { ComboBoxWithModal, Entity } from "../comboBox";
import { IncomeRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import ProviderSettlementTable, {
  IncomeDetailRowExtended,
  SettlementTableRowExtended,
  SettlementTableRow,
  ProviderSettlementRow,
} from "./ProviderSettlementTable";
import ResumeSummary from "../ResumeSummary";
import ProviderSettlementExpenses from "./ProviderSettlementExpenses";
import { useProviderSettlement } from "@/components/hooks/useProviderSettlement";
import { EntityListSection } from "../EntityListSection";
import AddOrEditEntityComponent from "./addOrEditForm";
import PaymentForm, { PaymentActionState } from "./PaymentForm";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import {
  addProviderPayment,
  deleteProviderPayment,
  updateProviderPayment,
} from "@/app/(dashboard)/dashboard/pagos/actions";
import { Receipt } from "lucide-react";
import { downloadProviderSettlementReceipt } from "@/lib/utils/providerSettlementReceipt";

type ProviderSettlementPageProps = {
  incomeId: string;
  mode: "create" | "edit";
};

export type ProviderPaymentRow = {
  id?: string | number;
  settlementId?: string | number;
  amount?: number | string;
  date?: string | Date;
  formattedDate?: string;
  paymentType?: string;
  reference?: string;
  formattedAmount?: string;
  formattedPaymentType?: string;
};

const ProviderSettlementPage = ({
  incomeId,
  mode,
}: ProviderSettlementPageProps) => {
  const [comboBoxSelectedOption, setComboBoxSelectedOption] =
    useState<Entity | null>(null);

  const {
    isLoading,
    isPending,
    grossAmount,
    commissionTotal,
    expenses,
    selectedOption,
    selectedIncome,
    setSelectedOption,
    setSettlementDetails,
    settlementExpenses,
    setSettlementExpenses,
    formattedIncomes,
    validationErrors,
    errorRef,
    handleSubmit,
    router,
  } = useProviderSettlement({
    mode,
    initialId: incomeId,
  });

  // ── Payment entity manager ──────────────────────────────────────────────
  const settlementId = (selectedIncome as ProviderSettlementRow)?.id;

  const {
    data: payments,
    isLoading: isLoadingPayments,
    selectedEntity: selectedPayment,
    setSelectedEntity: setSelectedPayment,
    isEditing: isPaymentEditing,
    setIsEditing: setIsPaymentEditing,
    isModalOpen: isPaymentModalOpen,
    setIsModalOpen: setIsPaymentModalOpen,
    setInitialState: setPaymentInitialState,
    formAction: paymentFormAction,
    isPending: isPaymentPending,
    handleOnDelete,
  } = useEntityManager<ProviderPaymentRow>({
    route: settlementId ? `/api/settlements/payments?settlementId=${settlementId}` : '',
    addAction: addProviderPayment,
    updateAction: updateProviderPayment,
    deleteAction: deleteProviderPayment,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Pago",
  });
    console.log("🚀 ~ ProviderSettlementPage ~ payments:", payments)
  // ───────────────────────────────────────────────────────────────────────

  const formatCurrency = (value?: string | number) => {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isNaN(amount) ? 0 : amount);
  };

  const formatPaymentType = (paymentType?: string) => {
    switch (paymentType) {
      case "cash":
        return "Efectivo";
      case "transfer":
        return "Transferencia";
      case "card":
        return "Tarjeta";
      case "check":
        return "Cheque";
      default:
        return paymentType ?? "";
    }
  };

  const formattedPayments = (payments ?? []).map((payment) => ({
    ...payment,
    formattedAmount: formatCurrency(payment.amount),
    formattedPaymentType: formatPaymentType(payment.paymentType),
  }));

  const totalAmountInDebt = Number((selectedIncome as any)?.netAmount ?? 0);
  const totalPaymentsAmount = (payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );
  const remainingQuote = Math.max(totalAmountInDebt - totalPaymentsAmount, 0);
  const formattedRemainingQuote = formatCurrency(remainingQuote);

  const isIncomeConfirmed = selectedIncome?.status === "confirmed";

  const addPaymentComponent = (state: PaymentActionState) =>
    AddOrEditEntityComponent(
      isPaymentEditing ? "Editar Pago" : "Agregar Pago",
      <PaymentForm
        formAction={paymentFormAction}
        state={{
          ...state,
          // pre-fill settlementId so the user doesn't have to pick it
          settlementId: settlementId ?? state.settlementId,
          remainingQuote: formattedRemainingQuote,
        }}
        isPending={isPaymentPending}
        isEditing={isPaymentEditing}
        setIsModalOpen={setIsPaymentModalOpen}
        setIsEditing={setIsPaymentEditing}
        selectedOption={comboBoxSelectedOption}
        setComboBoxSelectedOption={setComboBoxSelectedOption}
      />
    );

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-none w-full">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {mode === "create"
          ? "Crear nuevo Recibo de Pago"
          : mode === "edit" && !isIncomeConfirmed
            ? "Editar Recibo de Pago"
            : isIncomeConfirmed
              ? "Generar Recibo de Pago"
              : "Ver Recibo de Pago"}
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Cargando...</div>
        </div>
      ) : (
        ((incomeId === "0" && formattedIncomes.length > 0) ||
          (selectedOption && selectedOption.id) ||
          selectedIncome) && (
          <>
            {mode === "create" && incomeId === "0" && (
              <div>
                <h2>
                  Seleccione un ingreso — verá únicamente los ingresos que ya
                  han sido confirmados
                </h2>
                <ComboBoxWithModal
                  data={formattedIncomes}
                  selectedOption={selectedOption}
                  setComboBoxSelectedOption={setSelectedOption}
                />
              </div>
            )}

            {selectedIncome && selectedIncome.id && (
              <div className="bg-white rounded-lg shadow p-6 w-full space-y-6">
                {/* ── Settlement info header ── */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    <strong>Ingreso ID:</strong> {selectedIncome.id}
                    <strong> Proveedor:</strong> {selectedIncome.providerName}
                    <strong> Fecha de ingreso:</strong>{" "}
                    {selectedIncome.formattedDate}
                  </p>
                  {isIncomeConfirmed && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadProviderSettlementReceipt({
                          id: selectedIncome.id,
                          providerName: selectedIncome.providerName,
                          netAmount: (selectedIncome as any).netAmount,
                          settlementDetails: (selectedIncome as any).settlementDetails,
                          settlementExpenses: (selectedIncome as any).settlementExpenses,
                        })
                      }
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      <Receipt size={16} />
                      Generar Recibo
                    </button>
                  )}
                </div>

                {/* ── Validation errors ── */}
                {validationErrors.length > 0 && (
                  <div
                    ref={errorRef}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <h3 className="text-red-800 font-medium mb-2">
                      Errores de validación:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-red-700 text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Settlement form ── */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleSubmit();
                  }}
                  className="space-y-6"
                >
                  <ProviderSettlementTable<SettlementTableRow>
                    mode={mode}
                    status={selectedIncome.status}
                    rows={(() => {
                      if (!selectedIncome) return [];
                      if ("incomeDetails" in selectedIncome)
                        return selectedIncome.incomeDetails || [];
                      return (
                        (selectedIncome as ProviderSettlementRow)
                          .settlementDetails || []
                      );
                    })()}
                    onChange={(rows) => setSettlementDetails(rows as any)}
                  />

                  <ProviderSettlementExpenses
                    status={selectedIncome.status}
                    expenses={settlementExpenses}
                    onChange={(expenses) => setSettlementExpenses(expenses)}
                  />

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ResumeSummary
                      title="Resumen"
                      currency="Q."
                      items={[
                        { description: "SubTotal Productos:", amount: grossAmount },
                        { description: "Total Comisiones:", amount: commissionTotal },
                        { description: "SubTotal Gastos o descuentos:", amount: expenses },
                        { description: "Total a pagar:", amount: grossAmount - expenses },
                      ]}
                      showTotal={false}
                      highlightLastRow={true}
                    />
                  </div>

                  <div className="flex gap-4">
                    {!isIncomeConfirmed && (<><button
                      type="submit"
                      disabled={isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isPending
                        ? mode === "create"
                          ? "Generando..."
                          : "Actualizando..."
                        : mode === "create"
                          ? "Generar Recibo"
                          : "Actualizar Recibo"}
                    </button>
                   
                    </>)}
                     <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      {isIncomeConfirmed ? "Regresar" : "Cancelar"}
                    </button>
                  </div>
                </form>

                {/* ── Payments list (only visible once a settlement exists) ── */}
                {isIncomeConfirmed && settlementId && (
                  <EntityListSection<ProviderPaymentRow>
                    title={"Pagos registrados "}
                    addButtonText="Agregar Pago"
                    isLoading={isLoadingPayments}
                    data={formattedPayments}
                    columns={[
                      { header: "Fecha", field: "formattedDate" },
                      { header: "Monto", field: "formattedAmount" },
                      { header: "Tipo", field: "formattedPaymentType" },
                      { header: "Referencia", field: "reference" },
                    ]}
                    currentPage={1}
                    totalItems={formattedPayments.length}
                    pageSize={10}
                    onPageChange={() => {}}
                    onEdit={(payment) => {
                      setComboBoxSelectedOption(null);
                      setSelectedPayment(payment);
                      setIsPaymentEditing(true);
                      setIsPaymentModalOpen(true);
                    }}
                    onDelete={(payment) => {
                      if (!payment.id) return;
                      handleOnDelete(Number(payment.id));
                    }}
                    isModalOpen={isPaymentModalOpen}
                    setIsModalOpen={(open) => {
                      if (open) {
                        setComboBoxSelectedOption(null);
                        setSelectedPayment(null);
                        setIsPaymentEditing(false);
                        setPaymentInitialState({});
                      }
                      setIsPaymentModalOpen(open);
                    }}
                    modalContent={addPaymentComponent(
                      isPaymentEditing
                        ? (selectedPayment as PaymentActionState)
                        : {}
                    )}
                    callBackActionWhenModalOpen={() => {
                      setComboBoxSelectedOption(null);
                      setSelectedPayment(null);
                      setIsPaymentEditing(false);
                      setPaymentInitialState({});
                    }}
                  />
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default ProviderSettlementPage;
