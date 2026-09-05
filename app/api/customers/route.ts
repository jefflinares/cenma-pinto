import { getCustomers } from "@/lib/db/queries/customers";

export async function GET() {
  try {
    const customers = await getCustomers();
    return Response.json(customers);
  } catch (error) {
    console.error("[api/customers] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
