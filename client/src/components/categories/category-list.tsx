import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { iconOptions } from "@/lib/utils";
import AddCategoryModal from "@/components/modals/add-category-modal";
import Loading from "@/components/ui/loading";
import AddItemModal from "@/components/modals/add-item-modal";

interface CategoryListProps {
  restaurantId: number;
}

export default function CategoryList({ restaurantId }: CategoryListProps) {
  const { toast } = useToast();
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState<number | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
  });

  // Edit category form schema
  const formSchema = z.object({
    name: z.string().min(2, "שם הקטגוריה חייב להכיל לפחות 2 תווים"),
    icon: z.string().min(1, "נא לבחור סמל עבור הקטגוריה"),
    displayOrder: z.coerce.number().int().nonnegative("סדר הצגה חייב להיות מספר חיובי"),
  });

  // Edit category form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "utensils",
      displayOrder: 0,
    },
  });

  // Update form values when selected category changes
  useState(() => {
    if (selectedCategoryForEdit) {
      form.reset({
        name: selectedCategoryForEdit.name,
        icon: selectedCategoryForEdit.icon || "utensils",
        displayOrder: selectedCategoryForEdit.displayOrder || 0,
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      toast({
        title: "הקטגוריה עודכנה בהצלחה",
        description: "פרטי הקטגוריה עודכנו בהצלחה",
      });
      setSelectedCategoryForEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון הקטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      toast({
        title: "הקטגוריה נמחקה בהצלחה",
        description: "הקטגוריה והפריטים המשויכים אליה נמחקו מהמערכת",
      });
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת הקטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitEditCategory = (values: z.infer<typeof formSchema>) => {
    if (selectedCategoryForEdit) {
      updateCategoryMutation.mutate({
        id: selectedCategoryForEdit.id,
        data: values,
      });
    }
  };

  const handleAddItem = (categoryId: number) => {
    setSelectedCategoryForItem(categoryId);
    setIsAddItemModalOpen(true);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
            <i className="fas fa-list-alt text-4xl text-slate-400 mb-4"></i>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">אין קטגוריות</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">לחץ על "הוסף קטגוריה" כדי ליצור את הקטגוריה הראשונה שלך.</p>
            <Button onClick={() => setIsAddCategoryModalOpen(true)}>
              <PlusCircle className="ml-2 h-4 w-4" />
              הוסף קטגוריה
            </Button>
          </div>
        ) : (
          <>
            {categories?.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="bg-primary-50 dark:bg-primary-900/20 border-b border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <i className={`fas fa-${category.icon || "utensils"} ml-2 text-primary-600 dark:text-primary-400`}></i>
                    {category.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategoryForEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      סדר הצגה: <span className="font-semibold">{category.displayOrder || 0}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddItem(category.id)}
                    >
                      <PlusCircle className="ml-1 h-3.5 w-3.5" />
                      הוסף פריט
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Add Category Button */}
      {categories?.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button onClick={() => setIsAddCategoryModalOpen(true)}>
            <PlusCircle className="ml-2 h-4 w-4" />
            הוסף קטגוריה
          </Button>
        </div>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        restaurantId={restaurantId}
      />

      {/* Add Item Modal */}
      {selectedCategoryForItem && (
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => {
            setIsAddItemModalOpen(false);
            setSelectedCategoryForItem(null);
          }}
          restaurantId={restaurantId}
          categoryId={selectedCategoryForItem}
        />
      )}

      {/* Edit Category Modal */}
      <Dialog open={!!selectedCategoryForEdit} onOpenChange={() => setSelectedCategoryForEdit(null)}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת קטגוריה</DialogTitle>
            <DialogDescription>
              ערוך את פרטי הקטגוריה
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEditCategory)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הקטגוריה *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סמל הקטגוריה *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סמל" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <i className={`fas fa-${option.icon} ml-2`}></i>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סדר הצגה</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCategoryForEdit(null)}
                  className="ml-2"
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending ? "מעדכן..." : "שמור שינויים"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הקטגוריה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הקטגוריה וכל הפריטים הקשורים אליה לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => categoryToDelete && deleteCategoryMutation.mutate(categoryToDelete.id)}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "מוחק..." : "מחק קטגוריה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
