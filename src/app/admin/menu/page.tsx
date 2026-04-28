"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from 'sonner';
import { Star } from "lucide-react"; // Import d'une icône pour le plat du jour

interface Dish {
  id: number;
  name: string;
  price: string;
}

export default function MenuAdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuDate, setMenuDate] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [featuredDishId, setFeaturedDishId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/dishes")
      .then(res => res.json())
      .then(data => setDishes(data))
      .catch(() => toast.error("Erreur de chargement des plats"));
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedDishes(prev => {
      const isRemoving = prev.includes(id);
      if (isRemoving) {
        if (featuredDishId === id) setFeaturedDishId(null);
        return prev.filter(dishId => dishId !== id);
      } else {
        // Par défaut, si c'est le premier plat coché, on le met en "Plat du jour"
        if (prev.length === 0) setFeaturedDishId(id);
        return [...prev, id];
      }
    });
  };

  const toggleFeatured = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!selectedDishes.includes(id)) {
      toast.error("Veuillez d'abord cocher le plat avant de le mettre à la une.");
      return;
    }
    setFeaturedDishId(id);
    toast.info("Ce plat sera mis en avant sur l'accueil.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDishes.length === 0) {
      toast.error("Veuillez sélectionner au moins un plat.");
      return;
    }

    // RÉORGANISATION : On place le plat "featured" en première position du tableau
    const orderedDishes = [
      featuredDishId,
      ...selectedDishes.filter(id => id !== featuredDishId)
    ].filter(Boolean); // On filtre les null au cas où

    const res = await apiFetch("/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_date: menuDate,
        dishes: orderedDishes // L'ordre est maintenant garanti
      }),
    });

    if (res.ok) {
      toast.success("Menu publié avec succès !");
      setMenuDate("");
      setSelectedDishes([]);
      setFeaturedDishId(null);
    } else {
      const error = await res.json();
      toast.error(error.message || "Erreur lors de la publication.");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Publier le menu du jour</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date du menu</label>
            <input 
              type="date" 
              required
              value={menuDate}
              onChange={(e) => setMenuDate(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sélectionnez les plats (Cliquez sur l'étoile pour le plat principal)
            </label>
            <div className="grid grid-cols-1 gap-3 border p-4 rounded bg-slate-50">
              {dishes.map(dish => (
                <div key={dish.id} className={`flex items-center space-x-3 p-3 rounded border shadow-sm transition ${selectedDishes.includes(dish.id) ? 'bg-white border-blue-200' : 'bg-slate-50 opacity-70'}`}>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    checked={selectedDishes.includes(dish.id)}
                    onChange={() => handleCheckboxChange(dish.id)}
                  />
                  
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">{dish.name}</span>
                    <span className="text-slate-500 text-sm ml-4">{dish.price} FCFA</span>
                  </div>

                  {/* Bouton Étoile pour définir le plat du jour */}
                  <button
                    type="button"
                    onClick={(e) => toggleFeatured(e, dish.id)}
                    className={`p-2 rounded-full transition ${featuredDishId === dish.id ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400'}`}
                    title="Mettre ce plat en avant"
                  >
                    <Star className={featuredDishId === dish.id ? "fill-current" : ""} size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded font-bold hover:bg-slate-900 transition">
            Publier ce Menu {selectedDishes.length > 0 && `(${selectedDishes.length} plats)`}
          </button>
        </form>
      </div>
    </div>
  );
}