"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


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
  const router = useRouter();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState({ key: 'orders_count', direction: 'desc' });

  //  Charger les données (Plats)
  const fetchData = async () => {
    const res = await fetch("http://resto-api.test/api/dishes");
    const data = await res.json();
    setDishes(data);
  };

  useEffect(() => { fetchData(); }, []);

  // 
  const startEdit = (dish: Dish) => {
    setEditingId(dish.id);
    setForm({
      name: dish.name,
      description: dish.description || "",
      price: dish.price
    });
  };

  // Ajouter ou modifier un plat
 const handleSubmit = async (e: React.SubmitEvent) => {
  e.preventDefault();
  // 1. Récupérer le token
  const token = localStorage.getItem("token");

  // 2. L'envoyer dans les headers
  const res = await fetch("http://resto-api.test/api/dishes", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(form),
  });

  if (res.status === 401) {
    // Si le token est expiré ou invalide, on redirige vers le login
    router.push("/login");
    return;
  }

  const url = editingId 
    ? `http://resto-api.test/api/dishes/${editingId}` 
    : "http://resto-api.test/api/dishes";
    
  const method = editingId ? "PUT" : "POST";

  await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  // Reset
  setEditingId(null);
  setForm({ name: "", description: "", price: "" });
  fetchData();
};

  //  Supprimer un plat
  const handleDelete = async (id: number) => {
    if (confirm("Supprimer ce plat ?")) {
      await fetch(`http://resto-api.test/api/dishes/${id}`, { method: "DELETE" });
      fetchData();
    }
  };


  //Gestion de tri
  const sortedDishes = [...dishes].sort((a, b) => {
    // On récupère les valeurs à comparer (ex: a['price'] ou a['orders_count'])
    const aValue = a[sortConfig.key as keyof Dish];
    const bValue = b[sortConfig.key as keyof Dish];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
  let direction = 'desc';
  // Si on clique sur la même colonne, on inverse juste la direction
  if (sortConfig.key === key && sortConfig.direction === 'desc') {
    direction = 'asc';
  }
  setSortConfig({ key, direction });
};



  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Gestion des plats à la carte</h1>
          <Link href="/" className="text-blue-600 hover:underline">← Retour au Menu</Link>
        </div>
                

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- FORMULAIRE D'AJOUT --- */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-slate-800">
              {editingId ? "📝 Modifier le Plat" : "➕ Ajouter un Plat"}
            </h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nom du plat" 
                className="w-full p-2 border rounded bg-white text-slate-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Description" 
                className="w-full p-2 border rounded bg-white text-slate-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
              <input 
                type="number" 
                step="500" 
                placeholder="Prix" 
                className="w-full p-2 border rounded bg-white text-slate-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})} 
                required 
              />
              <div className="flex gap-2">
                <button className="flex-1 bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-900 transition">
                  {editingId ? "Mettre à jour" : "Enregistrer"}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setForm({name:"", description:"", price:""}); }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* --- LISTE DE GESTION --- */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-200 border-b-2 border-slate-300">
                <tr>
                  
                  <th 
                    onClick={() => requestSort('name')} 
                    className="p-4 cursor-pointer text-slate-900 font-bold hover:bg-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      NOM {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>

                  <th 
                    onClick={() => requestSort('price')} 
                    className="p-4 cursor-pointer text-slate-900 font-bold hover:bg-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      PRIX {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>

                  <th 
                    onClick={() => requestSort('orders_count')} 
                    className="p-4 cursor-pointer text-slate-900 font-bold hover:bg-slate-300 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      VENTES {sortConfig.key === 'orders_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>

                  <th className="p-4 text-center text-slate-900 font-bold">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDishes.map(dish => (
                  <tr key={dish.id} className="border-b hover:bg-slate-50 transition">
                    {/* On force text-slate-900 ici */}
                    <td className="p-4 font-semibold text-slate-900">{dish.name}</td>
                    <td className="p-4 text-slate-700 font-medium">{dish.price} fcfa</td>
                    <td className="p-4 text-center">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                          {dish.orders_count}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => startEdit(dish)} 
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(dish.id)} 
                        className="text-red-600 hover:text-red-800 text-sm font-bold p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}