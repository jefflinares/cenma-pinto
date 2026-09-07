import {
  getCashDaySummary,
  getCashMovementsForDate,
  getPreviousClosingBalance,
} from "@/lib/db/queries/cashMovements";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const [daySummary, movements, prevClosing] = await Promise.all([
      getCashDaySummary(date),
      getCashMovementsForDate(date),
      getPreviousClosingBalance(date),
    ]);

    return Response.json({
      daySummary,
      movements,
      suggestedOpening: prevClosing ?? "0",
    });
  } catch (error) {
    console.error("[api/cash] GET error:", error);
    return Response.json({ daySummary: null, movements: [], suggestedOpening: "0" }, { status: 500 });
  }
}
