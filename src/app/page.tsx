"use client";

import Image from "next/image";
//import Link from "next/link";
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
  const [hasOrdered, setHasOrdered] = useState(false); // État pour bloquer l'UI si déjà commandé
  const userName = Cookies.get('userName');

  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    action: () => {},
  });

  

  useEffect(() => {
    // On appelle le menu du jour ordonné par l'admin
    apiFetch("/menus/current")
      .then((res) => {
        if (!res.ok) throw new Error("Pas de menu");
        return res.json();
      })
      .then((data) => {
        setTodayMenu(data);
        return apiFetch(`/orders/check-status?menu_id=${data.id}`);
      })
      .then((res) => res.json())
      .then((status) => {
        setHasOrdered(status.hasOrdered); // L'état est restauré depuis la DB
        setLoading(false);
      })
      .catch(() => {
        setTodayMenu(null);
        setLoading(false);
      });
  }, []);

  const askConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmConfig({
      show: true,
      title,
      message,
      action: action, 
    });
  };

  const handleOrder = async (dishId: number) => {
    if (!todayMenu || hasOrdered) return;

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
      setHasOrdered(true); // Bloque les boutons visuellement
    } else if (res.status === 429) {
      const data = await res.json();
      toast.error(data.message || "Vous avez déjà commandé aujourd'hui.");
      setHasOrdered(true);
    } else if (res.status === 403) {
      const data = await res.json();
      toast.error(data.message);
    }
    else {
      toast.error("Échec de la commande.");
    }
  };

  const logout = () => {
    Cookies.remove('token'); 
    Cookies.remove('userName');
    window.location.href = "/login"; 
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm font-medium">Préparation du menu...</p>
      </div>
    </div>
  );

  if (!todayMenu || todayMenu.dishes.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-stone-50 text-center px-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">En cours de préparation</h1>
        <p className="text-stone-500 mt-2 max-w-xs">L'administrateur n'a pas encore publié le menu du jour. Revenez d'ici quelques minutes.</p>
        <button onClick={logout} className="mt-8 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Déconnexion</button>
      </div>
    );
  }

  // Le premier plat est le "Plat à la une" (choisi par l'admin)
  const platDuJour = todayMenu.dishes[0];
  const otherDishes = todayMenu.dishes.slice(1);

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased pb-12">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-stone-200">
               <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-stone-600">Un instant...</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[11px] font-medium text-stone-400 uppercase tracking-wider">Bonjour, {userName}</span>
            <div className="h-4 w-[1px] bg-stone-200 hidden sm:block"></div>
            <button 
              onClick={logout}
              className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-red-600 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </nav>
      
      {/* ---Boite de dialogue pour confirmation--- */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold text-stone-900">{confirmConfig.title}</h3>
            <p className="text-stone-500 text-sm mt-2">{confirmConfig.message}</p>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} 
                className="flex-1 py-3 text-sm font-medium border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => { 
                  confirmConfig.action(); 
                  setConfirmConfig(prev => ({ ...prev, show: false })); 
                }}
                className="flex-1 py-3 text-sm font-bold bg-stone-900 text-white rounded-xl hover:bg-amber-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-light text-stone-800 tracking-tight">Le Menu <span className="font-serif italic text-amber-700">du Jour</span></h2>
            <p className="text-stone-400 text-sm mt-1 uppercase tracking-widest font-medium">
              {new Date(todayMenu.menu_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {hasOrdered && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <span className="text-base">✅</span> Commande confirmée
            </div>
          )}
        </div>

        {/* --- PLAT DU JOUR: HERO SECTION --- */}
        {platDuJour && (
          <section className="mb-16">
            <div className="bg-white rounded-[2rem] overflow-hidden border border-stone-200 shadow-xl shadow-stone-200/50 flex flex-col md:flex-row md:min-h-[400px]">
              <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                {platDuJour.image ? (
                  <img 
                    src={`http://resto-api.test/storage/${platDuJour.image}`}
                    alt={platDuJour.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-stone-400 uppercase tracking-widest">Image non disponible</div>
                )}
                <div className="absolute top-6 left-6 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-amber-500/30">
                  À la une
                </div>
              </div>

              <div className="p-10 md:w-1/2 flex flex-col justify-center bg-gradient-to-br from-white to-stone-50">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-stone-800 mb-2 leading-tight">{platDuJour.name}</h1>
                  <p className="text-stone-500 text-sm leading-relaxed line-clamp-4">
                    {platDuJour.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-stone-100">
                  <span className="text-3xl font-light text-stone-900">{platDuJour.price} <small className="text-xs font-bold text-stone-400">FCFA</small></span>
                  <button 
                    disabled={hasOrdered}
                    onClick={() => askConfirmation(
                      "Confirmer la commande", 
                      "Voulez-vous réserver ce plat pour aujourd'hui ?", 
                      () => handleOrder(platDuJour.id)
                    )}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all
                      ${hasOrdered 
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                        : 'bg-stone-900 text-white hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-700/20 active:scale-95'}`}
                  >
                    {hasOrdered ? "Déjà commandé" : "Sélectionner ce plat"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- AUTRES PLATS --- */}
        {otherDishes.length > 0 && (
          <>
            <div className="flex items-center gap-6 mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 whitespace-nowrap">Autres plats:</h3>
              <div className="h-[1px] w-full bg-stone-200"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherDishes.map((dish) => (
                <div key={dish.id} className="group bg-white rounded-3xl border border-stone-200 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500 flex flex-col h-full overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    {dish.image ? (
                      <img 
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        src={`http://resto-api.test/storage/${dish.image}`} 
                        alt={dish.name} 
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-50 flex items-center justify-center text-[10px] text-stone-300">SANS IMAGE</div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-base font-bold text-stone-800 group-hover:text-amber-800 transition-colors">{dish.name}</h4>
                        <span className="text-sm font-bold text-stone-500 whitespace-nowrap">{dish.price}</span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 italic">
                        {dish.description}
                      </p>
                    </div>

                    <button 
                      disabled={hasOrdered}
                      onClick={() => askConfirmation(
                        "Confirmer la commande", 
                        "Voulez-vous réserver ce plat pour aujourd'hui ?", 
                        () => handleOrder(dish.id)
                      )}
                      className={`mt-auto w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                        ${hasOrdered 
                          ? 'bg-stone-50 text-stone-300 border border-stone-100 cursor-not-allowed' 
                          : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-900 hover:text-white hover:border-stone-900'}`}
                    >
                      {hasOrdered ? "Indisponible" : "Choisir"}
                    </button>	
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}