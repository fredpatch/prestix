import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { authApi } from "./lib/auth.api";
import api from "./lib/axios";
import LoginPage from "./pages/auth/LoginPage";
import BootstrapPage from "./pages/BootstrapPage";
import Layout from "./components/layouts/Layout";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import PartyDetailPage from "./pages/party/PartyDetailPage";
import PartiesPage from "./pages/PartiesPage";
import ProformasPage from "./pages/ProformasPage";
import ProformaDetailPage from "./pages/documents/proforma/components/ProformaDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetailPage from "./pages/documents/invoices/components/InvoiceDetailPage";
import CreancesPage from "./pages/CreancesPage";

interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: "agent" | "manager" | "admin" | "super_admin";
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Reserved for Sprint 2+ admin pages (Settings, Users, Catalog) — not yet wired.
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function BootstrapRoute({ bootstrapNeeded }: { bootstrapNeeded: boolean }) {
  if (!bootstrapNeeded) return <Navigate to="/login" replace />;
  return <BootstrapPage />;
}

// Placeholder until the real dashboard (M12) lands.
function DashboardPlaceholder() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-lg font-bold text-brand-gold-dark">Tableau de bord</h1>
      <p className="text-neutral-500 text-sm mt-1">
        Connecté : {user?.fullName} ({user?.role})
      </p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapNeeded, setBootstrapNeeded] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const bootstrapRes = await api.get("/bootstrap/status");
        if (!bootstrapRes.data.initialized) {
          setBootstrapNeeded(true);
          setLoading(false);
          return;
        }

        const response = await authApi.me();
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <img
            src="/brand/logo.jpg"
            alt="PrestiX"
            className="w-12 h-12 rounded-full mx-auto object-contain"
          />
          <p className="text-neutral-500 text-sm">Chargement de PrestiX...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <Routes>
        <Route path="/bootstrap" element={<BootstrapRoute bootstrapNeeded={bootstrapNeeded} />} />
        {bootstrapNeeded && <Route path="*" element={<Navigate to="/bootstrap" replace />} />}

        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout userRole={user?.role} userFullName={user?.fullName} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/parties" element={<PartiesPage />} />
          <Route path="/parties/:id" element={<PartyDetailPage />} />
          <Route path="/proformas" element={<ProformasPage />} />
          <Route path="/proformas/:id" element={<ProformaDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/creances" element={<CreancesPage />} />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
