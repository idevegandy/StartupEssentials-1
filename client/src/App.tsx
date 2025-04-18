import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";

// Import pages
import AuthPage from "@/pages/auth-page";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import RestaurantsList from "@/pages/super-admin/restaurants";
import RestaurantAdminDashboard from "@/pages/restaurant-admin/dashboard";
import RestaurantCategories from "@/pages/restaurant-admin/categories";
import RestaurantItems from "@/pages/restaurant-admin/items";
import RestaurantMenuSettings from "@/pages/restaurant-admin/menu-settings";
import MenuDisplay from "@/pages/public/menu-display";

function Router() {
  return (
    <Switch>
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Public menu page */}
      <Route path="/menus/:slug" component={MenuDisplay} />
      
      {/* Super Admin Routes */}
      <ProtectedRoute path="/" component={SuperAdminDashboard} roles={['super_admin']} />
      <ProtectedRoute path="/restaurants" component={RestaurantsList} roles={['super_admin']} />
      <ProtectedRoute path="/super-admin/dashboard" component={SuperAdminDashboard} roles={['super_admin']} />
      <ProtectedRoute path="/super-admin/restaurants" component={RestaurantsList} roles={['super_admin']} />
      
      {/* Restaurant Admin Routes */}
      <ProtectedRoute path="/restaurant-admin/dashboard" component={RestaurantAdminDashboard} roles={['restaurant_admin']} />
      <ProtectedRoute path="/restaurant-admin/categories" component={RestaurantCategories} roles={['restaurant_admin']} />
      <ProtectedRoute path="/restaurant-admin/items" component={RestaurantItems} roles={['restaurant_admin']} />
      <ProtectedRoute path="/restaurant-admin/menu-settings" component={RestaurantMenuSettings} roles={['restaurant_admin']} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
