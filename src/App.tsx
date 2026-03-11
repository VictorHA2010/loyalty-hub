import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import BusinessRoleGuard from "@/components/BusinessRoleGuard";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ children, allowed }: { children: React.ReactNode; allowed: string[] }) {
  const { user, loading, globalRole, businessContext } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const activeRole = businessContext?.role || globalRole || 'customer';
  if (!allowed.includes(activeRole)) return <Navigate to="/select-business" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, globalRole } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (globalRole === 'platform_admin') return <Navigate to="/platform" replace />;
    return <Navigate to="/select-business" replace />;
  }
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/select-business" element={<ProtectedRoute><SelectBusiness /></ProtectedRoute>} />
            <Route path="/select-org" element={<Navigate to="/select-business" replace />} />

            {/* Platform Admin */}
            <Route path="/platform" element={<RoleRoute allowed={['platform_admin']}><PlatformDashboard /></RoleRoute>} />

            {/* Business routes by slug */}
            <Route path="/b/:slug" element={<BusinessProvider><BusinessLanding /></BusinessProvider>} />
            <Route path="/b/:slug/login" element={<BusinessProvider><BusinessAuthPage /></BusinessProvider>} />
            <Route path="/b/:slug/app" element={<BusinessProvider><CustomerDashboard /></BusinessProvider>} />

            {/* Admin routes by slug — guarded by role */}
            <Route path="/admin/:slug" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminDashboard /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/rewards" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminRewards /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/staff" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminStaff /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/members" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminMembers /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/customers" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminCustomers /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/memberships" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminMemberships /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/redemptions" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminRedemptions /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/loyalty" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminLoyaltySettings /></BusinessRoleGuard></BusinessProvider>} />
            <Route path="/admin/:slug/settings" element={<BusinessProvider><BusinessRoleGuard allowed={['business_admin']}><AdminSettings /></BusinessRoleGuard></BusinessProvider>} />

            {/* Staff routes by slug — guarded by role */}
            <Route path="/staff/:slug" element={<BusinessProvider><BusinessRoleGuard allowed={['staff', 'business_admin']}><StaffDashboard /></BusinessRoleGuard></BusinessProvider>} />

            {/* Legacy redirects */}
            <Route path="/admin" element={<Navigate to="/select-business" replace />} />
            <Route path="/staff" element={<Navigate to="/select-business" replace />} />
            <Route path="/app" element={<Navigate to="/select-business" replace />} />
            <Route path="/dashboard" element={<Navigate to="/select-business" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
