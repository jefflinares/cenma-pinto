"use client";
import { useState, useMemo } from "react";
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
  addProductClassification,
  updateProductClassification,
  deleteProductClassification,
} from "./actions";
import { Container, Product, ProductClassification } from "@/lib/db/schema";
import { EntityListSection } from "@/components/ui/EntityListSection";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import ContainerForm, {
  ContainerActionState,
} from "@/components/ui/forms/containerForm";
import ProductClassificationForm, {
  ProductClassificationActionState,
} from "@/components/ui/forms/productClassificationForm";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { Entity } from "@/components/ui/comboBox";
import { getIcon } from "@/lib/icons/classificationIcons";

export type ProductRow = Product & {
  containerId?: string | number;
  productClassification?: string;
  productClassificationId?: string | number;
  svgIcon?: string;
};

type ProductWithClassifications = {
  products: ProductRow[];
  productClassifications: ProductClassification[];
};

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
    currentPage: currentProductPage,
    setCurrentPage: setCurrentProductPage,
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
    currentPage: containerPage,
    setCurrentPage: setContainerPage,
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
    entityName: "Envase",
  });

  const {
    data: productClassifications,
    error: errorProductClassifications,
    currentPage: classificationPage,
    setCurrentPage: setClassificationPage,
    isLoading: isLoadingProductClassifications,
    selectedEntity: selectedProductClassification,
    setSelectedEntity: setSelectedProductClassification,
    isEditing: isProductClassificationEditing,
    setIsEditing: setIsProductClassificationEditing,
    isModalOpen: isProductClassificationModalOpen,
    setIsModalOpen: setIsProductClassificationModalOpen,
    initialState: productClassificationInitialState,
    setInitialState: setProductClassificationInitialState,
    formAction: formActionProductClassification,
    state: stateProductClassification,
    isPending: isPendingProductClassification,
    handleOnDelete: handleOnDeleteProductClassification,
  } = useEntityManager<ProductClassification>({
    route: "/api/productClassification",
    addAction: addProductClassification,
    updateAction: updateProductClassification,
    deleteAction: deleteProductClassification,
    setComboBoxSelectedOption,
    comboBoxSelectedOption,
    entityName: "Clasificación",
  });

  // Map productClassifications with their icons
  const productClassificationsWithIcons = useMemo(
    () =>
      productClassifications?.map((pc) => ({
        id: pc.id,
        name: pc.name,
        icon: getIcon(pc.svgIcon ?? undefined),
      })) ?? [],
    [productClassifications],
  );

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
        classificationOptions={productClassificationsWithIcons}
        modalChildren={addNewContainerComponent(stateContainer)}
        onAddCallBackAction={() => {
          // Aquí puedes manejar la acción de agregar un nuevo proveedor
          console.log(
            "callback para cerrar el formulario del producto y permitir que se abra el de envases",
          );
          setIsModalOpen(false);
          setIsContainerModalOpen(true);
        }}
      />,
    );
  };

  const addNewContainerComponent = (state: ProductActionState) => {
    return AddOrEditEntityComponent(
      isContainerEditing ? "Editar Envase" : "Agregar Envase",
      <ContainerForm
        formAction={formActionContainer}
        state={state}
        isPending={isPendingContainer}
        isEditing={isContainerEditing}
        setIsEditing={setIsContainerEditing}
        setIsModalOpen={setIsContainerModalOpen}
      />,
    );
  };

  const addNewProductClassificationComponent = (
    state: ProductClassificationActionState,
  ) => {
    return AddOrEditEntityComponent(
      isProductClassificationEditing
        ? "Editar Clasificación"
        : "Agregar Clasificación",
      <ProductClassificationForm
        formAction={formActionProductClassification}
        state={state}
        isPending={isPendingProductClassification}
        isEditing={isProductClassificationEditing}
        setIsEditing={setIsProductClassificationEditing}
        setIsModalOpen={setIsProductClassificationModalOpen}
      />,
    );
  };

  return (
    <>
      <EntityListSection<Container>
        title="Envases"
        addButtonText="Agregar nuevo Envase"
        isLoading={isLoadingContainers}
        data={containers ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          // { header: "Capacidad", field: "capacity" },
          // { header: "Unidad", field: "unit" },
          { header: "Precio por Envase", field: "unitPrice" },
        ]}
        currentPage={containerPage}
        totalItems={containers?.length || 0}
        pageSize={10}
        onPageChange={setContainerPage}
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
            : {},
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
      <EntityListSection<ProductClassification>
        title="Clasificaciones de Productos"
        addButtonText="Agregar nueva Clasificación"
        isLoading={isLoadingProductClassifications}
        data={productClassifications ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          {
            header: "Icono",
            field: "svgIcon",
            render: (value) => getIcon(value as string),
          },
        ]}
        currentPage={classificationPage}
        totalItems={productClassifications?.length || 0}
        pageSize={10}
        onPageChange={setClassificationPage}
        onEdit={(classification) => {
          setSelectedProductClassification(classification);
          setIsProductClassificationEditing(true);
          setIsProductClassificationModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDeleteProductClassification(Number(id))}
        isModalOpen={isProductClassificationModalOpen}
        setIsModalOpen={setIsProductClassificationModalOpen}
        modalContent={addNewProductClassificationComponent(
          isProductClassificationEditing
            ? (selectedProductClassification as any as ProductClassificationActionState)
            : {},
        )}
        callBackActionWhenModalOpen={() => {
          setSelectedProductClassification(null);
          setIsProductClassificationEditing(false);
          setProductClassificationInitialState({
            id: null,
            name: "",
            svgIcon: "",
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
          { header: "Envase", field: "container" },
          {
            header: "Clasificación",
            field: "svgIcon",
            render: (value) => getIcon(value as string),
          },
        ]}
        currentPage={currentProductPage}
        totalItems={products?.length || 0}
        pageSize={10}
        onPageChange={setCurrentProductPage}
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
          isEditing ? (selectedProduct as any as ProductActionState) : {},
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
