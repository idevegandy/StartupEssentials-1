import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Restaurant, User } from "@shared/schema";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const restaurantFormSchema = z.object({
  name: z.string().min(2, "שם המסעדה חייב להכיל לפחות 2 תווים"),
  description: z.string().optional(),
  facebookLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
  instagramLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
  websiteLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
});

const adminFormSchema = z.object({
  name: z.string().min(2, "שם המנהל חייב להכיל לפחות 2 תווים"),
  email: z.string().email("אנא הזן כתובת אימייל תקינה"),
  newPassword: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

interface EditRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  admin?: User;
}

export default function EditRestaurantModal({ 
  isOpen, 
  onClose, 
  restaurant, 
  admin 
}: EditRestaurantModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("restaurant");
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo || null);
  
  // Restaurant form
  const restaurantForm = useForm<z.infer<typeof restaurantFormSchema>>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description || "",
      facebookLink: restaurant.facebookLink || "",
      instagramLink: restaurant.instagramLink || "",
      websiteLink: restaurant.websiteLink || "",
    },
  });
  
  // Admin form
  const adminForm = useForm<z.infer<typeof adminFormSchema>>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: admin?.name || "",
      email: admin?.email || "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update form when restaurant data changes
  useEffect(() => {
    restaurantForm.reset({
      name: restaurant.name,
      description: restaurant.description || "",
      facebookLink: restaurant.facebookLink || "",
      instagramLink: restaurant.instagramLink || "",
      websiteLink: restaurant.websiteLink || "",
    });
    
    if (admin) {
      adminForm.reset({
        name: admin.name,
        email: admin.email,
        newPassword: "",
        confirmPassword: "",
      });
    }
    
    setLogoPreview(restaurant.logo || null);
  }, [restaurant, admin]);
  
  // Update restaurant mutation
  const updateRestaurantMutation = useMutation({
    mutationFn: async (data: Partial<Restaurant>) => {
      const res = await apiRequest("PUT", `/api/restaurants/${restaurant.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "מסעדה עודכנה בהצלחה",
        description: "פרטי המסעדה עודכנו בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון המסעדה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update admin mutation
  const updateAdminMutation = useMutation({
    mutationFn: async (data: { admin: Partial<User>, resetPassword?: boolean }) => {
      if (data.resetPassword) {
        const res = await apiRequest(
          "POST", 
          `/api/restaurants/${restaurant.id}/reset-password`, 
          { password: data.admin.newPassword }
        );
        return await res.json();
      } else {
        // Just update the admin details without password
        // This would typically be a different endpoint
        const res = await apiRequest(
          "PUT", 
          `/api/restaurants/${restaurant.id}/admin`, 
          data.admin
        );
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "מנהל המסעדה עודכן בהצלחה",
        description: "פרטי מנהל המסעדה עודכנו בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון מנהל המסעדה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitRestaurant = (values: z.infer<typeof restaurantFormSchema>) => {
    updateRestaurantMutation.mutate({
      ...values,
      logo: logoPreview,
    });
  };
  
  const onSubmitAdmin = (values: z.infer<typeof adminFormSchema>) => {
    const hasPasswordChange = !!values.newPassword;
    
    const adminData = {
      admin: {
        name: values.name,
        email: values.email,
        newPassword: values.newPassword,
      },
      resetPassword: hasPasswordChange,
    };
    
    updateAdminMutation.mutate(adminData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">עריכת מסעדה</DialogTitle>
          <DialogDescription>
            עדכן את פרטי המסעדה ומנהל המסעדה
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="restaurant" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="restaurant">מסעדה</TabsTrigger>
            <TabsTrigger value="admin">מנהל</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurant">
            <Form {...restaurantForm}>
              <form onSubmit={restaurantForm.handleSubmit(onSubmitRestaurant)}>
                <FormField
                  control={restaurantForm.control}
                  name="name"
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
                        setLogoPreview("https://via.placeholder.com/150/14b8a6/ffffff?text=Logo");
                      }}
                    >
                      העלאת תמונה
                    </Button>
                  </div>
                </div>
                
                <FormField
                  control={restaurantForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>תיאור המסעדה</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={restaurantForm.control}
                  name="facebookLink"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>קישור לפייסבוק</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://facebook.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={restaurantForm.control}
                  name="instagramLink"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>קישור לאינסטגרם</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://instagram.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={restaurantForm.control}
                  name="websiteLink"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>קישור לאתר האינטרנט</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
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
                  <Button 
                    type="submit" 
                    disabled={updateRestaurantMutation.isPending}
                  >
                    {updateRestaurantMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        מעדכן...
                      </>
                    ) : (
                      "שמור שינויים"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="admin">
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)}>
                <FormField
                  control={adminForm.control}
                  name="name"
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
                  control={adminForm.control}
                  name="email"
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
                  control={adminForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>סיסמה חדשה</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        השאר ריק אם אינך רוצה לשנות את הסיסמה
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adminForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>אימות סיסמה</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
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
                  <Button 
                    type="submit" 
                    disabled={updateAdminMutation.isPending}
                  >
                    {updateAdminMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        מעדכן...
                      </>
                    ) : (
                      "שמור שינויים"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
