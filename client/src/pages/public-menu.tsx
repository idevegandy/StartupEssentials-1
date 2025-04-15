import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaTiktok } from "react-icons/fa";

// Types for public menu data
interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  featured: boolean;
  categoryId: number;
  restaurantId: number;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  displayOrder: number;
  restaurantId: number;
  items: MenuItem[];
}

interface SocialMediaLink {
  id: number;
  platform: string;
  url: string;
  restaurantId: number;
}

interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  rtl: boolean;
  phone: string | null;
  address: string | null;
}

interface PublicMenuData {
  restaurant: Restaurant;
  categories: Category[];
  socialMediaLinks: SocialMediaLink[];
}

const PublicMenu: React.FC = () => {
  const [, params] = useRoute<{ restaurantId: string }>("/menus/:restaurantId");
  const restaurantId = params?.restaurantId;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch public menu data
  const { data, isLoading, error } = useQuery<PublicMenuData>({
    queryKey: ["/api/public/restaurants", restaurantId, "menu"],
    enabled: !!restaurantId,
  });

  useEffect(() => {
    // Set the first category as selected when data loads
    if (data?.categories && data.categories.length > 0 && !selectedCategory) {
      setSelectedCategory(data.categories[0].id.toString());
    }
  }, [data, selectedCategory]);

  // Define dynamic styles based on restaurant branding
  const getStyles = () => {
    if (!data?.restaurant) return {};
    
    return {
      primaryColor: data.restaurant.primaryColor || "#e65100",
      secondaryColor: data.restaurant.secondaryColor || "#f5f5f5",
      direction: data.restaurant.rtl ? "rtl" : "ltr",
    };
  };
  
  const styles = getStyles();

  // Handle errors and loading states
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2" style={{ borderColor: styles.primaryColor }}></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">⚠️</h1>
          <p className="mt-4 text-lg">Menu not available</p>
        </div>
      </div>
    );
  }

  // Get dynamic icon from Lucide icons
  const getDynamicIcon = (iconName: string): LucideIcon => {
    return (LucideIcons as any)[iconName] || LucideIcons.Utensils;
  };

  // Get social media icon
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <FaFacebook />;
      case 'instagram':
        return <FaInstagram />;
      case 'twitter':
        return <FaTwitter />;
      case 'whatsapp':
        return <FaWhatsapp />;
      case 'tiktok':
        return <FaTiktok />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen pb-20" 
      style={{ 
        direction: styles.direction as any,
        background: styles.secondaryColor,
        color: '#333',
      }}
    >
      {/* Restaurant Header */}
      <div 
        className="flex flex-col items-center justify-center p-6 text-white"
        style={{ backgroundColor: styles.primaryColor }}
      >
        {data.restaurant.logo ? (
          <img 
            src={data.restaurant.logo} 
            alt={data.restaurant.name} 
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
          />
        ) : (
          <div 
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-3xl font-bold shadow-lg"
          >
            {data.restaurant.name.charAt(0)}
          </div>
        )}
        <h1 className="mt-4 text-center text-3xl font-bold">{data.restaurant.name}</h1>
        {data.restaurant.description && (
          <p className="mt-2 max-w-md text-center text-sm opacity-90">{data.restaurant.description}</p>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="mx-auto mt-4 max-w-md px-4">
        <Tabs 
          value={selectedCategory || undefined} 
          onValueChange={setSelectedCategory}
          className="w-full"
        >
          <TabsList className="h-auto flex w-full flex-wrap justify-start gap-2 bg-transparent">
            {data.categories.map((category) => {
              const IconComponent = getDynamicIcon(category.icon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id.toString()}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
                    selectedCategory === category.id.toString() 
                      ? "bg-opacity-100 text-white" 
                      : "bg-white bg-opacity-80 text-gray-700"
                  )}
                  style={{
                    backgroundColor: selectedCategory === category.id.toString() ? styles.primaryColor : undefined,
                  }}
                >
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Menu Items by Category */}
          <div className="mt-6">
            {data.categories.map((category) => (
              <TabsContent key={category.id} value={category.id.toString()} className="mt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="mb-4 text-xl font-bold">{category.name}</h2>
                    <div className="grid gap-4">
                      {category.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <Card className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row">
                                {item.image && (
                                  <div className="h-32 w-full md:h-auto md:w-32 overflow-hidden">
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  </div>
                                )}
                                <div className="flex flex-1 flex-col justify-between p-4">
                                  <div>
                                    <div className="flex items-start justify-between">
                                      <h3 className="font-bold">{item.name}</h3>
                                      <div className="text-end font-medium">
                                        {item.discountPrice !== null ? (
                                          <>
                                            <span className="text-xs line-through opacity-60">₪{item.price}</span>
                                            <span className="ms-1 text-green-600">₪{item.discountPrice}</span>
                                          </>
                                        ) : (
                                          <span>₪{item.price}</span>
                                        )}
                                      </div>
                                    </div>
                                    {item.description && (
                                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                      
                      {category.items.length === 0 && (
                        <p className="text-center text-gray-500">No items in this category</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Social Media Links */}
      {data.socialMediaLinks && data.socialMediaLinks.length > 0 && (
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-3">
            {data.socialMediaLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
                style={{ backgroundColor: styles.primaryColor }}
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 py-4 text-center text-sm text-gray-500">
        {data.restaurant.phone && (
          <p className="mb-1">
            <span className="font-medium">Phone:</span> {data.restaurant.phone}
          </p>
        )}
        {data.restaurant.address && (
          <p>
            <span className="font-medium">Address:</span> {data.restaurant.address}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;