import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable, { Column, DataTableProps } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

export type EntityWithId = { id?: string | number, plate?: string };

type EntityListSectionProps<T extends EntityWithId> = DataTableProps<T> & {
  title: string;
  addButtonText: string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  callBackActionWhenModalOpen?: () => void;
  modalContent: React.ReactNode;
};

export function EntityListSection<T extends EntityWithId>({
  title,
  addButtonText,
  isLoading,
  data,
  columns,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  isModalOpen,
  setIsModalOpen,
  callBackActionWhenModalOpen,
  modalContent,
  hasNestedData,
  renderNestedContent
}: EntityListSectionProps<T>) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {title}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de {title}</CardTitle>
          <CardAction>
            <Button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
              onClick={() => { callBackActionWhenModalOpen?.(); setIsModalOpen(true); }}
            >
              {addButtonText}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            isLoading={isLoading}
            data={data}
            columns={columns}
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onEdit={onEdit}
            onDelete={onDelete}
            expandable={!!renderNestedContent}
            hasNestedData={hasNestedData}
            renderNestedContent={renderNestedContent}
          />
        </CardContent>
      </Card>
      {isModalOpen && (
        <Modal setIsModalOpen={setIsModalOpen}>
          {modalContent}
        </Modal>
      )}
    </section>
  );
}