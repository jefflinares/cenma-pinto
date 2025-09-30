import React from "react";
import GenericForm, { GenericFormState, GenericFormField } from "./GenericForm";

export type SupplierActionState = {
  id?: string | number;
  name: string;
  phone?: string;
  address?: string;
  error?: string;
  success?: string;
};

type SupplierProps = {
  formAction: (formData: FormData) => void | Promise<void>;
  state: SupplierActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
};

const supplierFields: GenericFormField[] = [
  { name: "id", label: "ID", hidden: true },
  {
    name: "name",
    label: "Nombre",
    required: true,
    placeholder: "Nombre Proveedor",
  },
  {
    name: "phone",
    label: "Teléfono",
    required: true,
    type: "tel",
    placeholder: "Teléfono Proveedor",
    props: { pattern: "[0-9]{8}", maxLength: 8, inputMode: "numeric" },
  },
  { name: "address", label: "Dirección", placeholder: "Dirección Proveedor" },
];

const Supplier = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
}: SupplierProps) => {
  return (
    <GenericForm
      fields={supplierFields}
      state={state as GenericFormState}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Proveedor"
      editText="Actualizar Proveedor"
    />
  );
};

export default Supplier;
