import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Loader2, ExternalLink, Facebook, Instagram, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

interface Restaurant {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  rtl: boolean;
  phone: string | null;
  address: string | null;
  facebookLink: string | null;
  instagramLink: string | null;
  websiteLink: string | null;
}

interface PublicMenuData {
  restaurant: Restaurant;
  categories: Category[];
}

export default function MenuDisplay() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setIsLoading(true);
        const res = await apiRequest('GET', `/api/menus/${slug}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch menu: ${res.status}`);
        }
        const data = await res.json();
        setMenuData(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setError("Failed to load menu");
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchMenu();
    }
  }, [slug]);

  // Format price with ₪ symbol
  const formatPrice = (price: number) => {
    return `₪${(price / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה</h1>
        <p className="text-gray-600">{error || "לא נמצא תפריט"}</p>
      </div>
    );
  }

  const { restaurant, categories } = menuData;
  const isRtl = restaurant.rtl !== false; // Default to RTL if not specified
  const primaryColor = restaurant.primaryColor || "#14b8a6";
  const bgColor = restaurant.secondaryColor || "#ffffff";

  // Create CSS custom properties for theming
  const customStyles = {
    "--primary-color": primaryColor,
    "--background-color": bgColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        ...customStyles,
        backgroundColor: bgColor,
      }}
    >
      {/* Restaurant Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-12 w-12 object-cover rounded-full mr-3"
              />
            )}
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {restaurant.name}
            </h1>
          </div>
          <div className="flex space-x-2">
            {restaurant.facebookLink && (
              <a
                href={restaurant.facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-full"
                style={{ color: primaryColor }}
              >
                <Facebook size={18} />
              </a>
            )}
            {restaurant.instagramLink && (
              <a
                href={restaurant.instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-full"
                style={{ color: primaryColor }}
              >
                <Instagram size={18} />
              </a>
            )}
            {restaurant.websiteLink && (
              <a
                href={restaurant.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-full"
                style={{ color: primaryColor }}
              >
                <Globe size={18} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pb-24">
        {/* Restaurant Info */}
        <div className="mb-8 text-center">
          {restaurant.description && (
            <p className="text-muted-foreground mt-2">{restaurant.description}</p>
          )}
          {(restaurant.phone || restaurant.address) && (
            <div className="mt-4 text-sm text-muted-foreground">
              {restaurant.phone && <p className="mb-1">{restaurant.phone}</p>}
              {restaurant.address && <p>{restaurant.address}</p>}
            </div>
          )}
        </div>

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="overflow-x-auto pb-2 mb-6">
            <div className="flex space-x-2 rtl:space-x-reverse">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  className="px-4 py-2 rounded-full text-sm whitespace-nowrap border"
                  style={{ 
                    borderColor: primaryColor,
                    color: primaryColor
                  }}
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Categories and Menu Items */}
        {categories.length > 0 ? (
          categories
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="mb-10"
              >
                <h2
                  className="text-xl font-bold mb-4 pb-2 border-b"
                  style={{ color: primaryColor, borderColor: primaryColor }}
                >
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-muted-foreground mb-4 text-sm">
                    {category.description}
                  </p>
                )}

                <div className="space-y-4">
                  {category.items.length > 0 ? (
                    category.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          {item.description && (
                            <p className="text-muted-foreground text-sm mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {item.discountPrice !== null ? (
                            <div className="text-right">
                              <span className="font-bold" style={{ color: primaryColor }}>
                                {formatPrice(item.discountPrice)}
                              </span>
                              <span className="text-muted-foreground line-through text-sm ml-2">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold" style={{ color: primaryColor }}>
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      אין פריטים בקטגוריה זו
                    </p>
                  )}
                </div>
              </section>
            ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">אין קטגוריות בתפריט זה</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} {restaurant.name}</p>
      </footer>
    </div>
  );
}