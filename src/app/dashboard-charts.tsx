"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type {
  VentaDiaria,
  TopProducto,
} from "@/services/dashboard.service";

function fmtTooltip(value: unknown): [string, string] {
  return [`${Number(value).toLocaleString()} CUP`, "Total"];
}

export function VentasDiariasChart({ data }: { data: VentaDiaria[] }) {
  if (data.length === 0) {
    return <EmptyState text="Sin datos de ventas por día" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => String(v).slice(5)}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip
          formatter={fmtTooltip}
          labelFormatter={(label) => `Fecha: ${String(label)}`}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
          }}
        />
        <Bar
          dataKey="totalCup"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          name="Total CUP"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductosChart({ data }: { data: TopProducto[] }) {
  if (data.length === 0) {
    return <EmptyState text="Sin datos de productos vendidos" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <YAxis
          type="category"
          dataKey="producto"
          tick={{ fontSize: 11 }}
          width={120}
        />
        <Tooltip
          formatter={fmtTooltip}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
          }}
        />
        <Bar
          dataKey="totalCup"
          fill="#16a34a"
          radius={[0, 4, 4, 0]}
          name="Total CUP"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-muted text-sm">
      {text}
    </div>
  );
}
