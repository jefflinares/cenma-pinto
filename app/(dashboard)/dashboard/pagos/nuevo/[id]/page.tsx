"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useMemo, useActionState, useEffect } from "react";
import AddOrEditEntityComponent from "@/components/ui/forms/addOrEditForm";
import { useEntityManager } from "@/components/hooks/useEntityManager";
import { IncomeRow } from "../../../proveedores/page";
import useFetchData from "@/components/hooks/useFetchData";
import { ProductRow } from "../../../productos/page";
import ProviderSettlementTable, {
  IncomeDetailRowExtended,
} from "@/components/ui/forms/ProviderSettlementTable";
import ProviderSettlementExpenses from "@/components/ui/forms/ProviderSettlementExpenses";
import { Expense } from "@/components/ui/forms/ProviderSettlementExpenses";
import ResumeSummary from "@/components/ui/ResumeSummary";
import { NewProviderSettlement, ProviderSettlement } from "@/lib/db/schema";
import { addProviderSettlement } from "../../actions";
import { ComboBoxWithModal, Entity } from "@/components/ui/comboBox";
import ProviderSettlementPage from "@/components/ui/forms/ProviderSettlementPage";

type Provider = NewProviderSettlement;

export default function ProviderSettlements() {
  const params = useParams();
  const incomeId = params.id as string;
  /*const router = useRouter();
  debugger;
  console.log("🚀 ~ ProviderSettlements ~ incomeId:", incomeId);

  const [isPending, setIsPending] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [initialState, setInitialState] = useState({});

  const [selectedOption, setSelectedOption] = useState<Entity | null>(null);


  const [selectedIncome, setSelectedIncome] = useState<IncomeRow | null>(null);
  const { data: incomes, isLoading } = useFetchData<IncomeRow>(
    incomeId != "0" ? `/api/incomes?incomeId=${incomeId}` : "/api/incomes",
  );
  console.log("🚀 ~ ProviderSettlements ~ incomes:", incomes);

  useEffect(() => {
    if (selectedOption && selectedOption.id) {
      // Find the selected income from the list of incomes
      const selectedIncome = incomes?.find(
        (income) => String(income.id) === String(selectedOption.id),
      );
      if (selectedIncome) {
        setSelectedIncome(selectedIncome);
      }
    }
  }, [selectedOption?.id]);

  useEffect(() => {
    if (incomeId !== "0" && incomes) {
      const income = incomes.find((inc) => String(inc.id) === incomeId);
      if (income) {
        setSelectedIncome(income);
      }
    }
  }, [incomes]);

  const onIncomeChange = (id: string) => {
    // setSelectedIncomeId(id);
    // router.replace(`/dashboard/pagos/nuevo/${id}`); // optional, to keep the URL in
    // sync and allow bookmarking
  };

  const [settlementDetails, setSettlementDetails] = useState<
    IncomeDetailRowExtended[]
  >([]);
  console.log(
    "🚀 ~ ProviderSettlements ~ settlementDetails:",
    settlementDetails,
  );
  const [settlementExpenses, setSettlementExpenses] = useState<Expense[]>([]);
  console.log(
    "🚀 ~ ProviderSettlements ~ settlementExpenses:",
    settlementExpenses,
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { providerName, providerId } = selectedIncome || {};

  const grossAmount = useMemo(
    () =>
      settlementDetails.reduce(
        (sum, detail) => sum + (detail?.subtotal || 0),
        0,
      ),
    [settlementDetails],
  );

  const expenses = useMemo(
    () =>
      settlementExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount ?? 0),
        0,
      ),
    [settlementExpenses],
  );

  const scrollToErrorNotification = () => {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
  };

  const handleSubmit = async (formData: FormData) => {
    console.log("🚀 ~ handleSubmit ~ formData:", formData, 'selectedIncome: ', selectedIncome);
    const errors: string[] = [];
    if (settlementDetails.length === 0) {
      setValidationErrors(["Debe agregar al menos un producto al pago."]);
      scrollToErrorNotification();
      return;
    }

    // Validate settlement details
    settlementDetails.forEach((detail, index) => {
      // debugger;
      if (!detail.subtotal || detail.subtotal <= 0) {
        errors.push(
          `Detalle ${index + 1}: El precio o la cantidad no ha sido establecido.`,
        );
      }
    });

    // Validate settlement expenses
    settlementExpenses.forEach((expense, index) => {
      if (!expense.amount || +expense.amount <= 0) {
        errors.push(`Gasto ${index + 1}: El monto no ha sido establecido.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      scrollToErrorNotification();
      return;
    }

    setValidationErrors([]);
    setIsPending(true);
    try {
      debugger
      const payload = {
        settlement: {
          incomeId: selectedIncome?.id,
          providerId,
          grossAmount,
          commissionAmount: 0,
          otherDeductions: expenses,
          netAmount: grossAmount - expenses,
        },
        settlementDetails,
        settlementExpenses,
      };
      console.log("🚀 ~ handleSubmit ~ payload:", payload);
      const formData = new FormData();
      Object.entries(payload as any).forEach(([key, value]) => {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await addProviderSettlement(initialState, formData);
      console.log("🚀 ~ handleSubmit ~ response:", response);

      if (response.error) {
        console.error("Error creating settlement:", response.error);
        setValidationErrors([response.error]);
        scrollToErrorNotification();
        return;
      }
      // router.push("/dashboard/pagos");
      // Add your API call here
      // const response = await fetch('/api/settlements', {
      //   method: 'POST',
      //   body: formData
      // });
      // After successful creation, redirect back to /pagos
      // router.push("/dashboard/pagos");
    } catch (error) {
      console.error("Error creating settlement:", error);
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
  console.log("🚀 ~ ProviderSettlements ~ formattedIncomes:", formattedIncomes);
*/



  return (
    <ProviderSettlementPage incomeId={incomeId} mode="create" />
  );
}
