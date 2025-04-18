import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Restaurant } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Loader2, Eye, Palette, Facebook, Instagram, Phone } from "lucide-react";
import { FileWithPreview } from "@/types";

const formSchema = z.object({
  logo: z.any().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Primary color must be a valid hex color (e.g. #3b82f6)",
  }),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Background color must be a valid hex color (e.g. #ffffff)",
  }),
  facebook: z.string().url({ message: "Must be a valid URL" }).or(z.string().max(0)).optional(),
  instagram: z.string().url({ message: "Must be a valid URL" }).or(z.string().max(0)).optional(),
  whatsapp: z.string().min(10, { message: "Must be a valid phone number" }).or(z.string().max(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Customization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<FileWithPreview | null>(null);

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}` : null],
    enabled: !!user?.restaurantId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryColor: restaurant?.primaryColor || "#3b82f6",
      backgroundColor: restaurant?.backgroundColor || "#ffffff",
      facebook: restaurant?.facebook || "",
      instagram: restaurant?.instagram || "",
      whatsapp: restaurant?.whatsapp || "",
    },
    values: {
      primaryColor: restaurant?.primaryColor || "#3b82f6",
      backgroundColor: restaurant?.backgroundColor || "#ffffff",
      facebook: restaurant?.facebook || "",
      instagram: restaurant?.instagram || "",
      whatsapp: restaurant?.whatsapp || "",
    },
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // If we have a logo file, we would handle file upload here
      // For the MVP, we'll just use a placeholder value
      const data = { ...values };
      if (logoFile) {
        data.logo = logoFile.name; // In a real app, this would be the uploaded file URL
      }
      
      const res = await apiRequest("PUT", `/api/restaurants/${user?.restaurantId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}` : null],
      });
      toast({
        title: "התאמה אישית עודכנה",
        description: "הגדרות התאמה אישית עודכנו בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון התאמה אישית",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateRestaurantMutation.mutate(values);
  };

  // Preview URL for the public menu
  const menuPreviewUrl = restaurant ? `/menus/${restaurant.slug}` : "";

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">התאמה אישית</h1>
          {restaurant && (
            <a href={menuPreviewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>צפה בתפריט</span>
              </Button>
            </a>
          )}
        </div>

        <Tabs defaultValue="design" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>עיצוב</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              <span>מדיה חברתית</span>
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TabsContent value="design" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>עיצוב תפריט</CardTitle>
                      <CardDescription>
                        התאם אישית את מראה התפריט הציבורי שלך
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>לוגו מסעדה</FormLabel>
                            <FormControl>
                              <FileUpload
                                value={logoFile}
                                onChange={(file) => {
                                  setLogoFile(file);
                                  field.onChange(file);
                                }}
                                accept={{ 'image/*': [] }}
                                maxSize={2 * 1024 * 1024} // 2MB
                              />
                            </FormControl>
                            <FormDescription>
                              העלה לוגו בגודל מומלץ של 200x200 פיקסלים
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>צבע ראשי</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <div
                                className="w-10 h-10 rounded-md border"
                                style={{ backgroundColor: field.value }}
                              />
                            </div>
                            <FormDescription>
                              הצבע הראשי משמש לכפתורים ואלמנטים מודגשים
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>צבע רקע</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <div
                                className="w-10 h-10 rounded-md border"
                                style={{ backgroundColor: field.value }}
                              />
                            </div>
                            <FormDescription>
                              צבע הרקע של התפריט
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>מדיה חברתית</CardTitle>
                      <CardDescription>
                        הוסף קישורים לחשבונות המדיה החברתית של המסעדה שלך
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פייסבוק</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Facebook className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="https://facebook.com/..." className="pr-10" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              כתובת URL של דף הפייסבוק של המסעדה
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אינסטגרם</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Instagram className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="https://instagram.com/..." className="pr-10" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              כתובת URL של עמוד האינסטגרם של המסעדה
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>וואטסאפ</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Phone className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="מספר טלפון, לדוגמה: 972501234567" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              מספר הטלפון של המסעדה עבור תקשורת בוואטסאפ
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateRestaurantMutation.isPending}
                  >
                    {updateRestaurantMutation.isPending && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </Tabs>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
