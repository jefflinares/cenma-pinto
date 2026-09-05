import { getAllOrders, getOrderById, getOrdersByIncomeId } from "@/lib/db/queries/orders";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const incomeId = params.get("incomeId");
  const orderId = params.get("orderId");
  if (orderId) {
    const order = await getOrderById(Number(orderId));
    return Response.json(order);
  }
  if (incomeId) {
    const orders = await getOrdersByIncomeId(Number(incomeId));
    return Response.json(orders);
  }
  const orders = await getAllOrders();
  return Response.json(orders);
}
