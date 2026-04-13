import { ComboBoxWithModalProps } from "../comboBox";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { formatDDMMYYYYtoYYYYMMDD } from "@/lib/utils";

export type PaymentActionState = {
  id?: string | number;
  settlementId?: string | number;
  amount?: number;
  date?: string | Date;
  formattedDate?: string;
  remainingQuote?: string;
  paymentType?: "cash" | "transfer" | "card" | "check" | string;
  reference?: string;
  error?: string;
  success?: string;
};

type PaymentProps = Omit<ComboBoxWithModalProps, "data"> & {
  formAction: (formData: FormData) => void | Promise<void>;
  state: PaymentActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
};

const PaymentForm = (props: PaymentProps) => {

    const paymentTypeOptions = [
      { id: "cash", name: "Efectivo" },
      { id: "transfer", name: "Transferencia" },
      { id: "card", name: "Tarjeta" },
      { id: "check", name: "Cheque" },
    ];
  console.log("🚀 ~ PaymentForm ~ props.state:", props.state);
  const paymentFields: GenericFormField[] = [
    // always send settlementId as hidden — pre-filled by parent
    {
      name: "settlementId",
      label: "Liquidación",
      hidden: true,
      defaultValue: props.state.settlementId,
    },
    ...(props.isEditing
      ? [
          {
            name: "id",
            label: "ID",
            hidden: true,
            defaultValue: props.state?.id,
          } as GenericFormField,
        ]
      : []),
    {
      name: "remainingQuote",
      label: "Saldo pendiente",
      type: "text",
      defaultValue: props.state.remainingQuote ?? "Q0.00",
      props: { readOnly: true },
    },
    {
      name: "date",
      label: "Fecha de pago",
      type: "date",
      required: true,
      placeholder: "Fecha de pago",
      defaultValue: props.state.formattedDate
        ? formatDDMMYYYYtoYYYYMMDD(props.state.formattedDate)
        : new Date().toISOString().split("T")[0],
    },
    {
      name: "amount",
      label: "Monto",
      type: "number",
      required: true,
      placeholder: "0.00",
      props: { min: 0, step: "0.01" },
      defaultValue: props.state.amount ?? 0,
    },
    {
      name: "paymentType",
      label: "Tipo de pago",
      type: "combobox",
      required: true,
      data: paymentTypeOptions,
      defaultValue:
        paymentTypeOptions.find(
          (paymentOption) => paymentOption.id === props.state.paymentType
        )?.id ?? "",
    },
    {
      name: "reference",
      label: "Referencia",
      type: "text",
      placeholder: "No. boleta / transacción / cheque",
      defaultValue: props.state.reference ?? "",
    },
  ];

  return (
    <GenericForm
      fields={paymentFields}
      state={props.state as GenericFormState}
      isPending={props.isPending}
      isEditing={props.isEditing}
      formAction={props.formAction}
      onCancel={() => {
        props.setIsModalOpen(false);
        props.setIsEditing(false);
        props.setComboBoxSelectedOption?.(null);
      }}
      submitText="Registrar Pago"
      editText="Actualizar Pago"
      data={[]}
      selectedOption={props.selectedOption}
      setComboBoxSelectedOption={props.setComboBoxSelectedOption}
      modalChildren={props.modalChildren}
      onAddCallBackAction={props.onAddCallBackAction}
    />
  );
};

export default PaymentForm;