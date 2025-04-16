import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
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

// Auth Pages
import AuthPage from "@/pages/auth";
import TestLogin from "@/pages/test-login";

// Public Menu Page
import MenuPage from "@/pages/menu/[slug]";

function Router() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated - show auth page or public menu
  if (!user) {
    return (
      <Switch>
        {/* Public Menu Route */}
        <Route path="/menus/:slug" component={MenuPage} />
        
        {/* Test Login Route - for debugging auth issues */}
        <Route path="/test-login" component={TestLogin} />
        
        {/* Auth Route - default route */}
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  // For super_admin
  if (user.role === "super_admin") {
    console.log("Rendering super_admin routes");
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/restaurants" component={Restaurants} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        
        {/* Test Login & Debug Route */}
        <Route path="/test-login" component={TestLogin} />
        
        {/* Public Menu Route */}
        <Route path="/menus/:slug" component={MenuPage} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For restaurant_admin
  console.log("Rendering restaurant_admin routes");
  return (
    <Switch>
      <Route path="/" component={RestaurantDashboard} />
      <Route path="/categories" component={Categories} />
      <Route path="/items" component={Items} />
      <Route path="/customization" component={Customization} />
      <Route path="/qr-code" component={QrCodePage} />
      <Route path="/profile" component={Profile} />
      
      {/* Test Login & Debug Route */}
      <Route path="/test-login" component={TestLogin} />
      
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
