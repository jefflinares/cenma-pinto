"use client";
import { useActionState, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Provider, Truck } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";
import SupplierForm, {
  SupplierActionState,
} from "@/components/ui/forms/supplier";
import {
  addSupplier,
  updateSupplier,
  deleteSupplier,
  updateTruck,
  addTruck,
  deleteTruck,
} from "./actions";
import { useToast } from "@/components/ui/toast";
import { EntityListSection } from "@/components/ui/EntityListSection";
import TruckForm, { TruckActionState } from "@/components/ui/forms/truck";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";

type TruckRow = Truck & { providerName?: string };
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSWR<Provider[]>(
    "/api/supplier",
    fetcher
  );
  const { data: trucks = [], isLoading: isLoadingTrucks } = useSWR<Truck[]>(
    "/api/truck",
    fetcher
  );

  const [selectedSupplier, setSelectedSupplier] = useState<Provider | null>(
    null
  );
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTruckEditing, setIsTruckEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [comboBoxSelectedOption, setComboBoxSelectedOption] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  // Cambia la función de acción según el modo
  const actionFn = isEditing ? updateSupplier : addSupplier;
  const actionFnTruck = isTruckEditing ? updateTruck : addTruck;
  const [initialState, setInitialState] = useState({});
  const [truckInitialState, setTruckInitialState] = useState({});
  console.log("🚀 ~ SuppliersPage ~ truckInitialState:", truckInitialState);
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

  useEffect(() => {
    if (isTruckEditing) {
      const truckInitialState =
        isTruckEditing && selectedTruck
          ? {
              plate: selectedTruck.plate,
              ownerId: selectedTruck.ownerId,
            }
          : {};
      setTruckInitialState(truckInitialState);
    }
  }, [isTruckEditing, selectedTruck]);

  useEffect(() => {
    if (comboBoxSelectedOption) {
      setTruckInitialState((prevState) => ({
        ...prevState,
        ownerId: comboBoxSelectedOption.id,
      }));
    }
  }, [comboBoxSelectedOption]);

  const { addToast } = useToast();

  const [stateSupplier, formActionSupplier, isPending] = useActionState<
    SupplierActionState,
    FormData
  >(actionFn, initialState);

  const [stateTruck, formActionTruck, isPendingTruck] = useActionState<
    TruckActionState,
    FormData
  >(actionFnTruck, truckInitialState);
  console.log("🚀 ~ SuppliersPage ~ stateTruck:", stateTruck);

  // Al finalizar la acción:
  useEffect(() => {
    if (stateSupplier?.success) {
      mutate("/api/supplier"); // Refresca proveedores con SWR

      addToast(
        isEditing ? "Proveedor actualizado" : "Proveedor agregado",
        "success"
      );
      setIsModalOpen(false);
      setIsEditing(false);
    } else if (stateSupplier?.error) {
      addToast(stateSupplier.error, "error");
    }
  }, [stateSupplier]);

  useEffect(() => {
    if (stateTruck?.success) {
      mutate("/api/truck"); // Refresca camiones con SWR
      addToast(
        isTruckEditing ? "Camión actualizado" : "Camión agregado",
        "success"
      );
      setIsTruckModalOpen(false);
      setIsTruckEditing(false);
    } else if (stateTruck?.error) {
      addToast(stateTruck.error, "error");
    }
  }, [stateTruck]);

  const handleOnDelete = async (
    id: string | number,
    supplier: boolean = true
  ) => {
    if (supplier) {
      try {
        const formData = new FormData();
        formData.append("id", String(id));
        const response = await deleteSupplier({ id }, formData);
        console.log("🚀 ~ handleOnDelete ~ response:", response);
        if (response.error) {
          addToast(response.error, "error", 5000);
          return;
        }
        addToast("Proveedor eliminado", "success");
        mutate("/api/supplier");
      } catch (error) {
        console.error("Error deleting proveedor:", error);
      }
    } else {
      console.log("Eliminando un camión con placa:", id);
      const formData = new FormData();
      formData.append("id", String(id));
      const response = await deleteTruck({ id }, formData);
      console.log("🚀 ~ handleOnDelete ~ response:", response);
      if (response.error) {
        addToast(response.error, "error");
        return;
      }
      addToast("Camión eliminado", "success");
      mutate("/api/truck");
    }
  };

  const addNewSupplier = (
    state: SupplierActionState,
    formAction: (formData: FormData) => void | Promise<void>
  ) => {
    return AddOrEditEntityComponent(
      isEditing ? "Editar Proveedor" : "Agregar Proveedor",

      <SupplierForm
        formAction={formAction}
        state={state}
        isPending={isPending}
        isEditing={isEditing}
        setIsModalOpen={setIsModalOpen}
        setIsEditing={setIsEditing}
      />
    );
  };

  const addNewTruck = (
    state: TruckActionState,
    formAction: (formData: FormData) => void | Promise<void>
  ) => {
    return AddOrEditEntityComponent(
      isTruckEditing ? "Editar Camión" : "Agregar Camión",

      <TruckForm
        formAction={formAction}
        state={state}
        selectedOption={comboBoxSelectedOption}
        setComboBoxSelectedOption={setComboBoxSelectedOption}
        isPending={isPending}
        isEditing={isTruckEditing}
        setIsModalOpen={setIsTruckModalOpen}
        setIsEditing={setIsTruckEditing}
        data={suppliers?.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
        }))}
        modalChildren={addNewSupplier(stateSupplier, formActionSupplier)}
        onAddCallBackAction={() => {
          // Aquí puedes manejar la acción de agregar un nuevo proveedor
          console.log(
            "callback para cerrar el formulario del truck y permitir que se abra el de proveedores"
          );
          setIsTruckModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    );
  };

  return (
    <>
      <EntityListSection<Provider>
        title="Proveedores"
        addButtonText="Agregar nuevo Proveedor"
        isLoading={isLoading}
        data={suppliers ?? []}
        columns={[
          { header: "Nombre", field: "name" },
          { header: "Teléfono", field: "phone" },
          { header: "Dirección", field: "address" },
        ]}
        currentPage={1}
        totalItems={suppliers?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(supplier) => {
          setSelectedSupplier(supplier);
          setIsEditing(true);
          setIsModalOpen(true);
        }}
        onDelete={({ id }) => handleOnDelete(Number(id))}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalContent={addNewSupplier(
          isEditing
            ? (selectedSupplier as any as SupplierActionState)
            : stateSupplier,
          formActionSupplier
        )}
        callBackActionWhenModalOpen={() => {
          setSelectedSupplier(null);
          setInitialState({ success: "" });
        }}
      />
      <EntityListSection<TruckRow>
        title="Camiones"
        addButtonText="Agregar nuevo Camión"
        isLoading={isLoadingTrucks}
        data={trucks ?? []}
        columns={[
          { header: "Placa", field: "plate" },
          { header: "Dueño", field: "providerName" },
          // { header: "Dirección", field: "address" },
        ]}
        currentPage={1}
        totalItems={trucks?.length || 0}
        pageSize={10}
        onPageChange={() => {}}
        onEdit={(truck) => {
          setSelectedTruck(truck);
          setIsTruckEditing(true);
          setComboBoxSelectedOption({
            id: truck.ownerId ?? -1,
            name: suppliers.find((s) => s.id === truck.ownerId)?.name || "",
          });
          setIsTruckModalOpen(true);
        }}
        onDelete={({ id }) => {
          handleOnDelete(id, false);
        }}
        isModalOpen={isTruckModalOpen}
        setIsModalOpen={setIsTruckModalOpen}
        callBackActionWhenModalOpen={() => {
          console.log(
            "callback para resetear el comboBoxSelectedOption y evitar que quede el último seleccionado aparezca en el formulario del truck"
          );
          setComboBoxSelectedOption(null);
        }}
        modalContent={addNewTruck(
          isTruckEditing
            ? (selectedTruck as any as TruckActionState)
            : stateTruck,
          formActionTruck
        )}
      />
    </>
  );
}
