import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { 
  LayoutDashboard, 
  Utensils, 
  Users, 
  Tags, 
  BarChart, 
  Settings, 
  Home, 
  BookOpen, 
  Palette, 
  QrCode, 
  Share2, 
  LogOut, 
  Menu, 
  X,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, isActive, onClick }: NavItemProps) => (
  <Link href={href}>
    <div
      className={`flex items-center px-4 py-3 hover:bg-neutral-100 cursor-pointer ${
        isActive ? "bg-primary/10 border-r-3 border-primary" : "text-neutral-700"
      }`}
      onClick={onClick}
    >
      <span className="w-5 text-center ml-3">{icon}</span>
      <span className={isActive ? "font-medium text-primary" : ""}>{label}</span>
    </div>
  </Link>
);

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLocale();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.role === "restaurant_admin";

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as "he" | "ar" | "en");
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <div className="fixed top-0 right-0 p-4 md:hidden z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          className="text-neutral-800 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-md fixed h-screen overflow-y-auto z-30 transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:relative md:translate-x-0`}
      >
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary font-heading">{t("menu_management")}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileSidebar}
              className="md:hidden text-neutral-500 hover:text-neutral-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Super Admin Navigation */}
        {isSuperAdmin && (
          <div>
            <div className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase">{t("system_management")}</div>
            <nav>
              <NavItem 
                href="/" 
                icon={<LayoutDashboard size={18} />} 
                label={t("dashboard")} 
                isActive={location === "/"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/restaurants" 
                icon={<Utensils size={18} />} 
                label={t("restaurants")} 
                isActive={location === "/restaurants"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/users" 
                icon={<Users size={18} />} 
                label={t("users")} 
                isActive={location === "/users"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/categories" 
                icon={<Tags size={18} />} 
                label={t("categories")} 
                isActive={location === "/categories"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/statistics" 
                icon={<BarChart size={18} />} 
                label={t("statistics")} 
                isActive={location === "/statistics"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/settings" 
                icon={<Settings size={18} />} 
                label={t("settings")} 
                isActive={location === "/settings"} 
                onClick={() => setIsMobileOpen(false)}
              />
            </nav>
          </div>
        )}

        {/* Restaurant Admin Navigation */}
        {isRestaurantAdmin && user?.restaurants?.length > 0 && (
          <div>
            <div className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase">{t("restaurant_management")}</div>
            <nav>
              {user.restaurants.map((restaurant) => (
                <div key={restaurant.id} className="mb-2">
                  <div className="px-4 py-2 text-sm font-semibold text-primary">{restaurant.name}</div>
                  <NavItem 
                    href={`/restaurant/${restaurant.id}/dashboard`}
                    icon={<Home size={18} />} 
                    label={t("general")} 
                    isActive={location === `/restaurant/${restaurant.id}/dashboard`} 
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <NavItem 
                    href={`/restaurant/${restaurant.id}/menu`}
                    icon={<BookOpen size={18} />} 
                    label={t("menu_editor")} 
                    isActive={location === `/restaurant/${restaurant.id}/menu`} 
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <NavItem 
                    href={`/restaurant/${restaurant.id}/appearance`}
                    icon={<Palette size={18} />} 
                    label={t("appearance")} 
                    isActive={location === `/restaurant/${restaurant.id}/appearance`} 
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <NavItem 
                    href={`/restaurant/${restaurant.id}/qr-codes`}
                    icon={<QrCode size={18} />} 
                    label={t("qr_codes")} 
                    isActive={location === `/restaurant/${restaurant.id}/qr-codes`} 
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <NavItem 
                    href={`/restaurant/${restaurant.id}/social-media`}
                    icon={<Share2 size={18} />} 
                    label={t("social_media")} 
                    isActive={location === `/restaurant/${restaurant.id}/social-media`} 
                    onClick={() => setIsMobileOpen(false)}
                  />
                </div>
              ))}
            </nav>
          </div>
        )}

        <div className="px-4 py-3 mt-auto border-t border-neutral-200 absolute bottom-0 w-full bg-white">
          {/* Language Selector */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Globe size={16} className="ml-2 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Language / שפה / اللغة</span>
            </div>
            <Select defaultValue={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* User Profile */}
          {user && (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="mr-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={async () => {
              await logout();
              setIsMobileOpen(false);
            }}
          >
            <LogOut className="h-4 w-4 ml-2" />
            {t("logout")}
          </Button>
        </div>
      </aside>
    </>
  );
}
