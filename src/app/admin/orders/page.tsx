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
  { key: "all",        label: "Toutes" },
  { key: "pending",    label: "En attente" },
  { key: "preparing",  label: "En cuisine" },
  { key: "ready",      label: "Prêtes" },
  { key: "delivering", label: "En livraison" },
  { key: "delivered",  label: "Livrées" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente",   color: "#D97706" },
  preparing:  { label: "En cuisine",   color: "#2563EB" },
  ready:      { label: "Prête",        color: "#16A34A" },
  delivering: { label: "En livraison", color: "#7C3AED" },
  delivered:  { label: "Livrée",       color: "#9CA3AF" },
};

const NEXT_STATUS: Record<string, string | null> = {
  pending: null, preparing: "ready", ready: "delivering", delivering: "delivered", delivered: null,
};

const NEXT_LABEL: Record<string, string> = {
  preparing: "Marquer prête", ready: "Livrer", delivering: "Terminer",
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
    if (res.ok) { toast.success("Statut mis à jour."); fetchOrders(true); }
    else { toast.error("Erreur lors de la mise à jour."); }
    setStatusDialog(null);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const res = await apiFetch(`/orders/${deleteDialog.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Commande supprimée."); fetchOrders(true); }
    else { toast.error("Erreur lors de la suppression."); }
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
    <div className="min-h-screen p-8" style={{ background: "#F0EEE9" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#AAA" }}>
              Suivi
            </p>
            <h1 className="text-2xl font-light tracking-tight" style={{ color: "#141414" }}>
              Commandes
            </h1>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-40"
            style={{ color: "#AAA" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#141414"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#AAA"; }}
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Filtres — pills monospace */}
        <div className="flex flex-wrap gap-px mb-6" style={{ background: "#E5E2DC" }}>
          {STATUSES.map((s) => {
            const count = countByStatus(s.key);
            const active = filter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors"
                style={active
                  ? { background: "#141414", color: "#FFFFFF" }
                  : { background: "#FEFCF8", color: "#888" }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#141414"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#888"; }}
              >
                {s.label}
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5"
                  style={active
                    ? { color: "#888", background: "rgba(255,255,255,0.12)" }
                    : { color: "#BBB", background: "#F0EEE9" }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="mb-6 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#BBB" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par employé, plat ou numéro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none transition-all"
            style={{ background: "#FFFFFF", border: "1px solid #E5E2DC", color: "#141414" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#C84B31"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#E5E2DC"; }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E2DC" }}>

          {/* En-têtes */}
          <div className="grid gap-px"
            style={{ gridTemplateColumns: "60px 1.5fr 1fr 100px 80px 150px", background: "#E5E2DC" }}>
            {["#", "Employé", "Plat", "Date", "Heure", "Actions"].map((h) => (
              <div key={h} className="px-4 py-3" style={{ background: "#FEFCF8" }}>
                <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#AAA" }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Lignes */}
          <div className="divide-y" style={{ borderColor: "#F7F5F0" }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid gap-4 px-4 py-4"
                  style={{ gridTemplateColumns: "60px 1.5fr 1fr 100px 80px 150px" }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-3 rounded animate-pulse" style={{ background: "#F0EEE9" }} />
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-light" style={{ color: "#CCC" }}>Aucune commande trouvée</p>
                <p className="text-xs mt-1" style={{ color: "#DDD" }}>Modifiez vos filtres ou la recherche</p>
              </div>
            ) : (
              filtered.map((order) => {
                const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                const nextStatus = NEXT_STATUS[order.status];
                const nextLabel = NEXT_LABEL[order.status];

                return (
                  <div
                    key={order.id}
                    className="grid items-center group transition-colors"
                    style={{ gridTemplateColumns: "60px 1.5fr 1fr 100px 80px 150px" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEFCF8"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* ID */}
                    <div className="px-4 py-3.5">
                      <span className="font-mono text-xs" style={{ color: "#CCC" }}>#{order.id}</span>
                    </div>

                    {/* Employé */}
                    <div className="px-4 py-3.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center font-mono text-xs font-light"
                        style={{ background: "#F0EEE9", color: "#C84B31" }}>
                        {order.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "#141414" }}>{order.user?.name ?? "—"}</p>
                        <p className="text-[10px] truncate" style={{ color: "#CCC" }}>{order.user?.email ?? ""}</p>
                      </div>
                    </div>

                    {/* Plat */}
                    <div className="px-4 py-3.5">
                      <p className="text-xs font-medium" style={{ color: "#141414" }}>{order.dish?.name ?? "—"}</p>
                      {order.dish && (
                        <p className="font-mono text-[10px] mt-0.5" style={{ color: "#BBB" }}>
                          {parseInt(order.dish.price).toLocaleString("fr-FR")} F
                        </p>
                      )}
                    </div>

                    {/* Date menu */}
                    <div className="px-4 py-3.5">
                      <span className="font-mono text-[10px]" style={{ color: "#BBB" }}>
                        {order.menu?.menu_date
                          ? new Date(order.menu.menu_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
                          : "—"}
                      </span>
                    </div>

                    {/* Heure */}
                    <div className="px-4 py-3.5">
                      <span className="font-mono text-[10px]" style={{ color: "#BBB" }}>
                        {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {nextStatus && (
                        <button
                          onClick={() => setStatusDialog({ order, next: nextStatus })}
                          className="text-[11px] font-medium transition-colors"
                          style={{ color: "#888" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#141414"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
                        >
                          {nextLabel}
                        </button>
                      )}
                      {nextStatus && <span style={{ color: "#E5E2DC" }}>·</span>}
                      <button
                        onClick={() => setDeleteDialog(order)}
                        className="text-[11px] font-medium transition-colors"
                        style={{ color: "#888" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#C84B31"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F0EEE9" }}>
              <span className="font-mono text-[11px]" style={{ color: "#CCC" }}>
                {filtered.length} / {orders.length} commande(s)
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "#BBB" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C84B31"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}
                >
                  Effacer
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        open={!!statusDialog}
        title="Changer le statut"
        message={`Passer la commande #${statusDialog?.order.id} (${statusDialog?.order.dish?.name}) au statut "${statusDialog ? STATUS_MAP[statusDialog.next]?.label : ""}" ?`}
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
