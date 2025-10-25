import { getIncomes } from "@/lib/db/queries/income";

export async function GET() {
  const incomes = await getIncomes();
  return Response.json(incomes);
}
