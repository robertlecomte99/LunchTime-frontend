"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://LunchTime-api.test/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        Cookies.set("token", data.token, { expires: 1 });
        Cookies.set("role", data.user.role, { expires: 7, path: "/" });
        Cookies.set("permissions", JSON.stringify(data.user.permissions), { expires: 7 });
        Cookies.set("userName", data.user.name);

        if (JSON.stringify(data.user.permissions).includes("get_admin_panel")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        toast.error("Identifiants incorrects. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0800] p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl min-h-[560px]">

        {/* ── Panneau gauche – visuel food ── */}
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-[#1a1008] overflow-hidden">
          {/* Grille de food en fond */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
            {[
              { bg: "#221508", icon: "🍔" },
              { bg: "#1d1006", icon: "🍕" },
              { bg: "#1d1006", icon: "🌮" },
              { bg: "#221508", icon: "🍟" },
            ].map((tile, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-5xl"
                style={{ background: tile.bg }}
              >
                {tile.icon}
              </div>
            ))}
          </div>

          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/65" />

          {/* Contenu */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium tracking-widest uppercase text-white/60">
                Lunch-Time
              </span>
            </div>

            {/* Titre héro */}
            <div className="mt-auto pb-2">
              <h2 className="text-5xl font-medium text-white leading-none tracking-tight">
                Lunch<br />
                <span className="text-orange-400">Time.</span>
              </h2>
              <p className="text-sm text-white/40 mt-3 leading-relaxed max-w-[200px]">
                Commandez votre repas du midi en quelques secondes.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {["Rapide", "Frais", "Savoureux"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Panneau droit – formulaire ── */}
        <div className="bg-white flex flex-col justify-center px-10 py-12">
          {/* Header formulaire */}
          <div className="mb-8">
            <p className="text-[10px] font-medium tracking-[.18em] uppercase text-orange-500 mb-2">
              Espace Login
            </p>
            <h1 className="text-2xl font-medium text-stone-900 leading-tight">
              Bon retour<br />parmi nous
            </h1>
            <p className="text-sm text-stone-400 mt-2">
              Connectez-vous pour accéder au menu du jour.
            </p>

            
          </div>

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-stone-500 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                placeholder="prenom.nom@entreprise.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-stone-500 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-[.99] text-white text-sm font-medium tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Connexion en cours…
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-stone-300">
            Lunch-Time &copy; {new Date().getFullYear()} — Réservé aux employés de NEXUS Corp
          </p>
        </div>
      </div>
    </div>
  );
}
