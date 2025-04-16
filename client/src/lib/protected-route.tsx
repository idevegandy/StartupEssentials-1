import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: "super_admin" | "restaurant_admin" | "any";
}

export function ProtectedRoute({
  path,
  component: Component,
  role = "any",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Properly check role permissions
  if (role !== "any") {
    // If route requires super_admin role but user is not super_admin
    if (role === "super_admin" && user.role !== "super_admin") {
      console.log("Access denied: super_admin route, user is", user.role);
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
    
    // If route requires restaurant_admin role but user is not restaurant_admin or super_admin
    if (role === "restaurant_admin" && user.role !== "restaurant_admin" && user.role !== "super_admin") {
      console.log("Access denied: restaurant_admin route, user is", user.role);
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
