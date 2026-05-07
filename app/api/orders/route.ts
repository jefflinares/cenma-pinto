import { getOrdersByIncomeId } from "@/lib/db/queries/orders";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const incomeId = params.get("incomeId");
  if (!incomeId) return Response.json([]);
  const orders = await getOrdersByIncomeId(Number(incomeId));
  return Response.json(orders);
}
