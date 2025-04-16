import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Facebook, 
  Instagram, 
  Globe, 
  Phone, 
  Utensils, 
  Coffee, 
  Pizza, 
  Beef,
  Salad,
  Dessert,
  Wine,
  Soup
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

// Default icons for categories if none specified
const categoryIcons: Record<string, React.ReactNode> = {
  main: <Utensils size={20} />,
  drinks: <Coffee size={20} />,
  pizza: <Pizza size={20} />,
  meat: <Beef size={20} />,
  salads: <Salad size={20} />,
  desserts: <Dessert size={20} />,
  wine: <Wine size={20} />,
  soup: <Soup size={20} />,
};

// Helper function to get icon for category
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerCategory.includes(key)) {
      return icon;
    }
  }
  
  return <Utensils size={20} />; // Default icon
};

// Format price with ₪ symbol
const formatPrice = (price: number) => {
  return `₪${(price / 100).toFixed(2)}`;
};

export default function MenuDisplay() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<string>("");
  
  // Fetch restaurant menu data
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['/api/menus', slug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/menus/${slug}`);
      return response.json();
    }
  });
  
  // Set the first category as active when data loads
  useEffect(() => {
    if (menuData?.categories?.length > 0) {
      setActiveTab(menuData.categories[0].id.toString());
    }
  }, [menuData]);
  
  // Apply restaurant colors if available
  const primaryColor = menuData?.restaurant?.primaryColor || "#14b8a6";
  const backgroundColor = menuData?.restaurant?.backgroundColor || "#ffffff";
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col" dir="rtl">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex justify-center mb-6">
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-40 mx-auto mb-6" />
          <div className="grid grid-cols-4 gap-2 mb-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="mb-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!menuData || !menuData.restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">התפריט לא נמצא</h1>
          <p className="text-gray-600">התפריט המבוקש אינו קיים או שהוסר</p>
        </div>
      </div>
    );
  }
  
  const { restaurant, categories } = menuData;
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor }}
      dir="rtl"
    >
      {/* Restaurant Header */}
      <header className="p-6 text-center">
        {restaurant.logo && (
          <img 
            src={restaurant.logo} 
            alt={restaurant.name} 
            className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-4"
            style={{ borderColor: primaryColor }}
          />
        )}
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="mt-2 text-gray-600">{restaurant.description}</p>
        )}
        
        {/* Social Links */}
        <div className="flex justify-center mt-4 gap-3">
          {restaurant.facebookLink && (
            <a 
              href={restaurant.facebookLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              <Facebook size={20} />
            </a>
          )}
          {restaurant.instagramLink && (
            <a 
              href={restaurant.instagramLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              <Instagram size={20} />
            </a>
          )}
          {restaurant.websiteLink && (
            <a 
              href={restaurant.websiteLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              <Globe size={20} />
            </a>
          )}
          {restaurant.phone && (
            <a 
              href={`tel:${restaurant.phone}`}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              <Phone size={20} />
            </a>
          )}
        </div>
      </header>
      
      {/* Menu Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pb-16">
        {categories.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-flow-col auto-cols-max gap-2 justify-start overflow-x-auto mb-6 p-1 w-full">
              {categories.map((category: any) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id.toString()}
                  className="flex items-center gap-2 px-4 py-2 font-medium"
                  style={{ 
                    borderColor: primaryColor,
                    "--tw-border-opacity": "0.5",
                    "--tw-text-opacity": "1",
                    color: primaryColor
                  } as React.CSSProperties}
                >
                  {getCategoryIcon(category.name)}
                  <span>{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category: any) => (
              <TabsContent 
                key={category.id} 
                value={category.id.toString()}
                className="space-y-4"
              >
                {category.items && category.items.length > 0 ? (
                  category.items.map((item: any) => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold">{item.name}</h3>
                          <span 
                            className="font-bold"
                            style={{ color: primaryColor }}
                          >
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        )}
                      </div>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-40 object-cover" 
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    אין פריטים בקטגוריה זו
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">אין עדיין קטגוריות בתפריט</h2>
            <p className="text-gray-600">המסעדה עדיין לא הוסיפה פריטים לתפריט</p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {restaurant.name}</p>
        <p className="text-xs mt-1">מופעל על ידי RestaurantOS</p>
      </footer>
    </div>
  );
}