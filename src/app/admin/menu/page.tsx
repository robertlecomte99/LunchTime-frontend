"use client";

import { useEffect, useState, useRef } from "react";
//import Link from "next/link";
import { apiFetch } from "@/lib/api";

import { useRouter } from "next/navigation";
import { toast } from 'sonner';


interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  orders_count: number;
}
interface Menu {
  id: number;
  menu_date: Date;
  is_published: boolean;
  dish_ids: Dish[];
}

export default function AdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const router = useRouter();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState({ key: 'orders_count', direction: 'desc' });
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  

  //  Charger les données (Plats)
  const fetchData = async () => {
    const res = await apiFetch("/dishes");
    const data = await res.json();
    setDishes(data);
  };

  useEffect(() => { fetchData(); }, []);

  // 
  const startEdit = (dish: Dish) => {
    setEditingId(dish.id);
    //setForm({name: dish.name,description: dish.description || "",price: dish.price,image: dish.image});
    setName(dish.name);
    setDescription(dish.description || "");
    setPrice(dish.price);
    setImage(dish.image);
  };

  const handleResetFile = () => {
    setFile(null); 
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // On vide l'input physiquement
    }
  };
  // Ajouter ou modifier un plat
 const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  //const token = localStorage.getItem("token"); ancienne methode de recup token
  const url = editingId 
    ? `/dishes/${editingId}` 
    : "/dishes";
  //const method = editingId ? "PUT" : "POST";
  const message = editingId ? "Plat mis à jour avec succés" : "Plat ajouté avec succés";
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price.toString());
  
  if (file) {
      formData.append('image', file); //fichier binaire
  }

  if (editingId) {
      formData.append('_method', 'PUT');
  }

  const res=await apiFetch(url, {
    method: "POST",
    //headers: { "Content-Type": "Application/JSON"},
    body: formData,
  });

  if (res.status === 401) {
    // Si le token est expiré ou invalide, on redirige vers le login
    router.push("/login");
    return;
  }
  if (res.status === 422) {
    const data = await res.json();
    setErrors(data.errors); // Laravel renvoie les erreurs par champ
  }  
    
  if (res.ok) {
    toast.success(message);
  } else {
    toast.error("Échec de la requête.");
  }

  // Reset
  handleResetFile();
  setEditingId(null);
  //setForm({ name: "", description: "", price: "",image: ""});
  setName("");
  setDescription("");
  setPrice("");
  fetchData();
  setImage("");
  
};

  //  Supprimer un plat
  const handleDelete = async (id: number) => {
    if (confirm("Supprimer ce plat ?")) {
      //await fetch(`http://resto-api.test/api/dishes/${id}`, { method: "DELETE" });
      //fetchData();
      const res = await apiFetch(`/dishes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Le plat a été supprimé !");
        fetchData();
      } else {
        toast.error("Erreur lors de la suppression.");
      }
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
                value={name}
                onChange={e => setName(e.target.value)} 
                required 
              />
              <textarea 
                placeholder="Description" 
                className="w-full p-2 border rounded bg-white text-slate-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
              <input 
                type="number" 
                min="0"
                step="500" 
                placeholder="Prix" 
                className="w-full p-2 border rounded bg-white text-slate-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                required 
              />
              
              <div className="flex flex-col gap-2 text-gray-400">
                
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    id="image"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFile(e.target.files[0]); //stockage du fichier dans un state
                      }
                    }}
                    className="border p-2 rounded"
                  />
                  {file && (
                    <button
                      type="button"
                      onClick={handleResetFile}
                      className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors"
                      title="Supprimer le fichier"
                    >
                      ✕
                    </button>
                  )}
                
                {file ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Aperçu :</p>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Aperçu" 
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                ):(
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Aperçu :</p>
                    <img 
                      src={`http://resto-api.test/storage/${image}`} 
                      alt="Aperçu" 
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                )}

              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-900 transition">
                  {editingId ? "Mettre à jour" : "Enregistrer"}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setName("");setDescription("");setPrice("");setImage(""); handleResetFile}}
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