"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area,
} from "recharts";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Dish {
  id: number;
  name: string;
  price: string;
  orders_count: number;
}

interface Order {
  id: number;
  status: string;
  created_at: string;
  dish: { id: number; name: string; price: string };
  user: { id: number; name: string; email: string };
}

interface DailyStat {
  date: string;
  total: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "text-orange-600", bg: "bg-orange-100" },
  preparing: { label: "En cuisine",  color: "text-blue-600",   bg: "bg-blue-100"   },
  ready:     { label: "Prête",       color: "text-green-600",  bg: "bg-green-100"  },
  delivering:{ label: "En livraison",color: "text-purple-600", bg: "bg-purple-100" },
  delivered: { label: "Livrée",      color: "text-gray-500",   bg: "bg-gray-100"   },
};

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-black ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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

  // Regrouper les commandes par employé
  const employeeMap: Record<number, { user: Order["user"]; orders: Order[] }> = {};
  todayOrders.forEach((o) => {
    if (!o.user) return;
    if (!employeeMap[o.user.id]) employeeMap[o.user.id] = { user: o.user, orders: [] };
    employeeMap[o.user.id].orders.push(o);
  });
  const employees = Object.values(employeeMap);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total commandes" value={totalOrders} sub="Depuis le début" accent="text-gray-900" />
        <KpiCard label="Commandes aujourd'hui" value={todayOrders.length} sub={`${employees.length} employé(s)`} accent="text-amber-600" />
        <KpiCard label="Plat vedette" value={bestSeller?.name ?? "—"} sub={`${bestSeller?.orders_count ?? 0} commandes`} accent="text-orange-600" />
        <KpiCard label="Plats au catalogue" value={dishes.length} sub="Disponibles" accent="text-blue-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar chart: ventes par plat */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-1">Ventes par plat</h2>
          <p className="text-xs text-gray-400 mb-6">Volume total de commandes</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                />
                <Bar dataKey="ventes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.ventes === maxSales && maxSales > 0 ? "#f59e0b" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area chart: commandes par jour */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-1">Commandes / Jour</h2>
          <p className="text-xs text-gray-400 mb-6">30 derniers jours</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("fr-FR")}
                />
                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Commandes du jour par employé */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-700">Commandes du jour par employé</h2>
            <p className="text-xs text-gray-400">{todayOrders.length} commande(s) au total</p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Aucune commande aujourd'hui</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map(({ user, orders }) => (
              <div key={user.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">{user.name[0].toUpperCase()}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                {/* Commandes */}
                <div className="flex flex-col gap-1.5 items-end">
                  {orders.map((o) => {
                    const s = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
                    return (
                      <div key={o.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">{o.dish?.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
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
  );
}
