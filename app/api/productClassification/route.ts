import { getProductClassifications } from "@/lib/db/queries/productClassification";

export async function GET() {
  try {
    const classifications = await getProductClassifications();
    return Response.json(classifications);
  } catch (error) {
    console.error("[api/productClassification] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
