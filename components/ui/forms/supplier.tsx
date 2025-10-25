import React from "react";
import GenericForm, { GenericFormState, GenericFormField } from "./GenericForm";
import { TruckActionState } from "./truck";

export type SupplierActionState = {
  id?: string | number;
  name: string;
  phone?: string;
  address?: string;
  trucks?: TruckActionState[];
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

const Supplier = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
}: SupplierProps) => {
  const supplierFields: GenericFormField[] = [
    ...(isEditing
      ? [{ name: "id", label: "ID", hidden: true, defaultValue: state?.id }]
      : []),
    {
      name: "name",
      label: "Nombre",
      required: true,
      placeholder: "Nombre Proveedor",
      defaultValue: state?.name || "",
    },
    {
      name: "phone",
      label: "Teléfono",
      required: true,
      type: "tel",
      placeholder: "Teléfono Proveedor",
      props: { pattern: "[0-9]{8}", maxLength: 8, inputMode: "numeric" },
      defaultValue: state?.phone || "",
    },
    {
      name: "address",
      label: "Dirección",
      placeholder: "Dirección Proveedor",
      defaultValue: state?.address || "",
    },
  ];
  console.log("🚀 ~ Supplier ~ supplierFields:", supplierFields, 'state: ', state, formAction)

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
