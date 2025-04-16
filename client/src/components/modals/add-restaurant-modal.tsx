import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/utils";
import { CreateRestaurantData } from "@/lib/types";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  restaurantName: z.string().min(2, "שם המסעדה חייב להכיל לפחות 2 תווים"),
  restaurantSlug: z.string().min(2, "כתובת URL חייבת להכיל לפחות 2 תווים")
    .regex(/^[a-z0-9-]+$/, "כתובת URL יכולה להכיל רק אותיות באנגלית, מספרים ומקפים"),
  adminName: z.string().min(2, "שם המנהל חייב להכיל לפחות 2 תווים"),
  adminEmail: z.string().email("אנא הזן כתובת אימייל תקינה"),
  adminPassword: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  adminPasswordConfirm: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
}).refine((data) => data.adminPassword === data.adminPasswordConfirm, {
  message: "הסיסמאות אינן תואמות",
  path: ["adminPasswordConfirm"],
});

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRestaurantModal({ isOpen, onClose }: AddRestaurantModalProps) {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurantName: "",
      restaurantSlug: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      adminPasswordConfirm: "",
    },
  });
  
  const watchRestaurantName = form.watch("restaurantName");
  
  // Update slug automatically when restaurant name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "restaurantName") {
        form.setValue("restaurantSlug", slugify(value.restaurantName || ""));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  const addRestaurantMutation = useMutation({
    mutationFn: async (data: CreateRestaurantData) => {
      const res = await apiRequest("POST", "/api/restaurants", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "מסעדה נוספה בהצלחה",
        description: "המסעדה ומנהל המסעדה נוצרו בהצלחה",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת מסעדה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data: CreateRestaurantData = {
      restaurant: {
        name: values.restaurantName,
        slug: values.restaurantSlug,
        logo: logoPreview || undefined,
      },
      admin: {
        name: values.adminName,
        email: values.adminEmail,
        password: values.adminPassword,
      },
    };
    
    addRestaurantMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">הוספת מסעדה חדשה</DialogTitle>
          <DialogDescription>
            צור מסעדה חדשה ומשתמש מנהל עבורה
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Restaurant Details Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">פרטי המסעדה</h4>
              
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>שם המסעדה *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="restaurantSlug"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>כתובת URL *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">/menus/</span>
                        <Input {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      אותיות באנגלית, מספרים ומקפים בלבד
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mb-4">
                <FormLabel>לוגו המסעדה</FormLabel>
                <div className="mt-1 flex items-center">
                  <span className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Restaurant logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <i className="fas fa-utensils text-slate-400 dark:text-slate-500"></i>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-4"
                    onClick={() => {
                      // In a real app, this would open a file picker
                      // For now we'll just use a placeholder logo URL
                      setLogoPreview("https://via.placeholder.com/150/14b8a6/ffffff?text=Logo");
                    }}
                  >
                    העלאת תמונה
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Admin User Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">פרטי מנהל המסעדה</h4>
              
              <FormField
                control={form.control}
                name="adminName"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>שם מלא *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>דוא"ל *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>סיסמה *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="adminPasswordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימות סיסמה *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                ביטול
              </Button>
              <Button type="submit" disabled={addRestaurantMutation.isPending}>
                {addRestaurantMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מוסיף...
                  </>
                ) : (
                  "שמור מסעדה"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
