import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category, Item } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import AddItemModal from "@/components/modals/add-item-modal";
import Loading from "@/components/ui/loading";

interface ItemListProps {
  restaurantId: number;
}

export default function ItemList({ restaurantId }: ItemListProps) {
  const { toast } = useToast();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Fetch categories and items
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
  });
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Load items for selected category
  const { data: items, isLoading: isItemsLoading } = useQuery<Item[]>({
    queryKey: [`/api/categories/${selectedCategory}/items`],
    enabled: !!selectedCategory,
  });
  
  // Edit item form schema
  const formSchema = z.object({
    name: z.string().min(2, "שם הפריט חייב להכיל לפחות 2 תווים"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "המחיר חייב להיות חיובי"),
    categoryId: z.coerce.number().min(1, "נא לבחור קטגוריה"),
    displayOrder: z.coerce.number().int().nonnegative("סדר הצגה חייב להיות מספר חיובי"),
  });
  
  // Edit item form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: selectedCategory || 0,
      displayOrder: 0,
    },
  });
  
  // Update form values when selected item changes
  useState(() => {
    if (selectedItem) {
      form.reset({
        name: selectedItem.name,
        description: selectedItem.description || "",
        price: selectedItem.price / 100, // Convert from cents to whole numbers
        categoryId: selectedItem.categoryId,
        displayOrder: selectedItem.displayOrder || 0,
      });
      setImagePreview(selectedItem.image || null);
    }
  });
  
  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/items/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${variables.data.categoryId}/items`] });
      toast({
        title: "הפריט עודכן בהצלחה",
        description: "פרטי הפריט עודכנו בהצלחה",
      });
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון הפריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategory}/items`] });
      }
      toast({
        title: "הפריט נמחק בהצלחה",
        description: "הפריט נמחק מהמערכת",
      });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת הפריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitEditItem = (values: z.infer<typeof formSchema>) => {
    if (selectedItem) {
      // Convert price to cents
      const priceInCents = Math.round(values.price * 100);
      
      updateItemMutation.mutate({
        id: selectedItem.id,
        data: {
          ...values,
          price: priceInCents,
          image: imagePreview,
        },
      });
    }
  };
  
  if (isCategoriesLoading) {
    return <Loading />;
  }
  
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
        <i className="fas fa-layer-group text-4xl text-slate-400 mb-4"></i>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">אין קטגוריות</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">עליך להגדיר קטגוריות לפני שתוכל להוסיף פריטים לתפריט.</p>
        <Button variant="outline" onClick={() => window.location.href = '/restaurant-admin/categories'}>
          נהל קטגוריות
        </Button>
      </div>
    );
  }
  
  // Set initial category if none selected
  if (!selectedCategory && categories.length > 0 && !isCategoriesLoading) {
    setSelectedCategory(categories[0].id);
  }
  
  return (
    <div>
      {/* Category Tabs */}
      <div className="mb-6 flex overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="ml-2 mb-2 whitespace-nowrap"
            onClick={() => setSelectedCategory(category.id)}
          >
            <i className={`fas fa-${category.icon || "utensils"} ml-2`}></i>
            {category.name}
          </Button>
        ))}
      </div>
      
      {/* Items List */}
      {isItemsLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!items || items.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
              <i className="fas fa-hamburger text-4xl text-slate-400 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">אין פריטים בקטגוריה זו</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">לחץ על "הוסף פריט" כדי להתחיל.</p>
              <Button onClick={() => setIsAddItemModalOpen(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                הוסף פריט
              </Button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image && (
                    <div className="w-full h-40 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="bg-white dark:bg-slate-800 pt-4 px-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="text-lg font-bold text-primary-700 dark:text-primary-400">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {item.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        סדר הצגה: <span className="font-semibold">{item.displayOrder || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setItemToDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Add Item Button */}
      <div className="mt-6 flex justify-center">
        <Button onClick={() => setIsAddItemModalOpen(true)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          הוסף פריט
        </Button>
      </div>
      
      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        restaurantId={restaurantId}
        categoryId={selectedCategory || undefined}
      />
      
      {/* Edit Item Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת פריט</DialogTitle>
            <DialogDescription>
              ערוך את פרטי הפריט בתפריט
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEditItem)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הפריט *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mb-4">
                <FormLabel>תמונת הפריט</FormLabel>
                <div className="mt-1 flex items-center">
                  <div className="h-24 w-24 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Item preview" className="h-full w-full object-cover" />
                    ) : (
                      <i className="fas fa-utensils text-slate-400 dark:text-slate-500"></i>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-4"
                    onClick={() => {
                      // In a real app, this would open a file picker
                      setImagePreview("https://via.placeholder.com/200/14b8a6/ffffff?text=Food");
                    }}
                  >
                    העלאת תמונה
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאור הפריט</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="תיאור קצר של הפריט, רכיבים, וכדומה"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר (₪) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קטגוריה *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center">
                              <i className={`fas fa-${category.icon} ml-2`}></i>
                              {category.name}
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
                  onClick={() => setSelectedItem(null)}
                  className="ml-2"
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? "מעדכן..." : "שמור שינויים"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Item Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הפריט?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הפריט מהתפריט לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "מוחק..." : "מחק פריט"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
