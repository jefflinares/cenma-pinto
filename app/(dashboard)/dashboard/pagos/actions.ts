"use server";

import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import {
  ActivityType,
  income,
  providerSettlementDetails,
  providerSettlementExpenses,
  providerSettlements,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
              subtotal: d.subtotal ?? d.sub_total ?? 0,
              reason: d.reason,
            };
          }
          return val;
        },
        z.object({
          id: z.union([z.string().min(1).transform(Number), z.number().int()]),
          quantity: z.union([z.string().min(1).transform(Number), z.number()]),
          unitPrice: z.union([z.string().min(1).transform(Number), z.number()]),
          subtotal: z.union([z.string().min(1).transform(Number), z.number()]),
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
        if (settlementDetails.length > 0)
          await tx.insert(providerSettlementDetails).values(
            settlementDetails.map((detail) => ({
              settlementId: NewProviderSettlement.id,
              incomeDetailId: Number(detail.id),
              quantity: String((detail as any).quantity ?? "0"),
              unitPrice: String((detail as any).unitPrice ?? "0"),
              subtotal: String((detail as any).subtotal ?? "0"),
              reason: detail.reason ?? "",
            })),
          );
        // Register the settlementExpenses
        if (settlementExpenses.length > 0)
          await tx.insert(providerSettlementExpenses).values(
            settlementExpenses.map((expense) => ({
              settlementId: NewProviderSettlement.id,
              concept: expense.description,
              amount: String((expense as any).amount ?? "0"),
            })),
          );

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
      return {
        error: "Error al crear el recibo de pago al proveedor.",
        incomeId: settlement.incomeId,
      };
    }
  },
);

const providerSettlementUpdateSchema = z
  .object({
    settlementId: z.union([z.string().min(1).transform(Number), z.number().int()]),
    settlement: z
      .object({ status: z.string().min(1) })
      .passthrough(),
  })
  .passthrough();


  export const updateProviderSettlement = validatedActionWithUser(
    providerSettlementUpdateSchema,
    async (data, _, user) => {
      const { settlementId, settlement } = data;
      try {
        /*const result = await db.transaction(async (tx) => {
          await tx
            .update(providerSettlements)
            .set({ status: settlement.status })
            .where(eq(providerSettlements.id, settlementId))
            .returning(); 
          return true;
        });*/

        /*if (!result) {
          throw new Error("No se pudo actualizar el recibo de pago al proveedor.");
        } */
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
