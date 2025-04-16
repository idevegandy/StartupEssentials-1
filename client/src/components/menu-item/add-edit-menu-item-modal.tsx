import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MenuItem, Category } from "@shared/schema";
import { FileWithPreview } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "מחיר חייב להיות מספר חיובי"),
  discountPrice: z.coerce.number().min(0, "מחיר מבצע חייב להיות מספר חיובי").optional().nullable(),
  image: z.any().optional(),
  featured: z.boolean().default(false),
  categoryId: z.coerce.number().min(1, "חובה לבחור קטגוריה"),
});

type MenuItemFormValues = z.infer<typeof formSchema>;

interface AddEditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  categories: Category[];
}

export default function AddEditMenuItemModal({ 
  isOpen, 
  onClose, 
  menuItem, 
  categories 
}: AddEditMenuItemModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<FileWithPreview | null>(null);
  
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: null,
      featured: false,
      categoryId: 0,
    },
  });
  
  // Update form values when menuItem changes
  useEffect(() => {
    if (menuItem) {
      form.reset({
        name: menuItem.name,
        description: menuItem.description || "",
        price: menuItem.price,
        discountPrice: menuItem.discountPrice,
        featured: menuItem.featured,
        categoryId: menuItem.categoryId,
      });
      
      if (menuItem.image) {
        setImageFile({
          name: menuItem.name,
          size: 0,
          type: "image/jpeg",
          preview: menuItem.image,
        } as FileWithPreview);
      } else {
        setImageFile(null);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        discountPrice: null,
        featured: false,
        categoryId: categories?.length > 0 ? categories[0].id : 0,
      });
      setImageFile(null);
    }
  }, [menuItem, form, categories]);
  
  const addMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormValues) => {
      if (!user?.restaurantId) {
        throw new Error("לא נמצא מזהה מסעדה");
      }
      
      // In a real app, we would handle file upload here
      const payload = {
        ...data,
        restaurantId: user.restaurantId,
        image: imageFile ? imageFile.preview : null,
      };
      
      const res = await apiRequest("POST", "/api/items", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/items` : null] 
      });
      toast({
        title: "פריט נוסף",
        description: "פריט התפריט נוסף בהצלחה",
      });
      form.reset();
      setImageFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת פריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormValues) => {
      if (!menuItem) {
        throw new Error("לא נמצא פריט לעדכון");
      }
      
      // In a real app, we would handle file upload here
      const payload = {
        ...data,
        image: imageFile ? imageFile.preview : null,
      };
      
      const res = await apiRequest("PUT", `/api/items/${menuItem.id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/items` : null] 
      });
      toast({
        title: "פריט עודכן",
        description: "פריט התפריט עודכן בהצלחה",
      });
      form.reset();
      setImageFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון פריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: MenuItemFormValues) => {
    if (menuItem) {
      updateMenuItemMutation.mutate(data);
    } else {
      addMenuItemMutation.mutate(data);
    }
  };
  
  const isPending = addMenuItemMutation.isPending || updateMenuItemMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{menuItem ? "עריכת פריט" : "הוספת פריט חדש"}</DialogTitle>
          <DialogDescription>
            {menuItem 
              ? "ערוך את פרטי הפריט בתפריט שלך" 
              : "הוסף פריט חדש לתפריט המסעדה שלך"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם הפריט</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="הזן שם לפריט" />
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
                      <FormLabel>קטגוריה</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={String(field.value)}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
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
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.1" 
                              placeholder="0" 
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">₪</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר מבצע (אופציונלי)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              value={field.value === null ? "" : field.value}
                              onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                              type="number" 
                              min="0" 
                              step="0.1" 
                              placeholder="0" 
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">₪</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>פריט מומלץ</FormLabel>
                        <p className="text-sm text-gray-500">
                          פריטים מומלצים יוצגו באופן מודגש בתפריט
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4 md:col-span-1">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור (אופציונלי)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="הזן תיאור לפריט"
                          className="resize-none h-32"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תמונה (אופציונלי)</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={imageFile}
                          onChange={(file) => {
                            setImageFile(file);
                            field.onChange(file);
                          }}
                          accept={{ 'image/*': [] }}
                          maxSize={2 * 1024 * 1024} // 2MB
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-row-reverse sm:justify-end gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {menuItem ? "עדכן פריט" : "הוסף פריט"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}