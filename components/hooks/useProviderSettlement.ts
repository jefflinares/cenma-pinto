// components/hooks/useProviderSettlement.ts
import { useState, useEffect, useMemo, useRef } from "react";
import useFetchData from "@/components/hooks/useFetchData";
import { IncomeRow } from "@/app/(dashboard)/dashboard/proveedores/page";
import {
  IncomeDetailRowExtended,
  SettlementTableRowExtended,
  ProviderSettlementRow,
} from "@/components/ui/forms/ProviderSettlementTable";
import { Expense } from "@/components/ui/forms/ProviderSettlementExpenses";
import {
  addProviderSettlement,
  updateProviderSettlement,
} from "@/app/(dashboard)/dashboard/pagos/actions";
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
    SettlementTableRowExtended[]
  >([]);
  const [settlementExpenses, setSettlementExpenses] = useState<Expense[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const grossAmount = useMemo(
    () =>
      settlementDetails.reduce((sum, d) => {
        const val = Number(d?.subtotal ?? 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0),
    [settlementDetails],
  );
  const commissionTotal = useMemo(
    () =>
      settlementDetails.reduce((sum, d) => {
        const val = Number(d?.totalComission ?? 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0),
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

  // unified submit handler; called from the form's onSubmit callback
  const handleSubmit = async () => {
    const errors: string[] = [];

    if (settlementDetails.length === 0) {
      setValidationErrors(["Debe agregar al menos un producto al pago."]);
      scrollToErrorNotification();
      return;
    }

    // perform the same checks we do interactively inside the table so the
    // user can't bypass them by never blurring a row or by submitting too fast
    // * quantities must be non‑negative and > 0
    // * unit price / commission non‑negative
    // * for rows with stock available the sum of splits for a given product
    //   must equal (not exceed) the stock value
    const qtyTotals: Record<string | number, number> = {};
    const stocks: Record<
      string | number,
      { stock: number; productName: string }
    > = {};

    settlementDetails.forEach((d, idx) => {
      const qty = Number((d as any).quantity ?? 0);
      const price = Number((d as any).unitPrice ?? 0);
      const comm = Number((d as any).comission ?? 0);
      const subtotal = Number((d as any).subtotal ?? 0);
      const productId =
        (d as any).productId ?? (d as any).incomeDetailId ?? `row${idx}`;
      const productName = (d as any)?.productName || "";
      console.log("🚀 ~ handleSubmit ~ productName:", productName);
      // stock may arrive as a string so coerce to number and only
      // consider it valid when not NaN
      const stockRaw = (d as any).stock;
      const stock = stockRaw != null ? Number(stockRaw) : undefined;

      if (qty < 0) {
        errors.push(`Detalle ${idx + 1}: cantidad no puede ser negativa.`);
      }
      if (qty === 0) {
        errors.push(`Detalle ${idx + 1}: la cantidad debe ser mayor que cero.`);
      }
      if (price < 0) {
        errors.push(
          `Detalle ${idx + 1}: precio unitario no puede ser negativo.`,
        );
      }
      if (comm < 0) {
        errors.push(`Detalle ${idx + 1}: comisión no puede ser negativa.`);
      }
      if (subtotal <= 0) {
        errors.push(`Detalle ${idx + 1}: subtotal inválido.`);
      }

      qtyTotals[productId] = (qtyTotals[productId] || 0) + qty;
      if (stock !== undefined && !isNaN(stock)) {
        stocks[productId] = {
          stock,
          productName,
        };
      }
    });

    Object.entries(stocks).forEach(([pid, producto]) => {
      const { stock: stk, productName } = producto;
      const total = qtyTotals[pid] || 0;
      if (total > stk) {
        errors.push(
          `Cantidad total para el producto ${productName} excede el stock (${stk}).`,
        );
      } else if (total < stk) {
        errors.push(
          `Cantidad total para el producto ${productName} debe igualar el stock (${stk}).`,
        );
      }
    });

    if (errors.length) {
      setValidationErrors(errors);
      scrollToErrorNotification();
      return;
    }

    setValidationErrors([]);
    setIsPending(true);
    try {
      debugger;
      // also validate expenses; if the user left a blank row we treat it as
      // an error so they get feedback rather than dropping silently later.
      settlementExpenses.forEach((exp, idx) => {
        const amt = Number(exp.amount ?? 0);
        if (!exp.concept || String(exp.concept).trim() === "") {
          errors.push(`Gasto ${idx + 1}: el concepto no puede estar vacío.`);
        }
        if (!amt || amt <= 0) {
          errors.push(`Gasto ${idx + 1}: el monto debe ser mayor que cero.`);
        }
      });

      if (errors.length) {
        setValidationErrors(errors);
        scrollToErrorNotification();
        return;
      }

      // drop any expense rows where the amount is missing or zero; these
      // entries are usually artifacts left behind when the user deletes the
      // last row but the component keeps one blank row.
      const cleanExpenses = settlementExpenses
        .map((e) => ({
          ...e,
          amount: Number(e.amount || 0),
        }))
        .filter(
          (e) => e.amount && e.concept && String(e.concept).trim() !== "",
        );

      const payload: any = {
        settlement: {
          incomeId: selectedIncome?.id ?? initialId,
          providerId: selectedIncome?.providerId,
          grossAmount,
          commissionAmount: 0,
          otherDeductions: expenses,
          netAmount: grossAmount - expenses,
        },
        settlementDetails,
        settlementExpenses: cleanExpenses,
      };

      // when editing, include the settlementId so the server knows what to update
      if (mode === "edit") {
        payload.settlementId = Number(initialId);
      }

      const fd = new FormData();
      Object.entries(payload as any).forEach(([k, v]) =>
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v)),
      );

      let response: any;
      if (mode === "create") {
        response = await addProviderSettlement({}, fd);
      } else {
        response = await updateProviderSettlement({}, fd);
      }

      if (response?.error) {
        console.log("🚀 ~ handleSubmit ~ response:", response);
        setValidationErrors([response.error]);
        scrollToErrorNotification();
        return;
      }

      // navigate back after either operation
      router.push("/dashboard/pagos");
    } finally {
      setIsPending(false);
    }
  };

  const formattedIncomeDetail = (
    income: IncomeRow | ProviderSettlementRow,
  ): string => {
    const details =
      "incomeDetails" in income
        ? income.incomeDetails
        : (income as ProviderSettlementRow).settlementDetails;
    return (
      details?.reduce((acc, detail) => {
        if (+detail.quantity === 0) return acc; // skip zero quantity items
        const productInfo = `${"productName" in detail ? detail.productName : ""} - ${detail.quantity}`;
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
          name: `ID:  ${income.id} - ${income.providerName} - ${income.formattedDate} - ${formattedIncomeDetail(
            income,
          )}`,
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
    commissionTotal,
    expenses,
    errorRef,
    scrollToErrorNotification,
    handleSubmit,
    onIncomeChange,
    formattedIncomes,
    router,
  };
}
