import { getIncomes } from "@/lib/db/queries/income";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  console.log("🚀 ~ GET ~ params:", params);
  const incomeId = params.get("incomeId");
  const from = params.get("from");
  const to = params.get("to");
  const limit = params.get("limit");
  const withAvailableStock = params.get("withAvailableStock");
  const incomes = await getIncomes({
    id: incomeId ? Number(incomeId) : undefined,
    from: from || undefined,
    to: to || undefined,
    limit: limit ? Number(limit) : undefined,
    withAvailableStock: withAvailableStock === "true",
  });
  return Response.json(incomes);
}
