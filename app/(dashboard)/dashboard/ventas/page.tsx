'use client';
import { useEntityManager } from '@/components/hooks/useEntityManager';
import { addCustomer, deleteCustomer, updateCustomer } from './actions';
import { EntityListSection } from '@/components/ui/EntityListSection';
import { Customer } from '@/lib/db/schema';
import CustomerForm, { CustomerActionState } from '@/components/ui/forms/customerForm';
import AddOrEditEntityComponent from '@/components/ui/forms/addOrEditForm';

type CustomerRow = Customer

export default function SalesPage() {
  
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
  })

  const addNewCustomer = (
    state: CustomerActionState,
    formAction: (formData: FormData) => void | Promise<void>
  ) => {
    return AddOrEditEntityComponent(
      isEditing ? "Editar Cliente" : "Agregar Cliente",
      <CustomerForm
        formAction={formAction}
        state={state}
        isPending={isPending}
        isEditing={isEditing}
        setIsModalOpen={setIsModalOpen}
        setIsEditing={setIsEditing}
      />
    )
  }

  return (    
    <>
      <EntityListSection<CustomerRow>
        title="Clientes"
        addButtonText='Agregar nuevo Cliente'
        isLoading={isLoading}
        data={customers ?? []}
        columns={[
          // { header: "ID", field: "id" },
          { header: "Nombre", field: "name" },
          { header: "Teléfono", field: "phone" },
          { header: "Email", field: "email" },
          { header: "Dirección", field: "address" },
        ]}
        currentPage={1}
        totalItems={customers?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(customer) => {
          setSelectedCustomer(customer)
          setIsEditing(true)
          setIsModalOpen(true)
        }}
        onDelete={({ id }) => handleOnDeleteCustomer(Number(id))}

        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={addNewCustomer(
          isEditing
            ? (selectedCustomer as any as CustomerActionState)
            : ({} as any),
          formActionCustomer
        )}
        callBackActionWhenModalOpen={() => {
          console.log(
            "reset selected customer and initial state when modal opens"
          );
          setIsEditing(false);
          setSelectedCustomer(null);
          setInitialState({ name: "" });
        }}
      />
    </>
  );
}
