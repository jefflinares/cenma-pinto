import { getCustomerById } from "@/lib/db/queries/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customer = await getCustomerById(Number(id));
    return Response.json(customer);
  } catch (error) {
    console.error("[api/customers/[id]] GET error:", error);
    return Response.json(null, { status: 500 });
  }
}
