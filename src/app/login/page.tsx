"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { toast } from 'sonner';


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      const res = await fetch("http://resto-api.test/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        Cookies.set('token', data.token, { expires: 1 }); 
        Cookies.set('role', data.user.role, { 
          expires: 7, 
          path: '/' // TRÈS IMPORTANT : rend le cookie visible sur tout le site
        });        
        Cookies.set('userName', data.user.name)
        //localStorage.setItem("token", data.token); // On stocke le jeton
        
        if (data.user.role !== "admin") {
          router.push("/admin"); 
        }else {
          router.push("/"); 
        }
      } else {
        toast.error("Erreur de connexion.");
      }
    }finally{
      setIsLoading(false); // On arrête le chargement, quoi qu'il arrive
    };
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Accès Admin</h2>
        <input 
          type="email" placeholder="Email" className="w-full p-3 mb-4 text-slate-900 border rounded placeholder-gray-300"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Mot de passe" className="w-full p-3 mb-6 text-slate-900 border rounded placeholder-gray-300"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button disabled={isLoading} className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition">
          {isLoading ? "connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}