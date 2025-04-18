import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, Trash2, Link2, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaWhatsapp, 
  FaTiktok, 
  FaSnapchat, 
  FaPinterest 
} from "react-icons/fa";
import { Restaurant, SocialMediaLink, insertSocialMediaLinkSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Social media platforms with their icons and validation patterns
const socialMediaPlatforms = [
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: <FaFacebook className="h-5 w-5 text-blue-600" />,
    pattern: "https://facebook.com/.*|https://www.facebook.com/.*",
    placeholder: "https://facebook.com/yourbusiness"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: <FaInstagram className="h-5 w-5 text-pink-600" />,
    pattern: "https://instagram.com/.*|https://www.instagram.com/.*",
    placeholder: "https://instagram.com/yourbusiness"
  },
  { 
    id: "twitter", 
    name: "Twitter", 
    icon: <FaTwitter className="h-5 w-5 text-blue-400" />,
    pattern: "https://twitter.com/.*|https://x.com/.*",
    placeholder: "https://twitter.com/yourbusiness"
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp", 
    icon: <FaWhatsapp className="h-5 w-5 text-green-500" />,
    pattern: "https://wa.me/.*|https://api.whatsapp.com/send\\?phone=.*",
    placeholder: "https://wa.me/972501234567"
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    icon: <FaTiktok className="h-5 w-5 text-black" />,
    pattern: "https://tiktok.com/@.*|https://www.tiktok.com/@.*",
    placeholder: "https://tiktok.com/@yourbusiness"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    icon: <FaLinkedin className="h-5 w-5 text-blue-700" />,
    pattern: "https://linkedin.com/.*|https://www.linkedin.com/.*",
    placeholder: "https://linkedin.com/company/yourbusiness"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: <FaYoutube className="h-5 w-5 text-red-600" />,
    pattern: "https://youtube.com/.*|https://www.youtube.com/.*",
    placeholder: "https://youtube.com/c/yourbusiness"
  },
  { 
    id: "snapchat", 
    name: "Snapchat", 
    icon: <FaSnapchat className="h-5 w-5 text-yellow-400" />,
    pattern: "https://snapchat.com/add/.*|https://www.snapchat.com/add/.*",
    placeholder: "https://snapchat.com/add/yourbusiness"
  },
  { 
    id: "pinterest", 
    name: "Pinterest", 
    icon: <FaPinterest className="h-5 w-5 text-red-600" />,
    pattern: "https://pinterest.com/.*|https://www.pinterest.com/.*",
    placeholder: "https://pinterest.com/yourbusiness"
  }
];

export default function SocialMedia() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id);
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentLinkId, setCurrentLinkId] = useState<number | undefined>(undefined);
  const [selectedPlatform, setSelectedPlatform] = useState(socialMediaPlatforms[0]);

  // Queries
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: socialMediaLinks, isLoading: isLoadingLinks } = useQuery<SocialMediaLink[]>({
    queryKey: ["/api/restaurants", restaurantId, "social-media"],
    enabled: !!restaurantId,
  });

  // Form schema for adding social media links
  const formSchema = z.object({
    platform: z.string().min(1, { message: t("platform_required") }),
    url: z.string().url({ message: t("valid_url_required") }),
    restaurantId: z.number(),
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: socialMediaPlatforms[0].id,
      url: "",
      restaurantId: restaurantId,
    },
  });

  // Check if current user has access to this restaurant
  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.id === restaurant?.adminId;
  const hasAccess = isSuperAdmin || isRestaurantAdmin;

  // Handle platform selection
  const handleSelectPlatform = (platformId: string) => {
    const platform = socialMediaPlatforms.find(p => p.id === platformId);
    if (platform) {
      setSelectedPlatform(platform);
      form.setValue("platform", platform.id);
    }
  };

  // Handle adding social media link
  const handleAddSocialMediaLink = async (data: z.infer<typeof formSchema>) => {
    try {
      await apiRequest("POST", `/api/restaurants/${restaurantId}/social-media`, data);
      
      toast({
        title: t("success"),
        description: t("social_media_link_added"),
      });
      
      // Refresh social media links data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "social-media"] });
      setShowAddDialog(false);
      form.reset({
        platform: socialMediaPlatforms[0].id,
        url: "",
        restaurantId: restaurantId,
      });
    } catch (error) {
      console.error("Error adding social media link:", error);
      toast({
        title: t("error"),
        description: t("social_media_link_add_error"),
        variant: "destructive",
      });
    }
  };

  // Handle deleting social media link
  const handleDeleteSocialMediaLink = async () => {
    if (!currentLinkId) return;
    
    try {
      await apiRequest("DELETE", `/api/social-media/${currentLinkId}`, undefined);
      
      toast({
        title: t("success"),
        description: t("social_media_link_deleted"),
      });
      
      // Refresh social media links data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "social-media"] });
      setShowDeleteDialog(false);
      setCurrentLinkId(undefined);
    } catch (error) {
      console.error("Error deleting social media link:", error);
      toast({
        title: t("error"),
        description: t("social_media_link_delete_error"),
        variant: "destructive",
      });
    }
  };

  // Get platform info by ID
  const getPlatformInfo = (platformId: string) => {
    return socialMediaPlatforms.find(p => p.id === platformId) || socialMediaPlatforms[0];
  };

  // Get icon for platform
  const getPlatformIcon = (platformId: string) => {
    const platform = getPlatformInfo(platformId);
    return platform.icon;
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

  if (isLoadingRestaurant || isLoadingLinks) {
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
        <h1 className="text-2xl font-bold font-heading">{t("social_media")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="ml-2 h-4 w-4" />
            {t("add_social_media")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Current Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle>{t("connected_accounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {socialMediaLinks && socialMediaLinks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {socialMediaLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        {getPlatformIcon(link.platform)}
                      </div>
                      <div className="mr-4">
                        <p className="font-medium">{getPlatformInfo(link.platform).name}</p>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <Link2 className="h-3 w-3 ml-1" />
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        setCurrentLinkId(link.id);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("no_social_media")}</h3>
                <p className="text-neutral-500 mb-4">{t("no_social_media_description")}</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  {t("add_social_media")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits of Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>{t("benefits_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{t("benefit_1_title")}</h3>
                <p className="text-sm text-neutral-600">{t("benefit_1_description")}</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                  <Link2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{t("benefit_2_title")}</h3>
                <p className="text-sm text-neutral-600">{t("benefit_2_description")}</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                  <Users2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{t("benefit_3_title")}</h3>
                <p className="text-sm text-neutral-600">{t("benefit_3_description")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Social Media Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("add_social_media")}</DialogTitle>
            <DialogDescription>
              {t("add_social_media_description")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSocialMediaLink)} className="space-y-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("platform")}</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {socialMediaPlatforms.map((platform) => (
                          <div
                            key={platform.id}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              field.value === platform.id 
                                ? 'border-primary bg-primary/10' 
                                : 'border-neutral-200 hover:bg-neutral-50'
                            }`}
                            onClick={() => {
                              handleSelectPlatform(platform.id);
                              field.onChange(platform.id);
                            }}
                          >
                            {platform.icon}
                            <span className="mt-2 text-xs text-center">{platform.name}</span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("url")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={selectedPlatform.placeholder} 
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <input type="hidden" {...form.register("restaurantId")} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {t("add")}
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
              {t("delete_social_media_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteSocialMediaLink}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Users2 component since it's not imported
function Users2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
