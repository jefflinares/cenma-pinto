import { getSuppliers } from "@/lib/db/queries/suppliers";

export async function GET() {
  const suppliers = await getSuppliers();
  return Response.json(suppliers);
}
