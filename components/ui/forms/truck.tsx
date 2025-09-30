import React from "react";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { ComboBoxWithModalProps } from "../comboBox";

export type TruckActionState = {
  id?: string;
  plate?: string;
  ownerId?: string;
  error?: string;
  success?: string;
};

type TruckProps = ComboBoxWithModalProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  state: TruckActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
};

const truckFields: GenericFormField[] = [
  { name: "id", label: "ID", hidden: true },
  { name: "plate", label: "Placa", required: true, placeholder: "Placa Camión" },
  {
    name: "ownerId",
    label: "Propietario",
    type: "combobox",
    data: undefined, // will be set via props
    required: true,
    placeholder: "Selecciona un propietario",
  },
];

const Truck = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
  data,
  selectedOption,
  setComboBoxSelectedOption,
  modalChildren,
  onAddCallBackAction,
}: TruckProps) => {
  // Set ownerData for the combobox field
  const fields = truckFields.map((field) =>
    field.name === "ownerId" ? { ...field, data } : field
  );

  return (
    <GenericForm
      fields={fields}
      state={state as GenericFormState}
      isPending={isPending}
      isEditing={isEditing}
      formAction={formAction}
      onCancel={() => {
        setIsModalOpen(false);
        isEditing && setIsEditing(false);
      }}
      submitText="Registrar Camión"
      editText="Actualizar Camión"
      // ComboBox props
      data={data}
      selectedOption={selectedOption}
      setComboBoxSelectedOption={setComboBoxSelectedOption}
      modalChildren={modalChildren}
      onAddCallBackAction={onAddCallBackAction}
    />
  );
};

export default Truck;
