import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Category, MenuItem } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash,
  Pizza,
  Loader2,
  ImageIcon,
  Tag,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddEditMenuItemModal from "@/components/menu-item/add-edit-menu-item-modal";
import DeleteMenuItemModal from "@/components/menu-item/delete-menu-item-modal";

export default function Items() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null],
    enabled: !!user?.restaurantId,
  });

  const { data: menuItems, isLoading: isLoadingItems } = useQuery<MenuItem[]>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/items` : null],
    enabled: !!user?.restaurantId,
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/items` : null],
      });
      toast({
        title: "פריט נמחק",
        description: "פריט התפריט נמחק בהצלחה",
      });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת פריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteMenuItem = (itemId: number) => {
    deleteMenuItemMutation.mutate(itemId);
  };

  // Filter and sort menu items
  const filteredItems = menuItems
    ? menuItems
        .filter((item) => 
          (categoryFilter === "all" || item.categoryId === parseInt(categoryFilter)) &&
          (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())))
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Get category name by ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories?.find((c) => c.id === categoryId);
    return category?.name || "ללא קטגוריה";
  };

  const isLoading = isLoadingCategories || isLoadingItems;

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">פריטי תפריט</h1>
          <Button onClick={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}>
            <Plus className="ml-1 h-4 w-4" />
            הוסף פריט
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ניהול פריטי תפריט</CardTitle>
            <CardDescription>
              הוסף, ערוך או מחק פריטים בתפריט המסעדה שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="חפש פריט..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="סנן לפי קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="h-32">
                    <CardContent className="p-4 h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div className="flex">
                          <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center mr-4">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{item.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {item.description || "אין תיאור"}
                            </p>
                            <div className="flex items-center mt-1 space-x-3 space-x-reverse">
                              <div className="flex items-center text-sm text-gray-600">
                                <Tag className="h-3 w-3 ml-1" />
                                {getCategoryName(item.categoryId)}
                              </div>
                              <div className="flex items-center text-sm font-medium">
                                <DollarSign className="h-3 w-3 ml-1" />
                                {item.price} ₪
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 space-x-reverse mt-4 sm:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setShowAddModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ערוך
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setItemToDelete(item)}
                            className="text-red-500 border-red-300 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 ml-1" />
                            מחק
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pizza className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== "all"
                    ? "לא נמצאו פריטים התואמים את החיפוש"
                    : "לא נמצאו פריטי תפריט"}
                </p>
                {(searchTerm || categoryFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                    }}
                    className="mt-2"
                  >
                    נקה סינון
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Menu Item Modal */}
      <AddEditMenuItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        menuItem={editingItem}
        categories={categories || []}
      />

      {/* Delete Menu Item Modal */}
      <DeleteMenuItemModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDeleteMenuItem(itemToDelete.id)}
        itemName={itemToDelete?.name || ""}
        isLoading={deleteMenuItemMutation.isPending}
      />
    </MainLayout>
  );
}
