import React from "react"
import GenericForm from "./GenericForm";
import { ComboBoxWithModalProps } from "../comboBox";

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
};

const Product = ({
  formAction,
  state,
  isPending,
  isEditing = false,
  setIsModalOpen,
  setIsEditing,
  data,
  setComboBoxSelectedOption,
  selectedOption,
  modalChildren,
  onAddCallBackAction
}: ProductProps) => {
  console.log("🚀 ~ ProductOrContainer ~ state:", state)
  const productFields = [
    { name: "id", label: "ID", hidden: true },
    {
      name: "name",
      label: "Nombre del producto",
      required: true,
      placeholder: "Nombre del Producto",
    },
    { 
      name: "container",
      label: "Contenedor",
      type: "combobox",
      required: true,
      placeholder: "Seleccione un contenedor",
      data,
    }
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
    />
  );
};

export default Product;
