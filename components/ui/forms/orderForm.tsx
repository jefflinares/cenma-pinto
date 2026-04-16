import React, { Suspense } from "react";
import { CustomerOrderDetail } from "@/lib/db/schema";
import GenericForm, { GenericFormField, GenericFormState } from "./GenericForm";
import { ComboBoxWithModal, ComboBoxWithModalProps, Entity } from "../comboBox";
import { formatDDMMYYYYtoYYYYMMDD } from "@/lib/utils";
import { Label } from "../label";
import {
  IncomeDetailRow,
  IncomeRow,
} from "@/app/(dashboard)/dashboard/proveedores/page";
import OrderItemsTable from "./OrderItemsTable";

export type OrderDetail = CustomerOrderDetail & { customerName?: string };

export type OrderActionState = {
  id?: number;
  customerId?: number;
  formattedDate?: string;
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

const OrderForm = ({
  isLoading,
  selectedOption,
  setComboBoxSelectedOption,
  ...props
}: OrderProps) => {
  console.log("🚀 ~ OrderForm ~ selectedOption:", selectedOption);
  const [updatedOrderRows, setUpdatedOrderRows] = React.useState<
    IncomeDetailRow[]
  >([]);
  console.log("🚀 ~ OrderForm ~ updatedOrderRows:", updatedOrderRows);

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // build FormData from the form (includes normal fields)
    const fd = new FormData(formRef.current ?? undefined);

    // ensure customerId is included (from combobox selectedOption or form input)
    //debugger;
    fd.set('date', String(new Date().toISOString().split("T")[0]))
    const customerId =
      selectedOption?.id ??
      (fd.get("customerId") as string | null) ??
      props.state?.customerId;
    if (customerId != null) fd.set("customerId", String(customerId));

    // include updated order rows as JSON
    fd.set("orderDetails", JSON.stringify(updatedOrderRows));

    // call the server action (expects FormData)
    await props.formAction(fd);
  };

  return (
    <form
      className="space-y-4 px-4 sm:px-6 lg:px-0 pb-24"
      ref={formRef}
      action={props.formAction}
      onSubmit={handleSubmit}
    >
      <br />
      <Label>{"Registrar Venta"}</Label>
      <br />
      <Label htmlFor="customerId">{"Seleccione un cliente"}</Label>
      {isLoading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <ComboBoxWithModal
            name="customerId"
            selectedOption={selectedOption}
            setComboBoxSelectedOption={setComboBoxSelectedOption}
            data={props.customersData ?? []}
            onAddCallBackAction={props.onAddCallBackAction}
          />
        </>
      )}
      {props.incomes?.map((income) => {
        if (income?.incomeDetails?.length === 0) return null;
        return (
          <div key={income.id} className="space-y-4">
            <Label htmlFor={`income_${income.id}`}>
              {"Proveedor: " +
                income.providerName +
                " Fecha: " +
                income.formattedDate +
                " ID: " +
                income.id}
            </Label>
            <OrderItemsTable
              rows={income.incomeDetails as IncomeDetailRow[]}
              onChange={(updatedRow) => {
                setUpdatedOrderRows((prevRows) => {
                  const existingIndex = prevRows.findIndex(
                    (row) => row.id === updatedRow.id
                  );
                  if (existingIndex !== -1) {
                    const newRows = [...prevRows];
                    newRows[existingIndex] = updatedRow;
                    return newRows;
                  }
                  return [...prevRows, updatedRow];
                });
              }}
            />
          </div>
        );
      })}
      <button
        type="submit"
        aria-label={props.isEditing ? "Actualizar orden" : "Registrar orden"}
        disabled={props.isPending}
        className={`fixed right-4 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-lg text-white ${
          props.isPending
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {props.isPending
          ? "Guardando..."
          : props.isEditing
          ? "Actualizar Venta"
          : "Registrar Venta"}
      </button>
    </form>
  );
};

export default OrderForm;
