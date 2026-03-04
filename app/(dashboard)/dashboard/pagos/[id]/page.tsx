"use client";
import ProviderSettlementPage from "@/components/ui/forms/ProviderSettlementPage";
import { useParams } from "next/navigation";
import React from "react";

const Pagos = () => {
  const params = useParams();
  const incomeId = params.id as string;

  return <ProviderSettlementPage incomeId={incomeId} mode="edit" />;
};

export default Pagos;
