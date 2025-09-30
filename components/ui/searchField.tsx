import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "./input";
import { Modal } from "./modal";

export type Entity = {
  id: string | number;
  name: string;
};

type ComboBoxWithModalProps = React.ComponentProps<"input"> & {
  data?: Entity[];
  modalChildren: React.ReactNode;
};


function SearchField({ className, data, type, modalChildren, ...props }: ComboBoxWithModalProps) {
  const [options, setOptions] = useState(data || [
    { id: 1, name: "Pedro Pérez" },
    { id: 2, name: "Julio Gomez" },
    { id: 3, name: "Luis Fernández" },
    { id: 4, name: "Antonio López" },
    { id: 5, name: "María García" },
    { id: 6, name: "Ana Martínez" },
  ]);
  const [query, setQuery] = useState("");
  const [newOption, setNewOption] = useState({id: 0, name: ""});

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(query.toLowerCase())
  );


  return (
    <div>
      <Input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribe para buscar..."
      />

      <div className="border rounded mt-2 bg-white max-h-40 overflow-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => setQuery(opt.name)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt.name}
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-gray-500 flex justify-between items-center">
            <span>No se encontró la opción</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-2 text-blue-600 hover:underline text-sm"
            >
              Agregar nueva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { SearchField };