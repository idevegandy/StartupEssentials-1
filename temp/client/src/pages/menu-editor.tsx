import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  Utensils,
  Pizza,
  Coffee,
  Beer,
  Fish,
  Drumstick,
  IceCream,
  X
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Restaurant, Category, MenuItem, insertMenuItemSchema, insertCategorySchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Available icons for categories
const iconOptions = [
  { value: "utensils", label: "Utensils", icon: <Utensils className="h-4 w-4" /> },
  { value: "pizza", label: "Pizza", icon: <Pizza className="h-4 w-4" /> },
  { value: "coffee", label: "Coffee", icon: <Coffee className="h-4 w-4" /> },
  { value: "beer", label: "Beer", icon: <Beer className="h-4 w-4" /> },
  { value: "fish", label: "Fish", icon: <Fish className="h-4 w-4" /> },
  { value: "drumstick", label: "Chicken", icon: <Drumstick className="h-4 w-4" /> },
  { value: "ice-cream", label: "Dessert", icon: <IceCream className="h-4 w-4" /> },
];

// Function to get icon component by value
const getIconComponent = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option?.icon || <Utensils className="h-4 w-4" />;
};

export default function MenuEditor() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id);
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for modals and editing
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingMenuItem, setIsEditingMenuItem] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | undefined>(undefined);
  const [currentMenuItemId, setCurrentMenuItemId] = useState<number | undefined>(undefined);
  const [deleteType, setDeleteType] = useState<'category' | 'menuItem'>('category');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  
  // Queries
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/restaurants", restaurantId, "categories"],
    enabled: !!restaurantId,
  });

  const { data: menuItems, isLoading: isLoadingMenuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", restaurantId, "menu-items"],
    enabled: !!restaurantId,
  });

  const { data: currentCategory } = useQuery<Category>({
    queryKey: ["/api/categories", currentCategoryId],
    enabled: !!currentCategoryId && isEditingCategory,
  });

  const { data: currentMenuItem } = useQuery<MenuItem>({
    queryKey: ["/api/menu-items", currentMenuItemId],
    enabled: !!currentMenuItemId && isEditingMenuItem,
  });

  // Form validation schemas
  const categoryFormSchema = z.object({
    name: z.string().min(1, { message: t("name_required") }),
    description: z.string().optional(),
    icon: z.string().default("utensils"),
    displayOrder: z.number().int().default(0),
    restaurantId: z.number(),
  });

  const menuItemFormSchema = z.object({
    name: z.string().min(1, { message: t("name_required") }),
    description: z.string().optional(),
    price: z.number().int().min(0, { message: t("price_min_zero") }),
    discountPrice: z.number().int().min(0, { message: t("price_min_zero") }).optional(),
    categoryId: z.number().min(1, { message: t("category_required") }),
    featured: z.boolean().default(false),
    restaurantId: z.number(),
  });

  // Form initialization
  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "utensils",
      displayOrder: 0,
      restaurantId: restaurantId,
    },
  });

  const menuItemForm = useForm<z.infer<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      categoryId: 0,
      featured: false,
      restaurantId: restaurantId,
    },
  });

  // File upload state
  const [menuItemImage, setMenuItemImage] = useState<File | null>(null);

  // Check if current user has access to this restaurant
  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.id === restaurant?.adminId;
  const hasAccess = isSuperAdmin || isRestaurantAdmin;

  // Load current category data into form when editing
  useEffect(() => {
    if (currentCategory && isEditingCategory) {
      categoryForm.reset({
        name: currentCategory.name,
        description: currentCategory.description || "",
        icon: currentCategory.icon || "utensils",
        displayOrder: currentCategory.displayOrder || 0,
        restaurantId: currentCategory.restaurantId,
      });
    }
  }, [currentCategory, isEditingCategory, categoryForm]);

  // Load current menu item data into form when editing
  useEffect(() => {
    if (currentMenuItem && isEditingMenuItem) {
      menuItemForm.reset({
        name: currentMenuItem.name,
        description: currentMenuItem.description || "",
        price: currentMenuItem.price,
        discountPrice: currentMenuItem.discountPrice,
        categoryId: currentMenuItem.categoryId,
        featured: currentMenuItem.featured || false,
        restaurantId: currentMenuItem.restaurantId,
      });
    }
  }, [currentMenuItem, isEditingMenuItem, menuItemForm]);

  // Handle opening category dialog for adding
  const handleAddCategory = () => {
    setIsEditingCategory(false);
    setCurrentCategoryId(undefined);
    categoryForm.reset({
      name: "",
      description: "",
      icon: "utensils",
      displayOrder: 0,
      restaurantId: restaurantId,
    });
    setShowCategoryDialog(true);
  };

  // Handle opening category dialog for editing
  const handleEditCategory = (id: number) => {
    setIsEditingCategory(true);
    setCurrentCategoryId(id);
    setShowCategoryDialog(true);
  };

  // Handle opening menu item dialog for adding
  const handleAddMenuItem = (categoryId?: number) => {
    setIsEditingMenuItem(false);
    setCurrentMenuItemId(undefined);
    menuItemForm.reset({
      name: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      categoryId: categoryId || 0,
      featured: false,
      restaurantId: restaurantId,
    });
    setShowMenuItemDialog(true);
  };

  // Handle opening menu item dialog for editing
  const handleEditMenuItem = (id: number) => {
    setIsEditingMenuItem(true);
    setCurrentMenuItemId(id);
    setShowMenuItemDialog(true);
  };

  // Handle opening delete confirmation dialog
  const handleDeleteClick = (id: number, type: 'category' | 'menuItem') => {
    if (type === 'category') {
      setCurrentCategoryId(id);
    } else {
      setCurrentMenuItemId(id);
    }
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  // Handle category form submission
  const onCategorySubmit = async (data: z.infer<typeof categoryFormSchema>) => {
    try {
      if (isEditingCategory && currentCategoryId) {
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
      setShowCategoryDialog(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: t("error"),
        description: t("category_save_error"),
        variant: "destructive",
      });
    }
  };

  // Handle menu item form submission
  const onMenuItemSubmit = async (data: z.infer<typeof menuItemFormSchema>) => {
    try {
      // TODO: Handle image upload in a real implementation
      
      if (isEditingMenuItem && currentMenuItemId) {
        // Update existing menu item
        await apiRequest("PUT", `/api/menu-items/${currentMenuItemId}`, data);
        toast({
          title: t("success"),
          description: t("menu_item_updated"),
        });
      } else {
        // Create new menu item
        await apiRequest("POST", `/api/restaurants/${data.restaurantId}/menu-items`, data);
        toast({
          title: t("success"),
          description: t("menu_item_created"),
        });
      }
      
      // Refresh menu items data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", data.restaurantId, "menu-items"] });
      setShowMenuItemDialog(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: t("error"),
        description: t("menu_item_save_error"),
        variant: "destructive",
      });
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    try {
      if (deleteType === 'category' && currentCategoryId) {
        await apiRequest("DELETE", `/api/categories/${currentCategoryId}`, undefined);
        toast({
          title: t("success"),
          description: t("category_deleted"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "categories"] });
      } else if (deleteType === 'menuItem' && currentMenuItemId) {
        await apiRequest("DELETE", `/api/menu-items/${currentMenuItemId}`, undefined);
        toast({
          title: t("success"),
          description: t("menu_item_deleted"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "menu-items"] });
      }
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: t("error"),
        description: t(`${deleteType}_delete_error`),
        variant: "destructive",
      });
    }
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: number) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  // Get menu items for a category
  const getMenuItemsForCategory = (categoryId: number) => {
    return menuItems?.filter(item => item.categoryId === categoryId) || [];
  };

  if (!hasAccess) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("access_denied")}</h2>
              <p className="text-neutral-600">{t("no_access_to_restaurant")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingRestaurant || isLoadingCategories || isLoadingMenuItems) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("restaurant_not_found")}</h2>
              <p className="text-neutral-600">{t("restaurant_not_found_description")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("menu_editor")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="outline">
            <Eye className="ml-2 h-4 w-4" />
            {t("preview")}
          </Button>
          <Button>
            <Save className="ml-2 h-4 w-4" />
            {t("save_changes")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurant Info Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("restaurant_details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>{t("restaurant_logo")}</FormLabel>
                <div className="flex items-center">
                  <Avatar className="h-20 w-20 rounded-lg">
                    <AvatarImage src={restaurant.logo || ""} alt={restaurant.name} />
                    <AvatarFallback className="rounded-lg">{restaurant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="mr-4">
                    <Button variant="outline" size="sm" className="mb-2 w-full">
                      <PlusCircle className="ml-2 h-4 w-4" />
                      {t("upload_logo")}
                    </Button>
                    <Button variant="link" size="sm" className="text-red-500 p-0 h-auto">
                      <X className="ml-1 h-3 w-3" />
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <FormLabel htmlFor="name">{t("restaurant_name")}</FormLabel>
                <Input id="name" value={restaurant.name} readOnly />
              </div>

              <div>
                <FormLabel htmlFor="description">{t("description")}</FormLabel>
                <Textarea 
                  id="description" 
                  rows={3} 
                  value={restaurant.description || ""} 
                  readOnly 
                />
              </div>

              <div>
                <FormLabel htmlFor="phone">{t("phone")}</FormLabel>
                <Input id="phone" value={restaurant.phone || ""} readOnly />
              </div>

              <div>
                <FormLabel htmlFor="address">{t("address")}</FormLabel>
                <Input id="address" value={restaurant.address || ""} readOnly />
              </div>

              <div>
                <FormLabel>{t("interface_colors")}</FormLabel>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-neutral-500">{t("primary_color")}</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded-full ml-2" 
                        style={{ backgroundColor: restaurant.primaryColor || '#e65100' }}
                      ></div>
                      <span className="mr-2 text-sm">{restaurant.primaryColor || '#e65100'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-neutral-500">{t("secondary_color")}</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded-full ml-2" 
                        style={{ backgroundColor: restaurant.secondaryColor || '#f57c00' }}
                      ></div>
                      <span className="mr-2 text-sm">{restaurant.secondaryColor || '#f57c00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Categories and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-neutral-200">
              <CardTitle className="text-lg font-semibold font-heading">{t("categories")}</CardTitle>
              <Button size="sm" onClick={handleAddCategory}>
                <PlusCircle className="ml-2 h-4 w-4" />
                {t("add_category")}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {categories && categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryItems = getMenuItemsForCategory(category.id);
                    const isExpanded = expandedCategory === category.id;
                    
                    return (
                      <div key={category.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white">
                              {getIconComponent(category.icon || "utensils")}
                            </div>
                            <div className="mr-3">
                              <h3 className="font-medium">{category.name}</h3>
                              <p className="text-xs text-neutral-500">
                                {t("items_count", { count: categoryItems.length })}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddMenuItem(category.id)}
                            >
                              <PlusCircle className="ml-1 h-4 w-4" />
                              {t("add_item")}
                            </Button>
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
                              onClick={() => handleDeleteClick(category.id, 'category')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {categoryItems.length > 0 && (
                          <>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categoryItems.slice(0, isExpanded ? categoryItems.length : 2).map((item) => (
                                <div key={item.id} className="flex items-center p-2 border border-neutral-100 rounded bg-neutral-50">
                                  <div className="w-10 h-10 rounded bg-neutral-200 flex items-center justify-center">
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        className="w-10 h-10 rounded object-cover" 
                                        alt={item.name} 
                                      />
                                    ) : (
                                      <Utensils className="h-4 w-4 text-neutral-400" />
                                    )}
                                  </div>
                                  <div className="mr-2 flex-1">
                                    <div className="text-sm font-medium">{item.name}</div>
                                    <div className="text-xs text-neutral-500">
                                      ₪{item.price}
                                      {item.discountPrice && (
                                        <span className="mr-1 line-through">₪{item.discountPrice}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex space-x-1 space-x-reverse">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditMenuItem(item.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => handleDeleteClick(item.id, 'menuItem')}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {categoryItems.length > 2 && (
                              <div className="mt-3 text-center">
                                <Button 
                                  variant="link" 
                                  onClick={() => toggleCategoryExpansion(category.id)}
                                >
                                  {isExpanded 
                                    ? t("collapse") 
                                    : t("show_all_items", { count: categoryItems.length })}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                  <h3 className="text-lg font-medium mb-2">{t("no_categories")}</h3>
                  <p className="text-neutral-500 mb-4">{t("no_categories_description")}</p>
                  <Button onClick={handleAddCategory}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    {t("add_first_category")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingCategory ? t("edit_category_title") : t("add_category_title")}
            </DialogTitle>
            <DialogDescription>
              {isEditingCategory 
                ? t("edit_category_description") 
                : t("add_category_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
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
                control={categoryForm.control}
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
                control={categoryForm.control}
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
                control={categoryForm.control}
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

              <input type="hidden" {...categoryForm.register("restaurantId")} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {isEditingCategory ? t("save_changes") : t("add_category")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Menu Item Form Dialog */}
      <Dialog open={showMenuItemDialog} onOpenChange={setShowMenuItemDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingMenuItem ? t("edit_item_title") : t("add_item_title")}
            </DialogTitle>
            <DialogDescription>
              {isEditingMenuItem 
                ? t("edit_item_description") 
                : t("add_item_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...menuItemForm}>
            <form onSubmit={menuItemForm.handleSubmit(onMenuItemSubmit)} className="space-y-4">
              <div>
                <FormLabel>{t("item_image")}</FormLabel>
                <FileUpload
                  onFileSelected={(file) => setMenuItemImage(file)}
                  currentImageUrl={currentMenuItem?.image}
                  accept="image/*"
                  maxSize={2}
                  label={t("upload_image")}
                />
              </div>

              <FormField
                control={menuItemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("item_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={menuItemForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={menuItemForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("price_shekel")}</FormLabel>
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
                
                <FormField
                  control={menuItemForm.control}
                  name="discountPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("discount_price")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={menuItemForm.control}
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
                control={menuItemForm.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-x-reverse rounded-md border p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                      />
                    </FormControl>
                    <FormLabel className="mr-2 text-sm font-normal">{t("featured_item")}</FormLabel>
                  </FormItem>
                )}
              />

              <input type="hidden" {...menuItemForm.register("restaurantId")} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowMenuItemDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {isEditingMenuItem ? t("save_changes") : t("add_item")}
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
              {deleteType === 'category' 
                ? t("delete_category_confirmation") 
                : t("delete_menu_item_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
