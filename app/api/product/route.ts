import { getProducts } from "@/lib/db/queries/product";

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}
