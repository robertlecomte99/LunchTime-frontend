"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  orders_count: number;
}

export default function AdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  //  Charger les données (Plats)
  const fetchData = async () => {
    const res = await fetch("http://resto-api.test/api/dishes");
    const data = await res.json();
    setDishes(data);
  };

  useEffect(() => { fetchData(); }, []);


  // Gestion des commandes
  // 1. Ajoute un état pour stocker les commandes
  const [orders, setOrders] = useState<any[]>([]);

  // 2. Fonction pour charger les commandes
  const fetchOrders = async () => {
    const res = await fetch("http://resto-api.test/api/orders");
    const data = await res.json();
    setOrders(data);
  };

  // 3. Effet pour le "Temps Réel" (Polling toutes les 10 secondes)
  useEffect(() => {
    fetchOrders(); // Premier chargement
    const timer = setInterval(fetchOrders, 10000); 
    return () => clearInterval(timer);
  }, []);

  // 4. Fonction pour changer le statut au clic
  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    await fetch(`http://resto-api.test/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchOrders(); // Rafraîchissement immédiat
  };


  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Suivi des commandes</h1>
          <Link href="/" className="text-blue-600 hover:underline">← Retour au Menu</Link>
        </div>

        
        {/* --- suivi du statut de la commande --- */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            🔔 Commandes en cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {orders.filter(o => o.status !== 'delivered').map((order) => (
              <div key={order.id} className={`p-4 rounded-xl border-t-4 shadow-sm bg-white ${
                order.status === 'pending' ? 'border-red-500' : 
                order.status === 'preparing' ? 'border-orange-500' : 'border-green-500'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black text-slate-400">#CMD-{order.id}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">
                    {order.status}
                  </span>
                </div>
                <p className="font-bold text-slate-800">{order.dish?.name}</p>
                
                <div className="mt-4 flex gap-2">
                  {order.status === 'pending' && (
                    <button onClick={() => handleStatusChange(order.id, 'preparing')} className="w-full bg-orange-500 text-white text-xs py-2 rounded font-bold">Préparer</button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => handleStatusChange(order.id, 'ready')} className="w-full bg-green-500 text-white text-xs py-2 rounded font-bold">Prête !</button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => handleStatusChange(order.id, 'delivering')} className="w-full bg-blue-500 text-white text-xs py-2 rounded font-bold">Livrer</button>
                  )}
                  {order.status === 'delivering' && (
                    <button onClick={() => handleStatusChange(order.id, 'delivered')} className="w-full bg-slate-800 text-white text-xs py-2 rounded font-bold">Terminer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  );
}