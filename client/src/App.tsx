import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useAuth, AuthProvider } from "./contexts/auth-context";
import { Sidebar } from "@/components/ui/sidebar";
import Dashboard from "@/pages/dashboard";
import Restaurants from "@/pages/restaurants";
import Users from "@/pages/users";
import Categories from "@/pages/categories";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import MenuEditor from "@/pages/menu-editor";
import Appearance from "@/pages/appearance";
import QRCodes from "@/pages/qr-codes";
import SocialMedia from "@/pages/social-media";
import PublicMenu from "@/pages/public-menu";
import Login from "@/pages/login";
import { useLocale, LocaleProvider } from "./contexts/locale-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { dir } = useLocale();

  return (
    <div className={`font-sans antialiased bg-neutral-50 text-neutral-800 ${dir === 'rtl' ? 'rtl' : ''}`}>
      <Switch>
        <Route path="/login" component={Login} />
        
        {/* Public Menu Route - Accessible without login */}
        <Route path="/menus/:restaurantId" component={PublicMenu} />

        {/* Protected routes */}
        <Route path="/">
          <ProtectedRoute>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-y-auto">
                <Switch>
                  <Route path="/restaurant/:id/dashboard" component={RestaurantDashboard} />
                  <Route path="/restaurant/:id/menu" component={MenuEditor} />
                  <Route path="/restaurant/:id/appearance" component={Appearance} />
                  <Route path="/restaurant/:id/qr-codes" component={QRCodes} />
                  <Route path="/restaurant/:id/social-media" component={SocialMedia} />
                  <Route path="/restaurants" component={Restaurants} />
                  <Route path="/users" component={Users} />
                  <Route path="/categories" component={Categories} />
                  <Route path="/" component={Dashboard} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <AppRoutes />
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;