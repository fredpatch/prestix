import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Sun,
  Moon,
  Contact,
  FileText,
  Receipt,
  AlertTriangle,
  ArrowLeft,
  Package,
  Percent,
  ClipboardCheck,
  History,
  Menu,
  X,
  Bell,
  Send,
  HelpCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth.api";
import api from "@/lib/axios";
import { useTheme } from "@/lib/theme";
import { usePageHeaderValue } from "./lib/page-header";
import { useNotificationUnreadCount } from "@/hooks/queries/useNotifications";
import { HelpPanel } from "./HelpPanel";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  moduleCode?: string; // gates visibility via /api/feature-flags, in addition to role
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, moduleCode: "dashboard" },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/analyse", label: "Analyse", icon: BarChart3, moduleCode: "dashboard" },
  { to: "/parties", label: "Parties", icon: Contact, moduleCode: "party" },
  { to: "/proformas", label: "Proformas", icon: FileText, moduleCode: "documents" },
  { to: "/invoices", label: "Factures", icon: Receipt, moduleCode: "documents" },
  { to: "/creances", label: "Créances", icon: AlertTriangle, moduleCode: "penalties" },
  { to: "/stock", label: "Stock", icon: Package, moduleCode: "shop" },
  { to: "/commissions", label: "Commissions", icon: Percent, moduleCode: "commission" },
  {
    to: "/commissions/edit-requests",
    label: "Demandes de modification",
    icon: ClipboardCheck,
    roles: ["admin", "super_admin"],
  },
  { to: "/users", label: "Utilisateurs", icon: Users, roles: ["admin", "super_admin"] },
  { to: "/audit-log", label: "Journal d'audit", icon: History, roles: ["admin", "super_admin"] },
  { to: "/mail-outbox", label: "Historique emails", icon: Send, roles: ["admin", "super_admin"] },
  { to: "/settings", label: "Paramètres", icon: Settings2, roles: ["super_admin"] },
  { to: "/aide", label: "Aide", icon: HelpCircle },
];

interface LayoutProps {
  userRole?: string;
  userFullName?: string;
}

export default function Layout({ userRole, userFullName }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const pageHeader = usePageHeaderValue();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [enabledModules, setEnabledModules] = useState<Set<string> | null>(null);
  const { data: unreadNotifications = 0 } = useNotificationUnreadCount();
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [helpPanelTopic, setHelpPanelTopic] = useState<string | undefined>(undefined);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobile(query.matches);
      if (!query.matches) setMobileNavOpen(false);
    };

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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

  const sidebarExpanded = isMobile || sidebarOpen;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-black/35 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <motion.aside
        animate={
          isMobile
            ? { width: 244, x: mobileNavOpen ? 0 : -260 }
            : { width: sidebarOpen ? 225 : 52, x: 0 }
        }
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-y-0 left-0 z-40 flex h-full flex-shrink-0 flex-col overflow-hidden bg-brand-gold-dark shadow-xl md:relative md:z-auto md:shadow-none"
      >
        <div className="flex h-[57px] items-center gap-3 overflow-hidden border-b border-white/10 px-4 py-4">
          <img
            src="/brand/logo.jpg"
            alt="PrestiX"
            className="h-9 w-9 flex-shrink-0 rounded-lg bg-white/10 object-contain"
          />
          <div
            className={cn(
              "overflow-hidden whitespace-nowrap transition-opacity duration-200",
              sidebarExpanded ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="text-white font-semibold text-[11px] leading-tight">PrestiX</p>
            <p className="text-brand-gold-light text-[11px] leading-tight">Le Prestigieux</p>
          </div>
          <button
            type="button"
            className="ml-auto flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!sidebarExpanded ? item.label : undefined}
                onClick={() => {
                  if (isMobile) setMobileNavOpen(false);
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 overflow-hidden rounded-md px-2.5 py-[7px] transition-colors",
                    isActive
                      ? "bg-brand-blue text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon size={16} className="flex-shrink-0" strokeWidth={1.75} />
                <span
                  className={cn(
                    "text-[12px] font-medium truncate whitespace-nowrap transition-opacity duration-150",
                    sidebarExpanded ? "opacity-100" : "opacity-0",
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
          className="hidden h-10 flex-shrink-0 items-center justify-center border-t border-white/10 text-white/40 transition-colors hover:bg-white/10 hover:text-white md:flex"
          aria-label={sidebarOpen ? "Réduire la barre latérale" : "Agrandir la barre latérale"}
        >
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>

        <div className="border-t border-white/10 p-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="h-9 w-full justify-start px-2.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
            <span className="text-[11px]">Déconnexion</span>
          </Button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[57px] flex-shrink-0 items-center justify-between border-b border-border bg-card px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              title="Menu"
              className="text-muted-foreground hover:text-brand-gold-dark md:hidden"
            >
              <Menu size={16} />
            </Button>
            {pageHeader?.backTo && (
              <Link
                to={pageHeader.backTo}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-brand-gold-dark hover:bg-accent shrink-0"
                title="Retour"
              >
                <ArrowLeft size={15} />
              </Link>
            )}
            <h1 className="text-brand-gold-dark font-semibold text-sm truncate">
              {pageHeader?.title ?? "PrestiX"}
            </h1>
            {pageHeader?.badge && (
              <span className="text-[10.5px] font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded shrink-0">
                {pageHeader.badge}
              </span>
            )}
          </div>
          <div className="ml-2 flex flex-shrink-0 items-center gap-1 sm:ml-4">
            {location.pathname !== "/aide" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setHelpPanelTopic(pageHeader?.helpTopic);
                  setHelpPanelOpen(true);
                }}
                title="Aide"
                className="text-muted-foreground hover:text-brand-gold-dark"
              >
                <HelpCircle size={14} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="text-muted-foreground hover:text-brand-gold-dark"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notifications")}
              title="Notifications"
              className="relative text-muted-foreground hover:text-brand-gold-dark"
            >
              <Bell size={14} />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white tabular-nums">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <div className="flex items-center gap-2.5 px-1 sm:px-1.5">
              <div className="hidden max-w-[180px] text-right sm:block">
                <p className="text-[12px] font-semibold text-foreground leading-tight">
                  {userFullName}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">
                  {userRole}
                </p>
              </div>
              <div className="flex h-8 w-8 flex-shrink-0 select-none items-center justify-center rounded-lg bg-brand-gold-dark text-[11px] font-bold text-white">
                {initials || "—"}
              </div>
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border md:block" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden h-8 gap-1.5 px-2.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 md:inline-flex"
            >
              {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
              <span className="text-[11px]">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <HelpPanel
        open={helpPanelOpen}
        onOpenChange={setHelpPanelOpen}
        topicSlug={helpPanelTopic}
        onTopicChange={setHelpPanelTopic}
      />
    </div>
  );
}
