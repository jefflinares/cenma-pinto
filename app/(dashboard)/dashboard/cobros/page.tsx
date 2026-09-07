"use client";

import { useCallback, useState, useTransition } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { ComboBoxWithModal, Entity } from "@/components/ui/comboBox";
import { Modal } from "@/components/ui/modal";
import { Pencil, Check, X } from "lucide-react";
import { updateOpeningBalance, closeCashDay, addCashWithdrawal, addCobro } from "./actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type CashDaySummary = {
  id: number;
  date: string;
  openingBalance: string;
  closingBalance: string | null;
  closedAt: string | null;
};

type CashMovement = {
  id: number;
  date: string;
  concept: string;
  type: string;
  amount: string;
};

type CashData = {
  daySummary: CashDaySummary | null;
  movements: CashMovement[];
  suggestedOpening: string;
};

type CustomerRow = { id: number; name: string };

type OrderBalance = {
  id: number;
  formattedDate: string;
  orderTotal: number;
  alreadyPaid: number;
  remaining: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

const typeBadge: Record<string, string> = {
  INCOME: "bg-green-100 text-green-800",
  EXPENSE: "bg-red-100 text-red-800",
  INITIAL: "bg-blue-100 text-blue-800",
};
const typeLabel: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Egreso",
  INITIAL: "Apertura",
};
const paymentTypeOptions = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "check", label: "Cheque" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmt(v: string | number) {
  return `Q${Number(v).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CobrosPage() {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // ── Cash state
  const [cashDate, setCashDate] = useState(today);
  const [editing, setEditing] = useState(false);
  const [openingInput, setOpeningInput] = useState("");
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalConcept, setWithdrawalConcept] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const { data: cashData, mutate: refreshCash } = useSWR<CashData>(
    `/api/cash?date=${cashDate}`,
    fetcher,
  );
  const daySummary = cashData?.daySummary ?? null;
  const movements: CashMovement[] = cashData?.movements ?? [];
  const suggestedOpening = cashData?.suggestedOpening ?? "0";

  // ── Cobros state
  const { data: customers } = useSWR<CustomerRow[]>("/api/customers", fetcher);
  const [selectedCustomer, setSelectedCustomer] = useState<Entity | null>(null);
  const [cobroAmount, setCobroAmount] = useState("");
  const [cobroType, setCobroType] = useState("cash");
  const [cobroDate, setCobroDate] = useState(today);
  const [cobroRef, setCobroRef] = useState("");
  const [orderBalances, setOrderBalances] = useState<OrderBalance[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleCustomerSelect = useCallback(async (entity: Entity | null) => {
    setSelectedCustomer(entity);
    setOrderBalances([]);
    if (!entity) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/cobros?customerId=${entity.id}`);
      const data: OrderBalance[] = await res.json();
      setOrderBalances(data);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const dispatchCustomerSelect = useCallback<React.Dispatch<React.SetStateAction<Entity | null>>>(
    (val) => { if (typeof val !== "function") handleCustomerSelect(val); },
    [handleCustomerSelect],
  );

  const totalPending = orderBalances.reduce((s, o) => s + o.remaining, 0);

  // ── Cash summary calcs
  const incomeTotal = movements.filter((m) => m.type === "INCOME").reduce((s, m) => s + Number(m.amount), 0);
  const expenseTotal = movements.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + Number(m.amount), 0);
  const currentBalance = daySummary
    ? Number(daySummary.openingBalance) + incomeTotal - expenseTotal
    : 0;

  // ── Actions

  function handleSaveOpening() {
    const balance = parseFloat(openingInput);
    if (Number.isNaN(balance) || balance < 0) {
      addToast("Ingresa un saldo inicial válido.", "error");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("date", cashDate);
      fd.append("openingBalance", String(balance));
      const res = await updateOpeningBalance({}, fd);
      if (res?.error) addToast(res.error, "error");
      else { addToast(res?.success ?? "Saldo guardado.", "success"); setEditing(false); refreshCash(); }
    });
  }

  function startEdit() {
    setOpeningInput(daySummary?.openingBalance ?? suggestedOpening);
    setEditing(true);
  }

  function handleCloseCash() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("date", cashDate);
      const res = await closeCashDay({}, fd);
      if (res?.error) addToast(res.error, "error");
      else { addToast(res?.success ?? "Caja cerrada.", "success"); refreshCash(); }
      setShowCloseConfirm(false);
    });
  }

  function handleWithdrawal() {
    if (!withdrawalConcept.trim() || !withdrawalAmount) {
      addToast("Completa concepto y monto.", "error");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("concept", withdrawalConcept);
      fd.append("amount", withdrawalAmount);
      fd.append("date", cashDate);
      const res = await addCashWithdrawal({}, fd);
      if (res?.error) addToast(res.error, "error");
      else {
        addToast(res?.success ?? "Retiro registrado.", "success");
        setWithdrawalConcept("");
        setWithdrawalAmount("");
        setShowWithdrawalModal(false);
        refreshCash();
      }
    });
  }

  function handleCobro(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) { addToast("Selecciona un cliente.", "error"); return; }
    if (!cobroAmount) { addToast("Ingresa un monto.", "error"); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("customerId", String(selectedCustomer.id));
      fd.append("totalAmount", cobroAmount);
      fd.append("paymentType", cobroType);
      fd.append("date", cobroDate);
      fd.append("reference", cobroRef);
      const res = await addCobro({}, fd);
      if (res?.error) addToast(res.error, "error");
      else {
        addToast(res?.success ?? "Cobro registrado.", "success");
        setCobroAmount("");
        setCobroRef("");
        setSelectedCustomer(null);
        setOrderBalances([]);
        if (cobroType === "cash") refreshCash();
      }
    });
  }

  const customerEntities: Entity[] = (customers ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="p-4 space-y-8 max-w-4xl mx-auto">
      {/* ── Caja Section ── */}
      <section className="border rounded-lg p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Caja</h2>
          <div className="flex items-center gap-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={cashDate}
              onChange={(e) => { setCashDate(e.target.value); setEditing(false); }}
              className="w-40"
            />
          </div>
        </div>

        {/* Opening balance row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Saldo inicial:</span>
          {!editing ? (
            <>
              <span className="text-xl font-bold text-gray-800">
                {daySummary ? fmt(daySummary.openingBalance) : <span className="text-gray-400 text-base font-normal">Sin registro</span>}
              </span>
              <button onClick={startEdit} className="text-gray-400 hover:text-gray-700" title="Editar">
                <Pencil className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Sugerido: ${fmt(suggestedOpening)}`}
                value={openingInput}
                onChange={(e) => setOpeningInput(e.target.value)}
                autoFocus
                className="w-40"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveOpening(); if (e.key === "Escape") setEditing(false); }}
              />
              <Button size="sm" onClick={handleSaveOpening} disabled={isPending}><Check className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={isPending}><X className="w-4 h-4" /></Button>
            </div>
          )}
        </div>

        {/* Summary cards — only when a day is registered */}
        {daySummary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Saldo Inicial" value={fmt(daySummary.openingBalance)} color="blue" />
              <SummaryCard label="+ Ingresos" value={fmt(incomeTotal)} color="green" />
              <SummaryCard label="− Egresos" value={fmt(expenseTotal)} color="red" />
              <SummaryCard
                label={daySummary.closingBalance ? "Saldo Final" : "Saldo Actual"}
                value={fmt(daySummary.closingBalance ?? currentBalance)}
                color="gray"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {!daySummary.closedAt ? (
                <>
                  <Button variant="outline" onClick={() => setShowWithdrawalModal(true)} disabled={isPending}>
                    Registrar Retiro
                  </Button>
                  <Button variant="destructive" onClick={() => setShowCloseConfirm(true)} disabled={isPending}>
                    Cerrar Caja
                  </Button>
                </>
              ) : (
                <span className="text-sm text-gray-500 self-center">
                  Caja cerrada el {new Date(daySummary.closedAt).toLocaleString("es-GT")}
                </span>
              )}
            </div>

            {/* Movements table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-2 border">Hora</th>
                    <th className="p-2 border">Concepto</th>
                    <th className="p-2 border">Tipo</th>
                    <th className="p-2 border text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-400">Sin movimientos</td>
                    </tr>
                  )}
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-2 border whitespace-nowrap">
                        {new Date(m.date).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-2 border">{m.concept}</td>
                      <td className="p-2 border">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge[m.type] ?? ""}`}>
                          {typeLabel[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className={`p-2 border text-right font-medium ${m.type === "EXPENSE" ? "text-red-600" : "text-green-700"}`}>
                        {m.type === "EXPENSE" ? "−" : "+"}{fmt(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── Cobros Section ── */}
      <section className="border rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold">Registrar Cobro</h2>

        <form onSubmit={handleCobro} className="space-y-4 max-w-lg">
          <div className="space-y-1">
            <Label>Cliente</Label>
            <ComboBoxWithModal
              data={customerEntities}
              selectedOption={selectedCustomer}
              setComboBoxSelectedOption={dispatchCustomerSelect}
            />
          </div>

          {selectedCustomer && !loadingOrders && orderBalances.length > 0 && (
            <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
              <p className="font-medium text-gray-700">Ventas confirmadas pendientes:</p>
              {orderBalances.map((o) => (
                <div key={o.id} className="flex justify-between">
                  <span>Orden #{o.id} — {o.formattedDate}</span>
                  <span className="text-red-600 font-medium">{fmt(o.remaining)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-semibold">
                <span>Total pendiente</span>
                <span>{fmt(totalPending)}</span>
              </div>
            </div>
          )}
          {selectedCustomer && loadingOrders && <p className="text-sm text-gray-400">Cargando ventas...</p>}
          {selectedCustomer && !loadingOrders && orderBalances.length === 0 && (
            <p className="text-sm text-gray-500">No hay ventas confirmadas pendientes.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={cobroAmount}
                onChange={(e) => setCobroAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de pago</Label>
              <select
                value={cobroType}
                onChange={(e) => setCobroType(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {paymentTypeOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={cobroDate}
                onChange={(e) => setCobroDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Referencia (opcional)</Label>
              <Input
                value={cobroRef}
                onChange={(e) => setCobroRef(e.target.value)}
                placeholder="No. cheque, transferencia..."
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending || !selectedCustomer}>
            Registrar cobro
          </Button>
        </form>
      </section>

      {/* ── Withdrawal Modal ── */}
      {showWithdrawalModal && (
        <Modal
          title="Registrar Retiro"
          setIsModalOpen={setShowWithdrawalModal}
          onConfirmAction={handleWithdrawal}
          onCancelAction={() => { setWithdrawalConcept(""); setWithdrawalAmount(""); }}
          onConfirmationText="Registrar"
          onCancelText="Cancelar"
          width="max-w-sm"
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Concepto</Label>
              <Input
                value={withdrawalConcept}
                onChange={(e) => setWithdrawalConcept(e.target.value)}
                placeholder="Descripción del retiro..."
              />
            </div>
            <div className="space-y-1">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Close confirm modal ── */}
      {showCloseConfirm && (
        <Modal
          title="Cerrar Caja"
          setIsModalOpen={setShowCloseConfirm}
          onConfirmAction={handleCloseCash}
          onCancelAction={() => {}}
          onConfirmationText="Cerrar Caja"
          onCancelText="Cancelar"
          width="max-w-sm"
        >
          <p className="text-sm text-gray-600">
            El saldo actual es <strong>{fmt(currentBalance)}</strong>. ¿Deseas cerrar la caja del día?
          </p>
        </Modal>
      )}
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: string; color: "blue" | "green" | "red" | "gray" }) {
  const cls = { blue: "border-blue-200 bg-blue-50 text-blue-800", green: "border-green-200 bg-green-50 text-green-800", red: "border-red-200 bg-red-50 text-red-800", gray: "border-gray-200 bg-gray-50 text-gray-800" }[color];
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
