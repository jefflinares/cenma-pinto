import React from "react";
import { ComboBoxWithModal } from "../comboBox";
import { IncomeRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import ProviderSettlementTable, {
  IncomeDetailRowExtended,
  ProviderSettlementeRowExtended,
} from "./ProviderSettlementTable";
import ResumeSummary from "../ResumeSummary";
import ProviderSettlementExpenses from "./ProviderSettlementExpenses";
import { useProviderSettlement } from "@/components/hooks/useProviderSettlement";
// import { useRouter } from "next/router";

type ProviderSettlementPageProps = {
  incomeId: string;
  mode: "create" | "edit";
};

const ProviderSettlementPage = ({
  incomeId,
  mode,
}: ProviderSettlementPageProps) => {
  // const router = useRouter();
  const {
    isLoading,
    isPending,
    grossAmount,
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
    // handleUpdate
  } = useProviderSettlement({
    mode,
    initialId: incomeId,
  });
    console.log("🚀 ~ ProviderSettlementPage ~ selectedIncome:", selectedIncome)

  return (
    <div className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {mode === "create"
          ? "Crear nuevo Recibo de Pago"
          : "Editar Recibo de Pago"}
      </h1>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Cargando...</div>
        </div>
      ) : (
        ((incomeId === "0" && formattedIncomes.length > 0) ||
          (selectedOption && selectedOption.id) || selectedIncome) && (
          <>
            {mode === "create" && incomeId === "0" && (
              <div>
                <h2>
                  Seleccione un ingreso verá unicamente los ingresos que ya han
                  sido confirmados
                </h2>
                <ComboBoxWithModal
                  data={formattedIncomes} // fetched with provider/order filter
                  selectedOption={selectedOption}
                  setComboBoxSelectedOption={setSelectedOption}
                />
              </div>
            )}
            {selectedIncome && selectedIncome.id && (
              <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Ingreso ID:</strong> {selectedIncome.id}
                    <strong> Proveedor:</strong> {selectedIncome.providerName}
                    <strong> Fecha de ingreso:</strong>{" "}
                    {selectedIncome.formattedDate}
                  </p>
                </div>

                {/* Validation errors display */}
                {validationErrors.length > 0 && (
                  <div
                    ref={errorRef}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
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

                {/* Your form component here */}
                <form
                  action={mode === "create" ? handleSubmit : undefined}
                  className="space-y-6"
                >
                  {/* Add your form fields here */}
                  <ProviderSettlementTable
                    rows={selectedIncome.incomeDetails || selectedIncome.settlementDetails || []}
                    onChange={(rows: IncomeDetailRowExtended[] | ProviderSettlementeRowExtended[]) => {
                      setSettlementDetails(rows);
                    }}
                  />
                  <ProviderSettlementExpenses
                    expenses={settlementExpenses}
                    onChange={(expenses) => setSettlementExpenses(expenses)}
                  />
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ResumeSummary
                      title="Resumen"
                      currency="Q."
                      items={[
                        {
                          description: "SubTotal Productos:",
                          amount: grossAmount,
                        },
                        {
                          description: "SubTotal Gastos o descuentos:",
                          amount: expenses,
                        },
                        {
                          description: "Total a pagar:",
                          amount: grossAmount - expenses,
                        },
                      ]}
                      showTotal={false}
                      highlightLastRow={true}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isPending ? "Generando..." : "Generar Recibo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default ProviderSettlementPage;
