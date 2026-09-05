import { getProducts } from "@/lib/db/queries/product";

export async function GET() {
  try {
    const products = await getProducts();
    return Response.json(products);
  } catch (error) {
    console.error("[api/product] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
