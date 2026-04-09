"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useEffect, useState } from "react";
//import Link from "next/link";
//import { toast } from 'sonner';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  orders_count: number;
}

export default function AdminPage() {

  const [dishes, setDishes] = useState<Dish[]>([]);
  
  //  Charger les données (Plats + KPIs)
  const fetchData = async () => {
    const res = await fetch("http://resto-api.test/api/dishes");
    const data = await res.json();
    setDishes(data);
  };

  useEffect(() => { fetchData(); }, []);


  // Calcul des KPIs
  const totalOrders = dishes.reduce((acc, dish) => acc + dish.orders_count, 0);
  const bestSeller = [...dishes].sort((a, b) => b.orders_count - a.orders_count)[0];
  
  //On extrait tous les nombres de ventes et on trouve le maximum
  const maxSales = Math.max(...dishes.map(d => d.orders_count), 0);
  // On prépare les données pour le graphique
  const chartData = dishes.map(dish => ({
    name: dish.name,
    ventes: dish.orders_count
  }));

  



  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Administrateur</h1>
          {/* <Link href="/" className="text-blue-600 hover:underline">← Retour au Menu</Link>*/}
        </div>

        {/* --- SECTION KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Total Commandes</p>
            <p className="text-3xl font-black text-slate-800">{totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Plat Vedette 🔥</p>
            <p className="text-xl font-bold text-slate-800">{bestSeller?.name || "N/A"}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Nombre de Plats</p>
            <p className="text-3xl font-black text-slate-800">{dishes.length}</p>
          </div>
        </div>

        {/* --- SECTION GRAPHIQUE --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-slate-700 mb-6">Volume des ventes par plat</h2>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ventes" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      // Si les ventes de cette barre égalent le maximum, on met en orange
                      fill={entry.ventes === maxSales && maxSales > 0 ? '#f97316' : '#3b82f6'} 
                      fillOpacity={entry.ventes === maxSales ? 1 : 0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
          
      </div>
    </div>
  );
}