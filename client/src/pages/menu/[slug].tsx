import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { RestaurantWithMenu, CategoryWithItems } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Facebook, Instagram, Phone } from "lucide-react";

export default function MenuPage() {
  const [_, params] = useRoute("/menus/:slug");
  const slug = params?.slug;
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"right" | "left">("right");
  const contentRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);

  const { data: menuData, isLoading, error } = useQuery<RestaurantWithMenu>({
    queryKey: [`/api/menus/${slug}`],
  });

  // Set the first category as active when data is loaded
  useEffect(() => {
    if (menuData?.categories && menuData.categories.length > 0) {
      setActiveCategory(menuData.categories[0].id);
    }
  }, [menuData]);

  // Handle scroll direction for animations
  const handleCategoryChange = (categoryId: number) => {
    if (activeCategory) {
      // Determine scroll direction based on category order
      const currentIndex = menuData?.categories.findIndex(cat => cat.id === activeCategory) || 0;
      const newIndex = menuData?.categories.findIndex(cat => cat.id === categoryId) || 0;
      setScrollDirection(newIndex > currentIndex ? "left" : "right");
    }
    setActiveCategory(categoryId);
    
    // Scroll to top of the content when changing category
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle header visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        if (scrollTop > 100 && scrollTop > lastScrollTop.current) {
          setShowHeader(false);
        } else {
          setShowHeader(true);
        }
        lastScrollTop.current = scrollTop;
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Apply restaurant styling if available
  useEffect(() => {
    if (menuData?.restaurant) {
      document.documentElement.style.setProperty(
        "--primary-color", 
        menuData.restaurant.primaryColor || "#3b82f6"
      );
      document.documentElement.style.setProperty(
        "--background-color", 
        menuData.restaurant.backgroundColor || "#ffffff"
      );
    }
  }, [menuData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
        <h2 className="text-xl font-medium text-gray-700">טוען את התפריט...</h2>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-700 mb-2">התפריט לא נמצא</h2>
        <p className="text-gray-500 text-center max-w-md px-4">
          לא הצלחנו למצוא את התפריט המבוקש. אנא בדוק שהקישור נכון או נסה שוב מאוחר יותר.
        </p>
      </div>
    );
  }

  const { restaurant, categories } = menuData;

  return (
    <div 
      className="flex flex-col min-h-screen overflow-hidden"
      style={{ backgroundColor: restaurant.backgroundColor || '#ffffff' }}
    >
      {/* Header - Restaurant Name & Logo */}
      <motion.header
        className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm"
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: showHeader ? 1 : 0,
          y: showHeader ? 0 : -100 
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center">
          {restaurant.logo ? (
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 mr-3">
              <img 
                src={restaurant.logo} 
                alt={restaurant.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mr-3 text-white text-xl font-bold"
              style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-bold">{restaurant.name}</h1>
        </div>
      </motion.header>

      {/* Categories Tabs */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 overflow-x-auto">
        <div className="flex space-x-1 space-x-reverse p-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id
                ? `bg-primary-600 text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={
                activeCategory === category.id
                  ? { backgroundColor: restaurant.primaryColor || '#3b82f6' }
                  : {}
              }
            >
              {category.icon && (
                <span className="ml-1 inline-block">{category.icon}</span>
              )}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div 
        ref={contentRef} 
        className="flex-1 overflow-y-auto pb-20"
        style={{ backgroundColor: restaurant.backgroundColor || '#ffffff' }}
      >
        <AnimatePresence mode="wait">
          {categories.map((category) => 
            activeCategory === category.id && (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: scrollDirection === "right" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: scrollDirection === "right" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="p-4"
              >
                <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                <div className="space-y-4">
                  {category.items.length > 0 ? (
                    category.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {item.image && (
                            <div className="sm:w-1/3 h-48 sm:h-auto">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className={`p-4 ${item.image ? 'sm:w-2/3' : 'w-full'}`}>
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold">{item.name}</h3>
                              <div 
                                className="px-3 py-1 rounded-full text-white font-medium text-sm"
                                style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                              >
                                {item.price} ₪
                              </div>
                            </div>
                            {item.description && (
                              <p className="mt-2 text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>אין פריטים בקטגוריה זו</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Social Links */}
      <footer className="bg-white py-4 border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-4 space-x-reverse">
            {restaurant.facebook && (
              <a 
                href={restaurant.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: restaurant.primaryColor || '#3b82f6' }}
              >
                <Facebook />
              </a>
            )}
            {restaurant.instagram && (
              <a 
                href={restaurant.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: restaurant.primaryColor || '#3b82f6' }}
              >
                <Instagram />
              </a>
            )}
            {restaurant.whatsapp && (
              <a 
                href={`https://wa.me/${restaurant.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: restaurant.primaryColor || '#3b82f6' }}
              >
                <Phone />
              </a>
            )}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {restaurant.name} © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
