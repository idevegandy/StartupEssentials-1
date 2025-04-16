import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function RestaurantCategories() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch categories for this restaurant
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'categories'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/categories`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">קטגוריות</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            קטגוריה חדשה
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p>טוען קטגוריות...</p>
          ) : categories?.length > 0 ? (
            categories.map((category: any) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description || 'ללא תיאור'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span>פריטים: {category.items?.length || 0}</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">ערוך</Button>
                      <Button variant="destructive" size="sm">מחק</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>אין קטגוריות</CardTitle>
                <CardDescription>לא נמצאו קטגוריות למסעדה זו.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  צור קטגוריה ראשונה
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* TODO: Add Category Dialog */}
    </AdminLayout>
  );
}