import { getSuppliers } from "@/lib/db/queries/suppliers";

export async function GET() {
  try {
    const suppliers = await getSuppliers();
    return Response.json(suppliers);
  } catch (error) {
    console.error("[api/supplier] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
