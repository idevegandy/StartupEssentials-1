import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  RotateCw,
  Utensils,
  Pizza,
  Coffee,
  Beer,
  Fish,
  Drumstick,
  IceCream,
  Apple,
  Wine,
  Beef,
  Egg,
  Croissant,
  Soup
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Category, Restaurant } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Available icons for categories
const iconOptions = [
  { value: "utensils", label: "Utensils", icon: <Utensils className="h-4 w-4" /> },
  { value: "pizza", label: "Pizza", icon: <Pizza className="h-4 w-4" /> },
  { value: "coffee", label: "Coffee", icon: <Coffee className="h-4 w-4" /> },
  { value: "beer", label: "Beer", icon: <Beer className="h-4 w-4" /> },
  { value: "fish", label: "Fish", icon: <Fish className="h-4 w-4" /> },
  { value: "drumstick", label: "Chicken", icon: <Drumstick className="h-4 w-4" /> },
  { value: "ice-cream", label: "Dessert", icon: <IceCream className="h-4 w-4" /> },
  { value: "apple", label: "Fruit", icon: <Apple className="h-4 w-4" /> },
  { value: "wine", label: "Wine", icon: <Wine className="h-4 w-4" /> },
  { value: "beef", label: "Beef", icon: <Beef className="h-4 w-4" /> },
  { value: "egg", label: "Breakfast", icon: <Egg className="h-4 w-4" /> },
  { value: "croissant", label: "Bakery", icon: <Croissant className="h-4 w-4" /> },
  { value: "soup", label: "Soup", icon: <Soup className="h-4 w-4" /> },
];

// Function to get icon component by value
const getIconComponent = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option?.icon || <Utensils className="h-4 w-4" />;
};

export default function Categories() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | undefined>(undefined);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | undefined>(undefined);
  
  const isSuperAdmin = user?.role === "super_admin";

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: !!user,
  });

  // Get all categories for all restaurants if super admin, otherwise get categories for selected restaurant
  const { data: allCategories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/restaurants", selectedRestaurantId, "categories"],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await fetch(`/api/restaurants/${selectedRestaurantId}/categories`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    enabled: !!selectedRestaurantId,
  });

  const { data: currentCategory } = useQuery<Category>({
    queryKey: ["/api/categories", currentCategoryId],
    queryFn: async () => {
      if (!currentCategoryId) throw new Error("No category ID provided");
      const response = await fetch(`/api/categories/${currentCategoryId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch category");
      return response.json();
    },
    enabled: !!currentCategoryId && isEditing,
  });

  // Filter categories based on search term
  const filteredCategories = allCategories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, { message: t("name_required") }),
    description: z.string().optional(),
    icon: z.string().default("utensils"),
    displayOrder: z.number().int().default(0),
    restaurantId: z.number(),
  });

  // Category form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "utensils",
      displayOrder: 0,
      restaurantId: selectedRestaurantId || 0,
    },
  });

  // Handle restaurant selection change
  const handleRestaurantChange = (restaurantId: string) => {
    setSelectedRestaurantId(parseInt(restaurantId));
    form.setValue("restaurantId", parseInt(restaurantId));
  };

  // Open dialog for adding a category
  const handleAddCategory = () => {
    if (!selectedRestaurantId) {
      toast({
        title: t("error"),
        description: t("select_restaurant_first"),
        variant: "destructive",
      });
      return;
    }
    
    setIsEditing(false);
    setCurrentCategoryId(undefined);
    form.reset({
      name: "",
      description: "",
      icon: "utensils",
      displayOrder: 0,
      restaurantId: selectedRestaurantId,
    });
    setShowDialog(true);
  };

  // Open dialog for editing a category
  const handleEditCategory = (id: number) => {
    setIsEditing(true);
    setCurrentCategoryId(id);
    
    const categoryToEdit = allCategories?.find(c => c.id === id);
    if (categoryToEdit) {
      form.reset({
        name: categoryToEdit.name,
        description: categoryToEdit.description || "",
        icon: categoryToEdit.icon || "utensils",
        displayOrder: categoryToEdit.displayOrder || 0,
        restaurantId: categoryToEdit.restaurantId,
      });
      setShowDialog(true);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id: number) => {
    setCurrentCategoryId(id);
    setShowDeleteDialog(true);
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (isEditing && currentCategoryId) {
        // Update existing category
        await apiRequest("PUT", `/api/categories/${currentCategoryId}`, data);
        toast({
          title: t("success"),
          description: t("category_updated"),
        });
      } else {
        // Create new category
        await apiRequest("POST", `/api/restaurants/${data.restaurantId}/categories`, data);
        toast({
          title: t("success"),
          description: t("category_created"),
        });
      }
      
      // Refresh categories data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", data.restaurantId, "categories"] });
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: t("error"),
        description: t("category_save_error"),
        variant: "destructive",
      });
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!currentCategoryId) return;
    
    try {
      await apiRequest("DELETE", `/api/categories/${currentCategoryId}`, undefined);
      toast({
        title: t("success"),
        description: t("category_deleted"),
      });
      
      // Refresh categories data for the selected restaurant
      const category = allCategories?.find(c => c.id === currentCategoryId);
      if (category) {
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", category.restaurantId, "categories"] });
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: t("error"),
        description: t("category_delete_error"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("categories")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <Input
              type="text"
              placeholder={t("search")}
              className="py-2 px-4 pr-10 rounded-lg border border-neutral-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!selectedRestaurantId}
            />
            <Search className="absolute right-3 top-3 text-neutral-400 h-4 w-4" />
          </div>
          <Button onClick={handleAddCategory} disabled={!selectedRestaurantId}>
            <PlusCircle className="ml-2 h-4 w-4" />
            {t("add_category")}
          </Button>
        </div>
      </div>

      {/* Restaurant Selector */}
      <Card className="mb-6">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("select_restaurant")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Select onValueChange={handleRestaurantChange} value={selectedRestaurantId?.toString()}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_restaurant")} />
            </SelectTrigger>
            <SelectContent>
              {restaurants?.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("categories")}</CardTitle>
        </CardHeader>
        
        {selectedRestaurantId ? (
          <>
            {isLoadingCategories ? (
              <div className="p-8 text-center">
                <RotateCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p>{t("loading_categories")}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("icon")}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("name")}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("description")}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("display_order")}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {filteredCategories && filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => {
                          return (
                            <tr key={category.id} className="hover:bg-neutral-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white">
                                  {getIconComponent(category.icon || "utensils")}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                {category.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">
                                {category.description || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                {category.displayOrder || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2 space-x-reverse">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategory(category.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-500 hover:text-red-700" 
                                    onClick={() => handleDeleteClick(category.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                            {searchTerm ? t("no_results") : t("no_categories")}
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
              </>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <p>{t("select_restaurant_view_categories")}</p>
          </div>
        )}
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("edit_category_title") : t("add_category_title")}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? t("edit_category_description") 
                : t("add_category_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category_name")}</FormLabel>
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
                    <FormLabel>{t("category_icon")}</FormLabel>
                    <FormControl>
                      <div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("select_icon")} />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center">
                                  {option.icon}
                                  <span className="mr-2">{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="mt-2 grid grid-cols-7 gap-2">
                          {iconOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`w-8 h-8 flex items-center justify-center border rounded-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary ${
                                field.value === option.value ? 'bg-primary text-white' : 'border-neutral-300'
                              }`}
                              onClick={() => field.onChange(option.value)}
                            >
                              {option.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("display_order")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <input type="hidden" {...form.register("restaurantId")} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {isEditing ? t("save_changes") : t("add_category")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              {t("confirm_delete")}
            </DialogTitle>
            <DialogDescription>
              {t("delete_category_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
