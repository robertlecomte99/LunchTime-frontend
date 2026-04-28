"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-stone-200">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Un Instant</span>
          </div>

          {/* Deadline banner */}
          {deadlinePassed ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-xs font-bold text-red-600">Commandes fermées</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-700">
                Ouvert jusqu'à {todayMenu.order_deadline}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-stone-400 italic">Bienvenue, {userName}</span>
            <button
              onClick={logout}
              className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-red-600 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Deadline banner mobile */}
      {deadlinePassed && (
        <div className="sm:hidden bg-red-600 text-white text-center text-xs font-bold py-2 px-4">
          ⛔ Les commandes sont fermées pour aujourd'hui
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* Date badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Menu du {new Date(todayMenu.menu_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>

        {/* Plat du jour Hero */}
        <section className="mb-12">
          <div className="bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-sm flex flex-col md:flex-row md:h-[320px]">
            <div className="relative w-full md:w-2/5 h-48 md:h-full overflow-hidden">
              {featured.image ? (
                <img
                  src={`http://resto-api.test/storage/${featured.image}`}
                  alt={featured.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-stone-400 uppercase tracking-tighter">
                  Pas d'image
                </div>
              )}
              <div className="absolute top-4 left-4 bg-stone-900/90 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Plat du Jour
              </div>
            </div>

            <div className="p-8 md:w-3/5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-semibold text-white tracking-tight">{featured.name}</h1>
                <span className="text-xl font-medium text-amber-600">
                  {featured.price} <small className="text-[10px] text-stone-300">FCFA</small>
                </span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-md">{featured.description}</p>

              <button
                onClick={() => !deadlinePassed && setConfirmOrder(featured)}
                disabled={deadlinePassed}
                className={`w-full md:w-auto px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] ${
                  deadlinePassed
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-white text-black hover:bg-amber-700"
                }`}
              >
                {deadlinePassed ? "Commandes fermées" : "Commander maintenant"}
              </button>
            </div>
          </div>
        </section>

        {/* Autres plats */}
        {others.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400">Autres plats</h2>
              <div className="h-[1px] flex-grow bg-stone-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((dish) => (
                <div
                  key={dish.id}
                  
                  className="group bg-stone-900 rounded-xl border border-stone-800 hover:border-stone-700 hover:shadow-xl hover:shadow-black/50 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative h-40 overflow-hidden rounded-t-xl">
                    {dish.image ? (
                      <img
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        src={`http://resto-api.test/storage/${dish.image}`}
                        alt={dish.name}
                      />
                    ) : (
                      
                      <div className="w-full h-full bg-stone-800 flex items-center justify-center text-[10px] text-stone-600">
                        NO PHOTO
                      </div>
                    )}
                    {dish.orders_count > 0 && (
                      
                      <div className="absolute top-2 right-2 bg-stone-800/90 backdrop-blur text-[9px] font-bold px-2 py-0.5 rounded-md border border-stone-700 text-stone-200 shadow-sm">
                        {dish.orders_count} COMMANDES
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      
                      <h3 className="text-sm font-bold text-white leading-tight">{dish.name}</h3>
                      
                      <span className="text-xs font-bold text-stone-300">
                        {dish.price} <small className="text-[10px] text-stone-500">FCFA</small>
                      </span>
                    </div>
                    
                    <p className="text-xs text-stone-400 leading-normal mb-6 line-clamp-2">{dish.description}</p>

                    <button
                      onClick={() => !deadlinePassed && setConfirmOrder(dish)}
                      disabled={deadlinePassed}
                      className={`mt-auto w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.97] ${
                        deadlinePassed
                          ? "bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700"
                          
                          : "bg-white text-black border border-white hover:bg-stone-200 hover:scale-[1.02]"
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
