import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { RestaurantWithAdmin } from "@/lib/types";
import AddRestaurantModal from "@/components/modals/add-restaurant-modal";

export default function SuperAdminDashboard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch all restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data as RestaurantWithAdmin[];
    }
  });

  // Stats calculation
  const totalRestaurants = restaurants?.length || 0;
  const totalAdmins = restaurants?.filter(r => r.admin).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="ml-2 h-4 w-4" />
            מסעדה חדשה
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ מסעדות</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRestaurants}</div>
              <p className="text-xs text-muted-foreground">
                מסעדות פעילות במערכת
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מנהלי מסעדות</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdmins}</div>
              <p className="text-xs text-muted-foreground">
                משתמשים עם הרשאות ניהול
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">מסעדות</h2>
          
          {isLoading ? (
            <p>טוען נתונים...</p>
          ) : restaurants && restaurants.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      {restaurant.logo && (
                        <img 
                          src={restaurant.logo} 
                          alt={restaurant.name} 
                          className="w-10 h-10 rounded-full object-cover ml-3"
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <CardDescription>
                          {restaurant.admin?.name ?? "אין מנהל"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">כתובת:</span>{" "}
                        <span className="text-muted-foreground">{restaurant.address || "לא הוגדר"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">דוא"ל מנהל:</span>{" "}
                        <span className="text-muted-foreground">{restaurant.admin?.email || "לא הוגדר"}</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/restaurant-admin/dashboard?id=${restaurant.id}`}>
                          נהל
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/menus/${restaurant.slug}`} target="_blank" rel="noopener noreferrer">
                          צפה בתפריט
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>אין מסעדות</CardTitle>
                <CardDescription>
                  לא נמצאו מסעדות במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  הוסף מסעדה ראשונה
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Restaurant Modal */}
      <AddRestaurantModal 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
      />
    </AdminLayout>
  );
}