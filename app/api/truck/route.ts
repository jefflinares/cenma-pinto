import { getTrucks } from "@/lib/db/queries/truck";

export async function GET() {
  const trucks = await getTrucks();
  return Response.json(trucks);
}
