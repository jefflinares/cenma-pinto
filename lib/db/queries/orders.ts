import { isNull, desc, eq, and, sql } from "drizzle-orm";
import { db } from "../drizzle";
import {
  customerOrders,
  customerOrderDetails,
  customers,
  products,
  incomeDetails,
} from "../schema";
import { validateSession } from "./util";

export async function getAllOrders() {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }

  const orders = await db
    .select({
      id: customerOrders.id,
      incomeId: customerOrders.incomeId,
      customerId: customerOrders.customerId,
      customerName: customers.name,
      date: customerOrders.date,
      status: customerOrders.status,
      createdAt: customerOrders.createdAt,
    })
    .from(customerOrders)
    .innerJoin(customers, eq(customerOrders.customerId, customers.id))
    .where(isNull(customerOrders.deletedAt))
    .orderBy(desc(customerOrders.createdAt));

  return Promise.all(
    orders.map(async (order) => {
      const [balanceRow] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
        })
        .from(customerOrderDetails)
        .innerJoin(customerOrders, eq(customerOrderDetails.orderId, customerOrders.id))
        .where(
          and(
            eq(customerOrders.customerId, order.customerId),
            isNull(customerOrders.deletedAt),
            isNull(customerOrderDetails.deletedAt),
          ),
        );

      return {
        ...order,
        formattedDate: new Date(order.date).toLocaleDateString("en-GB"),
        customerBalance: balanceRow?.total ?? "0",
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
      };
    }),
  );
}

export async function getOrderById(orderId: number) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const [order] = await db
    .select({
      id: customerOrders.id,
      incomeId: customerOrders.incomeId,
      customerId: customerOrders.customerId,
      customerName: customers.name,
      date: customerOrders.date,
      status: customerOrders.status,
      createdAt: customerOrders.createdAt,
    })
    .from(customerOrders)
    .innerJoin(customers, eq(customerOrders.customerId, customers.id))
    .where(and(isNull(customerOrders.deletedAt), eq(customerOrders.id, orderId)));

  if (!order) return null;

  const orderDetails = await db
    .select({
      id: customerOrderDetails.id,
      incomeDetailId: customerOrderDetails.incomeDetailId,
      productId: customerOrderDetails.productId,
      productName: products.name,
      quantity: customerOrderDetails.quantity,
      price: customerOrderDetails.price,
      containerId: customerOrderDetails.containerId,
      remainingQuantity: incomeDetails.remainingQuantity,
    })
    .from(customerOrderDetails)
    .innerJoin(products, eq(products.id, customerOrderDetails.productId))
    .innerJoin(incomeDetails, eq(incomeDetails.id, customerOrderDetails.incomeDetailId))
    .where(and(isNull(customerOrderDetails.deletedAt), eq(customerOrderDetails.orderId, orderId)));

  return {
    ...order,
    formattedDate: new Date(order.date).toLocaleDateString("en-GB"),
    orderDetails,
  };
}

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
      status: customerOrders.status,
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
    orders.map(async (order) => {
      const [balanceRow] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
        })
        .from(customerOrderDetails)
        .innerJoin(customerOrders, eq(customerOrderDetails.orderId, customerOrders.id))
        .where(
          and(
            eq(customerOrders.customerId, order.customerId),
            isNull(customerOrders.deletedAt),
            isNull(customerOrderDetails.deletedAt),
          ),
        );

      return {
        ...order,
        formattedDate: new Date(order.date).toLocaleDateString("en-GB"),
        customerBalance: balanceRow?.total ?? "0",
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
      };
    }),
  );
}
