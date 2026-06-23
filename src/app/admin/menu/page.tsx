"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface Dish {
  id: number;
  name: string;
  price: string;
  type_plat: string;
  image: string | null;
  pivot?: { is_featured: boolean };
}

interface TodayMenu {
  id: number;
  menu_date: string;
  order_deadline: string;
  is_published: boolean;
  dishes: Dish[];
}

// ─────────────────────────────────────────────
// Composant réutilisable : liste de sélection de plats
// ─────────────────────────────────────────────
function DishSelector({
  dishes,
  selectedDishes,
  featuredDish,
  onToggle,
  onFeature,
}: {
  dishes: Dish[];
  selectedDishes: number[];
  featuredDish: number | null;
  onToggle: (id: number) => void;
  onFeature: (id: number | null) => void;
}) {
  const grouped: Record<string, Dish[]> = {};
  dishes.forEach((d) => {
    const cat = d.type_plat || "standard";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(d);
  });

  return (
    <div className="p-4 space-y-5 max-h-[600px] overflow-y-auto">
      {Object.entries(grouped).map(([category, catDishes]) => (
        <div key={category}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
            {category}
          </p>
          <div className="space-y-2">
            {catDishes.map((dish) => {
              const checked = selectedDishes.includes(dish.id);
              const isFeatured = featuredDish === dish.id;
              return (
                <div
                  key={dish.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    checked
                      ? isFeatured
                        ? "border-amber-300 bg-amber-50"
                        : "border-blue-200 bg-blue-50/50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => onToggle(dish.id)}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {dish.image ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${dish.image}`}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{dish.name}</p>
                    <p className="text-xs text-gray-400">{parseInt(dish.price).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  {/* Featured toggle — uniquement pour les plats de type "daily" */}
                  {checked && dish.type_plat === "daily" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFeature(isFeatured ? null : dish.id);
                      }}
                      title={isFeatured ? "Retirer du plat du jour" : "Définir comme plat du jour"}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isFeatured
                          ? "bg-amber-400 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet 1 : Menu d'aujourd'hui (lecture + modification)
// ─────────────────────────────────────────────
function TodayTab({ allDishes }: { allDishes: Dish[] }) {
  const [todayMenu, setTodayMenu] = useState<TodayMenu | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [featuredDish, setFeaturedDish] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("11:30");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchTodayMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await apiFetch("/menus/current");
      if (res.status === 404) { setNotFound(true); setLoadingMenu(false); return; }
      const data: TodayMenu = await res.json();
      setTodayMenu(data);
      setNotFound(false);
      setSelectedDishes(data.dishes.map((d) => d.id));
      setFeaturedDish(data.dishes.find((d) => d.pivot?.is_featured)?.id ?? null);
      setDeadline(data.order_deadline ?? "11:30");
    } catch {
      setNotFound(true);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => { fetchTodayMenu(); }, []);

  const handleToggle = (id: number) => {
    setSelectedDishes((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    if (featuredDish === id) setFeaturedDish(null);
  };

  const handleSave = async () => {
    if (!todayMenu) return;
    setSaving(true);
    const res = await apiFetch(`/menus/${todayMenu.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishes: selectedDishes,
        featured_dish: featuredDish,
        order_deadline: deadline,
      }),
    });
    setSaving(false);
    setShowConfirm(false);
    if (res.ok) {
      toast.success("Menu mis à jour !");
      setEditing(false);
      fetchTodayMenu();
    } else {
      const err = await res.json();
      toast.error(err.message || "Erreur lors de la mise à jour.");
    }
  };

  const handleCancelEdit = () => {
    if (!todayMenu) return;
    setSelectedDishes(todayMenu.dishes.map((d) => d.id));
    setFeaturedDish(todayMenu.dishes.find((d) => d.pivot?.is_featured)?.id ?? null);
    setDeadline(todayMenu.order_deadline ?? "11:30");
    setEditing(false);
  };

  if (loadingMenu) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !todayMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-500">Aucun menu publié pour aujourd'hui</p>
        <p className="text-xs text-gray-400 mt-1">Utilisez l'onglet "Publier" pour créer le menu du jour.</p>
      </div>
    );
  }

  const todayDateStr = new Date(todayMenu.menu_date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  // ── Mode lecture ──
  if (!editing) {
    const featured = todayMenu.dishes.find((d) => d.pivot?.is_featured);
    const others = todayMenu.dishes.filter((d) => !d.pivot?.is_featured);

    return (
      <div className="space-y-6">
        {/* Bandeau info + bouton modifier */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 capitalize">{todayDateStr}</p>
              <p className="text-xs text-gray-400">
                Deadline : <span className="font-semibold text-gray-600">{todayMenu.order_deadline}</span>
                &nbsp;·&nbsp;{todayMenu.dishes.length} plat(s)
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1D2E] text-white text-xs font-bold hover:bg-[#252840] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier ce menu
          </button>
        </div>

        {/* Plat featured */}
        {featured && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-amber-500">⭐</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Plat du Jour</h2>
            </div>
            <div className="flex items-center gap-4 p-5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {featured.image ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${featured.image}`} alt={featured.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                )}
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">{featured.name}</p>
                <p className="text-sm text-amber-600 font-semibold mt-0.5">{parseInt(featured.price).toLocaleString("fr-FR")} FCFA</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">{featured.type_plat || "standard"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Autres plats */}
        {others.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Autres plats du menu</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {others.map((dish) => (
                <div key={dish.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {dish.image ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${dish.image}`} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{dish.name}</p>
                    <p className="text-xs text-gray-400">{parseInt(dish.price).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">{dish.type_plat || "standard"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Mode édition ──
  const featuredInAll = allDishes.find((d) => d.id === featuredDish);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Paramètres</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure limite de commande</label>
              <input
                type="time"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Plats sélectionnés</span>
                <span className="text-sm font-bold text-gray-800">{selectedDishes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Plat du jour</span>
                <span className="text-sm font-bold text-amber-600 truncate max-w-[120px]">
                  {featuredInAll?.name ?? "Non défini"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Limite</span>
                <span className="text-sm font-bold text-gray-800">{deadline}</span>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#1A1D2E] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#252840] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer les modifications
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-700">Modifier les plats du menu</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cochez les plats à inclure, puis marquez le{" "}
                <span className="text-amber-600 font-semibold">⭐ Plat du Jour</span>
              </p>
            </div>
            <DishSelector
              dishes={allDishes}
              selectedDishes={selectedDishes}
              featuredDish={featuredDish}
              onToggle={handleToggle}
              onFeature={setFeaturedDish}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Modifier le menu"
        message={`Appliquer les modifications au menu du ${todayDateStr} ?`}
        confirmLabel={saving ? "Enregistrement…" : "Confirmer"}
        cancelLabel="Annuler"
        variant="info"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Onglet 2 : Publier un nouveau menu
// ─────────────────────────────────────────────
function PublishTab({ dishes }: { dishes: Dish[] }) {
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [featuredDish, setFeaturedDish] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("11:30");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = (id: number) => {
    setSelectedDishes((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    if (featuredDish === id) setFeaturedDish(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await apiFetch("/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_date: menuDate,
        dishes: selectedDishes,
        featured_dish: featuredDish,
        order_deadline: deadline,
      }),
    });
    setLoading(false);
    setShowConfirm(false);
    if (res.ok) {
      toast.success("Menu publié avec succès !");
      setSelectedDishes([]);
      setFeaturedDish(null);
    } else {
      const err = await res.json();
      toast.error(err.message || "Erreur lors de la publication.");
    }
  };

  const isValid = menuDate && selectedDishes.length > 0 && featuredDish !== null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Paramètres</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Date du menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={menuDate}
                  onChange={(e) => setMenuDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure limite de commande</label>
                <input
                  type="time"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">Les commandes seront bloquées après cet horaire</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Plats sélectionnés</span>
                <span className="text-sm font-bold text-gray-800">{selectedDishes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Plat du jour</span>
                <span className="text-sm font-bold text-amber-600 truncate max-w-[120px]">
                  {featuredDish ? dishes.find((d) => d.id === featuredDish)?.name ?? "—" : "Non défini"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Limite</span>
                <span className="text-sm font-bold text-gray-800">{deadline}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => setShowConfirm(true)}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-[#1A1D2E] disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl text-sm font-bold hover:bg-[#252840] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Publier ce menu
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-700">Sélectionnez les plats</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cochez les plats à inclure, puis marquez le <span className="text-amber-600 font-semibold">⭐ Plat du Jour</span>
              </p>
            </div>
            <DishSelector
              dishes={dishes}
              selectedDishes={selectedDishes}
              featuredDish={featuredDish}
              onToggle={handleToggle}
              onFeature={setFeaturedDish}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Publier le menu"
        message={`Publier le menu du ${new Date(menuDate).toLocaleDateString("fr-FR")} avec ${selectedDishes.length} plat(s) et une deadline à ${deadline} ?`}
        confirmLabel={loading ? "Publication…" : "Publier"}
        cancelLabel="Annuler"
        variant="info"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Page principale avec onglets
// ─────────────────────────────────────────────
export default function MenuAdminPage() {
  const [activeTab, setActiveTab] = useState<"today" | "publish">("today");
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    apiFetch("/dishes")
      .then((r) => r.json())
      .then(setDishes)
      .catch(() => toast.error("Erreur de chargement des plats"));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Menu du Jour</h1>
        <p className="text-sm text-gray-400 mt-1">Consultez, modifiez ou publiez le menu du jour</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("today")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "today"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Menu d'aujourd'hui
        </button>
        <button
          onClick={() => setActiveTab("publish")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "publish"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Publier un menu
        </button>
      </div>

      {activeTab === "today" ? (
        <TodayTab allDishes={dishes} />
      ) : (
        <PublishTab dishes={dishes} />
      )}
    </div>
  );
}
