"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from 'sonner';
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { apiFetch } from "@/lib/api";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  orders_count: number;
}

interface Menu {
  id: number;
  menu_date: string;
  dishes: Dish[];
}

export default function Home() {
  const [todayMenu, setTodayMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = Cookies.get('userName');

  useEffect(() => {
    // On appelle le menu du jour au lieu de tous les plats
    apiFetch("/menus/current")
      .then((res) => {
        if (!res.ok) throw new Error("Pas de menu");
        return res.json();
      })
      .then((data) => {
        setTodayMenu(data);
        setLoading(false);
      })
      .catch(() => {
        setTodayMenu(null);
        setLoading(false);
      });
  }, []);

  const handleOrder = async (dishId: number) => {
    if (!todayMenu) return;

    const res = await apiFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        dish_id: dishId,
        menu_id: todayMenu.id 
      }),
    });

    if (res.status === 201) {
      toast.success("Commande enregistrée avec succès !");
    } else if (res.status === 429) {
      // 429 Too Many Requests: Limite atteinte
      const data = await res.json();
      toast.error(data.message || "Limite de commandes atteinte (2 max).");
    } else {
      toast.error("Échec de la commande.");
    }
  };

  const logout = () => {
    Cookies.remove('token'); 
    window.location.href = "/login"; 
  };

  if (loading) return (/* ton loader actuel */ <div className="flex h-screen items-center justify-center bg-stone-50"><div className="animate-pulse">Chargement...</div></div>);

  if (!todayMenu || todayMenu.dishes.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-stone-50 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Aucun menu publié</h1>
        <p className="text-stone-500 mt-2">Revenez un peu plus tard pour commander votre repas du jour.</p>
        <button onClick={logout} className="mt-6 text-sm underline text-stone-400">Déconnexion</button>
      </div>
    );
  }

  const platDuJour = todayMenu.dishes[0];
  const otherDishes = todayMenu.dishes.slice(1);

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased pb-12">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-stone-200">
               <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Un Instant</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-stone-400 italic">Bienvenue, {userName}</span>
            <div className="h-4 w-[1px] bg-stone-200 hidden sm:block"></div>
            <button 
              onClick={logout}
              className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-red-600 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>
      
      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* Affichage d'un petit badge date */}
        <div className="mb-6 inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
          Menu du : {new Date(todayMenu.menu_date).toLocaleDateString('fr-FR')}
        </div>

        {/* --- PLAT DU JOUR: COMPACT HERO --- */}
        {platDuJour && (
          <section className="mb-12">
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col md:flex-row md:h-[320px]">
              {/* Left Side: Controlled Image Size */}
              <div className="relative w-full md:w-2/5 h-48 md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-stone-100">
                {platDuJour.image ? (
                  <img 
                    src={`http://resto-api.test/storage/${platDuJour.image}`}
                    alt={platDuJour.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-stone-400 uppercase tracking-tighter">Pas d'image</div>
                )}
                <div className="absolute top-4 left-4 bg-stone-900/90 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  ⭐ Plat du Jour
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="p-8 md:w-3/5 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">{platDuJour.name}</h1>
                  <span className="text-xl font-medium text-amber-600">{platDuJour.price} <small className="text-[10px] text-stone-400">FCFA</small></span>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed mb-8 max-w-md">
                  {platDuJour.description}
                </p>
                
                <div>
                  <button 
                    onClick={() => handleOrder(platDuJour.id)}
                    className="w-full md:w-auto bg-stone-900 text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all active:scale-[0.98]"
                  >
                    Commander maintenant
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- CATEGORY HEADER --- */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400">Autres plats</h2>
          <div className="h-[1px] flex-grow bg-stone-200"></div>
          <Link href="/admin" className="text-[10px] font-bold uppercase text-stone-400 hover:text-stone-900">Admin</Link>
        </div>

        {/* --- COMPACT GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherDishes.map((dish) => (
            <div key={dish.id} className="group bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-300 flex flex-col h-full">
              {/* Small Image Header */}
              <div className="relative h-40 overflow-hidden rounded-t-xl">
                {dish.image ? (
                  <img 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    src={`http://resto-api.test/storage/${dish.image}`} 
                    alt={dish.name} 
                  />
                ) : (
                  <div className="w-full h-full bg-stone-50 flex items-center justify-center text-[10px] text-stone-300">NO PHOTO</div>
                )}
                
                {dish.orders_count > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-0.5 rounded-md border border-stone-100 shadow-sm">
                    {dish.orders_count} COMMANDES
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-stone-800 leading-tight">{dish.name}</h3>
                  <span className="text-xs font-bold text-stone-500">{dish.price} <small className="text-[10px] text-stone-400">FCFA</small></span>
                </div>
                
                <p className="text-xs text-stone-400 leading-normal mb-6 line-clamp-2">
                  {dish.description}
                </p>

                <button 
                  onClick={() => handleOrder(dish.id)}
                  className="mt-auto w-full py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all active:scale-[0.97]"
                >
                  Commander
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}