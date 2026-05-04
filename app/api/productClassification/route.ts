import { getProductClassifications } from "@/lib/db/queries/productClassification";

export async function GET() {
  const classifications = await getProductClassifications();
  return Response.json(classifications);
}
