import { getSettlements } from "@/lib/db/queries/settlements";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const settlementId = params.get("settlementId") ?? undefined;
  const incomeId = params.get("incomeId") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const settlements = await getSettlements({ settlementId, incomeId, from, to });
  return Response.json(settlements);
}
