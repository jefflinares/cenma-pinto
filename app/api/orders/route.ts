import { getAllOrders, getOrderById, getOrdersByCustomerId, getOrdersByIncomeId } from "@/lib/db/queries/orders";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const incomeId = params.get("incomeId");
    const orderId = params.get("orderId");
    const customerId = params.get("customerId");
    if (orderId) {
      const order = await getOrderById(Number(orderId));
      return Response.json(order);
    }
    if (customerId) {
      const orders = await getOrdersByCustomerId(Number(customerId));
      return Response.json(orders);
    }
    if (incomeId) {
      const orders = await getOrdersByIncomeId(Number(incomeId));
      return Response.json(orders);
    }
    const orders = await getAllOrders();
    return Response.json(orders);
  } catch (error) {
    console.error("[api/orders] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
