import React, { Suspense } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";
import { ComboBoxWithModal, Entity, type ComboBoxWithModalProps } from "../comboBox";

export type GenericFormField = {
  name: string;
  label: string;
  type?: string;
  data?: Entity[]; // For ComboBoxWithModal
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  hidden?: boolean;
  props?: Record<string, any>;
};

export type GenericFormState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type GenericFormProps = ComboBoxWithModalProps & {
  fields: GenericFormField[];
  state: GenericFormState;
  isPending: boolean;
  isEditing?: boolean;
  formAction: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  submitText?: string;
  editText?: string;
};

const GenericForm = ({
  fields,
  state,
  isPending,
  isEditing,
  formAction,
  onCancel,
  submitText = "Registrar",
  editText = "Actualizar",
  selectedOption,
  modalChildren,
  onAddCallBackAction,
  setComboBoxSelectedOption
  
}: GenericFormProps) => {
  console.log("🚀 ~ GenericForm ~ state:", state)



  const renderComboBoxField = (field: GenericFormField) => {
    // Implement ComboBox rendering logic here if needed
    console.log('🚀 ~ renderComboBoxField ~ selectedOption:', selectedOption);
    return (
      <div>
        <Label htmlFor={field.name} className="mb-2">
          {field.label}
        </Label>
        <Input
          type="hidden"
          name={field.name}
          id={field.name}
          value={selectedOption?.id ?? ""}
        />
        <ComboBoxWithModal
          id={field.name}
          data={field.data}
          modalChildren={modalChildren}
          onAddCallBackAction={onAddCallBackAction}
          selectedOption={selectedOption}
          setComboBoxSelectedOption={setComboBoxSelectedOption}
        />
      </div>
    );
  };

  const renderInputField = (field: GenericFormField) => {
    return (
      <>
        <Label htmlFor={field.name} className="mb-2">
          {field.label}
        </Label>
        <Input
          id={field.name}
          name={field.name}
          type={field.type || "text"}
          placeholder={field.placeholder}
          defaultValue={state[field.name] ?? field.defaultValue ?? ""}
          required={field.required}
          {...field.props}
        />
      </>
    );
  };

  const renderFields = () => {
    return fields.map((field) => {
      if (field.type === "combobox") {
        return (
          <div key={field.name} style={field.hidden ? { display: "none" } : {}}>
            {renderComboBoxField(field)}
          </div>
        );
      }
      return (
        <div key={field.name} style={field.hidden ? { display: "none" } : {}}>
          {renderInputField(field)}
        </div>
      );
    });
  };

  return (
    <form className="space-y-4" action={formAction}>
      <Suspense fallback={<div>Cargando...</div>}>{renderFields()}</Suspense>
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && isEditing && (
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
          editText
        ) : (
          submitText
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isPending}
        onClick={onCancel}
      >
        Cancelar
      </Button>
    </form>
  );
};

export default GenericForm;
