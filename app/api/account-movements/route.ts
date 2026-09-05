import { getAccountMovementsByCustomerId } from "@/lib/db/queries/accountMovements";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const customerId = params.get("customerId");
  if (!customerId) return Response.json([]);
  const data = await getAccountMovementsByCustomerId(Number(customerId));
  return Response.json(data);
}
