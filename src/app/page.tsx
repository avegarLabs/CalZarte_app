import Link from "next/link";

export const dynamic = "force-dynamic";

import { obtenerTasasActivas } from "@/services/tasa-cambio.service";
import { obtenerDashboardData } from "@/services/dashboard.service";
import { formatMoney } from "@/lib/money";
import { MONEDA_NACIONAL } from "@/db/constants";

import {
  VentasDiariasChart,
  TopProductosChart,
} from "./dashboard-charts";

export default function HomePage() {
  const { kpis, ventasPorDia, topProductos } = obtenerDashboardData();
  const tasas = obtenerTasasActivas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <p className="text-sm text-muted">
            Resumen general de CalZarte
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Ingresos Totales"
          value={formatMoney(kpis.revenueCupCents, MONEDA_NACIONAL)}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          accent="text-success"
          href="/ventas"
        />
        <KpiCard
          title="Ventas Completadas"
          value={String(kpis.ventasCompletadas)}
          sub={
            kpis.ventasCanceladas > 0
              ? `${kpis.ventasCanceladas} canceladas`
              : undefined
          }
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
          accent="text-primary"
          href="/ventas"
        />
        <KpiCard
          title="Productos / Stock"
          value={`${kpis.totalProductos}`}
          sub={`${kpis.totalStock} unidades en stock`}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          accent="text-violet-600"
          href="/productos"
        />
      </div>

      {/* Tasas activas */}
      {tasas.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Tasas de Cambio Activas
            </h2>
            <Link
              href="/tasas"
              className="text-xs text-primary hover:underline"
            >
              Administrar
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {tasas.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm"
              >
                <span className="font-semibold text-primary">{t.moneda}</span>
                <span className="text-muted">=</span>
                <span className="font-mono font-medium">
                  {formatMoney(t.valorCents, MONEDA_NACIONAL)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ventas por día */}
        <ChartCard title="Ventas por Día" subtitle="Ingresos diarios en CUP">
          <VentasDiariasChart data={ventasPorDia} />
        </ChartCard>

        {/* Top productos */}
        <ChartCard
          title="Top Productos"
          subtitle="Productos con mayor ingreso en CUP"
        >
          <TopProductosChart data={topProductos} />
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
  href,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">
          {title}
        </p>
        <span className={`${accent} opacity-70`}>{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
