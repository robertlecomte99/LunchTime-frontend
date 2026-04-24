"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from 'sonner';

interface Dish {
  id: number;
  name: string;
  price: string;
}

export default function MenuAdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuDate, setMenuDate] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);

  useEffect(() => {
    // Récupérer tous les plats disponibles pour composer le menu
    apiFetch("/dishes")
      .then(res => res.json())
      .then(data => setDishes(data))
      .catch(() => toast.error("Erreur de chargement des plats"));
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedDishes(prev => 
      prev.includes(id) ? prev.filter(dishId => dishId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedDishes.length === 0) {
      toast.error("Veuillez sélectionner au moins un plat.");
      return;
    }

    const res = await apiFetch("/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_date: menuDate,
        dishes: selectedDishes
      }),
    });

    if (res.ok) {
      toast.success("Menu publié avec succès !");
      setMenuDate("");
      setSelectedDishes([]);
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionnez les plats</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded bg-slate-50">
              {dishes.map(dish => (
                <label key={dish.id} className="flex items-center space-x-3 bg-white p-3 rounded border shadow-sm cursor-pointer hover:bg-slate-100">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded"
                    checked={selectedDishes.includes(dish.id)}
                    onChange={() => handleCheckboxChange(dish.id)}
                  />
                  <span className="font-semibold text-slate-800">{dish.name}</span>
                  <span className="text-slate-500 text-sm ml-auto">{dish.price} FCFA</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded font-bold hover:bg-slate-900 transition">
            Publier ce Menu
          </button>
        </form>
      </div>
    </div>
  );
}