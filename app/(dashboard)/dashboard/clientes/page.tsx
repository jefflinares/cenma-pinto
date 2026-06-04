"use client";
import { useState } from "react";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { EntityListSection } from "@/components/ui/EntityListSection";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import CustomerForm, {
  CustomerActionState,
} from "@/components/ui/forms/customerForm";
import { Entity } from "@/components/ui/comboBox";
import { Customer } from "@/lib/db/schema";
import { addCustomer, updateCustomer, deleteCustomer } from "./actions";

type CustomerRow = Customer;

export default function CustomersPage() {
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
    formAction,
    isPending,
    currentPage,
    setCurrentPage,
    handleOnDelete,
  } = useEntityManager<CustomerRow>({
    route: "/api/customers",
    addAction: addCustomer,
    updateAction: updateCustomer,
    deleteAction: deleteCustomer,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Cliente",
  });

  const customerFormComponent = (state: CustomerActionState) =>
    AddOrEditEntityComponent(
      isEditing ? "Editar Cliente" : "Agregar Cliente",
      <CustomerForm
        formAction={formAction}
        state={state}
        isPending={isPending}
        isEditing={isEditing}
        setIsModalOpen={setIsModalOpen}
        setIsEditing={setIsEditing}
      />,
    );

  return (
    <EntityListSection<CustomerRow>
      title="Clientes"
      addButtonText="Agregar nuevo Cliente"
      isLoading={isLoading}
      data={customers ?? []}
      columns={[
        { header: "Nombre", field: "name" },
        { header: "Teléfono", field: "phone" },
        { header: "Email", field: "email" },
        { header: "Dirección", field: "address" },
      ]}
      currentPage={currentPage}
      totalItems={customers?.length ?? 0}
      pageSize={10}
      onPageChange={setCurrentPage}
      onEdit={(customer) => {
        setSelectedCustomer(customer);
        setIsEditing(true);
        setIsModalOpen(true);
      }}
      onDelete={({ id }) => handleOnDelete(Number(id))}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      modalContent={customerFormComponent(
        isEditing ? (selectedCustomer as any as CustomerActionState) : { name: "" },
      )}
      callBackActionWhenModalOpen={() => {
        setSelectedCustomer(null);
        setIsEditing(false);
        setInitialState({});
      }}
    />
  );
}
