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
}

export default function MenuAdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuDate, setMenuDate] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [featuredDish, setFeaturedDish] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("11:30");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/dishes")
      .then((r) => r.json())
      .then(setDishes)
      .catch(() => toast.error("Erreur de chargement des plats"));

    // Pré-remplir la date avec aujourd'hui
    const today = new Date().toISOString().split("T")[0];
    setMenuDate(today);
  }, []);

  const handleCheckbox = (id: number) => {
    setSelectedDishes((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    // Si on décoche le plat featured, on réinitialise
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

    if (res.ok) {
      toast.success("Menu publié avec succès !");
      setSelectedDishes([]);
      setFeaturedDish(null);
    } else {
      const err = await res.json();
      toast.error(err.message || "Erreur lors de la publication.");
    }
    setShowConfirm(false);
  };

  const groupedDishes: Record<string, Dish[]> = {};
  dishes.forEach((d) => {
    const cat = d.type_plat || "standard";
    if (!groupedDishes[cat]) groupedDishes[cat] = [];
    groupedDishes[cat].push(d);
  });

  const isValid = menuDate && selectedDishes.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Publier un menu</h1>
        <p className="text-sm text-gray-400 mt-1">Composez le menu du jour et définissez l'heure limite de commande</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panneau */}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Heure limite de commande
                </label>
                <input
                  type="time"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Les commandes seront bloquées après cet horaire
                </p>
              </div>
            </div>
          </div>

          {/* Résumé */}
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

        {/* Sélection des plats */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-700">Sélectionnez les plats</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cochez les plats à inclure, puis marquez le <span className="text-amber-600 font-semibold">⭐ Plat du Jour</span>
              </p>
            </div>

            <div className="p-4 space-y-5 max-h-[600px] overflow-y-auto">
              {Object.entries(groupedDishes).map(([category, catDishes]) => (
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
                          onClick={() => handleCheckbox(dish.id)}
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
                                src={`http://resto-api.test/storage/${dish.image}`}
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
                            <p className="text-xs text-gray-400">
                              {parseInt(dish.price).toLocaleString("fr-FR")} FCFA
                            </p>
                          </div>

                          {/* Featured toggle */}
                          {checked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeaturedDish(isFeatured ? null : dish.id);
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
    </div>
  );
}
