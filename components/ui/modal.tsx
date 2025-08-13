import React from "react";

type Props = {
  title?: string | React.ReactNode
  setIsModalOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
  onConfirmButton?: React.ReactNode;
  onConfirmationText?: string;
  onCancelText?: string;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
};
export const Modal = ({ title, setIsModalOpen, children, onConfirmButton, onConfirmationText, onCancelText, onConfirmAction, onCancelAction }: Props) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        {typeof title === 'string' ? (
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
        ) : (
          title
        )}
        {children}
        <div className="flex justify-end space-x-2">
          {onCancelAction ?
            <button
              onClick={() => { setIsModalOpen(false); onCancelAction?.(); }}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              {onCancelText || "Cancelar"}
            </button>
            : null}
          {onConfirmButton ? <>{onConfirmButton}</> :
            (onConfirmAction ? <button
              onClick={onConfirmAction}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
               {onConfirmationText || "Guardar"}
            </button> : null)
          }
        </div>
      </div>
    </div>
  );
};