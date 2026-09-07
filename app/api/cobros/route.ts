import { db } from "@/lib/db/drizzle";
import { validateSession } from "@/lib/db/queries/util";
import {
  customerOrderDetails,
  customerOrders,
  payments,
} from "@/lib/db/schema";
import { and, asc, eq, isNull, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const sessionData = await validateSession();
    if (!sessionData) return Response.json([], { status: 401 });

    const { searchParams } = new URL(request.url);
    const customerId = Number(searchParams.get("customerId"));
    if (!customerId) return Response.json([]);

    const orders = await db
      .select({ id: customerOrders.id, date: customerOrders.date, status: customerOrders.status })
      .from(customerOrders)
      .where(
        and(
          eq(customerOrders.customerId, customerId),
          eq(customerOrders.status, "confirmed"),
          isNull(customerOrders.deletedAt),
        ),
      )
      .orderBy(asc(customerOrders.date));

    const result = await Promise.all(
      orders.map(async (order) => {
        const [totalRow] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
          })
          .from(customerOrderDetails)
          .where(and(eq(customerOrderDetails.orderId, order.id), isNull(customerOrderDetails.deletedAt)));

        const [paidRow] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
          })
          .from(payments)
          .where(and(eq(payments.orderId, order.id), isNull(payments.deletedAt)));

        const orderTotal = Number(totalRow?.total ?? 0);
        const alreadyPaid = Number(paidRow?.total ?? 0);

        return {
          id: order.id,
          date: order.date,
          formattedDate: new Date(order.date).toLocaleDateString("en-GB"),
          status: order.status,
          orderTotal,
          alreadyPaid,
          remaining: Number((orderTotal - alreadyPaid).toFixed(2)),
        };
      }),
    );

    return Response.json(result.filter((o) => o.remaining > 0));
  } catch (error) {
    console.error("[api/cobros] GET error:", error);
    return Response.json([], { status: 500 });
  }
}
