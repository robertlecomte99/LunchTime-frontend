"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area,
} from "recharts";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Dish { id: number; name: string; price: string; orders_count: number; }
interface Order {
  id: number; status: string; created_at: string;
  dish: { id: number; name: string; price: string };
  user: { id: number; name: string; email: string };
}
interface DailyStat { date: string; total: number; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente",   color: "#D97706" },
  preparing:  { label: "En cuisine",   color: "#2563EB" },
  ready:      { label: "Prête",        color: "#16A34A" },
  delivering: { label: "En livraison", color: "#7C3AED" },
  delivered:  { label: "Livrée",       color: "#9CA3AF" },
};

function Ticket({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between p-5"
      style={{ background: "#FFFFFF", borderLeft: `3px solid ${accent ? "#C84B31" : "#E5E2DC"}` }}>
      <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "#999" }}>{label}</p>
      <p className="font-mono text-3xl font-light leading-none tracking-tight"
        style={{ color: accent ? "#C84B31" : "#141414" }}>{value}</p>
      {sub && <p className="text-[11px] mt-2" style={{ color: "#AAA" }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/dishes").then((r) => r.json()),
      apiFetch("/orders/today").then((r) => r.json()),
      apiFetch("/orders/daily-stats").then((r) => r.json()),
    ]).then(([d, o, s]) => {
      setDishes(d);
      setTodayOrders(Array.isArray(o) ? o : []);
      setDailyStats(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  const totalOrders = dishes.reduce((acc, d) => acc + d.orders_count, 0);
  const bestSeller = [...dishes].sort((a, b) => b.orders_count - a.orders_count)[0];
  const maxSales = Math.max(...dishes.map((d) => d.orders_count), 0);
  const chartData = dishes.map((d) => ({ name: d.name, ventes: d.orders_count }));
  const employeeMap: Record<number, { user: Order["user"]; orders: Order[] }> = {};
  todayOrders.forEach((o) => {
    if (!o.user) return;
    if (!employeeMap[o.user.id]) employeeMap[o.user.id] = { user: o.user, orders: [] };
    employeeMap[o.user.id].orders.push(o);
  });
  const employees = Object.values(employeeMap);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#F0EEE9" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#E5E2DC", borderTopColor: "#C84B31" }} />
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "#AAA" }}>Chargement…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0EEE9" }}>
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#AAA" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-2xl font-light tracking-tight" style={{ color: "#141414" }}>Vue d&apos;ensemble</h1>
        </div>

        {/* KPIs — style tickets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-8" style={{ background: "#D4D0C8" }}>
          <Ticket label="Aujourd'hui" value={todayOrders.length} sub={`${employees.length} employé(s)`} accent />
          <Ticket label="Total commandes" value={totalOrders} sub="Depuis le début" />
          <Ticket label="Plat vedette" value={bestSeller?.orders_count ?? 0} sub={bestSeller?.name ?? "—"} />
          <Ticket label="Catalogue" value={dishes.length} sub="plats disponibles" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px mb-8" style={{ background: "#D4D0C8" }}>
          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#AAA" }}>Ventes par plat</p>
            <p className="text-xs mb-5" style={{ color: "#BBB" }}>Volume total de commandes</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEE9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#BBB", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#BBB", fontSize: 10 }} />
                  <Tooltip cursor={{ fill: "#F7F5F0" }} contentStyle={{ borderRadius: "4px", border: "1px solid #E5E2DC", boxShadow: "none", fontSize: 11, fontFamily: "monospace" }} />
                  <Bar dataKey="ventes" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.ventes === maxSales && maxSales > 0 ? "#C84B31" : "#D4D0C8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#AAA" }}>Activité</p>
            <p className="text-xs mb-5" style={{ color: "#BBB" }}>Commandes sur 30 jours</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C84B31" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#C84B31" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEE9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#BBB", fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#BBB", fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: "4px", border: "1px solid #E5E2DC", boxShadow: "none", fontSize: 11, fontFamily: "monospace" }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString("fr-FR")} />
                  <Area type="monotone" dataKey="total" stroke="#C84B31" strokeWidth={1.5} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Commandes du jour */}
        <div style={{ background: "#FFFFFF" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F0EEE9" }}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#AAA" }}>Commandes du jour</p>
              <p className="text-xs mt-0.5" style={{ color: "#CCC" }}>{todayOrders.length} commande(s)</p>
            </div>
            <span className="font-mono text-xs" style={{ color: "#D4D0C8" }}>{new Date().toLocaleDateString("fr-FR")}</span>
          </div>

          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-light" style={{ color: "#CCC" }}>Aucune commande aujourd&apos;hui</p>
              <p className="text-xs mt-1" style={{ color: "#DDD" }}>Le menu sera visible une fois publié</p>
            </div>
          ) : (
            <div>
              {employees.map(({ user, orders }, idx) => (
                <div key={user.id} className="px-6 py-4 flex items-start gap-5"
                  style={{ borderBottom: idx < employees.length - 1 ? "1px solid #F7F5F0" : "none" }}>
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm font-light"
                    style={{ background: "#F0EEE9", color: "#C84B31" }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#141414" }}>{user.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#CCC" }}>{user.email}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    {orders.map((o) => {
                      const s = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
                      return (
                        <div key={o.id} className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{ color: "#555" }}>{o.dish?.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5"
                            style={{ color: s.color, background: `${s.color}18` }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
