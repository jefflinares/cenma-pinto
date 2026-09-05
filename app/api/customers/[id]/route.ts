import { getCustomerById } from "@/lib/db/queries/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  return Response.json(customer);
}
