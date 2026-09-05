"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProviderSettlementPage from "@/components/ui/forms/ProviderSettlementPage";

export default function ProviderSettlements() {
  const params = useParams();
  const router = useRouter();
  const incomeId = params.id as string;
  const [ready, setReady] = useState(incomeId === "0");

  useEffect(() => {
    if (incomeId === "0") return;
    fetch(`/api/settlements?incomeId=${incomeId}`)
      .then((res) => res.json())
      .then((data) => {
        const settlement = Array.isArray(data) ? data[0] : null;
        if (settlement?.id) {
          router.replace(`/dashboard/pagos/${settlement.id}`);
        } else {
          setReady(true);
        }
      });
  }, [incomeId]);

  if (!ready) return <div className="p-8">Cargando...</div>;

  return <ProviderSettlementPage incomeId={incomeId} mode="create" />;
}
