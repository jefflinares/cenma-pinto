"use client";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Provider } from "@/lib/db/schema";
import useSWR from "swr";
import { Suspense } from "react";
import { ComboBoxWithModal } from "@/components/ui/comboBox";
import SupplierForm, {
  SupplierActionState,
} from "@/components/ui/forms/supplier";
import { addSupplier, updateSupplier } from "./actions";
import DataTable from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SuppliersPage() {
  /*const { data: suppliers, isLoading } = useSWR<Provider>(
    "/api/supplier",
    fetcher
  );*/
  const suppliers = []
  const [selectedSupplier, setSelectedSupplier] = useState<Provider | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  console.log("🚀 ~ SuppliersPage ~ suppliers:", suppliers);
  // Cambia la función de acción según el modo
  const actionFn = isEditing ? updateSupplier : addSupplier;
  const [initialState, setInitialState] = useState({});
  useEffect(() => {
    if (isEditing) {
      const initialState =
        isEditing && selectedSupplier
          ? {
              id: selectedSupplier.id,
              name: selectedSupplier.name,
              phone: selectedSupplier.phone,
              address: selectedSupplier.address,
            }
          : {};
      setInitialState(initialState);
    }
  }, [isEditing, selectedSupplier]);

  const [state, formAction, isPending] = useActionState<
    SupplierActionState,
    FormData
  >(actionFn, initialState);

  const addNewSupplier = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información del Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm
            formAction={formAction}
            state={state}
            isPending={isPending}
            isEditing={isEditing}
            setIsModalOpen={setIsModalOpen}
            setIsEditing={setIsEditing}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Proveedores
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardAction>
            <Button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              // disabled={isPending}
            >
              Agregar nuevo Proveedor
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            isLoading={!suppliers}
            data={suppliers || []}
            columns={[
              { header: "Nombre", field: "name" },
              { header: "Teléfono", field: "phone" },
              { header: "Dirección", field: "address" },
            ]}
            currentPage={1}
            totalItems={suppliers?.length || 0}
            pageSize={10}
            onPageChange={() => {}}
            onEdit={(supplier) => {}}
            onDelete={(supplier) => {}}
          />
        </CardContent>
      </Card>
    </section>
  );
}
