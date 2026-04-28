"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface Order {
  id: number;
  status: string;
  created_at: string;
  dish: { id: number; name: string; price: string } | null;
  user: { id: number; name: string; email: string } | null;
  menu: { id: number; menu_date: string } | null;
}

const STATUSES = [
  { key: "all",        label: "Toutes",       color: "bg-gray-100 text-gray-700" },
  { key: "pending",    label: "En attente",   color: "bg-orange-100 text-orange-700" },
  { key: "preparing",  label: "En cuisine",   color: "bg-blue-100 text-blue-700" },
  { key: "ready",      label: "Prêtes",       color: "bg-green-100 text-green-700" },
  { key: "delivering", label: "En livraison", color: "bg-purple-100 text-purple-700" },
  { key: "delivered",  label: "Livrées",      color: "bg-gray-100 text-gray-500" },
];

const STATUS_MAP: Record<string, { label: string; dot: string; badge: string }> = {
  pending:    { label: "En attente",   dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
  preparing:  { label: "En cuisine",   dot: "bg-blue-400",   badge: "bg-blue-100 text-blue-700" },
  ready:      { label: "Prête",        dot: "bg-green-400",  badge: "bg-green-100 text-green-700" },
  delivering: { label: "En livraison", dot: "bg-purple-400", badge: "bg-purple-100 text-purple-700" },
  delivered:  { label: "Livrée",       dot: "bg-gray-300",   badge: "bg-gray-100 text-gray-500" },
};

const NEXT_STATUS: Record<string, string | null> = {
  pending:    "preparing",
  preparing:  "ready",
  ready:      "delivering",
  delivering: "delivered",
  delivered:  null,
};

const NEXT_LABEL: Record<string, string> = {
  pending:    "Préparer",
  preparing:  "Marquer prête",
  ready:      "Livrer",
  delivering: "Terminer",
};

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ order: Order; next: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const res = await apiFetch("/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    const res = await apiFetch(`/orders/${statusDialog.order.id}`, {
      method: "PUT",
      body: JSON.stringify({ status: statusDialog.next }),
    });
    if (res.ok) {
      toast.success("Statut mis à jour.");
      fetchOrders(true);
    } else {
      toast.error("Erreur lors de la mise à jour.");
    }
    setStatusDialog(null);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const res = await apiFetch(`/orders/${deleteDialog.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Commande supprimée.");
      fetchOrders(true);
    } else {
      toast.error("Erreur lors de la suppression.");
    }
    setDeleteDialog(null);
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.dish?.name.toLowerCase().includes(q) ||
      o.user?.name.toLowerCase().includes(q) ||
      o.user?.email.toLowerCase().includes(q) ||
      String(o.id).includes(q);
    return matchStatus && matchSearch;
  });

  const countByStatus = (key: string) =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestion des commandes</h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} commande(s) au total</p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Filters tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => {
          const count = countByStatus(s.key);
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === s.key
                  ? "bg-[#1A1D2E] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                filter === s.key ? "bg-white/20 text-white" : s.color
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par employé, plat ou numéro…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["#", "Employé", "Plat", "Menu", "Statut", "Heure", "Actions"].map((h) => (
                <th key={h} className="px-6 py-4 text-left">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">Aucune commande trouvée</p>
                    <p className="text-xs text-gray-300 mt-1">Essayez de modifier vos filtres</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                const nextStatus = NEXT_STATUS[order.status];
                const nextLabel = NEXT_LABEL[order.status];

                return (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                    </td>

                    {/* Employé */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">
                            {order.user?.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{order.user?.name ?? "—"}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">{order.user?.email ?? ""}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plat */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{order.dish?.name ?? "—"}</span>
                      {order.dish && (
                        <p className="text-xs text-gray-400">
                          {parseInt(order.dish.price).toLocaleString("fr-FR")} FCFA
                        </p>
                      )}
                    </td>

                    {/* Menu date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">
                        {order.menu?.menu_date
                          ? new Date(order.menu.menu_date).toLocaleDateString("fr-FR")
                          : "—"}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>

                    {/* Heure */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {nextStatus && (
                          <button
                            onClick={() => setStatusDialog({ order, next: nextStatus })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {nextLabel}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteDialog(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!statusDialog}
        title="Changer le statut"
        message={`Passer la commande #${statusDialog?.order.id} (${statusDialog?.order.dish?.name}) au statut "${
          statusDialog ? STATUS_MAP[statusDialog.next]?.label : ""
        }" ?`}
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="info"
        onConfirm={handleStatusChange}
        onCancel={() => setStatusDialog(null)}
      />

      <ConfirmDialog
        open={!!deleteDialog}
        title="Supprimer la commande"
        message={`Supprimer définitivement la commande #${deleteDialog?.id} de ${deleteDialog?.user?.name} ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </div>
  );
}
