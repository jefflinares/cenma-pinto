import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "./input";
import { Modal } from "./modal";

export type Entity = {
  id: string | number;
  name: string;
};

export type ComboBoxWithModalProps = React.ComponentProps<"input"> & {
  data?: Entity[];
  modalChildren?: React.ReactNode;
  selectedOption?: Entity | null;
  setComboBoxSelectedOption?: React.Dispatch<
    React.SetStateAction<Entity | null>
  >;
  onAddCallBackAction?: () => void;
};

function ComboBoxWithModal({
  className,
  data,
  type,
  modalChildren,
  onAddCallBackAction,
  selectedOption,
  setComboBoxSelectedOption,
  ...props
}: ComboBoxWithModalProps) {
  console.log("🚀 ~ ComboBoxWithModal ~ selectedOption:", selectedOption)
  const [options, setOptions] = useState(data || []);
  const [query, setQuery] = useState(selectedOption ? selectedOption.name : "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOption, setNewOption] = useState({ id: 0, name: "" });

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddOption = () => {
    if (newOption.name.trim() !== "") {
      setOptions([
        ...options,
        { id: options.length + 1, name: newOption.name.trim() },
      ]);
      setQuery(newOption.name);
      setNewOption({ id: 0, name: "" });
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <Input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        placeholder="Escribe para buscar..."
      />

      {  (<div className="border rounded mt-2 bg-white max-h-40 overflow-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => {
                setQuery(opt.name);
                setComboBoxSelectedOption && setComboBoxSelectedOption(opt);
              }}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt.name}
            </div>
          ))
        ) : ( 
            <div className="px-3 py-2 text-gray-500 flex justify-between items-center">
            <span>No se encontró la opción</span>
            {modalChildren && (<button
              onClick={() => {
                onAddCallBackAction?.();
                setIsModalOpen(true);
              }}
              className="ml-2 text-blue-600 hover:underline text-sm"
            >
              Agregar nueva
            </button>)}
          </div>
        )}
      </div>)}

      {isModalOpen && modalChildren && (
        <Modal
          setIsModalOpen={setIsModalOpen}
          children={modalChildren}
          onConfirmAction={handleAddOption}
        />
      )}
    </div>
  );
}

export { ComboBoxWithModal };
