import { isNull, desc, eq, and } from "drizzle-orm";
import { db } from "../drizzle";
import {
  customerOrders,
  customerOrderDetails,
  customers,
  products,
} from "../schema";
import { validateSession } from "./util";

export async function getOrdersByIncomeId(incomeId: number) {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }

  const orders = await db
    .select({
      id: customerOrders.id,
      customerId: customerOrders.customerId,
      customerName: customers.name,
      date: customerOrders.date,
      createdAt: customerOrders.createdAt,
    })
    .from(customerOrders)
    .innerJoin(customers, eq(customerOrders.customerId, customers.id))
    .where(
      and(
        isNull(customerOrders.deletedAt),
        eq(customerOrders.incomeId, incomeId),
      ),
    )
    .orderBy(desc(customerOrders.createdAt));

  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      formattedDate: new Date(order.date).toLocaleDateString("es-GT"),
      orderDetails: await db
        .select({
          id: customerOrderDetails.id,
          productId: customerOrderDetails.productId,
          productName: products.name,
          quantity: customerOrderDetails.quantity,
          price: customerOrderDetails.price,
        })
        .from(customerOrderDetails)
        .innerJoin(products, eq(products.id, customerOrderDetails.productId))
        .where(
          and(
            isNull(customerOrderDetails.deletedAt),
            eq(customerOrderDetails.orderId, order.id),
          ),
        ),
    })),
  );
}
