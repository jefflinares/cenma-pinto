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
  updateProviderSettlementStatus,
} from "@/app/(dashboard)/dashboard/pagos/actions";
import { ArrowLeft, CheckCircle, Receipt } from "lucide-react";
import { downloadProviderSettlementReceipt } from "@/lib/utils/providerSettlementReceipt";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

type ProviderSettlementPageProps = {
  incomeId: string;
  mode: "create" | "edit";
  backHref?: string;
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
  backHref,
}: ProviderSettlementPageProps) => {
  const [comboBoxSelectedOption, setComboBoxSelectedOption] =
    useState<Entity | null>(null);
  const [isConfirmPending, setIsConfirmPending] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { addToast } = useToast();

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
    refetch,
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
  const isDraft = selectedIncome?.status === "draft";
  const isSettlementConfirmed = mode === "edit" && isIncomeConfirmed;

  const handleConfirm = async () => {
    if (!settlementId) return;
    setIsConfirmPending(true);
    try {
      const fd = new FormData();
      fd.append("id", String(settlementId));
      fd.append("status", "confirmed");
      const result = await updateProviderSettlementStatus({}, fd);
      if ((result as any)?.error) {
        addToast((result as any).error, "error", 4000);
      } else {
        addToast("Recibo confirmado correctamente.", "success");
        await refetch();
      }
    } finally {
      setIsConfirmPending(false);
    }
  };

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
      {isConfirmModalOpen && (
        <Modal
          title="¿Confirmar recibo de pago?"
          setIsModalOpen={setIsConfirmModalOpen}
          onConfirmationText="Confirmar Recibo"
          onCancelText="Cancelar"
          onCancelAction={() => setIsConfirmModalOpen(false)}
          onConfirmAction={async () => {
            setIsConfirmModalOpen(false);
            await handleConfirm();
          }}
        >
          Esta acción no se puede revertir.
        </Modal>
      )}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {mode === "create"
            ? "Crear nuevo Recibo de Pago"
            : isIncomeConfirmed
              ? "Ver Recibo de Pago"
              : "Editar Recibo de Pago"}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {mode === "edit" && isDraft && settlementId && (
            <button
              type="button"
              disabled={isConfirmPending}
              onClick={() => setIsConfirmModalOpen(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              <CheckCircle size={16} />
              {isConfirmPending ? "Confirmando..." : "Confirmar Recibo"}
            </button>
          )}
          <div className="relative group">
            <button
              type="button"
              disabled={!isSettlementConfirmed}
              onClick={() =>
                downloadProviderSettlementReceipt({
                  id: selectedIncome?.id,
                  providerName: selectedIncome?.providerName,
                  netAmount: (selectedIncome as any)?.netAmount,
                  settlementDetails: (selectedIncome as any)?.settlementDetails,
                  settlementExpenses: (selectedIncome as any)?.settlementExpenses,
                  payments: formattedPayments,
                })
              }
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm"
            >
              <Receipt size={16} />
              Imprimir Recibo
            </button>
            {!isSettlementConfirmed && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50">
                <div className="w-2 h-2 bg-gray-800 rotate-45 mx-auto -mb-1" />
                <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  El recibo debe estar confirmado para imprimir
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <ArrowLeft size={16} />
            Regresar
          </button>
        </div>
      </div>

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
                    status={mode === "create" ? undefined : selectedIncome.status}
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
                    status={mode === "create" ? undefined : selectedIncome.status}
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
                    {(mode === "create" || !isIncomeConfirmed) && (<><button
                      type="submit"
                      disabled={isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isPending
                        ? mode === "create"
                          ? "Creando..."
                          : "Actualizando..."
                        : mode === "create"
                          ? "Crear Recibo de Pago"
                          : "Actualizar Recibo de Pago"}
                    </button>

                    </>)}
                     <button
                      type="button"
                      onClick={() => backHref ? router.push(backHref) : router.back()}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      {isIncomeConfirmed ? "Regresar" : "Cancelar"}
                    </button>
                  </div>
                </form>

                {/* ── Payments list (only visible once a settlement exists and is confirmed) ── */}
                {isSettlementConfirmed && settlementId && (
                  <EntityListSection<ProviderPaymentRow>
                    title={"Pagos registrados"}
                    subtitle={`Pagado: ${formatCurrency(totalPaymentsAmount)} · Pendiente: ${formatCurrency(remainingQuote)}`}
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
