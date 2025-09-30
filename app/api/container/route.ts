import { getContainers } from "@/lib/db/queries/container";

export async function GET() {
  const containers = await getContainers();
  return Response.json(containers);
}
