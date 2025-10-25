import React from "react";

type Props = {
  title?: string | React.ReactNode;
  setIsModalOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
  onConfirmButton?: React.ReactNode;
  onConfirmationText?: string;
  onCancelText?: string;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
  width?: string;
  maxHeight?: string;
};

export const Modal = ({
  title,
  setIsModalOpen,
  children,
  onConfirmButton,
  onConfirmationText,
  onCancelText,
  onConfirmAction,
  onCancelAction,
  width = "max-w-2xl",
  maxHeight = "max-h-[70vh]", // Fixed: Added brackets for arbitrary value
}: Props) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-lg w-full ${width} flex flex-col max-h-[90vh] mx-auto`}
      >
        {/* Header - Fixed (only show if title exists) */}
        {title && (
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold">{title}</h2>
            ) : (
              title
            )}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${maxHeight}`}>
          {children}
        </div>

        {/* Footer - Fixed (only show if buttons exist) */}
        {(onCancelAction || onConfirmButton || onConfirmAction) && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
            {onCancelAction && (
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  onCancelAction?.();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-center"
              >
                {onCancelText || "Cancelar"}
              </button>
            )}
            {onConfirmButton ? (
              <div className="w-full sm:w-auto">{onConfirmButton}</div>
            ) : (
              onConfirmAction && (
                <button
                  onClick={onConfirmAction}
                  className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-center"
                >
                  {onConfirmationText || "Guardar"}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
