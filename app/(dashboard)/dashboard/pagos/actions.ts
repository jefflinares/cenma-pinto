"use server";

import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import {
  ActivityType,
  income,
  providerPayments,
  providerSettlementDetails,
  providerSettlementExpenses,
  providerSettlements,
} from "@/lib/db/schema";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import z, { set } from "zod";

const providerSettlementSchema = z
  .object({
    settlement: z.preprocess(
      (val) => {
        if (typeof val === "object" && val !== null) {
          const s = val as any;
          const gross = s.grossAmount ?? s.gross_amount ?? 0;
          const other = s.otherDeductions ?? s.other_deductions ?? 0;
          return {
            incomeId: s.incomeId ?? s.income_id,
            providerId: s.providerId ?? s.provider_id,
            date: s.date,
            commissionAmount:
              s.commissionAmount ??
              s.comissionAmount ??
              s.commission_amount ??
              0,
            grossAmount: gross,
            otherDeductions: other,
            netAmount: s.netAmount ?? s.net_amount ?? gross - other,
          };
        }
        return val;
      },
      z.object({
        incomeId: z.union([
          z.string().min(1).transform(Number),
          z.number().int(),
        ]),
        providerId: z.union([
          z.string().min(1).transform(Number),
          z.number().int(),
        ]),
        date: z.string().min(1).optional(),
        commissionAmount: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
        grossAmount: z.union([z.string().min(1).transform(Number), z.number()]),
        otherDeductions: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
        netAmount: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
      }),
    ),
    settlementDetails: z.array(
      z.preprocess(
        (val) => {
          if (typeof val === "object" && val !== null) {
            const d = val as any;
            return {
              id: d.id ?? d.incomeDetailId ?? d.income_detail_id,
              quantity: d.quantity ?? d.qty ?? 0,
              unitPrice: d.unitPrice ?? d.unit_price ?? d.price ?? 0,
              comission: d.comission ?? d.commision ?? d.comisionAmount ?? 0,
              subtotal: d.subtotal ?? d.sub_total ?? 0,
              totalComission: d.totalComission ?? d.total_commission ?? 0,
              splitted: d.splitted ?? d.isSplitted ?? false,
              reason: d.reason,
            };
          }
          return val;
        },
        z.object({
          id: z.union([z.string().min(1).transform(Number), z.number().int()]),
          quantity: z.union([z.string().min(1).transform(Number), z.number()]),
          unitPrice: z.union([z.string().min(1).transform(Number), z.number()]),
          comission: z.union([z.string().min(1).transform(Number), z.number()]).optional(),
          subtotal: z.union([z.string().min(1).transform(Number), z.number()]),
          totalComission: z.union([z.string().min(1).transform(Number), z.number()]).optional(),
          splitted: z.boolean().optional(),
          reason: z.string().optional(),
        }),
      ),
    ),
    settlementExpenses: z.array(
      z.preprocess(
        (val) => {
          if (typeof val === "object" && val !== null) {
            const e = val as any;
            return {
              description: e.description ?? e.concept ?? e.concepto ?? "",
              amount: e.amount ?? e.monto ?? 0,
            };
          }
          return val;
        },
        z.object({
          description: z.string().min(1),
          amount: z.union([z.string().min(1).transform(Number), z.number()]),
        }),
      ),
    ),
  })
  .passthrough();

export const addProviderSettlement = validatedActionWithUser(
  providerSettlementSchema,
  async (data, _, user) => {
    const { settlement, settlementDetails, settlementExpenses } = data;
    try {
      const result = await db.transaction(async (tx) => {
        const [NewProviderSettlement] = await tx
          .insert(providerSettlements)
          .values({
            providerId: Number(settlement.providerId),
            incomeId: Number(settlement.incomeId),
            commissionAmount: String((settlement as any).commissionAmount ?? 0),
            grossAmount: String((settlement as any).grossAmount ?? 0),
            otherDeductions: String((settlement as any).otherDeductions ?? 0),
            netAmount: String((settlement as any).netAmount ?? 0),
            status: "draft",
          })
          .returning();

        // Register the settlementDetails
        if (settlementDetails.length > 0) {
          await tx.insert(providerSettlementDetails).values(
            settlementDetails.map((detail) => {
              const qty = Number((detail as any).quantity ?? 0);
              const unitPrice = Number((detail as any).unitPrice ?? 0);
              const comm = Number((detail as any).comission ?? 0);
              return {
                settlementId: NewProviderSettlement.id,
                incomeDetailId: Number(detail.id),
                quantity: String(qty),
                unitPrice: String(unitPrice),
                comission: String(comm),
                subtotal: String(Number((detail as any).subtotal ?? qty * unitPrice)),
                totalComission: String(qty * comm),
                splitted: Boolean((detail as any).splitted),
                reason: detail.reason ?? "",
              };
            }),
          );
        }
        // Register the settlementExpenses, skipping any rows that lack a
        // concept or have a non‑positive amount.  We coerce the field to a
        // number first to avoid Postgres errors.
        const validExpenses = settlementExpenses
          .map((expense: any) => ({
            concept: expense.concept,
            amount: Number(expense.amount || 0),
          }))
          .filter((e: any) => e.concept && e.amount > 0);
        if (validExpenses.length > 0) {
          await tx.insert(providerSettlementExpenses).values(
            validExpenses.map((expense: any) => ({
              settlementId: NewProviderSettlement.id,
              concept: expense.concept,
              amount: String(expense.amount),
            })),
          );
        }

        // update the income status to settled
        await tx
          .update(income)
          .set({ status: "settled" })
          .where(eq(income.id, Number(settlement.incomeId)));

        return NewProviderSettlement;
      });

      if (!result) {
        throw new Error("No se pudo crear el recibo de pago al proveedor.");
      }
      const teamId = 1;
      await logActivity(
        teamId,
        user.id,
        ActivityType.CREATE_PROVIDER_SETTLEMENT,
      );
      return {
        ...result,
        success: "Recibo de pago al proveedor creado exitosamente.",
      };
    } catch (error) {
      console.error("addProviderSettlement error", error);
      return {
        error: "Error al crear el recibo de pago al proveedor.",
        incomeId: settlement.incomeId,
      };
    }
  },
);

// when updating we receive the same shape as the create schema plus
// the settlementId (and the detail records may or may not include an `id`)
const providerSettlementUpdateSchema = z
  .object({
    settlementId: z.union([z.string().min(1).transform(Number), z.number().int()]),
    settlement: z.preprocess(
      (val) => {
        if (typeof val === "object" && val !== null) {
          const s = val as any;
          const gross = s.grossAmount ?? s.gross_amount ?? 0;
          const other = s.otherDeductions ?? s.other_deductions ?? 0;
          return {
            incomeId: s.incomeId ?? s.income_id,
            providerId: s.providerId ?? s.provider_id,
            date: s.date,
            commissionAmount:
              s.commissionAmount ??
              s.comissionAmount ??
              s.commission_amount ??
              0,
            grossAmount: gross,
            otherDeductions: other,
            netAmount: s.netAmount ?? s.net_amount ?? gross - other,
            status: s.status,
          };
        }
        return val;
      },
      z.object({
        incomeId: z.union([
          z.string().min(1).transform(Number),
          z.number().int(),
        ]),
        providerId: z.union([
          z.string().min(1).transform(Number),
          z.number().int(),
        ]),
        date: z.string().min(1).optional(),
        commissionAmount: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
        grossAmount: z.union([z.string().min(1).transform(Number), z.number()]),
        otherDeductions: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
        netAmount: z
          .union([z.string().min(1).transform(Number), z.number()])
          .optional(),
        status: z.string().optional(),
      }),
    ),
    settlementDetails: z.array(z.any()).optional(),
    settlementExpenses: z.array(z.any()).optional(),
  })
  .passthrough();

export const updateProviderSettlement = validatedActionWithUser(
  providerSettlementUpdateSchema,
  async (data, _, user) => {
    const { settlementId, settlement, settlementDetails = [], settlementExpenses = [] } = data as any;
    try {
      await db.transaction(async (tx) => {
        // update the parent record
        // incomeId is normally immutable; if we were to change it we must
        // verify the target income still exists, otherwise the FK constraint
        // will blow up (which is what you saw when the original income was
        // deleted).  For now we simply never touch it.
        const updatePayload: any = {
          providerId: Number(settlement.providerId),
          commissionAmount: String(settlement.commissionAmount ?? 0),
          grossAmount: String(settlement.grossAmount ?? 0),
          otherDeductions: String(settlement.otherDeductions ?? 0),
          netAmount: String(settlement.netAmount ?? 0),
          status: settlement.status ?? "draft",
        };

        // if you ever need to support changing the income, uncomment below
        // and add a check that the referenced income exists (e.g. with
        // `await tx.select({id: income.id}).from(income).where(eq(income.id, Number(settlement.incomeId)))`).
        // if the check fails, throw an error before calling update.
        // updatePayload.incomeId = Number(settlement.incomeId);

        await tx
          .update(providerSettlements)
          .set(updatePayload)
          .where(eq(providerSettlements.id, settlementId));

        // -------- details diffing --------
        const existing = await tx
          .select({ id: providerSettlementDetails.id })
          .from(providerSettlementDetails)
          .where(eq(providerSettlementDetails.settlementId, settlementId));
        const existingIds = existing.map((d) => d.id);

        const updates = settlementDetails.filter((d: any) => d.id != null);
        const inserts = settlementDetails.filter((d: any) => d.id == null);
        const incomingIds = updates.map((d: any) => Number(d.id));

        // perform updates
        for (const d of updates) {
          const qty = Number(d.quantity ?? 0);
          const unitPrice = Number(d.unitPrice ?? 0);
          const comm = Number(d.comission ?? 0);
          await tx
            .update(providerSettlementDetails)
            .set({
              quantity: String(qty),
              unitPrice: String(unitPrice),
              comission: String(comm),
              subtotal: String(d.subtotal ?? qty * unitPrice),
              totalComission: String(qty * comm),
              splitted: Boolean(d.splitted),
              reason: d.reason ?? "",
            })
            .where(eq(providerSettlementDetails.id, Number(d.id)));
        }

        // perform inserts
        if (inserts.length > 0) {
          await tx.insert(providerSettlementDetails).values(
            inserts.map((d: any) => ({
              settlementId,
              incomeDetailId: Number(d.incomeDetailId ?? d.id),
              quantity: String(d.quantity ?? 0),
              unitPrice: String(d.unitPrice ?? 0),
              comission: String(d.comission ?? 0),
              subtotal: String(d.subtotal ?? 0),
              totalComission: String(d.totalComission ?? 0),
              splitted: Boolean(d.splitted),
              reason: d.reason ?? "",
            })),
          );
        }

        // delete removed
        const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          for (const id of toDelete) {
            await tx
              .delete(providerSettlementDetails)
              .where(eq(providerSettlementDetails.id, id));
          }
        }

        // -------- expense handling --------
        // simplify the logic: just replace whatever is stored with the array the
        // client submitted.  the UI already filters out bad rows, so we don't
        // need complex diffing and this avoids bugs where new rows were missed.
        const cleanExpenses = settlementExpenses
          .map((e: any) => ({
            ...e,
            amount: Number(e.amount || 0),
          }))
          .filter((e: any) => e.concept && e.amount > 0);

        // log for debugging if someone reports missing rows
        console.log("updateProviderSettlement - incoming expenses", cleanExpenses);

        // blow away existing expenses and insert fresh set
        await tx
          .delete(providerSettlementExpenses)
          .where(eq(providerSettlementExpenses.settlementId, settlementId));

        if (cleanExpenses.length > 0) {
          await tx.insert(providerSettlementExpenses).values(
            cleanExpenses.map((e: any) => ({
              settlementId,
              concept: e.concept,
              amount: String(e.amount),
            })),
          );
        }
      });

      const teamId = 1;
      await logActivity(
        teamId,
        user.id,
        ActivityType.UPDATE_PROVIDER_SETTLEMENT,
      );
      return {
        success: "Recibo de pago al proveedor actualizado exitosamente.",
      };
    } catch (error) {
      console.error("updateProviderSettlement error", error);
      return {
        error: "Error al actualizar el recibo de pago al proveedor.",
      };
    }
  }
);

  const providerSettlementDeleteSchema = z
  .object({
    settlementId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  })
  .passthrough();
  
export const deleteProviderSettlement = validatedActionWithUser(
  providerSettlementDeleteSchema,
  async (data, _, user) => {
    const { settlementId } = data;
    try {
      /*const result = await db.transaction(async (tx) => {
        await tx
          .update(providerSettlements)
          .set({ deletedAt: new Date() })
          .where(eq(providerSettlements.id, settlementId))
          .returning();
        return true;
      });*/

      /*if (!result) {
        throw new Error("No se pudo eliminar el recibo de pago al proveedor.");
      } */  
      const teamId = 1;
      await logActivity(
        teamId,
        user.id,
        ActivityType.DELETE_PROVIDER_SETTLEMENT,
      );
      return {
        success: "Recibo de pago al proveedor eliminado exitosamente.",
      };
    } catch (error) {
      return {
        error: "Error al eliminar el recibo de pago al proveedor.",
      };
    }
  },
);

// -----------------------------------------------------------------------
// status update helper (used for the "confirm" button on the list page)
// -----------------------------------------------------------------------

const updateProviderSettlementStatusSchema = z.object({
  id: z.union([z.string().min(1).transform(Number), z.number().int()]),
  status: z.enum(["draft", "confirmed", "paid"]),
});

export const updateProviderSettlementStatus = validatedActionWithUser(
  updateProviderSettlementStatusSchema,
  async (data, _, user) => {
    const { id, status } = data as any;
    try {
      const [updated] = await db
        .update(providerSettlements)
        .set({ status })
        .where(eq(providerSettlements.id, id))
        .returning();
      if (!updated) {
        throw new Error("Failed to update provider settlement status");
      }
      // log activity for auditing - reuse update event
      const teamId = 1;
      await logActivity(
        teamId,
        user.id,
        ActivityType.UPDATE_PROVIDER_SETTLEMENT,
      );
      return { ...updated, success: "Estado del pago actualizado" };
    } catch (error) {
      console.error("updateProviderSettlementStatus error", error);
      return {
        error: "Error al actualizar el estado del pago al proveedor.",
      };
    }
  },
);


// ...existing code...

const providerPaymentSchema = z
  .preprocess(
    (val) => {
      if (typeof val === "object" && val !== null) {
        const obj = val as any;
        // Forms submit flat fields (settlementId, amount, ...), while APIs may
        // submit a nested { payment: {...} } payload. Normalize both shapes.
        if (obj.payment && typeof obj.payment === "object") {
          return obj;
        }
        return { payment: obj };
      }
      return val;
    },
    z.object({
      payment: z.preprocess(
        (val) => {
          if (typeof val === "object" && val !== null) {
            const p = val as any;
            return {
              settlementId: p.settlementId ?? p.settlement_id,
              amount: p.amount ?? p.monto ?? 0,
              date: p.date ?? p.paymentDate ?? p.payment_date,
              paymentType: p.paymentType ?? p.payment_type ?? p.method ?? "transfer",
              reference: p.reference ?? p.ref ?? "",
            };
          }
          return val;
        },
        z.object({
          settlementId: z.union([
            z.string().min(1).transform(Number),
            z.number().int(),
          ]),
          amount: z.union([z.string().min(1).transform(Number), z.number()]),
          date: z.string().min(1),
          paymentType: z.string().optional(),
          reference: z.string().optional(),
        }),
      ),
    }),
  );

export const addProviderPayment = validatedActionWithUser(
  providerPaymentSchema,
  async (data, _, user) => {
    const { payment } = data as any;

    try {
      if (!payment) {
        return { error: "Datos de pago inválidos." };
      }

      const settlementId = Number(payment.settlementId);
      const amount = Number(payment.amount ?? 0);

      if (!settlementId || Number.isNaN(settlementId)) {
        return { error: "Liquidación inválida." };
      }

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      const result = await db.transaction(async (tx) => {
        // 1. Get the settlement to validate it exists and grab netAmount
        const [settlement] = await tx
          .select({
            id: providerSettlements.id,
            netAmount: providerSettlements.netAmount,
          })
          .from(providerSettlements)
          .where(eq(providerSettlements.id, settlementId));

        if (!settlement) {
          throw new Error("SETTLEMENT_NOT_FOUND");
        }

        // 2. Sum all payments already made for this settlement
        const [paidRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM((${providerPayments.amount})::numeric), 0)`,
          })
          .from(providerPayments)
          .where(
            and(
              eq(providerPayments.settlementId, settlementId),
              isNull(providerPayments.deletedAt),
            ),
          );

        const netAmount = Number(settlement.netAmount ?? 0);
        const alreadyPaid = Number(paidRow?.total ?? 0);
        const available = Number((netAmount - alreadyPaid).toFixed(2));
        const requested = Number(amount.toFixed(2));

        if (requested > available) {
          throw new Error(`PAYMENT_EXCEEDS_AVAILABLE:${available.toFixed(2)}`);
        }

        // 3. Insert the payment
        const [newPayment] = await tx
          .insert(providerPayments)
          .values({
            settlementId,
            amount: String(requested),
            date: new Date(String(payment.date)),
            paymentType: String(payment.paymentType || "transfer"),
            reference: String(payment.reference ?? "") || null,
            createdBy: user.id,
          })
          .returning();

        return newPayment;
      });

      if (!result) {
        throw new Error("No se pudo registrar el pago.");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_PROVIDER_PAYMENT);

      return {
        ...result,
        success: "Pago al proveedor registrado exitosamente.",
      };
    } catch (error: any) {
      if (error?.message === "SETTLEMENT_NOT_FOUND") {
        return { error: "La liquidación indicada no existe." };
      }

      if (
        typeof error?.message === "string" &&
        error.message.startsWith("PAYMENT_EXCEEDS_AVAILABLE:")
      ) {
        const available = error.message.split(":")[1] ?? "0.00";
        return {
          error: `El pago excede el saldo pendiente de la liquidación. Disponible: $${available}.`,
        };
      }

      console.error("addProviderPayment error", error);
      return { error: "Error al registrar el pago al proveedor." };
    }
  },
);

const providerPaymentUpdateSchema = z
  .preprocess(
    (val) => {
      if (typeof val === "object" && val !== null) {
        const obj = val as any;
        if (obj.payment && typeof obj.payment === "object") {
          return obj;
        }
        return { payment: obj };
      }
      return val;
    },
    z.object({
      payment: z.preprocess(
        (val) => {
          if (typeof val === "object" && val !== null) {
            const p = val as any;
            return {
              id: p.id,
              settlementId: p.settlementId ?? p.settlement_id,
              amount: p.amount ?? p.monto ?? 0,
              date: p.date ?? p.paymentDate ?? p.payment_date,
              paymentType: p.paymentType ?? p.payment_type ?? p.method ?? "transfer",
              reference: p.reference ?? p.ref ?? "",
            };
          }
          return val;
        },
        z.object({
          id: z.union([z.string().min(1).transform(Number), z.number().int()]),
          settlementId: z.union([
            z.string().min(1).transform(Number),
            z.number().int(),
          ]),
          amount: z.union([z.string().min(1).transform(Number), z.number()]),
          date: z.string().min(1),
          paymentType: z.string().optional(),
          reference: z.string().optional(),
        }),
      ),
    }),
  );

export const updateProviderPayment = validatedActionWithUser(
  providerPaymentUpdateSchema,
  async (data, _, user) => {
    const { payment } = data as any;

    try {
      if (!payment) {
        return { error: "Datos de pago inválidos." };
      }

      const id = Number(payment.id);
      const settlementId = Number(payment.settlementId);
      const amount = Number(payment.amount ?? 0);

      if (!id || Number.isNaN(id)) {
        return { error: "Pago inválido." };
      }

      if (!settlementId || Number.isNaN(settlementId)) {
        return { error: "Liquidación inválida." };
      }

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      const result = await db.transaction(async (tx) => {
        const [existingPayment] = await tx
          .select({ id: providerPayments.id, settlementId: providerPayments.settlementId })
          .from(providerPayments)
          .where(and(eq(providerPayments.id, id), isNull(providerPayments.deletedAt)));

        if (!existingPayment) {
          throw new Error("PAYMENT_NOT_FOUND");
        }

        if (Number(existingPayment.settlementId) !== settlementId) {
          throw new Error("SETTLEMENT_MISMATCH");
        }

        const [settlement] = await tx
          .select({
            id: providerSettlements.id,
            netAmount: providerSettlements.netAmount,
          })
          .from(providerSettlements)
          .where(eq(providerSettlements.id, settlementId));

        if (!settlement) {
          throw new Error("SETTLEMENT_NOT_FOUND");
        }

        const [paidRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM((${providerPayments.amount})::numeric), 0)`,
          })
          .from(providerPayments)
          .where(
            and(
              eq(providerPayments.settlementId, settlementId),
              isNull(providerPayments.deletedAt),
              ne(providerPayments.id, id),
            ),
          );

        const netAmount = Number(settlement.netAmount ?? 0);
        const alreadyPaidWithoutCurrent = Number(paidRow?.total ?? 0);
        const available = Number((netAmount - alreadyPaidWithoutCurrent).toFixed(2));
        const requested = Number(amount.toFixed(2));

        if (requested > available) {
          throw new Error(`PAYMENT_EXCEEDS_AVAILABLE:${available.toFixed(2)}`);
        }

        const [updatedPayment] = await tx
          .update(providerPayments)
          .set({
            amount: String(requested),
            date: new Date(String(payment.date)),
            paymentType: String(payment.paymentType || "transfer"),
            reference: String(payment.reference ?? "") || null,
          })
          .where(and(eq(providerPayments.id, id), isNull(providerPayments.deletedAt)))
          .returning();

        return updatedPayment;
      });

      if (!result) {
        throw new Error("No se pudo actualizar el pago.");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_PROVIDER_PAYMENT);

      return {
        ...result,
        success: "Pago al proveedor actualizado exitosamente.",
      };
    } catch (error: any) {
      if (error?.message === "PAYMENT_NOT_FOUND") {
        return { error: "El pago indicado no existe." };
      }

      if (error?.message === "SETTLEMENT_MISMATCH") {
        return { error: "El pago no pertenece a la liquidación indicada." };
      }

      if (error?.message === "SETTLEMENT_NOT_FOUND") {
        return { error: "La liquidación indicada no existe." };
      }

      if (
        typeof error?.message === "string" &&
        error.message.startsWith("PAYMENT_EXCEEDS_AVAILABLE:")
      ) {
        const available = error.message.split(":")[1] ?? "0.00";
        return {
          error: `El pago excede el saldo pendiente de la liquidación. Disponible: $${available}.`,
        };
      }

      console.error("updateProviderPayment error", error);
      return { error: "Error al actualizar el pago al proveedor." };
    }
  },
);

const providerPaymentDeleteSchema = z
  .object({
    id: z.union([z.string().min(1).transform(Number), z.number().int()]),
  })
  .passthrough();

export const deleteProviderPayment = validatedActionWithUser(
  providerPaymentDeleteSchema,
  async (data, _, user) => {
    const { id } = data as any;

    try {
      const [deleted] = await db
        .update(providerPayments)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(providerPayments.id, Number(id)),
            isNull(providerPayments.deletedAt),
          ),
        )
        .returning();

      if (!deleted) {
        return { error: "El pago indicado no existe." };
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.DELETE_PROVIDER_PAYMENT);

      return { success: "Pago al proveedor eliminado exitosamente." };
    } catch (error) {
      console.error("deleteProviderPayment error", error);
      return { error: "Error al eliminar el pago al proveedor." };
    }
  },
);