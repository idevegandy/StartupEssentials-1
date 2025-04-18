import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UtensilsCrossed, Users2, QrCode, ShoppingBag, Search, PlusCircle, Eye, Edit, Trash2, ArrowRight } from "lucide-react";
import { Restaurant, User, ActivityLog } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isSuperAdmin = user?.role === "super_admin";

  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: !!user,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && isSuperAdmin,
  });

  const { data: activityLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
    enabled: !!user && isSuperAdmin,
  });

  const filteredRestaurants = restaurants?.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRestaurant = () => {
    navigate("/restaurant/new");
  };

  const handleEditRestaurant = (id: number) => {
    navigate(`/restaurants?action=edit&id=${id}`);
  };

  const handleViewRestaurant = (id: number) => {
    navigate(`/restaurant/${id}/dashboard`);
  };

  const handleDeleteRestaurant = async (id: number) => {
    if (window.confirm(t("delete_confirmation"))) {
      try {
        await apiRequest("DELETE", `/api/restaurants/${id}`, undefined);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting restaurant:", error);
      }
    }
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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000 / 60); // diff in minutes
    
    if (diff < 60) {
      return `${t("minutes_ago", { minutes: diff })}`;
    } else if (diff < 1440) {
      const hours = Math.floor(diff / 60);
      return `${t("hours_ago", { hours })}`;
    } else {
      const days = Math.floor(diff / 1440);
      return `${t("days_ago", { days })}`;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "create":
        return <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-light text-white">
          <PlusCircle className="h-4 w-4" />
        </div>;
      case "update":
        return <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white">
          <Edit className="h-4 w-4" />
        </div>;
      case "delete":
        return <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white">
          <Trash2 className="h-4 w-4" />
        </div>;
      case "login":
        return <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <Users2 className="h-4 w-4" />
        </div>;
      default:
        return <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-500 text-white">
          <Eye className="h-4 w-4" />
        </div>;
    }
  };

  if (isLoadingRestaurants) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("dashboard")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <Input
              type="text"
              placeholder={t("search")}
              className="py-2 px-4 pr-10 rounded-lg border border-neutral-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-neutral-400 h-4 w-4" />
          </div>
          <Button onClick={handleAddRestaurant}>
            <PlusCircle className="ml-2 h-4 w-4" />
            {t("add_restaurant")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<UtensilsCrossed className="h-5 w-5" />}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          title={t("total_restaurants") || "סה״כ מסעדות"}
          value={restaurants?.length || 0}
          change={12}
          changeLabel={t("from_last_month") || "מהחודש שעבר"}
        />
        
        <DashboardCard
          icon={<Users2 className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          title={t("active_users")}
          value={users?.length || 0}
          change={8}
        />
        
        <DashboardCard
          icon={<QrCode className="h-5 w-5" />}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          title={t("qr_scans")}
          value="1,287"
          change={24}
        />
        
        <DashboardCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-100"
          title={t("menu_items")}
          value="3,842"
          change={6}
        />
      </div>

      {/* Restaurant List */}
      <Card className="overflow-hidden mb-8">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("recent_restaurants")}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("name")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("manager")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("status")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("items")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("scans")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredRestaurants && filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => {
                  const manager = users?.find(u => u.id === restaurant.adminId);
                  
                  return (
                    <tr key={restaurant.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 rounded-full">
                            <AvatarImage src={restaurant.logo || ""} alt={restaurant.name} />
                            <AvatarFallback>{restaurant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-neutral-900">{restaurant.name}</div>
                            <div className="text-sm text-neutral-500">{restaurant.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{manager?.name || "-"}</div>
                        <div className="text-sm text-neutral-500">{manager?.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(restaurant.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">42</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">187</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button variant="ghost" size="sm" onClick={() => handleViewRestaurant(restaurant.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditRestaurant(restaurant.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteRestaurant(restaurant.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                    {searchTerm ? t("no_results") : t("no_restaurants")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between">
          <Button variant="ghost" size="sm" disabled>
            {t("previous")}
          </Button>
          <span className="text-sm text-neutral-500">{t("page", { current: 1, total: 1 })}</span>
          <Button variant="ghost" size="sm" disabled>
            {t("next")}
          </Button>
        </CardFooter>
      </Card>

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("recent_activity")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-4">
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.slice(0, 4).map((activity) => {
                const activityUser = users?.find(u => u.id === activity.userId);
                
                let message = "";
                if (activity.entityType === "restaurant") {
                  const restaurant = restaurants?.find(r => r.id === activity.entityId);
                  if (activity.action === "create") {
                    message = t("activity_restaurant_created", { name: restaurant?.name || "" });
                  } else if (activity.action === "update") {
                    message = t("activity_restaurant_updated", { name: restaurant?.name || "" });
                  } else if (activity.action === "delete") {
                    message = t("activity_restaurant_deleted", { name: activity.details?.name || "" });
                  }
                } else if (activity.entityType === "user") {
                  if (activity.action === "login") {
                    message = t("activity_user_login", { name: activityUser?.name || "" });
                  } else if (activity.action === "create") {
                    message = t("activity_user_created", { name: activity.details?.username || "" });
                  }
                } else if (activity.entityType === "menuItem") {
                  message = t("activity_menu_updated", { name: activity.details?.name || "" });
                } else if (activity.entityType === "qrCode") {
                  message = t("activity_qr_created", { name: activity.details?.label || "" });
                }
                
                return (
                  <li key={activity.id} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="mr-4 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-neutral-900">{message}</p>
                        <span className="text-sm text-neutral-500">
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        {t("by_user", { name: activityUser?.name || t("unknown") })}
                      </p>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-center text-sm text-neutral-500 py-4">
                {t("no_activity")}
              </li>
            )}
          </ul>
        </CardContent>
        <CardFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <Button variant="link" className="w-full" disabled={!activityLogs || activityLogs.length === 0}>
            {t("view_all_activity")}
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
