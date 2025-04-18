import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  UtensilsCrossed, 
  Tag, 
  QrCode, 
  ShoppingBag, 
  Edit,
  Share2,
  Palette,
  InfoIcon,
  ArrowRightLeft,
  User 
} from "lucide-react";
import { Restaurant, Category, MenuItem, User as UserType } from "@shared/schema";

export default function RestaurantDashboard() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id);
  const { user } = useAuth();
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/restaurants", restaurantId, "categories"],
    enabled: !!restaurantId,
  });

  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", restaurantId, "menu-items"],
    enabled: !!restaurantId,
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "super_admin",
  });

  // Check if current user has access to this restaurant
  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.id === restaurant?.adminId;
  const hasAccess = isSuperAdmin || isRestaurantAdmin;

  const getRestaurantAdmin = () => {
    if (!users || !restaurant) return null;
    return users.find(u => u.id === restaurant.adminId);
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{t("active")}</Badge>;
    } else if (status === "inactive") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{t("inactive")}</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{t("setup")}</Badge>;
    }
  };

  const navigateTo = (path: string) => {
    navigate(`/restaurant/${restaurantId}/${path}`);
  };

  if (!hasAccess) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <InfoIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("access_denied")}</h2>
              <p className="text-neutral-600">{t("no_access_to_restaurant")}</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                {t("back_to_dashboard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingRestaurant) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <InfoIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("restaurant_not_found")}</h2>
              <p className="text-neutral-600">{t("restaurant_not_found_description")}</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                {t("back_to_dashboard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Avatar className="h-12 w-12 rounded-full mr-4 bg-primary">
            <AvatarImage src={restaurant.logo || ""} alt={restaurant.name} />
            <AvatarFallback className="bg-primary text-white">{restaurant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-heading">{restaurant.name}</h1>
            <div className="flex items-center mt-1">
              {getStatusBadge(restaurant.status)}
              <span className="text-sm text-neutral-500 mr-4 ml-2">
                {restaurant.address || t("no_address")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={() => navigateTo("menu")}>
            <ShoppingBag className="ml-2 h-4 w-4" />
            {t("menu_editor")}
          </Button>
          <Button variant="outline" onClick={() => navigateTo("appearance")}>
            <Palette className="ml-2 h-4 w-4" />
            {t("appearance")}
          </Button>
          <Button variant="outline" onClick={() => navigateTo("qr-codes")}>
            <QrCode className="ml-2 h-4 w-4" />
            {t("qr_codes")}
          </Button>
          <Button onClick={() => navigate(`/restaurants?action=edit&id=${restaurantId}`)}>
            <Edit className="ml-2 h-4 w-4" />
            {t("edit_restaurant")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<Tag className="h-5 w-5" />}
          iconColor="text-primary"
          iconBgColor="bg-primary bg-opacity-10"
          title={t("categories")}
          value={categories?.length || 0}
        />
        
        <DashboardCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          title={t("menu_items")}
          value={menuItems?.length || 0}
        />
        
        <DashboardCard
          icon={<QrCode className="h-5 w-5" />}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          title={t("qr_code_scans")}
          value="0"
        />
        
        <DashboardCard
          icon={<ArrowRightLeft className="h-5 w-5" />}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          title={t("visits")}
          value="0"
        />
      </div>

      {/* Restaurant Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-4 border-b border-neutral-200">
            <CardTitle className="text-lg font-semibold font-heading">{t("restaurant_details")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500">{t("description")}</h3>
                <p className="mt-1">{restaurant.description || t("no_description")}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">{t("contact_information")}</h3>
                  <div className="mt-1 space-y-1">
                    <p><span className="font-medium">{t("phone")}:</span> {restaurant.phone || t("not_provided")}</p>
                    <p><span className="font-medium">{t("email")}:</span> {restaurant.email || t("not_provided")}</p>
                    <p><span className="font-medium">{t("address")}:</span> {restaurant.address || t("not_provided")}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">{t("appearance")}</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium ml-2">{t("primary_color")}:</span>
                      <div 
                        className="w-5 h-5 rounded-full mr-2 ml-auto" 
                        style={{ backgroundColor: restaurant.primaryColor || '#e65100' }}
                      ></div>
                      {restaurant.primaryColor || '#e65100'}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium ml-2">{t("secondary_color")}:</span>
                      <div 
                        className="w-5 h-5 rounded-full mr-2 ml-auto" 
                        style={{ backgroundColor: restaurant.secondaryColor || '#f57c00' }}
                      ></div>
                      {restaurant.secondaryColor || '#f57c00'}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium ml-2">{t("rtl_layout")}:</span>
                      <span className="mr-2 ml-auto">{restaurant.rtl ? t("enabled") : t("disabled")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 py-4 border-t border-neutral-200 flex justify-end">
            <Button variant="outline" onClick={() => navigate(`/restaurants?action=edit&id=${restaurantId}`)}>
              <Edit className="ml-2 h-4 w-4" />
              {t("edit_details")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="px-6 py-4 border-b border-neutral-200">
            <CardTitle className="text-lg font-semibold font-heading">{t("quick_actions")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigateTo("menu")}>
                <ShoppingBag className="ml-2 h-4 w-4" />
                {t("edit_menu")}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigateTo("appearance")}>
                <Palette className="ml-2 h-4 w-4" />
                {t("customize_appearance")}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigateTo("qr-codes")}>
                <QrCode className="ml-2 h-4 w-4" />
                {t("generate_qr_codes")}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigateTo("social-media")}>
                <Share2 className="ml-2 h-4 w-4" />
                {t("manage_social_media")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Admin */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("restaurant_admin")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {getRestaurantAdmin() ? (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 rounded-full">
                <AvatarFallback>{getRestaurantAdmin()?.name.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div className="mr-4">
                <p className="font-medium">{getRestaurantAdmin()?.name}</p>
                <p className="text-sm text-neutral-500">{getRestaurantAdmin()?.email}</p>
              </div>
              {isSuperAdmin && (
                <Button variant="outline" className="mr-auto" onClick={() => navigate(`/users?action=edit&id=${restaurant.adminId}`)}>
                  <Edit className="ml-2 h-4 w-4" />
                  {t("edit_admin")}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <User className="h-10 w-10 text-neutral-300" />
              <div className="mr-4">
                <p className="font-medium">{t("no_admin_assigned")}</p>
                {isSuperAdmin && (
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/restaurants?action=edit&id=${restaurantId}`)}>
                    {t("assign_admin")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
