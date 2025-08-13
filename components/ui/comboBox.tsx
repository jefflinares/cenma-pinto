import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "./input";
import { Modal } from "./modal";

function ComboBoxWithModal({ className, type, ...props }: React.ComponentProps<"input">) {
  const [options, setOptions] = useState([
    "Pedro Pérez",
    "Julio Gomez",
    "Luis Fernández",
    "Antonio López",
    "María García",
    "Ana Martínez",
  ]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOption, setNewOption] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      setOptions([...options, newOption.trim()]);
      setQuery(newOption.trim());
      setNewOption("");
      setIsModalOpen(false);
    }
  };
  
  const modalChildren = (
    <input
      type="text"
      value={newOption}
      onChange={(e) => setNewOption(e.target.value)}
      className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
      placeholder="Nombre de la nueva opción"
    />
  )

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
              onClick={() => setQuery(opt)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt}
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

      {isModalOpen && (
        <Modal setIsModalOpen={setIsModalOpen} children={modalChildren} onConfirmAction={handleAddOption}/>
      )}
    </div>
  );
}

export { ComboBoxWithModal };