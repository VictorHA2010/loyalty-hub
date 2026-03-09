import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import SelectBusiness from "./pages/SelectOrg";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffScan from "./pages/StaffScan";
import StaffRedemptions from "./pages/StaffRedemptions";
import AdminActivity from "./pages/AdminActivity";
import AdminRewards from "./pages/AdminRewards";
import AdminMembers from "./pages/AdminMembers";
import AdminRedemptions from "./pages/AdminRedemptions";
import AdminSettings from "./pages/AdminSettings";
import PlatformDashboard from "./pages/PlatformDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Cargando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ children, allowed }: { children: React.ReactNode; allowed: string[] }) {
  const { user, loading, globalRole, businessContext } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Cargando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  const activeRole = businessContext?.role || globalRole || 'customer';
  if (!allowed.includes(activeRole)) return <Navigate to="/select-business" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, globalRole } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Cargando...</p></div>;
  if (user) {
    if (globalRole === 'platform_admin') return <Navigate to="/platform" replace />;
    return <Navigate to="/select-business" replace />;
  }
  return <>{children}</>;
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

            {/* Business Admin */}
            <Route path="/admin" element={<RoleRoute allowed={['business_admin', 'platform_admin']}><AdminActivity /></RoleRoute>} />
            <Route path="/admin/rewards" element={<RoleRoute allowed={['business_admin', 'platform_admin']}><AdminRewards /></RoleRoute>} />
            <Route path="/admin/members" element={<RoleRoute allowed={['business_admin', 'platform_admin']}><AdminMembers /></RoleRoute>} />
            <Route path="/admin/redemptions" element={<RoleRoute allowed={['business_admin', 'platform_admin']}><AdminRedemptions /></RoleRoute>} />
            <Route path="/admin/settings" element={<RoleRoute allowed={['business_admin', 'platform_admin']}><AdminSettings /></RoleRoute>} />

            {/* Staff */}
            <Route path="/staff" element={<RoleRoute allowed={['staff', 'business_admin', 'platform_admin']}><StaffScan /></RoleRoute>} />
            <Route path="/staff/redemptions" element={<RoleRoute allowed={['staff', 'business_admin', 'platform_admin']}><StaffRedemptions /></RoleRoute>} />

            {/* Customer */}
            <Route path="/app" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
