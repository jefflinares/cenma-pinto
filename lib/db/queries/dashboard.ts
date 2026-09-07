import { and, eq, gte, isNull, lt, lte, sql, ne } from "drizzle-orm";
import { db } from "../drizzle";
import {
  customerOrders,
  customerOrderDetails,
  payments,
  customerAccounts,
  providerPayments,
  providerSettlements,
  providerSettlementDetails,
  income,
  incomeDetails,
  products,
  productClassification,
} from "../schema";
import { validateSession } from "./util";

function monthBounds(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const start = `${year}-${String(mon).padStart(2, "0")}-01`;
  const nextMon = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMon).padStart(2, "0")}-01`;
  return { start, end };
}

function last6Months(refMonth: string): { label: string; start: string; end: string }[] {
  const [year, mon] = refMonth.split("-").map(Number);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let m = mon - i;
    let y = year;
    while (m <= 0) { m += 12; y--; }
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const nm = m === 12 ? 1 : m + 1;
    const ny = m === 12 ? y + 1 : y;
    const end = `${ny}-${String(nm).padStart(2, "0")}-01`;
    const label = `${y}-${String(m).padStart(2, "0")}`;
    months.push({ label, start, end });
  }
  return months;
}

export async function getDashboardData(month: string) {
  const session = await validateSession();
  if (!session) throw new Error("Unauthorized");

  const { start, end } = monthBounds(month);

  // KPI: Total ventas del mes (confirmed + paid orders)
  const [ventasMes] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity} * ${customerOrderDetails.price}::numeric), 0)`,
    })
    .from(customerOrderDetails)
    .innerJoin(customerOrders, eq(customerOrderDetails.orderId, customerOrders.id))
    .where(
      and(
        isNull(customerOrders.deletedAt),
        isNull(customerOrderDetails.deletedAt),
        sql`${customerOrders.date} >= ${start}`,
        sql`${customerOrders.date} < ${end}`,
        sql`${customerOrders.status} IN ('confirmed', 'paid')`,
      ),
    );

  // KPI: Cobros realizados del mes
  const [cobrosRealizados] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .where(
      and(
        isNull(payments.deletedAt),
        sql`${payments.date} >= ${start}`,
        sql`${payments.date} < ${end}`,
      ),
    );

  // KPI: Cobros pendientes (saldo deudor de cuentas de clientes)
  const [cobrosPendientes] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CASE WHEN ${customerAccounts.balance}::numeric < 0 THEN ABS(${customerAccounts.balance}::numeric) ELSE 0 END), 0)`,
    })
    .from(customerAccounts);

  // KPI: Pagos a proveedores realizados del mes
  const [pagosProveedores] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${providerPayments.amount}::numeric), 0)`,
    })
    .from(providerPayments)
    .where(
      and(
        isNull(providerPayments.deletedAt),
        sql`${providerPayments.date} >= ${start}`,
        sql`${providerPayments.date} < ${end}`,
      ),
    );

  // KPI: Pagos pendientes proveedores (settlements no pagados)
  const pendingSettlements = await db
    .select({
      netAmount: providerSettlements.netAmount,
      settlementId: providerSettlements.id,
    })
    .from(providerSettlements)
    .where(
      and(
        isNull(providerSettlements.deletedAt),
        ne(providerSettlements.status, "paid"),
      ),
    );

  let pagosPendientesProveedores = 0;
  for (const s of pendingSettlements) {
    const [paid] = await db
      .select({ total: sql<string>`COALESCE(SUM(${providerPayments.amount}::numeric), 0)` })
      .from(providerPayments)
      .where(and(isNull(providerPayments.deletedAt), eq(providerPayments.settlementId, s.settlementId)));
    const pending = Number(s.netAmount) - Number(paid.total ?? 0);
    if (pending > 0) pagosPendientesProveedores += pending;
  }

  // KPI: Comisiones del mes — suma de total_comission en los detalles de liquidación
  const [comisionesMes] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${providerSettlementDetails.totalComission}::numeric), 0)`,
    })
    .from(providerSettlementDetails)
    .innerJoin(providerSettlements, eq(providerSettlementDetails.settlementId, providerSettlements.id))
    .innerJoin(income, eq(providerSettlements.incomeId, income.id))
    .where(
      and(
        isNull(providerSettlements.deletedAt),
        sql`${income.date}::date >= ${start}::date`,
        sql`${income.date}::date < ${end}::date`,
      ),
    );

  // Grafica: Ingresos por clasificación del mes
  const ingresosPorClasificacion = await db
    .select({
      name: sql<string>`COALESCE(${productClassification.name}, 'Sin clasificación')`,
      cantidad: sql<number>`COALESCE(SUM(${incomeDetails.quantity}), 0)`,
    })
    .from(incomeDetails)
    .innerJoin(income, eq(incomeDetails.incomeId, income.id))
    .innerJoin(products, eq(incomeDetails.productId, products.id))
    .leftJoin(productClassification, eq(products.productClassification, productClassification.id))
    .where(
      and(
        isNull(incomeDetails.deletedAt),
        isNull(income.deletedAt),
        sql`${income.date}::date >= ${start}::date`,
        sql`${income.date}::date < ${end}::date`,
      ),
    )
    .groupBy(productClassification.name);

  // Grafica: Ingresos por producto del mes
  const ingresosPorProducto = await db
    .select({
      name: products.name,
      cantidad: sql<number>`COALESCE(SUM(${incomeDetails.quantity}), 0)`,
    })
    .from(incomeDetails)
    .innerJoin(income, eq(incomeDetails.incomeId, income.id))
    .innerJoin(products, eq(incomeDetails.productId, products.id))
    .where(
      and(
        isNull(incomeDetails.deletedAt),
        isNull(income.deletedAt),
        sql`${income.date}::date >= ${start}::date`,
        sql`${income.date}::date < ${end}::date`,
      ),
    )
    .groupBy(products.name)
    .orderBy(sql`SUM(${incomeDetails.quantity}) DESC`);

  // Grafica: Ventas y cobros por mes (últimos 6 meses)
  const meses = last6Months(month);
  const ventasYCobrosPorMes = await Promise.all(
    meses.map(async ({ label, start: ms, end: me }) => {
      const [v] = await db
        .select({ total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity} * ${customerOrderDetails.price}::numeric), 0)` })
        .from(customerOrderDetails)
        .innerJoin(customerOrders, eq(customerOrderDetails.orderId, customerOrders.id))
        .where(
          and(
            isNull(customerOrders.deletedAt),
            isNull(customerOrderDetails.deletedAt),
            sql`${customerOrders.date} >= ${ms}`,
            sql`${customerOrders.date} < ${me}`,
            sql`${customerOrders.status} IN ('confirmed', 'paid')`,
          ),
        );
      const [c] = await db
        .select({ total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)` })
        .from(payments)
        .where(
          and(
            isNull(payments.deletedAt),
            sql`${payments.date} >= ${ms}`,
            sql`${payments.date} < ${me}`,
          ),
        );
      return { mes: label, ventas: Number(v.total), cobros: Number(c.total) };
    }),
  );

  // Grafica: Comisiones por mes (últimos 6 meses)
  const comisionesPorMes = await Promise.all(
    meses.map(async ({ label, start: ms, end: me }) => {
      const [c] = await db
        .select({ total: sql<string>`COALESCE(SUM(${providerSettlementDetails.totalComission}::numeric), 0)` })
        .from(providerSettlementDetails)
        .innerJoin(providerSettlements, eq(providerSettlementDetails.settlementId, providerSettlements.id))
        .innerJoin(income, eq(providerSettlements.incomeId, income.id))
        .where(
          and(
            isNull(providerSettlements.deletedAt),
            sql`${income.date}::date >= ${ms}::date`,
            sql`${income.date}::date < ${me}::date`,
          ),
        );
      return { mes: label, comisiones: Number(c.total) };
    }),
  );

  return {
    kpis: {
      ventasMes: Number(ventasMes.total),
      cobrosRealizados: Number(cobrosRealizados.total),
      cobrosPendientes: Number(cobrosPendientes.total),
      pagosProveedores: Number(pagosProveedores.total),
      pagosPendientesProveedores,
      comisionesMes: Number(comisionesMes.total),
    },
    ingresosPorClasificacion: ingresosPorClasificacion.map((r) => ({
      name: r.name,
      cantidad: Number(r.cantidad),
    })),
    ingresosPorProducto: ingresosPorProducto.map((r) => ({
      name: r.name,
      cantidad: Number(r.cantidad),
    })),
    ventasYCobrosPorMes,
    comisionesPorMes,
  };
}
