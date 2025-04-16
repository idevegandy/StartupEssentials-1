import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  List,
  ShoppingBasket,
  Edit,
  QrCode,
  LogOut,
  Settings,
  PanelLeft,
  Globe,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Super Admin: Dashboard, Restaurants
// Restaurant Admin: Dashboard, Categories, Items, Menu Editor, QR Codes

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Determine menu items based on user role
  const menuItems = user?.role === "super_admin" 
    ? [
        { path: "/", label: "לוח בקרה", icon: <LayoutDashboard size={20} /> },
        { path: "/restaurants", label: "מסעדות", icon: <Store size={20} /> },
        { path: "/settings", label: "הגדרות", icon: <Settings size={20} /> },
      ]
    : [
        { path: "/restaurant-admin/dashboard", label: "לוח בקרה", icon: <LayoutDashboard size={20} /> },
        { path: "/restaurant-admin/categories", label: "קטגוריות", icon: <List size={20} /> },
        { path: "/restaurant-admin/items", label: "פריטים", icon: <ShoppingBasket size={20} /> },
        { path: "/restaurant-admin/menu-settings", label: "הגדרות תפריט", icon: <Edit size={20} /> },
        { path: "/restaurant-admin/qr-codes", label: "קודי QR", icon: <QrCode size={20} /> },
      ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900" dir="rtl">
      {/* Sidebar */}
      <div 
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-lg transition-all duration-300 flex flex-col h-screen`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className={`text-xl font-bold ${collapsed ? "hidden" : "block"}`}>RestaurantOS</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "הרחב תפריט" : "צמצם תפריט"}
          >
            <PanelLeft size={20} className={`transform transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
        
        <div className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <span
                    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      isActive(item.path) 
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-medium" 
                        : ""
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span className={`${collapsed ? "hidden" : "block"}`}>{item.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${collapsed ? "hidden" : "block"}`}>
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === "super_admin" ? "מנהל מערכת" : "מנהל מסעדה"}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="focus:ring-0">
                  <Settings size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>התנתק</span>
                </DropdownMenuItem>
                {user?.role === "restaurant_admin" && user?.restaurantId && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`/menus/${user?.restaurantId}`, '_blank')}>
                    <Globe className="ml-2 h-4 w-4" />
                    <span>צפה בתפריט</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </div>
    </div>
  );
}