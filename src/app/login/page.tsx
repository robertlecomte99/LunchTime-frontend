"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const res = await fetch("http://resto-api.test/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      Cookies.set('token', data.token, { expires: 1 }); 
      //localStorage.setItem("token", data.token); // On stocke le jeton
      router.push("/admin"); // Direction le dashboard admin
    } else {
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Accès Admin</h2>
        <input 
          type="email" placeholder="Email" className="w-full p-3 mb-4 border rounded placeholder-gray-300"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Mot de passe" className="w-full p-3 mb-6 border rounded placeholder-gray-300"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition">
          Se connecter
        </button>
      </form>
    </div>
  );
}