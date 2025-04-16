import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { RestaurantFullMenu } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/loading";

export default function MenuDisplay() {
  const [_, params] = useRoute("/menus/:slug");
  const [menuData, setMenuData] = useState<RestaurantFullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/menus/${params?.slug}`);
        
        if (!response.ok) {
          throw new Error("תפריט לא נמצא");
        }
        
        const data = await response.json();
        setMenuData(data);
        
        // Set first category as active if there are categories
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
      } catch (err: any) {
        setError(err.message || "שגיאה בטעינת התפריט");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params?.slug) {
      fetchMenuData();
    }
  }, [params?.slug]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <Loading size="large" text="טוען תפריט..." />
      </div>
    );
  }
  
  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">שגיאה בטעינת התפריט</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{error || "תפריט לא נמצא"}</p>
      </div>
    );
  }
  
  const { restaurant, categories } = menuData;
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ 
        backgroundColor: restaurant.backgroundColor || "#ffffff",
        color: restaurant.backgroundColor ? "#000000" : undefined
      }}
    >
      {/* Restaurant header with logo */}
      <div 
        className="text-white p-4 text-center" 
        style={{ backgroundColor: restaurant.primaryColor || "#14b8a6" }}
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md mb-3">
          {restaurant.logo ? (
            <img 
              src={restaurant.logo} 
              alt={restaurant.name} 
              className="h-16 w-16 rounded-full object-cover" 
            />
          ) : (
            <i className="fas fa-utensils text-2xl" style={{ color: restaurant.primaryColor || "#14b8a6" }}></i>
          )}
        </div>
        <h1 className="text-xl font-bold">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-sm opacity-90">{restaurant.description}</p>
        )}
        
        <div className="flex justify-center mt-3 space-x-3 space-x-reverse">
          {restaurant.facebookLink && (
            <a href={restaurant.facebookLink} target="_blank" rel="noopener noreferrer" className="text-white hover:text-slate-200">
              <i className="fab fa-facebook text-lg"></i>
            </a>
          )}
          {restaurant.instagramLink && (
            <a href={restaurant.instagramLink} target="_blank" rel="noopener noreferrer" className="text-white hover:text-slate-200">
              <i className="fab fa-instagram text-lg"></i>
            </a>
          )}
          {restaurant.websiteLink && (
            <a href={restaurant.websiteLink} target="_blank" rel="noopener noreferrer" className="text-white hover:text-slate-200">
              <i className="fas fa-globe text-lg"></i>
            </a>
          )}
        </div>
      </div>
      
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-white shadow-sm" style={{ backgroundColor: restaurant.backgroundColor || "#ffffff" }}>
          <div className="flex p-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 text-sm font-medium rounded-md ml-2 ${
                  activeCategory === category.id
                    ? `bg-opacity-20 text-[${restaurant.primaryColor}]`
                    : `hover:bg-opacity-10`
                }`}
                style={{ 
                  backgroundColor: activeCategory === category.id 
                    ? `${restaurant.primaryColor}20` // 20% opacity 
                    : "transparent",
                  color: activeCategory === category.id 
                    ? restaurant.primaryColor 
                    : "#64748b"
                }}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Menu content */}
      <div className="flex-1 p-4">
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-utensils text-4xl mb-4 text-slate-400"></i>
            <p className="text-lg">התפריט ריק</p>
            <p className="mt-2 text-slate-500">בקרוב יתווספו פריטים לתפריט</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeCategory && (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {categories.find(c => c.id === activeCategory) && (
                  <h2 className="text-lg font-medium mb-3 flex items-center">
                    <i 
                      className={`fas fa-${categories.find(c => c.id === activeCategory)?.icon || 'utensils'} ml-2`}
                      style={{ color: restaurant.primaryColor || "#14b8a6" }}
                    ></i>
                    {categories.find(c => c.id === activeCategory)?.name}
                  </h2>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                  {categories.find(c => c.id === activeCategory)?.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow overflow-hidden border border-slate-200"
                      style={{ 
                        backgroundColor: restaurant.backgroundColor ? "#ffffff" : undefined,
                        borderColor: restaurant.backgroundColor ? "#e5e7eb" : undefined
                      }}
                    >
                      <div className="flex">
                        {item.image && (
                          <div className="w-24 h-24 flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div className="p-3 flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{item.name}</h3>
                            <span 
                              className="font-medium"
                              style={{ color: restaurant.primaryColor || "#14b8a6" }}
                            >
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-500 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {(categories.find(c => c.id === activeCategory)?.items.length || 0) === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-utensils text-2xl mb-2"></i>
                      <p>אין פריטים בקטגוריה זו</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} {restaurant.name}</p>
        <p className="mt-1">
          <a 
            href="#" 
            className="hover:text-slate-700"
            style={{ color: restaurant.primaryColor || "#14b8a6" }}
          >
            Powered by RestaurantOS
          </a>
        </p>
      </div>
    </div>
  );
}
