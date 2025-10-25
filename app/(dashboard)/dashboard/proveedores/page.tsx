"use client";
import { useActionState, useEffect, useState } from "react";
import { Income, IncomeDetail, Provider } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";
import SupplierForm, {
  SupplierActionState,
} from "@/components/ui/forms/supplier";
import {
  addSupplier,
  updateSupplier,
  deleteSupplier,
  updateIncome,
  addIncome,
} from "./actions";
import { useToast } from "@/components/ui/toast";
import { EntityListSection } from "@/components/ui/EntityListSection";
// import TruckForm, { TruckActionState } from "@/components/ui/forms/truck";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import IncomeForm, {
  IncomeActionState,
} from "@/components/ui/forms/incomeForm";
import NestedTable from "@/components/ui/NestedTable";
import { ProductRow } from "../productos/page";

type ProviderRow = Provider;
export type IncomeDetailRow = IncomeDetail & { productName?: string };
type IncomeRow = Income & {
  formatedDate?: string;
  providerName?: string;
  incomeDetails?: IncomeDetailRow[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSWR<ProviderRow[]>(
    "/api/supplier",
    fetcher
  );
  //console.log("🚀 ~ SuppliersPage ~ suppliers:", suppliers);

  const {
    data: incomes,
    error: errorIncomes,
    isLoading: isLoadingIncomes,
  } = useSWR<IncomeRow[]>("/api/incomes", fetcher);

  const {
    data: productsData,
    error: errorProducts,
    isLoading: isLoadingProducts,
  } = useSWR<ProductRow[]>("/api/product", fetcher);
  //console.log("🚀 ~ SuppliersPage ~ productsData:", productsData);

  const { addToast } = useToast();

  const [selectedSupplier, setSelectedSupplier] = useState<ProviderRow | null>(
    null
  );
  const [selectedIncome, setSelectedIncome] = useState<IncomeRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isIncomeEditing, setIsIncomeEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  const [comboBoxSelectedOption, setComboBoxSelectedOption] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  const [actionFn, setActionFn] = useState<
    ((prevState: any, formData: FormData) => Promise<any>)
  >();

  // Cambia la función de acción según el modo
  useEffect(() => {
    if (isEditing) {
      setActionFn(() => updateSupplier);
    } else {
      setActionFn(() => addSupplier);
    }
  }, [isEditing]);

  const [actionFnIncomes, setActionFnIncomes] = useState<
    ((prevState: any, formData: FormData) => Promise<any>)
  >();

  useEffect(() => {
    if (isIncomeEditing) {
      setActionFnIncomes(() => updateIncome);
    } else {
      setActionFnIncomes(() => addIncome);
    }
  }, [isIncomeEditing]);

  const [initialState, setInitialState] = useState({});
  const [incomeInitialState, setIncomeInitialState] = useState({});

  useEffect(() => {
    if (isEditing) {
      const initialState =
        isEditing && selectedSupplier
          ? {
              id: selectedSupplier.id,
              name: selectedSupplier.name,
              phone: selectedSupplier.phone,
              address: selectedSupplier.address,
            }
          : {};
      setInitialState(initialState);
    }
  }, [isEditing, selectedSupplier]);

  const [stateSupplier, formActionSupplier, isPending] = useActionState<
    SupplierActionState,
    FormData
  >(actionFn, initialState);

  const [stateIncomes, formActionIncomes, isPendingIncomes] = useActionState<
    IncomeActionState,
    FormData
  >(actionFnIncomes, incomeInitialState);

  // Al finalizar la acción:
  useEffect(() => {
    if (stateSupplier?.success) {
      mutate("/api/supplier"); // Refresca proveedores con SWR

      addToast(
        isEditing ? "Proveedor actualizado" : "Proveedor agregado",
        "success"
      );
      setIsModalOpen(false);
      setIsEditing(false);
    } else if (stateSupplier?.error) {
      addToast(stateSupplier.error, "error");
    }
  }, [stateSupplier]);

  useEffect(() => {
    if (stateIncomes?.success) {
      mutate("/api/incomes"); // Refresca camiones con SWR
      addToast(
        isIncomeEditing ? "Ingreso actualizado" : "Ingreso agregado",
        "success"
      );
      setIsIncomeModalOpen(false);
      setIsIncomeEditing(false);
      setIncomeInitialState({});
      setSelectedIncome(null);
    } else if (stateIncomes?.error) {
      addToast(stateIncomes.error, "error");
    }
  }, [stateIncomes]);

  const handleOnDelete = async (
    id: string | number,
    supplier: boolean = true
  ) => {
    if (supplier) {
      try {
        const formData = new FormData();
        formData.append("id", String(id));
        const response = await deleteSupplier({ id }, formData);
        console.log("🚀 ~ handleOnDelete ~ response:", response);
        if (response.error) {
          addToast(response.error, "error", 5000);
          return;
        }
        addToast("Proveedor eliminado", "success");
        mutate("/api/supplier");
      } catch (error) {
        console.error("Error deleting proveedor:", error);
      }
    } else {
    }
  };

  const addNewSupplier = (
    state: SupplierActionState,
    formAction: (formData: FormData) => void | Promise<void>
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
      />
    );
  };

  const addNewIncome = (
    state: IncomeActionState,
    formAction: (formData: FormData) => void | Promise<void>
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
        }))}
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
      />
    );
  };

  const incomeDetailColumns: {
    header: string;
    field: keyof IncomeDetailRow;
  }[] = [
    { header: "Producto", field: "productName" },
    { header: "Cantidad", field: "quantity" },
  ];
  return (
    <>
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
        currentPage={1}
        totalItems={suppliers?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(supplier) => {
          setSelectedSupplier(supplier);
          setIsEditing(true);
          setIsModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDelete(Number(id))}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={addNewSupplier(
          isEditing
            ? (selectedSupplier as any as SupplierActionState)
            : {} as any,
          formActionSupplier
        )}
        callBackActionWhenModalOpen={() => {
          console.log('reset selected supplier and initial state when modal opens');
          setIsEditing(false)
          setSelectedSupplier(null);
          setInitialState({ });
        }}
      />

      <EntityListSection<IncomeRow>
        title="Ingresos de Productos"
        addButtonText="Agregar nuevo Ingreso"
        isLoading={isLoadingIncomes}
        data={incomes ?? []}
        columns={[
          { header: "Fecha", field: "formatedDate" },
          { header: "Proveedor", field: "providerName" },
          // { header: "Dirección", field: "address" },
        ]}
        currentPage={1}
        totalItems={incomes?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(income) => {
          setSelectedIncome(income);
          setIsIncomeEditing(true);
          setComboBoxSelectedOption({
            id: income.providerId ?? -1,
            name: incomes?.find((t) => t.providerId === income.providerId)?.providerName || "",
          });
          setIsIncomeModalOpen(true);
        }}
        onDelete={({ id }) => {
          handleOnDelete(id, false);
        }}
        isModalOpen={isIncomeModalOpen}
        setIsModalOpen={setIsIncomeModalOpen}
        callBackActionWhenModalOpen={() => {
          console.log(
            "callback para resetear el comboBoxSelectedOption y evitar que quede el último seleccionado aparezca en el formulario del truck"
          );
          setIsIncomeEditing(false)
          setComboBoxSelectedOption(null);
          setSelectedIncome(null);
          setIncomeInitialState({});
        }}
        modalContent={addNewIncome(
          isIncomeEditing
            ? (selectedIncome as any as IncomeActionState)
            : {} as any,
          formActionIncomes
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
