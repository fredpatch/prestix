import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth.api";
import api from "@/lib/axios";
import { useTheme } from "@/lib/theme";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  moduleCode?: string; // gates visibility via /api/feature-flags, in addition to role
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, moduleCode: "dashboard" },
  { to: "/users", label: "Utilisateurs", icon: Users, roles: ["admin", "super_admin"] },
  { to: "/settings", label: "Paramètres", icon: Settings2, roles: ["super_admin"] },
];

interface LayoutProps {
  userRole?: string;
  userFullName?: string;
}

export default function Layout({ userRole, userFullName }: LayoutProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [enabledModules, setEnabledModules] = useState<Set<string> | null>(null);

  useEffect(() => {
    api
      .get("/feature-flags")
      .then((res) => {
        const enabled = new Set<string>(
          res.data
            .filter((f: { enabled: boolean }) => f.enabled)
            .map((f: { moduleCode: string }) => f.moduleCode),
        );
        setEnabledModules(enabled);
      })
      .catch(() => setEnabledModules(new Set())); // fail closed — hide module-gated items on error
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles && (!userRole || !item.roles.includes(userRole))) return false;
    if (item.moduleCode && enabledModules && !enabledModules.has(item.moduleCode)) return false;
    return true;
  });

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      navigate("/login");
    }
  }

  const initials = (userFullName ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.aside
        animate={{ width: sidebarOpen ? 180 : 45 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col bg-brand-gold-dark overflow-hidden flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-3 py-4 border-b border-white/10 h-[57px] overflow-hidden">
          <img
            src="/brand/logo.jpg"
            alt="PrestiX"
            className="w-8 h-8 rounded-lg object-contain bg-white/10 flex-shrink-0"
          />
          <div
            className={cn(
              "overflow-hidden whitespace-nowrap transition-opacity duration-200",
              sidebarOpen ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="text-white font-bold text-sm leading-tight">PrestiX</p>
            <p className="text-brand-gold-light text-[10px] leading-tight">Le Prestigieux</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-2.5 py-[7px] rounded-md transition-colors overflow-hidden",
                    isActive
                      ? "bg-brand-blue text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon size={15} className="flex-shrink-0" strokeWidth={1.75} />
                <span
                  className={cn(
                    "text-[12px] font-medium truncate whitespace-nowrap transition-opacity duration-150",
                    sidebarOpen ? "opacity-100" : "opacity-0",
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center h-10 border-t border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label={sidebarOpen ? "Réduire la barre latérale" : "Agrandir la barre latérale"}
        >
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </motion.aside>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="bg-card border-b border-border flex items-center justify-between px-6 h-[57px] flex-shrink-0">
          <h1 className="text-brand-gold-dark font-semibold text-sm truncate">PrestiX</h1>

          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="text-muted-foreground hover:text-brand-gold-dark"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            <div className="flex items-center gap-2.5 px-1.5">
              <div className="text-right">
                <p className="text-[12px] font-semibold text-foreground leading-tight">
                  {userFullName}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">
                  {userRole}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-brand-gold-dark text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none">
                {initials || "—"}
              </div>
            </div>

            <div className="w-px h-5 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
              {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
              <span className="text-[11px]">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
