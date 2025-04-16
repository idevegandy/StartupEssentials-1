import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { LocaleProvider } from "@/contexts/locale-context";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import Restaurants from "@/pages/admin/restaurants";
import Settings from "@/pages/admin/settings";
import Profile from "@/pages/admin/profile";

// Restaurant Admin Pages
import RestaurantDashboard from "@/pages/restaurant/dashboard";
import Categories from "@/pages/restaurant/categories";
import Items from "@/pages/restaurant/items";
import Customization from "@/pages/restaurant/customization";
import QrCodePage from "@/pages/restaurant/qr-code";

// Auth Page
import AuthPage from "@/pages/auth";

// Public Menu Page
import MenuPage from "@/pages/menu/[slug]";

function Router() {
  return (
    <Switch>
      {/* Super Admin Routes */}
      <ProtectedRoute path="/" component={AdminDashboard} role="super_admin" />
      <ProtectedRoute path="/restaurants" component={Restaurants} role="super_admin" />
      <ProtectedRoute path="/settings" component={Settings} role="super_admin" />
      <ProtectedRoute path="/profile" component={Profile} role="any" />

      {/* Restaurant Admin Routes */}
      <ProtectedRoute path="/restaurant" component={RestaurantDashboard} role="restaurant_admin" />
      <ProtectedRoute path="/categories" component={Categories} role="restaurant_admin" />
      <ProtectedRoute path="/items" component={Items} role="restaurant_admin" />
      <ProtectedRoute path="/customization" component={Customization} role="restaurant_admin" />
      <ProtectedRoute path="/qr-code" component={QrCodePage} role="restaurant_admin" />

      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />

      {/* Public Menu Route */}
      <Route path="/menus/:slug" component={MenuPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <div className="rtl">
            <Router />
            <Toaster />
          </div>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
