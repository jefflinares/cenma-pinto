"use client";
import { useState } from "react";
import ProductOrContainerForm, {
  ProductActionState,
} from "@/components/ui/forms/product";
import {
  addContainer,
  addProduct,
  deleteContainer,
  deleteProduct,
  updateContainer,
  updateProduct,
} from "./actions";
import { Container, Product } from "@/lib/db/schema";
import { EntityListSection } from "@/components/ui/EntityListSection";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import ContainerForm, {
  ContainerActionState,
} from "@/components/ui/forms/containerForm";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { Entity } from "@/components/ui/comboBox";

export type ProductRow = Product & { containerId?: string | number };

export default function ProductsPage() {
  const [comboBoxSelectedOption, setComboBoxSelectedOption] =
    useState<Entity | null>(null);
  const {
    data: products,
    error,
    isLoading,
    selectedEntity: selectedProduct,
    setSelectedEntity: setSelectedProduct,
    isEditing,
    setIsEditing,
    isModalOpen,
    setIsModalOpen,
    initialState,
    setInitialState,
    formAction,
    isPending,
    handleOnDelete: handleOnDeleteProduct,
  } = useEntityManager<ProductRow>({
    route: "/api/product",
    addAction: addProduct,
    updateAction: updateProduct,
    deleteAction: deleteProduct,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Producto",
  });

  const {
    data: containers,
    error: errorContainers,
    isLoading: isLoadingContainers,
    selectedEntity: selectedContainer,
    setSelectedEntity: setSelectedContainer,
    isEditing: isContainerEditing,
    setIsEditing: setIsContainerEditing,
    isModalOpen: isContainerModalOpen,
    setIsModalOpen: setIsContainerModalOpen,
    initialState: containerInitialState,
    setInitialState: setContainerInitialState,
    formAction: formActionContainer,
    state: stateContainer,
    isPending: isPendingContainer,
    handleOnDelete: handleOnDeleteContainer,
  } = useEntityManager<Container>({
    route: "/api/container",
    addAction: addContainer,
    updateAction: updateContainer,
    deleteAction: deleteContainer,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Contenedor",
  });

  const addNewProductComponent = (state: ProductActionState) => {
    return AddOrEditEntityComponent(
      isEditing ? "Editar Producto" : "Agregar Producto",
      <ProductOrContainerForm
        formAction={formAction}
        state={state}
        selectedOption={comboBoxSelectedOption}
        setComboBoxSelectedOption={setComboBoxSelectedOption}
        isPending={isPending}
        isEditing={isEditing}
        setIsModalOpen={setIsModalOpen}
        setIsEditing={setIsEditing}
        data={
          containers ? containers.map((c) => ({ id: c.id, name: c.name })) : []
        }
        modalChildren={addNewContainerComponent(stateContainer)}
        onAddCallBackAction={() => {
          // Aquí puedes manejar la acción de agregar un nuevo proveedor
          console.log(
            "callback para cerrar el formulario del producto y permitir que se abra el de contenedores"
          );
          setIsModalOpen(false);
          setIsContainerModalOpen(true);
        }}
      />
    );
  };

  const addNewContainerComponent = (state: ProductActionState) => {
    return AddOrEditEntityComponent(
      isContainerEditing ? "Editar Contenedor" : "Agregar Contenedor",
      <ContainerForm
        formAction={formActionContainer}
        state={state}
        isPending={isPendingContainer}
        isEditing={isContainerEditing}
        setIsEditing={setIsContainerEditing}
        setIsModalOpen={setIsContainerModalOpen}
      />
    );
  };

  return (
    <>
      <EntityListSection<Container>
        title="Contenedores"
        addButtonText="Agregar nuevo Contenedor"
        isLoading={isLoadingContainers}
        data={containers ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          { header: "Capacidad", field: "capacity" },
          { header: "Unidad", field: "unit" },
        ]}
        currentPage={1}
        totalItems={containers?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(container) => {
          setSelectedContainer(container);
          setIsContainerEditing(true);
          setIsContainerModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDeleteContainer(Number(id))}
        isModalOpen={isContainerModalOpen}
        setIsModalOpen={setIsContainerModalOpen}
        modalContent={addNewContainerComponent(
          isContainerEditing
            ? (selectedContainer as any as ContainerActionState)
            : {}
        )}
        callBackActionWhenModalOpen={() => {
          setSelectedContainer(null);
          setIsContainerEditing(false);
          setContainerInitialState({
            id: null,
            name: "",
            capacity: "",
            unit: "",
          });
        }}
      />
      <EntityListSection<ProductRow>
        title="Productos"
        addButtonText="Agregar nuevo Producto"
        isLoading={isLoading}
        data={products ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          { header: "Contenedor", field: "container" },
        ]}
        currentPage={1}
        totalItems={products?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(product) => {
          setSelectedProduct(product);
          setIsEditing(true);
          setComboBoxSelectedOption({
            id: product.containerId ?? -1,
            name:
              containers?.find((c) => c.id === product.containerId)?.name || "",
          });
          setIsModalOpen(true);
          console.log("product", product);
        }}
        onDelete={({ id }) => handleOnDeleteProduct(Number(id))}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={addNewProductComponent(
          isEditing ? (selectedProduct as any as ProductActionState) : {}
        )}
        callBackActionWhenModalOpen={() => {
          setComboBoxSelectedOption(null); // Clear the selected option
          setSelectedProduct(null); // Clear the selected product
          setInitialState({}); // Reset the initial state
          setIsEditing(false); // Set editing to false
        }}
      />
    </>
  );
}
