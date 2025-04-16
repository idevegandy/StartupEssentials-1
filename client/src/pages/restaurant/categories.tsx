import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Category } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash, Tags, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddEditCategoryModal from "@/components/category/add-edit-category-modal";
import DeleteCategoryModal from "@/components/category/delete-category-modal";

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null],
    enabled: !!user?.restaurantId,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null],
      });
      toast({
        title: "קטגוריה נמחקה",
        description: "הקטגוריה נמחקה בהצלחה",
      });
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת קטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCategory = (categoryId: number) => {
    deleteCategoryMutation.mutate(categoryId);
  };

  // Filter categories based on search term
  const filteredCategories = categories
    ? categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">קטגוריות</h1>
          <Button onClick={() => {
            setEditingCategory(null);
            setShowAddModal(true);
          }}>
            <Plus className="ml-1 h-4 w-4" />
            הוסף קטגוריה
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ניהול קטגוריות</CardTitle>
            <CardDescription>
              הוסף, ערוך או מחק קטגוריות בתפריט המסעדה שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="חפש קטגוריה..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10"
                />
              </div>
            </div>

            <Tabs defaultValue="grid" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="grid">תצוגת רשת</TabsTrigger>
                <TabsTrigger value="list">תצוגת רשימה</TabsTrigger>
              </TabsList>

              <TabsContent value="grid">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="h-32 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                      </Card>
                    ))}
                  </div>
                ) : filteredCategories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                      <Card key={category.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                {category.icon ? (
                                  <span className="text-xl text-primary-600">{category.icon}</span>
                                ) : (
                                  <Tags className="h-5 w-5 text-primary-600" />
                                )}
                              </div>
                              <div className="mr-3">
                                <h3 className="font-medium">{category.name}</h3>
                              </div>
                            </div>
                            <div className="flex space-x-1 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setShowAddModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCategoryToDelete(category)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tags className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">לא נמצאו קטגוריות{searchTerm ? " התואמות את החיפוש" : ""}</p>
                    {searchTerm && (
                      <Button
                        variant="link"
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        נקה חיפוש
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-12 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                      </div>
                    ))}
                  </div>
                ) : filteredCategories.length > 0 ? (
                  <div className="divide-y">
                    {filteredCategories.map((category) => (
                      <div key={category.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            {category.icon ? (
                              <span className="text-xl text-primary-600">{category.icon}</span>
                            ) : (
                              <Tags className="h-5 w-5 text-primary-600" />
                            )}
                          </div>
                          <div className="mr-3">
                            <h3 className="font-medium">{category.name}</h3>
                          </div>
                        </div>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setShowAddModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ערוך
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCategoryToDelete(category)}
                            className="text-red-500 border-red-300 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 ml-1" />
                            מחק
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tags className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">לא נמצאו קטגוריות{searchTerm ? " התואמות את החיפוש" : ""}</p>
                    {searchTerm && (
                      <Button
                        variant="link"
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        נקה חיפוש
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Category Modal */}
      <AddEditCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={editingCategory}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => categoryToDelete && handleDeleteCategory(categoryToDelete.id)}
        categoryName={categoryToDelete?.name || ""}
        isLoading={deleteCategoryMutation.isPending}
      />
    </MainLayout>
  );
}
