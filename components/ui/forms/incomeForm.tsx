import { ProductRow } from "@/app/(dashboard)/dashboard/productos/page";
import { ComboBoxWithModalProps, type Entity } from "../comboBox";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { IncomeDetailRow } from "@/app/(dashboard)/dashboard/proveedores/page";

export type IncomeActionState = {
  id?: string | number;
  date?: string | Date;
  formatedDate?: string;
  incomeDetails?: IncomeDetailRow[];
  providerId?: string | number;
  totalAmount?: number;
  error?: string;
  success?: string;
};

type IncomeProps = ComboBoxWithModalProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  productsData: Entity[] | undefined;
  providersData?: Entity[]  | undefined;
  state: IncomeActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
};

const IncomeForm = (props: IncomeProps) => {
  console.log("🚀 ~ IncomeForm ~ props:", props?.state);

  function formatDDMMYYYYtoYYYYMMDD(dateStr: string) {
    const [dd, mm, yyyy] = dateStr.split("/");
    if (dd && mm && yyyy) {
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  }
  const dynamicFields = {
    type: "row",
    name: "products",
    label: "productos",
    fields: props.productsData
      ? props.productsData
          .map((product) => [
            {
              name: `productId_${product.id}`,
              type: "hidden",
              defaultValue: product.id,
              hidden: true,
            },
            {
              name: `quantity_${product.id}`,
              type: "number",
              label: product.name,
              required: true,
              placeholder: "Cantidad",
              props: { min: 0 },
              defaultValue:
                props.state.incomeDetails?.find(
                  (income) => income.productId === product.id
                )?.quantity || 0,
            },
          ])
          .flat()
      : [],
    className: "gap-6",
  };

  const incomeFields: GenericFormField[] = [
      ...(props.isEditing
    ? [{
        name: "id",
        label: "ID",
        hidden: true,
        defaultValue: props.state?.id
      }]
    : []),
    {
      name: "date",
      label: "Fecha",
      type: "date",
      required: true,
      placeholder: "Fecha de Ingreso",
      defaultValue: props.state.formatedDate
        ? formatDDMMYYYYtoYYYYMMDD(props.state.formatedDate)
        : new Date().toISOString().split("T")[0],
    },
    {
      name: "providerId",
      label: "Proveedor",
      type: "combobox",
      data: props.providersData,
      required: true,
      placeholder: "Selecciona un proveedor",
      defaultValue: props.state.providerId,
    },
    dynamicFields,
  ];
  console.log("🚀 ~ IncomeForm ~ incomeFields:", incomeFields);
  return (
    <GenericForm
      fields={incomeFields}
      state={props.state as GenericFormState}
      isPending={props.isPending}
      isEditing={props.isEditing}
      formAction={props.formAction}
      onCancel={() => {
        props.setIsModalOpen(false);
        props.setIsEditing(false);
      }}
      submitText="Registrar Ingreso"
      editText="Actualizar Ingreso"
      data={props.data}
      selectedOption={props.selectedOption}
      setComboBoxSelectedOption={props.setComboBoxSelectedOption}
      modalChildren={props.modalChildren}
      onAddCallBackAction={props.onAddCallBackAction}
    />
  );
};

export default IncomeForm;
