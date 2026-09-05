import { getCustomerPaymentsByOrderId } from "@/lib/db/queries/payments";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const orderId = params.get("orderId");
    if (!orderId) return Response.json([]);
    const data = await getCustomerPaymentsByOrderId(Number(orderId));
    return Response.json(data);
  } catch (error) {
    console.error("[api/orders/payments] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
