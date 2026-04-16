import { getProviderPayments } from "@/lib/db/queries/payments";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const settlementId = params.get("settlementId") ?? undefined;
  const payments = await getProviderPayments({ settlementId });
  return Response.json(payments);
}