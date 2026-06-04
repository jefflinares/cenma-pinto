import React from "react";
import GenericForm from "./GenericForm";
import { iconMap, getIcon } from "@/lib/icons/classificationIcons";

export type ProductClassificationActionState = {
  id?: string | number;
  name?: string;
  svgIcon?: string;
  loading?: boolean;
  success?: string;
  error?: string;
  [key: string]: any;
};

type ProductClassificationFormBaseProps = {
  state: ProductClassificationActionState;
  isEditing?: boolean;
};

type ProductClassificationFormProps = ProductClassificationFormBaseProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  isPending: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
};

const ProductClassificationForm = ({
  formAction,
  state,
  isPending,
  isEditing = false,
  setIsModalOpen,
  setIsEditing
}: ProductClassificationFormProps) => {
  console.log("🚀 ~ productClassificationForm ~ state:", state)
  
  // Create carousel items from iconMap with icons
  const iconCarouselItems = Object.keys(iconMap).map((iconName) => ({
    id: iconName,
    name: iconName.charAt(0).toUpperCase() + iconName.slice(1),
    icon: getIcon(iconName),
  }));

  const productClassificationFields = [
    ...(isEditing
      ? [{ name: "id", label: "ID", hidden: true, defaultValue: state?.id }]
      : []),
    {
      name: "name",
      label: "Nombre de la Clasificación",
      required: true,
      placeholder: "Nombre de la Clasificación",
      defaultValue: state?.name || "",
    },
    {
      name: "svgIcon",
      label: "Selecciona un Icono",
      type: "carousel",
      defaultValue: state?.svgIcon ? [state.svgIcon] : [],
      data: iconCarouselItems,
      multiSelect: false,
      showIcon: true,
      showText: true,
    },
  ];


  return (
    <GenericForm
      fields={productClassificationFields}
      state={state}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Clasificación"
      editText="Actualizar Clasificación"
      data={[]}
    />
  );
};

export default ProductClassificationForm;
