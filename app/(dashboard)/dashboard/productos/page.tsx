"use client";
import { useActionState, useEffect, useState } from "react";
import ProductOrContainerForm, {
  ProductActionState,
} from "@/components/ui/forms/product";
import useSWR, { mutate } from "swr";
import {
  addContainer,
  addProduct,
  deleteContainer,
  deleteProduct,
  updateContainer,
  updateProduct,
} from "./actions";
import { Container, Product } from "@/lib/db/schema";
import { useToast } from "@/components/ui/toast";
import { EntityListSection } from "@/components/ui/EntityListSection";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import ContainerForm, {
  ContainerActionState,
} from "@/components/ui/forms/containerForm";

export type ProductRow = Product & { containerId?: string | number };
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductsPage() {
  const {
    data: products,
    error,
    isLoading,
  } = useSWR<ProductRow[]>("/api/product", fetcher);

  const {
    data: containers,
    error: errorContainers,
    isLoading: isLoadingContainers,
  } = useSWR<Container[]>("/api/container", fetcher);

  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null
  );
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isContainerEditing, setIsContainerEditing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [comboBoxSelectedOption, setComboBoxSelectedOption] = useState<{
    id: string | number;
    name: string;
  } | null>(null);
  // Cambia la función de acción según el modo
  const defaultProductActionFn: (state: ProductActionState, payload: FormData) => ProductActionState | Promise<ProductActionState> = async (state, payload) => state;
  const [actionFn, setActionFn] =
    useState<(state: ProductActionState, payload: FormData) => ProductActionState | Promise<ProductActionState>>(defaultProductActionFn);

  useEffect(() => {
    if (isEditing) {
      setActionFn(() => updateProduct);
    } else {
      setActionFn(() => addProduct);
    }
  }, [isEditing]);
  const defaultContainerActionFn: (state: ContainerActionState, payload: FormData) => ContainerActionState | Promise<ContainerActionState> = async (state, payload) => state;
  const [actionFnContainer, setActionFnContainer] =
    useState<(state: ContainerActionState, payload: FormData) => ContainerActionState | Promise<ContainerActionState>>(defaultContainerActionFn);
    useState<(prevState: any, formData: FormData) => Promise<any>>();

  useEffect(() => {
    if (isContainerEditing) {
      setActionFnContainer(() => updateContainer);
    } else {
      setActionFnContainer(() => addContainer);
    }
  }, [isContainerEditing]);

  const [initialState, setInitialState] = useState({});
  const [containerInitialState, setContainerInitialState] = useState({});
  useEffect(() => {
    if (isEditing) {
      const initialState =
        isEditing && selectedProduct
          ? { id: selectedProduct.id, name: selectedProduct.name }
          : {};
      setInitialState(initialState);
    } else {
      setInitialState({});
    }
  }, [isEditing, selectedProduct]);

  useEffect(() => {
    if (isContainerEditing) {
      const initialState =
        isContainerEditing && selectedContainer
          ? {
              ...selectedContainer,
            }
          : {};
      setContainerInitialState(initialState);
    } else {
      setContainerInitialState({});
    }
  }, [isContainerEditing, selectedContainer]);

  const [state, formAction, isPending] = useActionState<
    ProductActionState,
    FormData
  >(actionFn, initialState);

  const [stateContainer, formActionContainer, isPendingContainer] =
    useActionState<ContainerActionState, FormData>(
      actionFnContainer,
      containerInitialState
    );

  const { addToast } = useToast();

  // Al finalizar la acción:
  useEffect(() => {
    if (state?.success) {
      mutate("/api/product"); // Refresca productos con SWR
      setIsModalOpen(false);
      addToast(
        isEditing ? "Producto actualizado" : "Producto agregado",
        "success"
      );
      setSelectedProduct(null);
      setIsEditing(false);
      setComboBoxSelectedOption(null);
      setInitialState({});
    }
  }, [state]);

  useEffect(() => {
    if (stateContainer?.success) {
      console.log("container actualizad o agregado ", stateContainer);
      mutate("/api/container"); // Refresca contenedores con SWR
      addToast(
        isContainerEditing ? "Contenedor actualizado" : "Contenedor agregado",
        "success"
      );
      setIsContainerModalOpen(false);
      setIsContainerEditing(false);
      setContainerInitialState({})
    }
  }, [stateContainer]);
  console.log("🚀 ~ ProductsPage ~ initialState:", initialState);

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

  const handleOnDelete = async (id: number, isProduct: boolean) => {
    try {
      const formData = new FormData();
      formData.append("id", String(id));
      if (isProduct) {
        const response = await deleteProduct({ id }, formData);
        console.log("🚀 ~ handleOnDelete ~ response:", response);
        if (response.error) {
          addToast(response.error, "error", 5000);
          return;
        }
        addToast("Producto eliminado", "success");
        mutate("/api/product");
      } else {
        const response = await deleteContainer({ id }, formData);

        console.log("🚀 ~ handleOnDelete ~ response:", response);
        if (response.error) {
          addToast(response.error, "error", 5000);
          return;
        }
        addToast("Contenedor eliminado", "success");
        mutate("/api/container");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
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
        onDelete={({ id }) => handleOnDelete(Number(id), false)}
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
            id: product.container ?? -1,
            name:
              containers?.find((c) => c.id === product.containerId)?.name || "",
          });
          setIsModalOpen(true);
          console.log("product", product);
        }}
        onDelete={({ id }) => handleOnDelete(Number(id), true)}
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
