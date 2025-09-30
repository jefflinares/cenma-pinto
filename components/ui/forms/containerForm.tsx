import React from "react";
import GenericForm from "./GenericForm";

export type ContainerActionState = {
  id?: string | number;
  name?: string;
  capacity?: number;
  unit?: string;
  loading?: boolean;
  success?: string;
  error?: string;
  [key: string]: any;
};

type ContainerFormBaseProps = {
  state: ContainerActionState;
  isEditing?: boolean;
};

type ContainerProps = ContainerFormBaseProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  isPending: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
};

const ContainerForm = ({
  formAction,
  state,
  isPending,
  isEditing = false,
  setIsModalOpen,
  setIsEditing
}: ContainerProps) => {
  console.log("🚀 ~ containerForm ~ state:", state)
  const containerFields = [
    { name: "id", label: "ID", hidden: true },
    {
      name: "name",
      label: "Nombre del contenedor",
      required: true,
      placeholder: "Nombre del Contenedor",
    },
    {
      name: "capacity",
      label: "Capacidad",
      required: true,
      placeholder: "Capacidad del Contenedor",
      type: "number",
      min: 0,
    },
    {
      name: "unit",
      label: "Unidad",
      required: true,
      placeholder: "Unidad de Medida",
    },
  ];
  return (
    <GenericForm
      fields={containerFields}
      state={state}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Contenedor"
      editText="Actualizar Contenedor"
    />
  );
};

export default ContainerForm;
