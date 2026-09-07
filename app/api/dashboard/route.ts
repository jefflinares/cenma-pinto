import { getDashboardData } from "@/lib/db/queries/dashboard";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const month = params.get("month") ?? new Date().toISOString().slice(0, 7);
    const data = await getDashboardData(month);
    return Response.json(data);
  } catch (error) {
    console.error("[api/dashboard] GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
