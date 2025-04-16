import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MenuSettings } from "@/lib/types";
import Loading from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MenuPreviewModal from "@/components/modals/menu-preview-modal";

export default function RestaurantMenuSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("colors");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Check if admin has a restaurant assigned
  const restaurantId = user?.restaurantId;
  
  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });
  
  // Form schema
  const formSchema = z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "נא להזין קוד צבע תקין"),
    backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "נא להזין קוד צבע תקין"),
    facebookLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
    instagramLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
    websiteLink: z.string().url("נא להזין כתובת URL תקינה").optional().or(z.literal("")),
    description: z.string().max(200, "התיאור יכול להכיל עד 200 תווים").optional(),
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryColor: "#14b8a6",
      backgroundColor: "#ffffff",
      facebookLink: "",
      instagramLink: "",
      websiteLink: "",
      description: "",
    },
  });
  
  // Initialize form with restaurant data
  useEffect(() => {
    if (restaurant) {
      form.reset({
        primaryColor: restaurant.primaryColor || "#14b8a6",
        backgroundColor: restaurant.backgroundColor || "#ffffff",
        facebookLink: restaurant.facebookLink || "",
        instagramLink: restaurant.instagramLink || "",
        websiteLink: restaurant.websiteLink || "",
        description: restaurant.description || "",
      });
      setLogoPreview(restaurant.logo || null);
    }
  }, [restaurant, form]);
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: MenuSettings) => {
      if (!restaurantId) throw new Error("No restaurant ID");
      const res = await apiRequest("PUT", `/api/restaurants/${restaurantId}`, {
        ...data,
        logo: logoPreview,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "הגדרות התפריט עודכנו",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettingsMutation.mutate(values);
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }
  
  if (!restaurant) {
    return (
      <AppLayout>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">לא נמצאה מסעדה</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            לא מוגדרת מסעדה לחשבון זה. אנא פנה למנהל המערכת.
          </p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="הגדרות תפריט">
      <PageHeader 
        title="הגדרות תפריט" 
        description="התאם אישית את מראה התפריט שלך"
      >
        <Button
          variant="outline"
          onClick={() => setIsPreviewOpen(true)}
          className="ml-2"
        >
          <i className="fas fa-eye ml-2"></i>
          תצוגה מקדימה
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(`/menus/${restaurant.slug}`, '_blank')}
        >
          <i className="fas fa-external-link-alt ml-2"></i>
          צפה בתפריט
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>התאמה אישית</CardTitle>
          <CardDescription>
            התאם את העיצוב והמראה של התפריט הציבורי שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="colors">צבעים ועיצוב</TabsTrigger>
              <TabsTrigger value="branding">לוגו ומיתוג</TabsTrigger>
              <TabsTrigger value="social">קישורים</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="colors">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>צבע ראשי</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded-md ml-2 border border-slate-200 dark:border-slate-700"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
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
                          <div className="flex items-center">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded-md ml-2 border border-slate-200 dark:border-slate-700"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>תיאור המסעדה</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="תיאור קצר שיופיע בתפריט" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="branding">
                  <div className="mb-6">
                    <FormLabel>לוגו המסעדה</FormLabel>
                    <div className="mt-2 flex items-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                        ) : (
                          <i className="fas fa-utensils text-2xl text-slate-400 dark:text-slate-500"></i>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mr-4"
                        onClick={() => {
                          // In a real app, this would open a file picker
                          setLogoPreview("https://via.placeholder.com/200/14b8a6/ffffff?text=Logo");
                        }}
                      >
                        העלאת לוגו
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mr-2"
                          onClick={() => setLogoPreview(null)}
                        >
                          הסר לוגו
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="social">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="facebookLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>קישור לפייסבוק</FormLabel>
                          <div className="flex items-center">
                            <i className="fab fa-facebook text-slate-500 ml-2"></i>
                            <FormControl>
                              <Input {...field} placeholder="https://facebook.com/your-page" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="instagramLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>קישור לאינסטגרם</FormLabel>
                          <div className="flex items-center">
                            <i className="fab fa-instagram text-slate-500 ml-2"></i>
                            <FormControl>
                              <Input {...field} placeholder="https://instagram.com/your-profile" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="websiteLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>קישור לאתר אינטרנט</FormLabel>
                          <div className="flex items-center">
                            <i className="fas fa-globe text-slate-500 ml-2"></i>
                            <FormControl>
                              <Input {...field} placeholder="https://your-website.com" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? "שומר..." : "שמור הגדרות"}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Menu Preview Modal */}
      {isPreviewOpen && restaurant && (
        <MenuPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          restaurant={{
            ...restaurant,
            primaryColor: form.getValues().primaryColor,
            backgroundColor: form.getValues().backgroundColor,
            logo: logoPreview,
            facebookLink: form.getValues().facebookLink,
            instagramLink: form.getValues().instagramLink,
            websiteLink: form.getValues().websiteLink,
            description: form.getValues().description,
          }}
          categories={[]} // These will be loaded in the modal
          items={{}}
        />
      )}
    </AppLayout>
  );
}
