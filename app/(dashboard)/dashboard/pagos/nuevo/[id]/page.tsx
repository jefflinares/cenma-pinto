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

  return (
    <ProviderSettlementPage incomeId={incomeId} mode="create" />
  );
}
