import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function RestaurantItems() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch all categories for this restaurant
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'categories'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/categories`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  // Fetch all items for this restaurant
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'items'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/items`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  const isLoading = categoriesLoading || itemsLoading;

  // Group items by category
  const itemsByCategory = items?.reduce((acc: Record<number, any[]>, item: any) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = [];
    }
    acc[item.categoryId].push(item);
    return acc;
  }, {});

  // Format price with ₪ symbol
  const formatPrice = (price: number) => {
    return `₪${(price / 100).toFixed(2)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">פריטים</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            פריט חדש
          </Button>
        </div>

        {isLoading ? (
          <p>טוען נתונים...</p>
        ) : categories?.length > 0 ? (
          <div className="space-y-8">
            {categories.map((category: any) => (
              <div key={category.id} className="space-y-4">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                
                {itemsByCategory && itemsByCategory[category.id]?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {itemsByCategory[category.id].map((item: any) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <p className="font-bold text-primary">{formatPrice(item.price)}</p>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {item.description || 'ללא תיאור'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">ערוך</Button>
                            <Button variant="destructive" size="sm">מחק</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">אין פריטים בקטגוריה זו</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">אין קטגוריות</h2>
            <p className="text-gray-500 mb-4">צור קטגוריות תחילה כדי להוסיף פריטים לתפריט</p>
            <Button variant="outline" onClick={() => window.location.href = '/restaurant-admin/categories'}>
              ניהול קטגוריות
            </Button>
          </div>
        )}
      </div>

      {/* TODO: Add Item Dialog */}
    </AdminLayout>
  );
}