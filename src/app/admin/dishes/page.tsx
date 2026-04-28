"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
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
    const av = a[sortConfig.key as keyof Dish];
    const bv = b[sortConfig.key as keyof Dish];
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? (
      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d={sortConfig.direction === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Catalogue des plats</h1>
          <p className="text-sm text-gray-400 mt-1">{dishes.length} plat(s) enregistré(s)</p>
        </div>
        <Link
          href="/admin/dishes/add"
          className="inline-flex items-center gap-2 bg-[#1A1D2E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#252840] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un plat
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un plat…"
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
              <th className="px-6 py-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Plat</span>
              </th>
              <th
                className="px-6 py-4 text-left cursor-pointer select-none group"
                onClick={() => requestSort("type_plat")}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                  Type <SortIcon col="type_plat" />
                </span>
              </th>
              <th
                className="px-6 py-4 text-left cursor-pointer select-none group"
                onClick={() => requestSort("price")}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                  Prix <SortIcon col="price" />
                </span>
              </th>
              <th
                className="px-6 py-4 text-center cursor-pointer select-none group"
                onClick={() => requestSort("orders_count")}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                  Ventes <SortIcon col="orders_count" />
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">
                  Aucun plat trouvé.
                </td>
              </tr>
            ) : (
              sorted.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {dish.image ? (
                          <img
                            src={`http://resto-api.test/storage/${dish.image}`}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{dish.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{dish.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                      {dish.type_plat || "standard"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-700">
                      {parseInt(dish.price).toLocaleString("fr-FR")} <span className="text-xs font-normal text-gray-400">FCFA</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                      dish.orders_count > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-400"
                    }`}>
                      {dish.orders_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/dishes/add?edit=${dish.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(dish)}
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
              ))
            )}
          </tbody>
        </table>
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
