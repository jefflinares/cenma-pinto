import React, { Suspense } from "react";
import { CustomerOrderDetail } from "@/lib/db/schema";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { ComboBoxWithModal, ComboBoxWithModalProps, Entity } from "../comboBox";
import { formatDDMMYYYYtoYYYYMMDD } from "@/lib/utils";
import { Label } from "../label";
import { IncomeRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import OrderItemsTable from "./OrderItemsTable";

export type OrderDetail = CustomerOrderDetail & { customerName?: string };

export type OrderActionState = {
  id?: number;
  customerId?: number;
  formatedDate?: string;
  orderDetails?: OrderDetail[];
  totalAmount?: number;
  error?: string;
  success?: string;
};

type OrderProps = ComboBoxWithModalProps & {
  formAction: (formData: FormData) => void | Promise<void>;
  customersData: Entity[] | undefined;
  incomes: IncomeRow[] | undefined;
  productsData: Entity[] | undefined;
  state: OrderActionState;
  isLoading: boolean;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
};

const OrderForm = ({ isLoading, ...props }: OrderProps) => {
  const dynamicFields = props.incomes?.map((income) => ({
    type: "row",
    name: "products",
    label: "productos",
    fields: [],
  }));
  const orderFields: GenericFormField[] = [
    ...(props.isEditing
      ? [
          {
            name: "id",
            label: "ID",
            hidden: true,
            defaultValue: props.state?.id,
          },
        ]
      : []),
    {
      name: "date",
      label: "Fecha",
      type: "date",
      required: true,
      placeholder: "Fecha de Ingreso",
      defaultValue: props.state?.formatedDate
        ? formatDDMMYYYYtoYYYYMMDD(props.state.formatedDate)
        : new Date().toISOString().split("T")[0],
    },
    {
      name: "customerId",
      label: "Cliente",
      type: "combobox",
      data: props.customersData,
      required: true,
      placeholder: "Selecciona un cliente",
      defaultValue: props.state?.customerId,
    },
  ];

  console.log("🚀 ~ OrderForm ~ props.customersData:", props.customersData);
  return (
    <form className="space-y-4" action={props.formAction}>
      <Label htmlFor="customerId">{"Seleccione un cliente"}</Label>
      {isLoading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <ComboBoxWithModal
            selectedOption={props.selectedOption}
            setComboBoxSelectedOption={props.setComboBoxSelectedOption}
            data={props.customersData ?? []}
            onAddCallBackAction={props.onAddCallBackAction}
          />
        </>
      )}
      {props.incomes?.map((income) => (
        <div key={income.id} className="space-y-4">
          <Label htmlFor={`income_${income.id}`}>{ "Proveedor: " + income.providerName + " Fecha: " + income.formatedDate}</Label>
          <OrderItemsTable
            rows={income.incomeDetails}
            onChange={(rows) => {
              console.log("rows: ", rows);
            }}
          />
        </div>
      ))}
    </form>
  );
};

export default OrderForm;
