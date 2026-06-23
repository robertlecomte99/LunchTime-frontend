"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Can } from '@/components/Can';


interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  orders_count: number;
  pivot?: { is_featured: boolean };
}

interface Menu {
  id: number;
  menu_date: string;
  order_deadline: string;
  deadline_passed: boolean;
  dishes: Dish[];
}

export default function Home() {
  const [todayMenu, setTodayMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<Dish | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const userName = Cookies.get("userName");

  useEffect(() => {
    apiFetch("/menus/current")
      .then((res) => {
        if (!res.ok) throw new Error("Pas de menu");
        return res.json();
      })
      .then((data: Menu) => {
        setTodayMenu(data);
        setDeadlinePassed(data.deadline_passed ?? false);
        setLoading(false);
      })
      .catch(() => {
        setTodayMenu(null);
        setLoading(false);
      });
  }, []);

  // Vérification live de la deadline toutes les minutes
  useEffect(() => {
    if (!todayMenu) return;
    const check = () => {
      const [h, m] = todayMenu.order_deadline.split(":").map(Number);
      const now = new Date();
      const passed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
      setDeadlinePassed(passed);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [todayMenu]);

  const handleOrder = async (dishId: number) => {
    if (!todayMenu) return;
    if (deadlinePassed) {
      toast.error(`Les commandes sont fermées depuis ${todayMenu.order_deadline}.`);
      return;
    }

    const res = await apiFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish_id: dishId, menu_id: todayMenu.id }),
    });

    if (res.status === 201) {
      toast.success("Commande enregistrée !");
    } else if (res.status === 403) {
      const data = await res.json();
      toast.error(data.message ?? "Commandes fermées.");
      setDeadlinePassed(true);
    } else if (res.status === 429) {
      const data = await res.json();
      toast.error(data.message ?? "Limite de 2 commandes atteinte.");
    } else {
      toast.error("Échec de la commande.");
    }
    setConfirmOrder(null);
  };

  const logout = () => {
    Cookies.remove("token");
    window.location.href = "/login";
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
          <p className="text-xs text-stone-400 uppercase tracking-widest">Chargement…</p>
        </div>
      </div>
    );

  if (!todayMenu || todayMenu.dishes.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-stone-50 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-stone-800">Aucun menu publié aujourd'hui</h1>
        <p className="text-stone-500 mt-2 text-sm max-w-xs">Revenez un peu plus tard pour commander votre repas.</p>
        <button onClick={logout} className="mt-6 text-xs underline text-stone-400 hover:text-stone-600">
          Déconnexion
        </button>
      </div>
    );
  }

  // Plat featured en premier
  const featured = todayMenu.dishes.find((d) => d.pivot?.is_featured) ?? todayMenu.dishes[0];
  const others = todayMenu.dishes.filter((d) => d.id !== featured.id);

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/60 px-6 py-3">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 relative rounded-lg overflow-hidden border border-stone-200">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Lunch-Time</span>
          </div>

          {/* Deadline banner */}
          {deadlinePassed ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-600">Commandes fermées</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-700">
                Ouvert jusqu'à {todayMenu.order_deadline}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-stone-400">{userName}</span>
            <button
              onClick={logout}
              className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 hover:text-red-500 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Deadline banner mobile */}
      {deadlinePassed && (
        <div className="sm:hidden bg-red-50 border-b border-red-200 text-red-600 text-center text-xs font-semibold py-2 px-4">
          Les commandes sont fermées pour aujourd'hui
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 pt-8">
        {/* Date badge */}
        <div className="mb-5 inline-flex items-center gap-2 text-stone-400 text-xs font-semibold tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(todayMenu.menu_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>

        {/* Plat du jour */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:h-[200px]">
            <div className="relative w-full sm:w-2/5 h-36 sm:h-full overflow-hidden flex-shrink-0">
              {featured.image ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${featured.image}`}
                  alt={featured.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                  Pas d'image
                </div>
              )}
              <div className="absolute top-3 left-3 bg-amber-400 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Plat du Jour
              </div>
            </div>

            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <h1 className="text-lg font-semibold text-stone-900 tracking-tight">{featured.name}</h1>
                  <span className="text-sm font-semibold text-amber-600 ml-4 whitespace-nowrap">
                    {parseInt(featured.price).toLocaleString("fr-FR")} <small className="text-[10px] text-stone-400 font-normal">FCFA</small>
                  </span>
                </div>
                <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">{featured.description}</p>
              </div>

              <button
                onClick={() => !deadlinePassed && setConfirmOrder(featured)}
                disabled={deadlinePassed}
                className={`mt-4 self-start px-6 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  deadlinePassed
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-stone-700"
                }`}
              >
                {deadlinePassed ? "Commandes fermées" : "Commander"}
              </button>
            </div>
          </div>
        </section>

        {/* Autres plats */}
        {others.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 whitespace-nowrap">Autres plats</h2>
              <div className="h-px flex-grow bg-stone-200" />
            </div>

            <div className="space-y-3">
              {others.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors flex items-center gap-4 px-4 py-3"
                >
                  {/* Miniature */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    {dish.image ? (
                      <img
                        className="object-cover w-full h-full"
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${dish.image}`}
                        alt={dish.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                        —
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-800 truncate">{dish.name}</h3>
                      {dish.orders_count > 0 && (
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">{dish.orders_count} cmd</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 leading-snug line-clamp-1 mt-0.5">{dish.description}</p>
                  </div>

                  {/* Prix + bouton */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">
                      {parseInt(dish.price).toLocaleString("fr-FR")} <small className="text-[10px] text-stone-400 font-normal">FCFA</small>
                    </span>
                    <button
                      onClick={() => !deadlinePassed && setConfirmOrder(dish)}
                      disabled={deadlinePassed}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        deadlinePassed
                          ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                          : "bg-stone-900 text-white hover:bg-stone-700"
                      }`}
                    >
                      {deadlinePassed ? "Fermé" : "Commander"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="fixed bottom-4 right-4">
        <Can do="get_admin_panel">
          <button
              onClick={() => (window.location.href = "/admin")}
              className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-blue-600 transition-colors"
            >
              Accès Admin
            </button>
        </Can>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmOrder}
        title="Confirmer la commande"
        message={`Commander "${confirmOrder?.name}" pour ${confirmOrder?.price} FCFA ?`}
        confirmLabel="Commander"
        cancelLabel="Annuler"
        variant="info"
        onConfirm={() => confirmOrder && handleOrder(confirmOrder.id)}
        onCancel={() => setConfirmOrder(null)}
      />
    </main>
  );
}
