"use client";
import React, { useState } from "react";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import OrderForm from "@/components/ui/forms/orderForm";
import { CustomerRow } from "../page";
import useFetchData from "@/components/hooks/useFetchData";
import { addOrder, deleteOrder, updateOrder } from "./actions";
import { Entity } from "@/components/ui/comboBox";
import { addCustomer, deleteCustomer, updateCustomer } from "../actions";
import { IncomeRow } from "../../proveedores/page";

const NewSale = () => {
  const [comboBoxSelectedOption, setComboBoxSelectedOption] =
    useState<Entity | null>(null);
  console.log("🚀 ~ NewSale ~ comboBoxSelectedOption:", comboBoxSelectedOption)

  const {
    data: customers,
    isLoading,
  //handleOnDelete: () => {},
  } = useFetchData<CustomerRow>(
     "/api/customers"
    );

   const {
    data: incomes,
    isLoading: isLoadingIncomes,
    selectedEntity: selectedIncome,
    setSelectedEntity: setSelectedIncome,
    isEditing: isEditingIncome,
    //setIsEditing: setIsEditingIncome,
    // isModalOpen: isModalOpenIncome,
    // setIsModalOpen: setIsModalOpenIncome,
    // setInitialState: setInitialStateIncome,
    formAction: formActionIncome,
    isPending: isPendingIncome,
    // handleOnDelete: handleOnDeleteCustomer,
  } = useEntityManager<IncomeRow>({
    route: "/api/incomes?withAvailableStock=true",
    addAction: addOrder,
    updateAction: updateOrder,  
    deleteAction: deleteOrder,
    setComboBoxSelectedOption: setComboBoxSelectedOption,
    comboBoxSelectedOption: comboBoxSelectedOption,
    entityName: "Orden",
  });

  // const { data: incomes } = useFetchData<IncomeRow[]>("/api/incomes?withAvailableStock=true");

  return (
    <OrderForm
      isLoading={isLoading || isLoadingIncomes}
      isPending={isPendingIncome}
      isEditing={isEditingIncome}
      customersData={customers?.map((c) => ({
        id: c.id,
        name: c.name,
      })) ?? []}
      incomes={incomes ?? []}
      productsData={[]}
      data={[]}
      formAction={formActionIncome}
      state={{} as any}
      setIsModalOpen={() => {}}
      setIsEditing={() => {}}
      selectedOption={comboBoxSelectedOption}
      setComboBoxSelectedOption={setComboBoxSelectedOption}
      modalChildren={<></>}
    />
  );
};

export default NewSale;
