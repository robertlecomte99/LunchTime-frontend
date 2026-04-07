"use client";

import Link from "next/link";
import Cookies from 'js-cookie';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const logout = () => {
    Cookies.remove('token'); // On supprime le cookie
    window.location.href = "/login"; // Redirection brutale mais efficace
  };
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR FIXE */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl">
        <h1 className="text-xl font-black mb-10 text-orange-500 tracking-tighter">UN INSTANT ADMIN v1</h1>
        
        <nav className="space-y-2 flex-1">
          <Link href="/admin" className="block p-3 rounded-lg hover:bg-slate-800 transition font-medium border-l-4 border-transparent hover:border-orange-500">
            📊 Dashboard
          </Link>
          <Link href="/admin/menu" className="block p-3 rounded-lg hover:bg-slate-800 transition font-medium border-l-4 border-transparent hover:border-orange-500">
            🍔 Gestion des plats
          </Link>
          <Link href="/admin/orders" className="block p-3 rounded-lg hover:bg-slate-800 transition font-medium border-l-4 border-transparent hover:border-orange-500">
            🔔 Suivi des commandes en cours
          </Link>
        </nav>
        <button 
          onClick={logout} 
          className="mt-4 p-3 text-left text-red-400 hover:bg-slate-800 rounded-lg transition font-medium"
        >
          🚪 Déconnexion
        </button>
        <div className="pt-6 border-t border-slate-700">
          <Link href="/" className="text-sm text-slate-400 hover:text-white underline">Voir le site client</Link>
        </div>
      </aside>

      {/* CONTENU DYNAMIQUE */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}