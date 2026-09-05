import { getCustomerPaymentsByOrderId } from "@/lib/db/queries/payments";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const orderId = params.get("orderId");
  if (!orderId) return Response.json([]);
  const data = await getCustomerPaymentsByOrderId(Number(orderId));
  return Response.json(data);
}
