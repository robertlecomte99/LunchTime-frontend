"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from 'js-cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userName = Cookies.get('userName');
  const logout = () => {
    Cookies.remove('token');
    window.location.href = "/login";
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Gestion des plats", href: "/admin/dishes", icon: "🍔" },
    { name: "Gestion du menu", href: "/admin/menu", icon: "📝" },
    { name: "Gestion des commandes", href: "/admin/orders", icon: "🔔" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">U</div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase">Un Instant</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110`}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 transition">
            🌐 Voir le site de commandes
          </Link>
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium"
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 flex flex-col">
        {/* TOPBAR (Optional but recommended for context) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="font-semibold text-slate-700 capitalize">
            {pathname.split('/').pop() || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bonjour,</p>
               <p className="text-sm font-semibold">{userName}</p>
             </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}