// components/hooks/useProviderSettlement.ts
import { useState, useEffect, useMemo, useRef } from "react";
import useFetchData from "@/components/hooks/useFetchData";
import { IncomeRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import {
  IncomeDetailRowExtended,
  ProviderSettlementeRowExtended,
  ProviderSettlementRow,
} from "@/components/ui/forms/ProviderSettlementTable";
import { Expense } from "@/components/ui/forms/ProviderSettlementExpenses";
import { addProviderSettlement } from "@/app/(dashboard)/dashboard/pagos/actions";
import { Entity } from "../ui/comboBox";
import { useRouter } from "next/navigation";

export function useProviderSettlement({
  mode, // "create" | "edit"
  initialId, // string from params (could be "0")
}: {
  mode: "create" | "edit";
  initialId: string;
}) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<Entity | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<
    IncomeRow | ProviderSettlementRow | null
  >(null);

  const { data: incomes, isLoading } = useFetchData<
    IncomeRow | ProviderSettlementRow
  >(
    mode === "create"
      ? initialId === "0"
        ? "/api/incomes"
        : `/api/incomes?incomeId=${initialId}`
      : // Edit mode always fetchs providerSettlement by id, so we can get the associated income from that data
        `/api/settlements?settlementId=${initialId}`,
  );
  console.log("🚀 ~ useProviderSettlement ~ incomes:", incomes);

  // keep selectedIncome in sync with option or id
  useEffect(() => {
    if (selectedOption?.id && incomes) {
      const inc = incomes.find(
        (i) => String(i.id) === String(selectedOption.id),
      );
      if (inc) setSelectedIncome(inc);
    }
  }, [selectedOption?.id, incomes]);

  useEffect(() => {
    if (incomes) {
      const inc = incomes.find((i) => String(i.id) === initialId);
      if (inc) {
        setSelectedIncome(inc);
        setSettlementExpenses(
          ((inc as ProviderSettlementRow).settlementExpenses || []).map(
            (e) => ({
              ...e,
              id: String(e.id),
            }),
          ),
        ); // only settlement has expenses
      }
    }
  }, [initialId, incomes, mode]);

  const [settlementDetails, setSettlementDetails] = useState<
    IncomeDetailRowExtended[] | ProviderSettlementeRowExtended[]
  >([]);
  const [settlementExpenses, setSettlementExpenses] = useState<Expense[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const grossAmount = useMemo(
    () => settlementDetails.reduce((sum, d) => sum + (d?.subtotal || 0), 0),
    [settlementDetails],
  );
  const expenses = useMemo(
    () => settlementExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0),
    [settlementExpenses],
  );

  const scrollToErrorNotification = () => {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
  };

  const handleSubmit = async (formData: FormData) => {
    const errors: string[] = [];
    if (settlementDetails.length === 0) {
      setValidationErrors(["Debe agregar al menos un producto al pago."]);
      scrollToErrorNotification();
      return;
    }
    // …same validation as before…
    if (errors.length) {
      setValidationErrors(errors);
      scrollToErrorNotification();
      return;
    }

    setValidationErrors([]);
    setIsPending(true);
    try {
      const payload = {
        settlement: {
          incomeId: selectedIncome?.id ?? initialId,
          providerId: selectedIncome?.providerId,
          grossAmount,
          commissionAmount: 0,
          otherDeductions: expenses,
          netAmount: grossAmount - expenses,
        },
        settlementDetails,
        settlementExpenses,
      };
      const fd = new FormData();
      Object.entries(payload as any).forEach(([k, v]) =>
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v)),
      );
      await addProviderSettlement({}, fd);
      router.push("/dashboard/pagos");
    } finally {
      setIsPending(false);
    }
  };

  const formattedIncomeDetail = (income: IncomeRow): string => {
    return (
      income.incomeDetails?.reduce((acc, detail) => {
        if (+detail.quantity === 0) return acc; // skip zero quantity items
        const productInfo = `${detail.productName} - ${detail.quantity}`;
        return acc ? `${acc} | ${productInfo}` : productInfo;
      }, "") ?? ""
    );
  };

  const formattedIncomes: Entity[] = useMemo(() => {
    return (
      incomes
        ?.filter((income) => income.status === "confirmed")
        .map((income) => ({
          id: income.id,
          name: `ID:  ${income.id} - ${income.providerName} - ${income.formattedDate} - ${formattedIncomeDetail(income)}`,
        })) || []
    );
  }, [incomes]);

  const onIncomeChange = (id: string) => {
    // used by combobox; could also update router here
    setSelectedOption({ id, name: "" });
  };

  return {
    incomes,
    isLoading,
    selectedIncome,
    selectedOption,
    setSelectedOption,
    settlementDetails,
    setSettlementDetails,
    settlementExpenses,
    setSettlementExpenses,
    validationErrors,
    isPending,
    grossAmount,
    expenses,
    errorRef,
    scrollToErrorNotification,
    handleSubmit,
    onIncomeChange,
    formattedIncomes,
    router,
  };
}
