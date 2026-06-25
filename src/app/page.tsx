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
      <div className="flex h-screen items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#E7E5E3", borderTopColor: "#1C1917" }} />
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "#A8A29E" }}>Chargement…</p>
        </div>
      </div>
    );

  if (!todayMenu || todayMenu.dishes.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center px-6" style={{ background: "#FAFAF8" }}>
        <p className="text-sm font-medium mb-1" style={{ color: "#1C1917" }}>Aucun menu publié aujourd&apos;hui</p>
        <p className="text-xs mb-6" style={{ color: "#A8A29E" }}>Revenez un peu plus tard pour commander votre repas.</p>
        <button onClick={logout} className="text-xs underline" style={{ color: "#A8A29E" }}>
          Déconnexion
        </button>
      </div>
    );
  }

  const featured = todayMenu.dishes.find((d) => d.pivot?.is_featured) ?? todayMenu.dishes[0];
  const others = todayMenu.dishes.filter((d) => d.id !== featured.id);

  return (
    <main className="min-h-screen font-sans antialiased pb-16" style={{ background: "#FAFAF8" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b px-6 py-3" style={{ background: "rgba(250,250,248,0.92)", backdropFilter: "blur(12px)", borderColor: "#E7E5E3" }}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 relative rounded-md overflow-hidden" style={{ border: "1px solid #E7E5E3" }}>
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#A8A29E" }}>Lunch-Time</span>
          </div>

          {/* Statut deadline */}
          {deadlinePassed ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Commandes fermées
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Ouvert jusqu&apos;à {todayMenu.order_deadline}
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs" style={{ color: "#A8A29E" }}>{userName}</span>
            <button
              onClick={logout}
              className="text-[11px] font-medium tracking-wide transition-colors"
              style={{ color: "#A8A29E" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#A8A29E")}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Deadline mobile */}
      {deadlinePassed && (
        <div className="sm:hidden text-center text-xs font-medium py-2 px-4" style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA", color: "#DC2626" }}>
          Les commandes sont fermées pour aujourd&apos;hui
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-8">

        {/* Date */}
        <p className="text-[11px] font-medium tracking-widest uppercase mb-6" style={{ color: "#A8A29E" }}>
          {new Date(todayMenu.menu_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {/* ── Plat du jour — barre amber signature ── */}
        <section className="mb-8">
          <div className="flex rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E7E5E3" }}>
            {/* Accent bar */}
            <div className="w-1 flex-shrink-0" style={{ background: "#D97706" }} />

            {/* Image */}
            <div className="relative flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36" style={{ background: "#F5F5F4" }}>
              {featured.image ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${featured.image}`}
                  alt={featured.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "#A8A29E" }}>—</div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex flex-col justify-between flex-1 px-5 py-4">
              <div>
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#D97706" }}>Plat du jour</span>
                <h1 className="text-base font-semibold leading-snug mt-1 mb-1" style={{ color: "#1C1917" }}>{featured.name}</h1>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#A8A29E" }}>{featured.description}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-semibold" style={{ color: "#1C1917" }}>
                  {parseInt(featured.price).toLocaleString("fr-FR")}
                  <span className="text-[10px] font-normal ml-1" style={{ color: "#A8A29E" }}>FCFA</span>
                </span>
                <button
                  onClick={() => !deadlinePassed && setConfirmOrder(featured)}
                  disabled={deadlinePassed}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={deadlinePassed
                    ? { background: "#F5F5F4", color: "#A8A29E", cursor: "not-allowed" }
                    : { background: "#1C1917", color: "#FFFFFF" }
                  }
                  onMouseEnter={e => { if (!deadlinePassed) e.currentTarget.style.background = "#44403C"; }}
                  onMouseLeave={e => { if (!deadlinePassed) e.currentTarget.style.background = "#1C1917"; }}
                >
                  {deadlinePassed ? "Fermé" : "Commander"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Autres plats ── */}
        {others.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap" style={{ color: "#A8A29E" }}>Au menu</span>
              <div className="flex-grow h-px" style={{ background: "#E7E5E3" }} />
            </div>

            <div className="space-y-2">
              {others.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ background: "#FFFFFF", border: "1px solid #E7E5E3" }}
                >
                  {/* Miniature */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#F5F5F4" }}>
                    {dish.image ? (
                      <img
                        className="object-cover w-full h-full"
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${dish.image}`}
                        alt={dish.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "#A8A29E" }}>—</div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-medium truncate" style={{ color: "#1C1917" }}>{dish.name}</h3>
                      {dish.orders_count > 0 && (
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#D4D0CB" }}>{dish.orders_count} cmd</span>
                      )}
                    </div>
                    <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "#A8A29E" }}>{dish.description}</p>
                  </div>

                  {/* Prix + bouton */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-medium hidden sm:block" style={{ color: "#1C1917" }}>
                      {parseInt(dish.price).toLocaleString("fr-FR")}
                      <span className="text-[10px] font-normal ml-1" style={{ color: "#A8A29E" }}>FCFA</span>
                    </span>
                    <button
                      onClick={() => !deadlinePassed && setConfirmOrder(dish)}
                      disabled={deadlinePassed}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={deadlinePassed
                        ? { background: "#F5F5F4", color: "#A8A29E", cursor: "not-allowed" }
                        : { background: "#F5F5F4", color: "#1C1917", border: "1px solid #E7E5E3" }
                      }
                      onMouseEnter={e => { if (!deadlinePassed) { e.currentTarget.style.background = "#1C1917"; e.currentTarget.style.color = "#FFFFFF"; }}}
                      onMouseLeave={e => { if (!deadlinePassed) { e.currentTarget.style.background = "#F5F5F4"; e.currentTarget.style.color = "#1C1917"; }}}
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

      {/* Accès Admin */}
      <div className="fixed bottom-4 right-4">
        <Can do="get_admin_panel">
          <button
            onClick={() => (window.location.href = "/admin")}
            className="text-[11px] font-medium tracking-wide transition-colors"
            style={{ color: "#A8A29E" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#1C1917")}
            onMouseLeave={e => (e.currentTarget.style.color = "#A8A29E")}
          >
            Admin
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
