import React, { Suspense } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";

export type SupplierActionState = {
  name: string;
  phone: string;
  address?: string;
  error?: string;
  success?: string;
};

type SupplierFormProps = {
  state: SupplierActionState;
  name: string;
  phone: string;
  address?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SupplierFormWithData({
  state,
  isEditing,
}: {
  state: SupplierActionState;
  isEditing: boolean;
}) {
  // const { data: user } = useSWR<User>('/api/user', fetcher);

  return (
    <SupplierForm
      state={state}
      name={state?.name ?? ""}
      phone={state?.phone ?? ""}
      address={state?.address ?? ""}
    />
  );
}

function SupplierForm({ state, name, phone, address }: SupplierFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Nombre
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Nombre Proveedor"
          defaultValue={state.name || name}
          required
        />
        <Label htmlFor="phone" className="mb-2">
          Teléfono
        </Label>
        <Input
          id="phone"
          name="phone"
          placeholder="Teléfono Proveedor"
          defaultValue={state.phone || phone}
          required
        />
        <Label htmlFor="address" className="mb-2">
          Dirección
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="Dirección Proveedor"
          defaultValue={state.address || address}
        />
      </div>
    </>
  );
}

const Supplier = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  state: SupplierActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
}) => {
  return (
    <form className="space-y-4" action={formAction}>
      <Suspense
        fallback={
          <SupplierForm
            state={state}
            name={state?.name ?? ""}
            phone={state?.phone ?? ""}
            address={state?.address ?? ""}
          />
        }
      >
        <SupplierFormWithData state={state} isEditing={isEditing} />
      </Suspense>
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && (
        <p className="text-green-500 text-sm">{state.success}</p>
      )}
      <Button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : isEditing ? (
          "Actualizar Producto"
        ) : (
          "Registrar Producto"
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isPending}
        onClick={() => {
          setIsModalOpen(false);
          isEditing && setIsEditing(false);
        }}
      >
        Cancelar
      </Button>
    </form>
  );
};

export default Supplier;
