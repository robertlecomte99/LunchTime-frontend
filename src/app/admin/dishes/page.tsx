"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image_path: string | null;
  type_plat: string;
  orders_count: number;
}

export default function DishesListPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "orders_count", direction: "desc" });
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [search, setSearch] = useState("");

  const fetchDishes = async () => {
    const res = await apiFetch("/dishes");
    const data = await res.json();
    setDishes(data);
    setLoading(false);
  };

  useEffect(() => { fetchDishes(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await apiFetch(`/dishes/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`"${deleteTarget.name}" supprimé.`);
      fetchDishes();
    } else {
      toast.error("Erreur lors de la suppression.");
    }
    setDeleteTarget(null);
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const filtered = dishes.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortConfig.key as keyof Dish] ?? "";
    const bv = b[sortConfig.key as keyof Dish] ?? "";
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        style={{ color: "#C84B31" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d={sortConfig.direction === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        style={{ color: "#D4D0C8" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0EEE9" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#AAA" }}>
              Gestion
            </p>
            <h1 className="text-2xl font-light tracking-tight" style={{ color: "#141414" }}>
              Catalogue des plats
            </h1>
          </div>
          <Link
            href="/admin/dishes/add"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: "#141414", color: "#FFFFFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#C84B31"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#141414"; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un plat
          </Link>
        </div>

        {/* Recherche */}
        <div className="mb-6 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#BBB" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un plat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none transition-all"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E2DC",
              color: "#141414",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#C84B31"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#E5E2DC"; }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E2DC" }}>

          {/* En-têtes */}
          <div className="grid gap-px" style={{
            gridTemplateColumns: "2fr 1fr 1fr 80px 120px",
            background: "#E5E2DC",
          }}>
            {[
              { label: "Plat", col: null },
              { label: "Type", col: "type_plat" },
              { label: "Prix", col: "price" },
              { label: "Ventes", col: "orders_count" },
              { label: "Actions", col: null },
            ].map(({ label, col }) => (
              <div
                key={label}
                onClick={() => col && requestSort(col)}
                className={`px-5 py-3 flex items-center gap-1.5 ${col ? "cursor-pointer select-none" : ""}`}
                style={{ background: "#FEFCF8" }}
              >
                <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#AAA" }}>
                  {label}
                </span>
                {col && <SortIcon col={col} />}
              </div>
            ))}
          </div>

          {/* Lignes */}
          <div className="divide-y" style={{ borderColor: "#F7F5F0" }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid gap-px px-5 py-4" style={{ gridTemplateColumns: "2fr 1fr 1fr 80px 120px" }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-3 rounded animate-pulse" style={{ background: "#F0EEE9" }} />
                  ))}
                </div>
              ))
            ) : sorted.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-light" style={{ color: "#CCC" }}>Aucun plat trouvé</p>
              </div>
            ) : (
              sorted.map((dish) => (
                <div
                  key={dish.id}
                  className="grid items-center gap-px group transition-colors"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 80px 120px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEFCF8"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Plat */}
                  <div className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 flex-shrink-0 overflow-hidden" style={{ background: "#F0EEE9" }}>
                      {dish.image_path ? (
                      <img
                      src={dish.image_path}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-[10px]"
                          style={{ color: "#CCC" }}>—</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#141414" }}>{dish.name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "#BBB" }}>{dish.description}</p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="px-5 py-3.5">
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider"
                      style={dish.type_plat === "daily"
                        ? { color: "#C84B31", background: "#C84B3115" }
                        : { color: "#888", background: "#F0EEE9" }
                      }
                    >
                      {dish.type_plat || "standard"}
                    </span>
                  </div>

                  {/* Prix */}
                  <div className="px-5 py-3.5">
                    <span className="font-mono text-sm" style={{ color: "#141414" }}>
                      {parseInt(dish.price).toLocaleString("fr-FR")}
                    </span>
                    <span className="font-mono text-[10px] ml-1" style={{ color: "#BBB" }}>F</span>
                  </div>

                  {/* Ventes */}
                  <div className="px-5 py-3.5">
                    <span
                      className="font-mono text-sm"
                      style={{ color: dish.orders_count > 0 ? "#C84B31" : "#D4D0C8" }}
                    >
                      {dish.orders_count}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/dishes/add?edit=${dish.id}`}
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: "#888" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#141414"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
                    >
                      Modifier
                    </Link>
                    <span style={{ color: "#E5E2DC" }}>·</span>
                    <button
                      onClick={() => setDeleteTarget(dish)}
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: "#888" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#C84B31"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer compteur */}
          {!loading && sorted.length > 0 && (
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F0EEE9" }}>
              <span className="font-mono text-[11px]" style={{ color: "#CCC" }}>
                {sorted.length} plat(s)
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "#BBB" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C84B31"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le plat"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
