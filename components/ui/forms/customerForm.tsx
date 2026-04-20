import React from "react";
import GenericForm, { GenericFormState, GenericFormField } from "./GenericForm";
import { TruckActionState } from "./truck";

export type CustomerActionState = {
  id?: string | number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  error?: string;
  success?: string;
};

type CustomerProps = {
  formAction: (formData: FormData) => void | Promise<void>;
  state: CustomerActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
};

const CustomerForm = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
}: CustomerProps) => {
  const customerFields: GenericFormField[] = [
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
      name: "email",
      label: "Email",
      required: false,
      type: "email",
      placeholder: "Email Proveedor",
      props: { pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" },
      defaultValue: state?.email || "",
    },
    {
      name: "address",
      label: "Dirección",
      placeholder: "Dirección Proveedor",
      defaultValue: state?.address || "",
    },
  ];
  console.log("🚀 ~ Customer ~ customerFields:", customerFields, 'state: ', state, formAction)

  return (
    <GenericForm
      fields={customerFields}
      state={state as GenericFormState}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Cliente"
      editText="Actualizar Cliente"
      data={[]}
    />
  );
};

export default CustomerForm;
