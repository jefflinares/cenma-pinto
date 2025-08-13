import React, { Suspense } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";

export type ActionState = {
  id?: string | number;
  name?: string;
  success?: string;
  error?: string;
  [key: string]: any; // This allows for additional properties
};

type ProductFormProps = {
  state: ActionState;
  nameValue?: string;
  isEditing?: boolean;
};

function ProductForm({
  state,
  nameValue = "",
  isEditing = false,
}: ProductFormProps) {
  console.log("🚀 ~ ProductForm ~ state:", state);

  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Nombre del producto
        </Label>
        {isEditing && state?.id && (
          <>
            {console.log("ID DEL PRODUCTO:", state.id)}
            <Input type="hidden" name="id" value={state.id} />
          </>
        )}
        <Input
          id="name"
          name="name"
          placeholder="Nombre del Producto"
          defaultValue={state?.name ?? nameValue}
          required
        />
      </div>
    </>
  );
}

function ProductFormWithData({
  state,
  isEditing,
}: {
  state: ActionState;
  isEditing: boolean;
}) {
  console.log("🚀 ~ ProductFormWithData ~ state:", state);

  return (
    <ProductForm
      state={state}
      nameValue={state.name || ""} // Use the name from state or empty string if not available
      isEditing={isEditing}
    />
  );
}

const Product = ({
  formAction,
  state,
  isPending,
  isEditing,
  setIsModalOpen,
  setIsEditing,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  state: ActionState;
  isPending: boolean;
  isEditing: boolean;
  setIsModalOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
}) => {
    
  return (
    <form className="space-y-4" action={formAction}>
      <Suspense fallback={<ProductForm state={state} />}>
        <ProductFormWithData state={state} isEditing={isEditing} />
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

export default Product;
