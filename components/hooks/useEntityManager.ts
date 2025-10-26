"use client";
import { useState, useEffect, useActionState } from "react";
import useSWR, { mutate } from "swr";
import { useToast } from "@/components/ui/toast";
import { Entity } from "../ui/comboBox";
import { ProductActionState } from "../ui/forms/product";
import { ContainerActionState } from "../ui/forms/containerForm";
import { SupplierActionState } from "../ui/forms/supplier";
import { IncomeActionState } from "../ui/forms/incomeForm";

type ActionState =
  | ProductActionState
  | ContainerActionState
  | SupplierActionState
  | IncomeActionState;

type UseEntityManagerParams = {
  route: string;
  addAction: (state: ActionState, payload: FormData) => Promise<ActionState>;
  updateAction: (state: ActionState, payload: FormData) => Promise<ActionState>;
  deleteAction: (state: ActionState, payload: FormData) => Promise<ActionState>;
  setComboBoxSelectedOption: (option: Entity | null) => void;
  comboBoxSelectedOption: Entity | null;
  entityName: string;
  toastAddText?: string;
  toastUpdateText?: string;
  comboBoxData?: Entity[];
};
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEntityManager<T>({
  route,
  addAction,
  updateAction,
  deleteAction,
  setComboBoxSelectedOption,
  entityName,
  toastAddText = `${entityName} agregado`,
  toastUpdateText = `${entityName} actualizado`,
}: UseEntityManagerParams) {
  const { data, error, isLoading } = useSWR<T[]>(route, fetcher);

  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [actionFn, setActionFn] = useState<(state: ActionState, payload: FormData) => Promise<ActionState>>();
  useEffect(() => {
    if (isEditing) {
      setActionFn(() => updateAction);
    } else {
      setActionFn(() => addAction);
    }
  }, [isEditing]);
  // Initial state handling
  const [initialState, setInitialState] = useState({});
  // Action state
  const defaultActionFn = async (state: ActionState, payload: FormData): Promise<ActionState> => state;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    actionFn ?? defaultActionFn,
    initialState
  );

  useEffect(() => {
    if (isEditing && selectedEntity) {
      setInitialState(selectedEntity as any);
    } else {
      setInitialState({});
    }
  }, [isEditing, selectedEntity]);

  const { addToast } = useToast();

  // Success effect
  useEffect(() => {
    if (state?.success) {
      mutate(route);
      setIsModalOpen(false);
      addToast(isEditing ? toastUpdateText : toastAddText, "success");
      setSelectedEntity(null);
      setIsEditing(false);
      setComboBoxSelectedOption(null);
      setInitialState({});
    }
  }, [state]);

  const handleOnDelete = async (id: number) => {
    try {
      const formData = new FormData();
      formData.append("id", String(id));
      const response = await deleteAction({ id }, formData);
      if (response.error) {
        addToast(response.error, "error", 5000);
        return;
      }
      addToast(`${entityName} eliminado`, "success");
      mutate(route);
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      addToast(`Ocurrió un error al eliminar el ${entityName}`, "error", 5000);
    }
  };

  return {
    data,
    error,
    isLoading,
    selectedEntity,
    setSelectedEntity,
    isEditing,
    setIsEditing,
    isModalOpen,
    setIsModalOpen,
    initialState,
    setInitialState,
    state,
    formAction,
    isPending,
    handleOnDelete,
  };
}
