import { getCustomers } from "@/lib/db/queries/customers";

export async function GET() {
  const customers = await getCustomers();
  return Response.json(customers);
}
