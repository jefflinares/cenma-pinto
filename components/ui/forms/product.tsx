import React from "react"
import GenericForm from "./GenericForm";
import { ComboBoxWithModalProps } from "../comboBox";
import type { CarouselFilterItem } from "../CarouselFilter";

export type ProductActionState = {
  id?: string | number;
  name?: string;
  success?: string;
  error?: string;
  [key: string]: any;
};

type ProductFormBaseProps = {
  state: ProductActionState;
  isEditing?: boolean;
};


type ProductProps = ProductFormBaseProps & ComboBoxWithModalProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  isPending: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
  classificationOptions: CarouselFilterItem[];
};

const Product = ({
  formAction,
  state,
  isPending,
  isEditing = false,
  setIsModalOpen,
  setIsEditing,
  data,
  classificationOptions,
  setComboBoxSelectedOption,
  selectedOption,
  modalChildren,
  onAddCallBackAction
}: ProductProps) => {
  console.log("🚀 ~ ProductOrContainer ~ state:", state)
  const productFields = [
    ...(isEditing
      ? [{ name: "id", label: "ID", hidden: true, defaultValue: state?.id }]
      : []),
    {
      name: "name",
      label: "Nombre del producto",
      required: true,
      placeholder: "Nombre del Producto",
      defaultValue: state?.name || "",
    },
    { 
      name: "container",
      label: "Envase",
      type: "combobox",
      required: true,
      placeholder: "Seleccione un envase",
      data,
      defaultValue: state?.container || "",
    },
    {
      name: "productClassification",
      label: "Clasificación",
      type: "carousel",
      data: classificationOptions,
      defaultValue: state?.productClassificationId ? [state.productClassificationId] : [],
      multiSelect: false,
      showIcon: true,
      showText: true,
    },
  ];
  return (
    <GenericForm
      fields={productFields}
      state={state}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Producto"
      editText="Actualizar Producto"
      selectedOption={selectedOption}
      setComboBoxSelectedOption={setComboBoxSelectedOption}
      modalChildren={modalChildren}
      onAddCallBackAction={onAddCallBackAction}
      data={data}
    />
  );
};

export default Product;
