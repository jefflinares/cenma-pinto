'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatQ(value: number) {
  return `Q ${new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

type KpiCardProps = {
  label: string;
  value: number;
  color: 'green' | 'red' | 'gray';
};

function KpiCard({ label, value, color }: KpiCardProps) {
  const styles = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${styles[color]}`}>
      <span className="text-sm font-medium opacity-80">{label}</span>
      <span className="text-lg font-bold leading-tight truncate" title={formatQ(value)}>{formatQ(value)}</span>
    </div>
  );
}

type DashboardData = {
  kpis: {
    ventasMes: number;
    cobrosRealizados: number;
    cobrosPendientes: number;
    pagosProveedores: number;
    pagosPendientesProveedores: number;
    comisionesMes: number;
  };
  ingresosPorClasificacion: { name: string; cantidad: number }[];
  ingresosPorProducto: { name: string; cantidad: number }[];
  ventasYCobrosPorMes: { mes: string; ventas: number; cobros: number }[];
  comisionesPorMes: { mes: string; comisiones: number }[];
};

export default function InicioDashboard() {
  const [month, setMonth] = useState(currentMonth);
  const { data, isLoading } = useSWR<DashboardData>(`/api/dashboard?month=${month}`, fetcher);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* KPI Cards */}
      {isLoading || !data?.kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-gray-50 p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Ventas del mes" value={data.kpis.ventasMes} color="green" />
          <KpiCard label="Cobros realizados" value={data.kpis.cobrosRealizados} color="green" />
          <KpiCard label="Cobros pendientes" value={data.kpis.cobrosPendientes} color="red" />
          <KpiCard label="Pagos proveedores" value={data.kpis.pagosProveedores} color="gray" />
          <KpiCard label="Pend. proveedores" value={data.kpis.pagosPendientesProveedores} color="red" />
          <KpiCard label="Comisiones" value={data.kpis.comisionesMes} color="green" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Ingresos por clasificación */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos por clasificación</h2>
          {isLoading || !data?.kpis ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : data.ingresosPorClasificacion.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.ingresosPorClasificacion}
                  dataKey="cantidad"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.ingresosPorClasificacion.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} unidades`, 'Cantidad']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Ingresos por producto */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos por producto</h2>
          {isLoading || !data?.kpis ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : data.ingresosPorProducto.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.ingresosPorProducto.slice(0, 10)}
                layout="vertical"
                margin={{ left: 16, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} unidades`, 'Cantidad']} />
                <Bar dataKey="cantidad" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar grouped: Ventas vs Cobros 6 meses */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ventas vs Cobros — últimos 6 meses</h2>
          {isLoading || !data?.kpis ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.ventasYCobrosPorMes} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatQ(Number(v))]} />
                <Legend />
                <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cobros" name="Cobros" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Comisiones 6 meses */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Comisiones — últimos 6 meses</h2>
          {isLoading || !data?.kpis ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.comisionesPorMes} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatQ(Number(v)), 'Comisiones']} />
                <Bar dataKey="comisiones" name="Comisiones" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
