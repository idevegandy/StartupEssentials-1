import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeGenerator } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertTriangle, Plus, Trash2, LinkIcon, ShareIcon } from "lucide-react";
import { Restaurant, QRCode as QRCodeType, insertQRCodeSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function QRCodes() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id);
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentQRCodeId, setCurrentQRCodeId] = useState<number | undefined>(undefined);
  const [tabValue, setTabValue] = useState("all");

  // Queries
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: qrCodes, isLoading: isLoadingQRCodes } = useQuery<QRCodeType[]>({
    queryKey: ["/api/restaurants", restaurantId, "qr-codes"],
    enabled: !!restaurantId,
  });

  // Form schema for creating QR codes
  const formSchema = z.object({
    label: z.string().min(1, { message: t("label_required") }),
    restaurantId: z.number(),
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      restaurantId: restaurantId,
    },
  });

  // Check if current user has access to this restaurant
  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.id === restaurant?.adminId;
  const hasAccess = isSuperAdmin || isRestaurantAdmin;

  // Generate menu URL for QR code
  const getMenuUrl = (restaurant: Restaurant) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/menus/${restaurantId}`;
  };

  // Handle QR code creation
  const handleCreateQRCode = async (data: z.infer<typeof formSchema>) => {
    try {
      await apiRequest("POST", `/api/restaurants/${restaurantId}/qr-codes`, data);
      
      toast({
        title: t("success"),
        description: t("qr_code_created"),
      });
      
      // Refresh QR codes data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "qr-codes"] });
      setShowCreateDialog(false);
      form.reset();
    } catch (error) {
      console.error("Error creating QR code:", error);
      toast({
        title: t("error"),
        description: t("qr_code_create_error"),
        variant: "destructive",
      });
    }
  };

  // Handle QR code deletion
  const handleDeleteQRCode = async () => {
    if (!currentQRCodeId) return;
    
    try {
      await apiRequest("DELETE", `/api/qr-codes/${currentQRCodeId}`, undefined);
      
      toast({
        title: t("success"),
        description: t("qr_code_deleted"),
      });
      
      // Refresh QR codes data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "qr-codes"] });
      setShowDeleteDialog(false);
      setCurrentQRCodeId(undefined);
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast({
        title: t("error"),
        description: t("qr_code_delete_error"),
        variant: "destructive",
      });
    }
  };

  // Handle regenerating a QR code
  const handleRegenerateQRCode = () => {
    // In a real implementation, this would create a new QR code with a new unique identifier
    // For now, we'll just show a toast message
    toast({
      title: t("qr_regenerated"),
      description: t("qr_regenerated_description"),
    });
  };

  // Share menu URL
  const handleShareMenu = async () => {
    if (!restaurant) return;
    
    const url = getMenuUrl(restaurant);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: t("menu_share_text", { name: restaurant.name }),
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to clipboard if sharing fails
        copyToClipboard(url);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      copyToClipboard(url);
    }
  };

  // Copy menu URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: t("copied_to_clipboard"),
          description: t("menu_url_copied"),
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: t("copy_error"),
          description: t("copy_error_description"),
          variant: "destructive",
        });
      }
    );
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

  if (isLoadingRestaurant || isLoadingQRCodes) {
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
        <h1 className="text-2xl font-bold font-heading">{t("qr_codes")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="ml-2 h-4 w-4" />
            {t("create_qr_code")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>{t("primary_menu_qr")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center">
                <QRCodeGenerator 
                  value={getMenuUrl(restaurant)}
                  size={200}
                  level="M"
                  includeMargin={true}
                  onRegenerate={handleRegenerateQRCode}
                  restaurantName={restaurant.name}
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-2">{t("menu_url")}</Label>
                    <div className="flex">
                      <Input 
                        value={getMenuUrl(restaurant)} 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button 
                        variant="secondary" 
                        className="rounded-l-none"
                        onClick={() => copyToClipboard(getMenuUrl(restaurant))}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block mb-2">{t("share_menu")}</Label>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleShareMenu}
                    >
                      <ShareIcon className="ml-2 h-4 w-4" />
                      {t("share")}
                    </Button>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">{t("qr_code_tips")}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                      <li>{t("qr_tip_1")}</li>
                      <li>{t("qr_tip_2")}</li>
                      <li>{t("qr_tip_3")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle>{t("additional_qr_codes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tabValue} onValueChange={setTabValue}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t("all_qr_codes")}</TabsTrigger>
                <TabsTrigger value="recent">{t("recently_created")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {qrCodes && qrCodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qrCodes.map((qrCode) => (
                      <Card key={qrCode.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 flex items-center justify-between w-full mb-2">
                              <h3 className="font-medium">{qrCode.label}</h3>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentQRCodeId(qrCode.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mb-3">
                              <QRCodeGenerator 
                                value={`${getMenuUrl(restaurant)}?qr=${qrCode.id}`}
                                size={120}
                                level="M"
                              />
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(qrCode.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("no_additional_qr_codes")}</h3>
                    <p className="text-neutral-500 mb-4">{t("no_qr_codes_description")}</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="ml-2 h-4 w-4" />
                      {t("create_qr_code")}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent">
                {qrCodes && qrCodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Just show the most recent 3 QR codes for demonstration */}
                    {qrCodes.slice(0, 3).map((qrCode) => (
                      <Card key={qrCode.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 flex items-center justify-between w-full mb-2">
                              <h3 className="font-medium">{qrCode.label}</h3>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentQRCodeId(qrCode.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mb-3">
                              <QRCodeGenerator 
                                value={`${getMenuUrl(restaurant)}?qr=${qrCode.id}`}
                                size={120}
                                level="M"
                              />
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(qrCode.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("no_additional_qr_codes")}</h3>
                    <p className="text-neutral-500 mb-4">{t("no_qr_codes_description")}</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="ml-2 h-4 w-4" />
                      {t("create_qr_code")}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create QR Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("create_qr_code")}</DialogTitle>
            <DialogDescription>
              {t("create_qr_code_description")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateQRCode)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("qr_code_label")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("qr_code_label_placeholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <input type="hidden" {...form.register("restaurantId")} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {t("create")}
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
              {t("delete_qr_code_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteQRCode}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
