// src/App.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import BusinessRoleGuard from "@/components/BusinessRoleGuard";

// Pages
import Index from "./pages/Index";                          // FIX BUG 1: ahora sí se importa
import AuthPage from "./pages/AuthPage";
import BusinessAuthPage from "./pages/BusinessAuthPage";
import ResetPassword from "./pages/ResetPassword";
import SelectBusiness from "./pages/SelectOrg";
import CustomerDashboard from "./pages/CustomerDashboard";
import BusinessLanding from "./pages/BusinessLanding";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRewards from "./pages/AdminRewards";
import AdminMembers from "./pages/AdminMembers";
import AdminStaff from "./pages/AdminStaff";
import AdminCustomers from "./pages/AdminCustomers";
import AdminMemberships from "./pages/AdminMemberships";
import AdminRedemptions from "./pages/AdminRedemptions";
import AdminLoyaltySettings from "./pages/AdminLoyaltySettings";
import AdminSettings from "./pages/AdminSettings";
import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformBusinessEdit from "./pages/PlatformBusinessEdit";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import PlansOverview from "./pages/PlansOverview";
import ActivationPending from "./pages/ActivationPending";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ─── Guards ───────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
}

/** Rutas que requieren sesión activa. Sin sesión → /login */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * FIX BUG 3: PublicRoute ahora redirige a "/" en lugar de "/select-business".
 * Así el Index hace la detección de rol inteligente antes de enviar al destino.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, globalRole } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (globalRole === 'platform_admin') return <Navigate to="/platform" replace />;
    return <Navigate to="/" replace />;   // ← "/" dispara Index con detección de rol
  }
  return <>{children}</>;
}

/** Rutas que requieren un rol global específico (platform_admin, etc.) */
function RoleRoute({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed: string[];
}) {
  const { user, loading, globalRole, businessContext } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const activeRole = businessContext?.role || globalRole || 'customer';
  if (!allowed.includes(activeRole)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/*
              FIX BUG 1: "/" ahora renderiza Index (detección inteligente de rol).
              Index redirige internamente según si es dueño, staff, cliente o nuevo.
              Si no hay sesión → Index ya hace navigate('/login') internamente.
            */}
            <Route path="/" element={<Index />} />

            {/* Auth pública */}
            <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Selector de negocio (fallback para usuarios con múltiples negocios) */}
            <Route path="/select-business" element={<ProtectedRoute><SelectBusiness /></ProtectedRoute>} />
            <Route path="/select-org" element={<Navigate to="/select-business" replace />} />

            {/*
              FIX BUG 5: /subscription-plans no tenía ruta.
              Alias que apunta a PlansOverview (la página real de planes).
            */}
            <Route path="/subscription-plans" element={<ProtectedRoute><PlansOverview /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><PlansOverview /></ProtectedRoute>} />
            <Route path="/activation" element={<ProtectedRoute><ActivationPending /></ProtectedRoute>} />

            {/* Platform Admin */}
            <Route path="/platform" element={<RoleRoute allowed={['platform_admin']}><PlatformDashboard /></RoleRoute>} />
            <Route path="/platform/business/:id" element={<RoleRoute allowed={['platform_admin']}><PlatformBusinessEdit /></RoleRoute>} />

            {/* ── Rutas públicas de negocio (por slug) ── */}
            <Route path="/b/:slug"        element={<BusinessProvider><BusinessLanding /></BusinessProvider>} />
            {/*
              BUG 2 CONTEXT: /b/:slug/login usa BusinessAuthPage (no AuthPage).
              BusinessAuthPage SÍ tiene acceso al slug via useParams y puede
              ejecutar linkUserToBusiness correctamente.
              AuthPage (/login) es solo para dueños/staff que entran por la web principal.
            */}
            <Route path="/b/:slug/login"  element={<BusinessProvider><BusinessAuthPage /></BusinessProvider>} />
            <Route path="/b/:slug/app"    element={<BusinessProvider><CustomerDashboard /></BusinessProvider>} />

            {/* ── Rutas Admin (por slug) ── */}
            <Route path="/admin/:slug"              element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminDashboard /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/rewards"      element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminRewards /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/staff"        element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminStaff /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/members"      element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminMembers /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/customers"    element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminCustomers /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/memberships"  element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminMemberships /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/redemptions"  element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminRedemptions /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/loyalty"      element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminLoyaltySettings /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/settings"     element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminSettings /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/plans"        element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><SubscriptionPlans /></BusinessRoleGuard></BusinessProvider>} />

            {/* ── Rutas Staff (por slug) ── */}
            <Route path="/staff/:slug" element={<BusinessProvider><BusinessRoleGuard allowed={['staff', 'business_admin']}><StaffDashboard /></BusinessRoleGuard></BusinessProvider>} />

            {/* Super Admin */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />

            {/* Redirects legacy → ahora apuntan a "/" para detección de rol */}
            <Route path="/admin"     element={<Navigate to="/" replace />} />
            <Route path="/staff"     element={<Navigate to="/" replace />} />
            <Route path="/app"       element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
