import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Category } from "@shared/schema";

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
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "שם הפריט חייב להכיל לפחות 2 תווים"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "המחיר חייב להיות חיובי"),
  categoryId: z.coerce.number().min(1, "נא לבחור קטגוריה"),
  displayOrder: z.coerce.number().int().nonnegative("סדר הצגה חייב להיות מספר חיובי"),
});

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  categoryId?: number;
}

export default function AddItemModal({ 
  isOpen, 
  onClose, 
  restaurantId,
  categoryId 
}: AddItemModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: isOpen,
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: categoryId || 0,
      displayOrder: 0,
    },
  });
  
  // Update category ID when the prop changes
  useState(() => {
    if (categoryId) {
      form.setValue("categoryId", categoryId);
    }
  });
  
  const addItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema> & { image?: string }) => {
      const categoryId = data.categoryId;
      const res = await apiRequest("POST", `/api/categories/${categoryId}/items`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const categoryId = variables.categoryId;
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/items`] });
      toast({
        title: "פריט נוסף בהצלחה",
        description: "הפריט החדש נוצר בהצלחה",
      });
      onClose();
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: categoryId,
        displayOrder: 0,
      });
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת פריט",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert price to cents
    const priceInCents = Math.round(values.price * 100);
    
    addItemMutation.mutate({
      ...values,
      price: priceInCents,
      image: imagePreview || undefined,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">הוספת פריט חדש</DialogTitle>
          <DialogDescription>
            הוסף פריט חדש לתפריט המסעדה שלך
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הפריט *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="לדוגמה: סלט ירקות, פיצה מרגריטה" />
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
                    defaultValue={field.value.toString()}
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
            
            <DialogFooter className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                ביטול
              </Button>
              <Button type="submit" disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מוסיף...
                  </>
                ) : (
                  "הוסף פריט"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
