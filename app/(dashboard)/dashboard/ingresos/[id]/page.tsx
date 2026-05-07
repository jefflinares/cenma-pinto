"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import IncomeForm, {
  IncomeActionState,
} from "@/components/ui/forms/incomeForm";
import {
  addIncome,
  updateIncome,
  updateIncomeStatus,
} from "../../proveedores/actions";
import CarouselFilter, {
  type CarouselFilterItem,
} from "@/components/ui/CarouselFilter";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/icons/classificationIcons";
import { ProductClassification } from "@/lib/db/schema";
import { Entity } from "@/components/ui/comboBox";
import { ArrowLeft, CheckCircle, ReceiptText } from "lucide-react";

export default function NewIncomePage() {
  const router = useRouter();
  const params = useParams();
  const incomeId = params?.id as string;
  const isCreating = incomeId === "0";

  const [selectedProvider, setSelectedProvider] = useState<Entity | null>(null);
  const [classifications, setClassifications] = useState<
    ProductClassification[]
  >([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Entity[]>([]);
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<
    (string | number)[]
  >([]);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const isConfirmed = !isCreating && incomeData?.status !== "draft";

  const fetchIncomeData = async (supplierEntities?: Entity[], productsData?: any[]) => {
    if (isCreating) return;
    try {
      const incomeRes = await fetch(`/api/incomes?incomeId=${incomeId}`);
      const incomeJson = await incomeRes.json();
      const income = Array.isArray(incomeJson) ? incomeJson[0] : incomeJson;
      setIncomeData(income);
      if (income?.providerId && supplierEntities) {
        setSelectedProvider({
          id: income.providerId,
          name:
            income.providerName ||
            supplierEntities.find((s: Entity) => s.id === income.providerId)?.name ||
            "",
        });
      }
      if (income?.incomeDetails?.length && productsData) {
        const detailProductIds = new Set(
          income.incomeDetails.map((d: any) => d.productId),
        );
        const classificationIds = [
          ...new Set(
            productsData
              .filter((p: any) => detailProductIds.has(p.id))
              .map((p: any) => p.productClassificationId)
              .filter(Boolean),
          ),
        ];
        setSelectedClassifications(classificationIds as (string | number)[]);
      }
    } catch (error) {
      console.error("Error fetching income data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [classRes, productsRes, suppliersRes, customersRes] = await Promise.all([
          fetch("/api/productClassification"),
          fetch("/api/product"),
          fetch("/api/supplier"),
          fetch("/api/customers"),
        ]);

        const productsData = (await productsRes.json()) || [];
        setClassifications((await classRes.json()) || []);
        setAllProducts(productsData);
        const suppliersData = await suppliersRes.json();
        const supplierEntities =
          suppliersData?.map((s: any) => ({ id: s.id, name: s.name })) || [];
        setSuppliers(supplierEntities);
        const customersData = await customersRes.json();
        setCustomers(
          (customersData ?? []).map((c: any) => ({ id: c.id, name: c.name })),
        );

        await fetchIncomeData(supplierEntities, productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [incomeId]);

  const carouselItems: CarouselFilterItem[] = useMemo(
    () =>
      classifications.map((c) => ({
        id: c.id,
        name: c.name,
        icon: getIcon(c.svgIcon ?? undefined),
      })),
    [classifications],
  );

  const filteredProducts = useMemo(() => {
    if (selectedClassifications.length === 0) return allProducts;
    return allProducts.filter((p) =>
      selectedClassifications.includes(p.productClassificationId),
    );
  }, [allProducts, selectedClassifications]);

  const productsForForm: Entity[] = filteredProducts.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const formState: IncomeActionState = isCreating
    ? {}
    : {
        id: incomeData?.id,
        formattedDate: incomeData?.formattedDate,
        incomeDetails: incomeData?.incomeDetails,
        providerId: incomeData?.providerId,
      };

  const handleFormAction = async (formData: FormData) => {
    setIsPending(true);
    try {
      const action = isCreating ? addIncome : updateIncome;
      const result = await (action as any)({}, formData);
      if (result?.success) router.push("/dashboard/proveedores");
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("id", String(incomeData.id));
      formData.append("status", "confirmed");
      const result = await (updateIncomeStatus as any)({}, formData);
      if (result?.success) {
        setIncomeData((prev: any) => ({ ...prev, status: "confirmed" }));
      }
    } catch (error) {
      console.error("Error confirming income:", error);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;

  return (
    <section className="flex-1 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-right justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {isCreating ? "Crear Nuevo Ingreso" : `Editar Ingreso #${incomeId}`}
        </h1>
        {!isCreating && !isConfirmed && (
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirmar Ingreso
          </Button>
        )}
        {isConfirmed && (
          <>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Confirmado
            </span>
            <Button
              className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
              onClick={() => {
                router.push(`/dashboard/pagos/nuevo/${incomeId}`);
                // console.log("Generar recibo para el ingreso:", income);
              }}
            >
              <ReceiptText size={18} />
              <span className="text-sm">Generar Recibo</span>
            </Button>
          </>
        )}
        <Button
          onClick={() => router.push("/dashboard/proveedores")}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
      </div>

      {/* Classification filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <Label className="mb-4 block">Filtrar por Clasificación</Label>
        <div className={isConfirmed ? "pointer-events-none opacity-60" : ""}>
          <CarouselFilter
            items={carouselItems}
            selectedItems={selectedClassifications}
            onSelectionChange={setSelectedClassifications}
            multiSelect={true}
            showIcon={true}
            showText={true}
          />
        </div>
        {selectedClassifications.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              Mostrando {filteredProducts.length} producto(s) de{" "}
              {selectedClassifications.length} clasificación(es) seleccionada(s)
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <IncomeForm
          formAction={handleFormAction}
          state={formState}
          isPending={isPending}
          isEditing={!isCreating}
          disabled={isConfirmed}
          setIsModalOpen={() => {}}
          setIsEditing={() => {}}
          productsData={productsForForm}
          providersData={suppliers}
          data={suppliers}
          selectedOption={selectedProvider}
          setComboBoxSelectedOption={setSelectedProvider}
          customersData={customers}
          onOrderChange={() => fetchIncomeData()}
        />
      </div>
    </section>
  );
}
