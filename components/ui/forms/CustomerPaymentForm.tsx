import { useState } from "react";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { Entity } from "@/components/ui/comboBox";
import { formatDDMMYYYYtoYYYYMMDD } from "@/lib/utils";

export type CustomerPaymentActionState = {
  id?: string | number;
  orderId?: string | number;
  customerId?: string | number;
  amount?: number | string;
  date?: string | Date;
  formattedDate?: string;
  paymentType?: string;
  reference?: string;
  error?: string;
  success?: string;
};

type CustomerPaymentFormProps = {
  formAction: (formData: FormData) => void | Promise<void>;
  state: CustomerPaymentActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  orderId: number;
  customerId: number;
  remainingAmount: string;
};

const paymentTypeOptions = [
  { id: "cash", name: "Efectivo" },
  { id: "transfer", name: "Transferencia" },
  { id: "card", name: "Tarjeta" },
  { id: "check", name: "Cheque" },
];

const CustomerPaymentForm = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
  orderId,
  customerId,
  remainingAmount,
}: CustomerPaymentFormProps) => {
  const [selectedPaymentType, setSelectedPaymentType] = useState<Entity | null>(
    paymentTypeOptions.find((opt) => opt.id === state.paymentType) ?? null,
  );

  const fields: GenericFormField[] = [
    { name: "orderId", label: "Venta", hidden: true, defaultValue: orderId },
    { name: "customerId", label: "Cliente", hidden: true, defaultValue: customerId },
    ...(isEditing
      ? [{ name: "id", label: "ID", hidden: true, defaultValue: state?.id } as GenericFormField]
      : []),
    {
      name: "remainingQuote",
      label: "Saldo pendiente",
      type: "text",
      defaultValue: remainingAmount,
      props: { readOnly: true },
    },
    {
      name: "date",
      label: "Fecha de pago",
      type: "date",
      required: true,
      defaultValue: state.formattedDate
        ? formatDDMMYYYYtoYYYYMMDD(state.formattedDate)
        : new Date().toISOString().split("T")[0],
    },
    {
      name: "amount",
      label: "Monto",
      type: "number",
      required: true,
      placeholder: "0.00",
      props: { min: 0, step: "0.01" },
      defaultValue: state.amount ?? 0,
    },
    {
      name: "paymentType",
      label: "Tipo de pago",
      type: "combobox",
      required: true,
      data: paymentTypeOptions,
      defaultValue:
        paymentTypeOptions.find((opt) => opt.id === state.paymentType)?.id ?? "",
    },
    {
      name: "reference",
      label: "Referencia",
      type: "text",
      placeholder: "No. boleta / transacción / cheque",
      defaultValue: state.reference ?? "",
    },
  ];

  // Ensure paymentType is always injected from local state,
  // since the hidden input value may not propagate reliably.
  const wrappedFormAction = async (formData: FormData) => {
    if (selectedPaymentType?.id) {
      formData.set("paymentType", String(selectedPaymentType.id));
    }
    await formAction(formData);
  };

  return (
    <GenericForm
      fields={fields}
      state={state as GenericFormState}
      isPending={isPending}
      isEditing={isEditing}
      formAction={wrappedFormAction}
      onCancel={() => {
        setIsModalOpen(false);
        setIsEditing(false);
      }}
      submitText="Registrar Pago"
      editText="Actualizar Pago"
      data={[]}
      selectedOption={selectedPaymentType}
      setComboBoxSelectedOption={setSelectedPaymentType}
      modalChildren={<></>}
      onAddCallBackAction={() => {}}
    />
  );
};

export default CustomerPaymentForm;
