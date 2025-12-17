'use client';
import { useEntityManager } from '@/components/hooks/useEntityManager';
import { addCustomer, deleteCustomer, updateCustomer } from './actions';
import { EntityListSection } from '@/components/ui/EntityListSection';
import { Customer, CustomerOrder } from '@/lib/db/schema';
import CustomerForm, { CustomerActionState } from '@/components/ui/forms/customerForm';
import AddOrEditEntityComponent from '@/components/ui/forms/addOrEditForm';
import OrderForm, { OrderActionState } from '@/components/ui/forms/orderForm';
import { useRouter } from 'next/navigation';

export type CustomerRow = Customer

export type OrderRow = CustomerOrder

export default function SalesPage() {
  
  const router = useRouter();

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


  const {
    data: orders,
    isLoading: isLoadingOrder,
    selectedEntity: selectedOrder,
    setSelectedEntity: setSelectedOrder,
    isEditing: isEditingOrder,
    setIsEditing: setIsEditingOrder,
    isModalOpen: isModalOpenOrder,
    setIsModalOpen: setIsModalOpenOrder,
    setInitialState: setInitialStateOrder,
    formAction: formActionOrder,
    isPending: isPendingOrder,
    handleOnDelete: handleOnDeleteOrder,
  } = useEntityManager<CustomerOrder>({
    route: "/api/orders",
    addAction: addCustomer,
    updateAction: updateCustomer,
    deleteAction: deleteCustomer,
    setComboBoxSelectedOption: () => {},
    comboBoxSelectedOption: null,
    entityName: "Order",
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

  const addNewOrder = (
    state: OrderActionState,
    formAction: (formData: FormData) => void | Promise<void>
  ) => {
    return AddOrEditEntityComponent(
      isEditingOrder ? "Editar Orden" : "Agregar Orden",
      <OrderForm
        formAction={formAction}
        state={state}
        customersData={customers?.map((c) => ({
          id: c.id,
          name: c.name
        }))}
        isPending={isPendingOrder}
        isEditing={isEditingOrder}
        setIsModalOpen={setIsModalOpenOrder}
        setIsEditing={setIsEditingOrder}
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
      <EntityListSection<CustomerRow>
        title="Ventas"
        addButtonText='Agregar nueva venta'
        isLoading={isLoadingOrder}
        data={orders ?? []}
        columns={[
          { header: "Número Orden", field: "id" },
          { header: "Cliente", field: "name" },
          { header: "Fecha", field: "phone" },
          { header: "Total", field: "email" },
          // { header: "Dirección", field: "address" },
        ]}
        currentPage={1}
        totalItems={orders?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(order) => {
          setSelectedOrder(order)
          setIsEditingOrder(true)
          setIsModalOpenOrder(true)
        }}
        onDelete={({ id }) => handleOnDeleteOrder(Number(id))}

        isModalOpen={isModalOpenOrder}
        setIsModalOpen={setIsModalOpenOrder}
        modalContent={addNewOrder(
          isEditingOrder
            ? (selectedOrder as any as OrderActionState)
            : ({} as any),
          formActionOrder
        )}
        redirectsOnAdd={true}
        callBackActionWhenModalOpen={() => {
          console.log(
            "reset selected order and initial state when modal opens"
          );
          setIsEditingOrder(false);
          setSelectedOrder(null);
          setInitialStateOrder({});
          router.push('./ventas/nueva')
        }}
      />
    </>
  );
}
