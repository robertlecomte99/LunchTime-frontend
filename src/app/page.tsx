"use client"; // Obligatoire pour utiliser useEffect et useState

import Image from "next/image"; // Importation du composant Image
import Link from "next/link";
import { toast } from 'sonner';
import { useEffect, useState } from "react";

// Définition du type pour un plat
interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  orders_count: number;
}

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Récupérer les plats au chargement
  useEffect(() => {
    fetch("http://resto-api.test/api/dishes")
      .then((res) => res.json())
      .then((data) => {
        setDishes(data);
        setLoading(false);
      })
      .catch(err => console.error("Erreur API:", err));
  }, []);

  // 2. Fonction pour commander
  const handleOrder = async (dishId: number) => {
    const res = await fetch("http://resto-api.test/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish_id: dishId }),
    });

    if (res.ok) {
      toast.success("Commande enregistrée!");
    } else {
      toast.error("Echec de l'enregistrement de la commande.");
    }
  };

  if (loading) return <p className="p-10 text-center">Chargement du menu...</p>;

  return (
    <main className="min-h-screen bg-[#FFF7ED] p-8 font-sans text-slate-900">
      <div>
        <Link href="/admin" className="text-blue-600 hover:underline">← page Admin</Link>
      </div>
      <div className="flex flex-col items-center mb-12">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Image 
            src="/logo.jpg"     // Chemin relatif au dossier public
            alt="Logo Resto" 
            width={150}          // Largeur en pixels
            height={150}         // Hauteur en pixels
            loading="eager"
            className="object-contain"
          />

        </div>
        {/*<h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
          Un Instant...
        </h1>*/}
        <p className="text-slate-500 mt-2 italic">Restaurant - Pâtisserie - Salon de thé</p>
    </div>
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">🍽️ Menu du jour</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((dish) => (
          <div key={dish.id} className="relative bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            
            {dish.orders_count > 0 && (
              <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                <span>🔥</span>
                <span>{dish.orders_count} COMMANDE(S)</span>
              </div>
            )}

            {/* Affichage de l'image */}
            <div className="relative h-48 w-full bg-gray-100">
              {dish.image ? (
                <img 
                  className="object-cover w-full h-full"
                  src={`http://resto-api.test/storage/${dish.image}`}     // Chemin relatif au dossier public
                  alt={dish.name} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Pas de photo
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-700">{dish.name}</h2>
            <p className="text-gray-500 my-2">{dish.description}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-medium text-green-600">{dish.price} Fcfa</span>
              <button 
                onClick={() => handleOrder(dish.id)}
                className="bg-orange-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Commander
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}