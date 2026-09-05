"use client";
import React, { useState } from "react";
import OrderForm from "@/components/ui/forms/orderForm";
import { CustomerRow } from "../page";
import useFetchData from "@/components/hooks/useFetchData";
import { addOrder } from "./actions";
import { Entity } from "@/components/ui/comboBox";
import { IncomeRow } from "../../proveedores/page";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const NewSale = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [comboBoxSelectedOption, setComboBoxSelectedOption] = useState<Entity | null>(null);
  const [selectedIncomeId, setSelectedIncomeId] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { data: customers, isLoading: isLoadingCustomers } =
    useFetchData<CustomerRow>("/api/customers");

  const { data: incomes, isLoading: isLoadingIncomes } =
    useFetchData<IncomeRow>("/api/incomes?withAvailableStock=true");

  const selectedIncome = incomes?.find((i) => i.id === selectedIncomeId) ?? null;

  const handleFormAction = async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await (addOrder as any)({}, formData);
      if (result?.error) {
        addToast(result.error, "error", 4000);
      } else if (result?.success) {
        addToast(result.success, "success");
        router.push(`/dashboard/ventas/${(result as any).id}`);
      }
    } catch (error) {
      addToast("Error al registrar la venta", "error", 4000);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoadingIncomes || isLoadingCustomers) {
    return <div className="p-8 text-gray-600">Cargando...</div>;
  }

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-none w-full">
      <div className="flex items-center gap-3 mb-6">
        {selectedIncome ? (
          <button
            type="button"
            onClick={() => setSelectedIncomeId(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Cambiar ingreso
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/dashboard/ventas")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Regresar
          </button>
        )}
        <h1 className="text-lg font-medium text-gray-900">
          {selectedIncome
            ? `Registrar Venta — Ingreso #${selectedIncome.id} · ${selectedIncome.providerName} · ${selectedIncome.formattedDate}`
            : "Registrar Venta — Seleccione un ingreso"}
        </h1>
      </div>

      {!selectedIncome ? (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {(incomes ?? []).length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">
              No hay ingresos con stock disponible.
            </p>
          ) : (
            (incomes ?? []).map((income) => (
              <button
                key={income.id}
                type="button"
                onClick={() => setSelectedIncomeId(income.id ?? null)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-900">
                    Ingreso #{income.id} — {income.providerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha: {income.formattedDate} ·{" "}
                    {income.incomeDetails?.length ?? 0} producto(s) disponible(s)
                  </p>
                </div>
                <span className="text-orange-500 text-sm font-medium shrink-0 ml-4">
                  Seleccionar →
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <OrderForm
          isLoading={false}
          isPending={isPending}
          isEditing={false}
          customersData={customers?.map((c) => ({ id: c.id, name: c.name })) ?? []}
          incomes={[selectedIncome]}
          productsData={[]}
          data={[]}
          formAction={handleFormAction}
          state={{} as any}
          setIsModalOpen={() => {}}
          setIsEditing={() => {}}
          selectedOption={comboBoxSelectedOption}
          setComboBoxSelectedOption={setComboBoxSelectedOption}
          modalChildren={<></>}
        />
      )}
    </div>
  );
};

export default NewSale;
