"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    href: "/admin/dishes",
    label: "Catalogue",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    children: [
      { href: "/admin/dishes", label: "Liste des plats" },
      { href: "/admin/dishes/add", label: "Ajouter / Modifier" },
    ],
  },
  {
    href: "/admin/menu",
    label: "Menu du Jour",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Commandes",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);
  const [openSubs, setOpenSubs] = useState<string[]>(["/admin/dishes"]);

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("userName");
    window.location.href = "/login";
  };

  const toggleSub = (href: string) =>
    setOpenSubs((p) => (p.includes(href) ? p.filter((h) => h !== href) : [...p, href]));

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen font-sans" style={{ background: "#F0EEE9" }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="w-56 min-h-screen fixed top-0 left-0 z-40 flex flex-col"
        style={{ background: "#141414" }}
      >
        {/* Marque */}
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#C84B31" }} />
            <div>
              <p className="text-white text-xs font-semibold tracking-widest uppercase leading-none">Lunch-Time</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>administration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            const hasChildren = !!item.children?.length;
            const subOpen = openSubs.includes(item.href);

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleSub(item.href)}
                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
                    style={active
                      ? { color: "#FFFFFF", borderLeft: "2px solid #C84B31", paddingLeft: "10px" }
                      : { color: "#666", borderLeft: "2px solid transparent", paddingLeft: "10px" }
                    }
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#CCC"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#666"; }}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <svg className={`w-3 h-3 transition-transform ${subOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
                    style={active
                      ? { color: "#FFFFFF", borderLeft: "2px solid #C84B31", paddingLeft: "10px" }
                      : { color: "#666", borderLeft: "2px solid transparent", paddingLeft: "10px" }
                    }
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#CCC"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#666"; }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}

                {hasChildren && subOpen && (
                  <div className="ml-6 mt-0.5 space-y-0.5 pl-3" style={{ borderLeft: "1px solid #222" }}>
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 rounded-md text-[11px] font-medium transition-colors"
                        style={pathname === child.href
                          ? { color: "#C84B31" }
                          : { color: "#555" }
                        }
                        onMouseEnter={e => { if (pathname !== child.href) e.currentTarget.style.color = "#CCC"; }}
                        onMouseLeave={e => { if (pathname !== child.href) e.currentTarget.style.color = "#555"; }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 space-y-0.5" style={{ borderTop: "1px solid #222" }}>
          <div className="pt-4" />
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "#555", borderLeft: "2px solid transparent", paddingLeft: "10px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#CCC"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#555"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Vue client
          </Link>
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "#555", borderLeft: "2px solid transparent", paddingLeft: "10px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#C84B31"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#555"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>

      <ConfirmDialog
        open={showLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmLabel="Déconnexion"
        cancelLabel="Rester"
        variant="warning"
        onConfirm={logout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
