import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Restaurant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Plus, Search } from "lucide-react";
import AddRestaurantModal from "@/components/restaurant/add-restaurant-modal";
import RestaurantActions from "@/components/restaurant/restaurant-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, CheckCircle, Clock } from "lucide-react";

export default function Restaurants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });
  
  // Filter restaurants by search term
  const filteredRestaurants = restaurants
    ? restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil((filteredRestaurants?.length || 0) / itemsPerPage);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Stats
  const totalRestaurants = restaurants?.length || 0;
  const activeRestaurants = restaurants?.filter(r => r.status === 'active').length || 0;
  const pendingRestaurants = restaurants?.filter(r => r.status === 'pending').length || 0;
  
  // Handle restaurant edit
  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowAddModal(true);
  };
  
  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">רשימת מסעדות</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="ml-1 h-4 w-4" />
            הוסף מסעדה
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Total Restaurants */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                  <Utensils className="h-5 w-5 text-primary-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">סה"כ מסעדות</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalRestaurants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Restaurants */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">מסעדות פעילות</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeRestaurants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Restaurants */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">מסעדות בהמתנה</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingRestaurants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Restaurant Table */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">רשימת מסעדות</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="חיפוש מסעדה..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם מסעדה</TableHead>
                    <TableHead className="text-right">סלאג</TableHead>
                    <TableHead className="text-right">תאריך הוספה</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRestaurants.length > 0 ? (
                    paginatedRestaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell className="py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                              {restaurant.logo ? (
                                <img 
                                  src={restaurant.logo} 
                                  alt={`${restaurant.name} logo`} 
                                  className="h-10 w-10 object-cover" 
                                />
                              ) : (
                                <Utensils className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {restaurant.slug}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(restaurant.createdAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              restaurant.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {restaurant.status === "active" ? "פעיל" : "בהמתנה"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <RestaurantActions
                            restaurant={restaurant}
                            onEdit={handleEditRestaurant}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchTerm
                          ? "לא נמצאו תוצאות המתאימות לחיפוש"
                          : "אין עדיין מסעדות במערכת"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    מציג
                    <span className="font-medium mx-1">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    עד
                    <span className="font-medium mx-1">
                      {Math.min(currentPage * itemsPerPage, filteredRestaurants.length)}
                    </span>
                    מתוך
                    <span className="font-medium mx-1">{filteredRestaurants.length}</span>
                    תוצאות
                  </p>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Restaurant Modal */}
      <AddRestaurantModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingRestaurant(null);
        }}
      />
    </MainLayout>
  );
}
