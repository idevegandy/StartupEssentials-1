import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Restaurant, Category, Item } from "@shared/schema";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MenuPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  categories: Category[];
  items: Record<number, Item[]>;
}

export default function MenuPreviewModal({ 
  isOpen, 
  onClose, 
  restaurant, 
  categories, 
  items 
}: MenuPreviewModalProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // Set the first category as active when the modal opens
  useEffect(() => {
    if (isOpen && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [isOpen, categories, activeCategory]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-sm w-full h-[38rem] flex flex-col" style={{ maxHeight: "90vh" }}>
          {/* Phone-style header */}
          <div className="bg-slate-800 py-2 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-1 space-x-reverse">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-white">תצוגת תפריט</div>
            <button onClick={onClose} className="text-white hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          
          {/* Restaurant Menu Content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
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
                  <i className="fas fa-utensils text-2xl text-primary-700"></i>
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
              <div className="bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <div className="flex p-2 min-w-max">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-4 py-2 text-sm font-medium rounded-md ml-2 ${
                        activeCategory === category.id
                          ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Menu items */}
            <AnimatePresence mode="wait">
              {activeCategory && (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-4"
                >
                  {categories.find(c => c.id === activeCategory) && (
                    <h2 className="text-lg font-medium mb-3 text-slate-900 dark:text-white flex items-center">
                      <i className={`fas fa-${categories.find(c => c.id === activeCategory)?.icon || 'utensils'} ml-2 text-primary-600 dark:text-primary-400`}></i>
                      {categories.find(c => c.id === activeCategory)?.name}
                    </h2>
                  )}
                  
                  {/* Menu items grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {items[activeCategory]?.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700"
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
                              <h3 className="font-medium text-slate-900 dark:text-white">{item.name}</h3>
                              <span className="font-medium text-primary-700 dark:text-primary-300">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {items[activeCategory]?.length === 0 && (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <i className="fas fa-utensils text-2xl mb-2"></i>
                        <p>אין פריטים בקטגוריה זו</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {categories.length === 0 && (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                <i className="fas fa-utensils text-4xl mb-4"></i>
                <p className="text-lg">אין קטגוריות בתפריט</p>
                <p className="mt-2">לחץ על "ניהול קטגוריות" כדי להוסיף קטגוריות</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
