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

  const {
    data: customers,
    isLoading,
    selectedEntity: selectedCustomer,
    setSelectedEntity: setSelectedCustomer,
    isEditing,
    setIsEditing,
    isModalOpen,
    setIsModalOpen,
    setInitialState,
    formAction: formActionCustomer,
    isPending,
    handleOnDelete: handleOnDeleteCustomer,
  } = useEntityManager<CustomerRow>({
    route: "/api/customers",
    addAction: addCustomer,
    updateAction: updateCustomer,
    deleteAction: deleteCustomer,
    setComboBoxSelectedOption: () => {},
    comboBoxSelectedOption: null,
    entityName: "Cliente",
  });

  const { data: incomes } = useFetchData<IncomeRow[]>("/api/incomes");

  return (
    <OrderForm
      isLoading={isLoading}
      isPending={isPending}
      isEditing={isEditing}
      customersData={customers?.map((c) => ({
        id: c.id,
        name: c.name,
      }))}
      incomes={incomes ?? []}
    />
  );
};

export default NewSale;
