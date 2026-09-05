import React, { Suspense, useState, useRef } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { Loader2 } from "lucide-react";
import {
  ComboBoxWithModal,
  Entity,
  type ComboBoxWithModalProps,
} from "../comboBox";
import CarouselFilter, { type CarouselFilterItem } from "../CarouselFilter";

export type GenericFormField = {
  name: string;
  label: string;
  type?: string;
  data?: Entity[] | CarouselFilterItem[]; // For ComboBoxWithModal and CarouselFilter
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number | (string | number)[];
  hidden?: boolean;
  props?: Record<string, any>;
  multiSelect?: boolean; // For carousel
  showIcon?: boolean; // For carousel
  showText?: boolean; // For carousel
};

export type GenericFormRowField = {
  type: "row";
  fields: GenericFormField[]; // Array of fields to display in a row
  className?: string; // Optional custom styling for the row
} | {
  type: "table";
  fields: GenericFormField[]; // Array of fields where each field represents a table row
  className?: string; // Optional custom styling for the table
};

export type GenericFormFieldOrRow = GenericFormField | GenericFormRowField;

export type GenericFormState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type GenericFormProps = ComboBoxWithModalProps & {
  fields: GenericFormFieldOrRow[];
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
  setComboBoxSelectedOption,
}: GenericFormProps) => {
  // Helper function to get carousel initial state
  const getCarouselInitialState = (field: GenericFormField) => {
    if (field.type === "carousel") {
      const defaultValue = field.defaultValue;
      return Array.isArray(defaultValue)
        ? defaultValue
        : defaultValue
          ? [defaultValue]
          : [];
    }
    return null;
  };

  // State for carousel selections - needed for visual updates
  const [carouselSelections, setCarouselSelections] = useState<
    Record<string, (string | number)[]>
  >(() => {
    const initialState: Record<string, (string | number)[]> = {};
    fields.forEach((fieldOrRow) => {
      if ("type" in fieldOrRow && fieldOrRow.type !== "row" && fieldOrRow.type !== "table") {
        const field = fieldOrRow as GenericFormField;
        const carouselState = getCarouselInitialState(field);
        if (carouselState !== null) {
          initialState[field.name] = carouselState;
        }
      } else if ("type" in fieldOrRow && (fieldOrRow.type === "row" || fieldOrRow.type === "table")) {
        const rowField = fieldOrRow as GenericFormRowField;
        rowField.fields.forEach((field) => {
          const carouselState = getCarouselInitialState(field);
          if (carouselState !== null) {
            initialState[field.name] = carouselState;
          }
        });
      }
    });
    return initialState;
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Wrap formAction to add carousel data
  const handleFormAction = (formData: FormData) => {
    // Add carousel selections to formData
    Object.entries(carouselSelections).forEach(([fieldName, selectedIds]) => {
      // If single-select, use the first item; when deselected, set an empty value to clear the field
      const value = selectedIds.length > 0 ? selectedIds[0] : "";
      formData.set(fieldName, String(value));
    });
    formAction(formData);
  };

  const renderComboBoxField = (field: GenericFormField) => {
    const fallbackSelectedOption =
      selectedOption ??
      (field.data || []).find((option) => option.id === field.defaultValue) ??
      null;

    return (
      <>
        <Label htmlFor={field.name} className="mb-2">
          {field.label}
        </Label>
        <Input
          type="hidden"
          name={field.name}
          id={field.name}
          value={fallbackSelectedOption?.id ?? ""}
        />
        <ComboBoxWithModal
          id={field.name}
          data={field.data || []}
          modalChildren={modalChildren}
          onAddCallBackAction={onAddCallBackAction}
          selectedOption={fallbackSelectedOption}
          setComboBoxSelectedOption={setComboBoxSelectedOption}
        />
      </>
    );
  };

  const renderInputField = (field: GenericFormField) => {
    // Ensure defaultValue is string or number, not an array
    const defaultVal = Array.isArray(field.defaultValue) ? "" : (field.defaultValue ?? "");
    
    return (
      <>
        <Label htmlFor={field.name} className="mb-2">
          {field.label}
        </Label>
        <Input
          id={field.name}
          name={field.name}
          type={field.type && field.type !== "combobox" && field.type !== "carousel" ? field.type : "text"}
          placeholder={field.placeholder}
          defaultValue={defaultVal}
          required={field.required}
          {...field.props}
        />
      </>
    );
  };

  const renderCarouselField = (field: GenericFormField) => {
    const items = field.data as CarouselFilterItem[];
    const selectedItems = carouselSelections[field.name] || [];

    return (
      <>
        <Label className="mb-2">{field.label}</Label>
        <CarouselFilter
          items={items || []}
          selectedItems={selectedItems}
          onSelectionChange={(newSelected) => {
            // Update state for visual feedback (re-render)
            setCarouselSelections((prev) => ({
              ...prev,
              [field.name]: newSelected,
            }));
          }}
          multiSelect={field.multiSelect ?? true}
          showIcon={field.showIcon ?? true}
          showText={field.showText ?? true}
        />
      </>
    );
  };

  const renderSingleField = (field: GenericFormField) => {
    if (field.type === "combobox") {
      return renderComboBoxField(field);
    }
    if (field.type === "carousel") {
      return renderCarouselField(field);
    }
    return renderInputField(field);
  };

  const renderTableField = (tableField: GenericFormRowField) => {
    // Filter out hidden fields to get the actual visible field count
    const visibleFields = tableField.fields.filter((field) => !field.hidden);
    const visibleFieldCount = visibleFields.length;

    // If no visible fields, don't render the table at all
    if (visibleFieldCount === 0) {
      return (
        <div style={{ display: "none" }}>
          {tableField.fields.map((field) => (
            <div key={field.name} style={{ display: "none" }}>
              {renderSingleField(field)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={`overflow-x-auto ${tableField.className || ""}`}>
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableField.fields
              .filter((field) => !field.hidden) // Skip hidden fields
              .map((field, index) => (
              <tr key={field.name}>
                {/* Hidden ID field */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="hidden"
                    name={`${field.name}_id`}
                    value={Array.isArray(field.defaultValue) ? field.defaultValue[0] || "" : field.defaultValue || ""}
                  />
                  {Array.isArray(field.defaultValue) ? field.defaultValue[0] || index + 1 : field.defaultValue || index + 1}
                </td>
                {/* Name field */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {field.label}
                </td>
                {/* Input field */}
                <td className="px-4 py-2 whitespace-nowrap">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type && field.type !== "combobox" && field.type !== "carousel" ? field.type : "text"}
                    placeholder={field.placeholder}
                    defaultValue={Array.isArray(field.defaultValue) ? field.defaultValue[0] || "" : field.defaultValue || ""}
                    required={field.required}
                    className="w-full"
                    {...field.props}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFields = () => {
    return fields.map((fieldOrRow, index) => {
      // Check if it's a row field
    /*   if ("type" in fieldOrRow && fieldOrRow.type === "row") {
        return (
          <div key={`row-${index}`}>
            {render(fieldOrRow as GenericFormRowField)}
          </div>
        );
      }
 */
      // Check if it's a table field
      if ("type" in fieldOrRow && fieldOrRow.type === "table") {
        return (
          <div key={`table-${index}`}>
            {renderTableField(fieldOrRow as GenericFormRowField)}
          </div>
        );
      }

      // Regular field
      const field = fieldOrRow as GenericFormField;
      return (
        <div key={field.name} style={field.hidden ? { display: "none" } : {}}>
          {renderSingleField(field)}
        </div>
      );
    });
  };

  return (
    <form className="space-y-4" action={handleFormAction} ref={formRef}>
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
