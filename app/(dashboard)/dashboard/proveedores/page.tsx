"use client";
import { useState } from "react";
import { Income, IncomeDetail, Provider } from "@/lib/db/schema";
import SupplierForm, {
  SupplierActionState,
} from "@/components/ui/forms/supplier";
import {
  addSupplier,
  updateSupplier,
  deleteSupplier,
  updateIncome,
  updateIncomeStatus,
  addIncome,
  deleteIncome,
} from "./actions";
import { EntityListSection } from "@/components/ui/EntityListSection";
// import TruckForm, { TruckActionState } from "@/components/ui/forms/truck";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import IncomeForm, {
  IncomeActionState,
} from "@/components/ui/forms/incomeForm";
import NestedTable from "@/components/ui/NestedTable";
import { ProductRow } from "../productos/page";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { Entity } from "@/components/ui/comboBox";
import { Check, ReceiptText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";

type ProviderRow = Provider;
export type IncomeDetailRow = IncomeDetail & {
  productName?: string;
  stock: number;
  unitPrice?: number;
};
export type IncomeRow = Income & {
  formattedDate?: string;
  providerName?: string;
  incomeDetails?: IncomeDetailRow[];
};

export default function SuppliersPage() {
  const [comboBoxSelectedOption, setComboBoxSelectedOption] =
    useState<Entity | null>(null);
  const [localModal, setLocalModal] = useState(false);
  const router = useRouter()
  const {
    data: suppliers,
    isLoading,
    selectedEntity: selectedSupplier,
    setSelectedEntity: setSelectedSupplier,
    isEditing,
    setIsEditing,
    isModalOpen,
    setIsModalOpen,
    setInitialState,
    formAction: formActionSupplier,
    isPending,
    handleOnDelete: handleOnDeleteSupplier,
    currentPage: currentPageProvider,
    setCurrentPage: setCurrentPageProvider,
  } = useEntityManager<ProviderRow>({
    route: "/api/supplier",
    addAction: addSupplier,
    updateAction: updateSupplier,
    deleteAction: deleteSupplier,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Proveedor",
  });

  const {
    data: incomes,
    error: errorIncomes,
    isLoading: isLoadingIncomes,
    selectedEntity: selectedIncome,
    setSelectedEntity: setSelectedIncome,
    isEditing: isIncomeEditing,
    setIsEditing: setIsIncomeEditing,
    isModalOpen: isIncomeModalOpen,
    setIsModalOpen: setIsIncomeModalOpen,
    setInitialState: setIncomeInitialState,
    formAction: formActionIncomes,
    handleOnDelete: handleOnDeleteIncome,
    handleOnUpdate: handleOnUpdateIncome,
    currentPage: currentPageIncome,
    setCurrentPage: setCurrentPageIncome,
  } = useEntityManager<IncomeRow>({
    route: "/api/incomes",
    addAction: addIncome,
    updateAction: updateIncome,
    deleteAction: deleteIncome,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Ingreso",
  });

  const {
    data: productsData,
    error: errorProducts,
    isLoading: isLoadingProducts,
  } = useEntityManager<ProductRow>({
    route: "/api/product",
    addAction: async (state, payload) => state,
    updateAction: async (state, payload) => state,
    deleteAction: async (state, payload) => state,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Producto",
  });

  const addNewSupplier = (
    state: SupplierActionState,
    formAction: (formData: FormData) => void | Promise<void>,
  ) => {
    return AddOrEditEntityComponent(
      isEditing ? "Editar Proveedor" : "Agregar Proveedor",

      <SupplierForm
        formAction={formAction}
        state={state}
        isPending={isPending}
        isEditing={isEditing}
        setIsModalOpen={setIsModalOpen}
        setIsEditing={setIsEditing}
      />,
    );
  };

  const addNewIncome = (
    state: IncomeActionState,
    formAction: (formData: FormData) => void | Promise<void>,
  ) => {
    return AddOrEditEntityComponent(
      isIncomeEditing ? "Editar Ingreso" : "Agregar Ingreso",

      <IncomeForm
        formAction={formAction}
        state={state}
        selectedOption={comboBoxSelectedOption}
        setComboBoxSelectedOption={setComboBoxSelectedOption}
        isPending={isPending}
        isEditing={isIncomeEditing}
        setIsModalOpen={setIsIncomeModalOpen}
        setIsEditing={setIsIncomeEditing}
        data={suppliers?.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
        })) ?? []}
        providersData={suppliers?.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
        }))}
        productsData={productsData?.map((product) => ({
          id: product.id,
          name: product.name,
        }))}
        // modalChildren={addNewSupplier(stateSupplier, formActionSupplier)}
        onAddCallBackAction={() => {
          // Aquí puedes manejar la acción de agregar un nuevo proveedor
          setIsIncomeModalOpen(false);
          setIncomeInitialState({});
          setSelectedIncome(null);
        }}
      />,
    );
  };

  const incomeDetailColumns: {
    header: string;
    field: keyof IncomeDetailRow;
  }[] = [
    { header: "Producto", field: "productName" },
    { header: "Cantidad", field: "quantity" },
    { header: "stock", field: "stock" },
  ];
  return (
    <>
      {localModal && (
        <Modal
          title={"Desea confirmar el ingreso ?"}
          setIsModalOpen={() => setLocalModal(false)}
          onConfirmationText="Confirmar Ingreso"
          onCancelText="Cancelar"
          onCancelAction={() => setLocalModal(false)}
          onConfirmAction={async () => {
            if (selectedIncome) {
              await handleOnUpdateIncome(
                {
                  ...selectedIncome,
                  id: selectedIncome.id,
                  status: "confirmed",
                },
                updateIncomeStatus,
              );
              setSelectedIncome(null);
              setLocalModal(false);
            }
          }}
        >
          Esta acción no se puede deshacer.
        </Modal>
      )}
      <EntityListSection<ProviderRow>
        title="Proveedores"
        addButtonText="Agregar nuevo Proveedor"
        isLoading={isLoading}
        data={suppliers ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          { header: "Teléfono", field: "phone" },
          { header: "Dirección", field: "address" },
        ]}
        currentPage={currentPageProvider}
        totalItems={suppliers?.length || 0}
        pageSize={10}
        onPageChange={(page) => setCurrentPageProvider(page)}
        onEdit={(supplier) => {
          setSelectedSupplier(supplier);
          setIsEditing(true);
          setIsModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDeleteSupplier(Number(id))}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={addNewSupplier(
          isEditing
            ? (selectedSupplier as any as SupplierActionState)
            : ({} as any),
          formActionSupplier,
        )}
        callBackActionWhenModalOpen={() => {
          console.log(
            "reset selected supplier and initial state when modal opens",
          );
          setIsEditing(false);
          setSelectedSupplier(null);
          setInitialState({ name: "" });
        }}
      />

      <EntityListSection<IncomeRow>
        title="Ingresos de Camiones"
        addButtonText="Agregar nuevo Ingreso"
        isLoading={isLoadingIncomes}
        data={incomes ?? []}
        columns={[
          { header: "Fecha", field: "formattedDate" },
          { header: "Proveedor", field: "providerName" },
          // { header: "Dirección", field: "address" },
        ]}
        actions={[
          {
            action: "edit",
            component: null,
            renderCondition: (income: Income) => income.status === "draft",
          },
          {
            action: "delete",
            component: null,
            renderCondition: (income: Income) => income.status === "draft",
          },
          {
            action: "confirm",
            component: (income: IncomeRow) => (
              <button
                onClick={() => {
                  setSelectedIncome(income);
                  setLocalModal(true);
                }}
                className="text-green-500 hover:text-green-700"
              >
                <Check size={20} />
              </button>
            ),
            renderCondition: (income: Income) => income.status === "draft",
          } as any,
          {
            action: "generate receipt",
            component: (income: IncomeRow) => (
              <button
                className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                onClick={() => {
                  router.push(`/dashboard/pagos/nuevo/${income.id}`);
                  console.log("Generar recibo para el ingreso:", income);
                }}
              >
                <ReceiptText size={18} />
                <span className="text-sm">Generar Recibo</span>
              </button>
            ),
            renderCondition: (income: Income) => income.status === "confirmed"
          },
          {
            action: "view receipt",
            component: (income: IncomeRow) => (
              <button
                className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                onClick={() => {
                  router.push(`/dashboard/pagos/${income.providerSettlementId}`);
                  console.log("Generar recibo para el ingreso:", income);
                }}
              >
                <ReceiptText size={18} />
                <span className="text-sm">Ver Recibo</span>
              </button>
            ),
            renderCondition: (income: Income) => income.status === "settled"
          },
        ]}
        currentPage={currentPageIncome}
        totalItems={incomes?.length || 0}
        pageSize={10}
        onPageChange={(page) => setCurrentPageIncome(page)}
        onEdit={(income) => {
          setSelectedIncome(income);
          setIsIncomeEditing(true);
          setComboBoxSelectedOption({
            id: income.providerId ?? -1,
            name:
              incomes?.find((t) => t.providerId === income.providerId)
                ?.providerName || "",
          });
          setIsIncomeModalOpen(true);
        }}
        onDelete={({ id }) => {
          handleOnDeleteIncome(id);
        }}
        isModalOpen={isIncomeModalOpen}
        setIsModalOpen={setIsIncomeModalOpen}
        callBackActionWhenModalOpen={() => {
          console.log(
            "callback para resetear el comboBoxSelectedOption y evitar que quede el último seleccionado aparezca en el formulario del truck",
          );
          setIsIncomeEditing(false);
          setComboBoxSelectedOption(null);
          setSelectedIncome(null);
          setIncomeInitialState({});
        }}
        modalContent={addNewIncome(
          isIncomeEditing
            ? (selectedIncome as any as IncomeActionState)
            : ({} as any),
          formActionIncomes,
        )}
        hasNestedData={(income: IncomeRow) => {
          console.log("evaluation income hasnestedData", income);
          return !!(income.incomeDetails && income.incomeDetails.length > 0);
        }}
        renderNestedContent={(income: IncomeRow) => (
          <NestedTable
            title="Detalles de Ingreso"
            columns={incomeDetailColumns}
            data={income.incomeDetails || []}
          />
        )}
      />
    </>
  );
}
