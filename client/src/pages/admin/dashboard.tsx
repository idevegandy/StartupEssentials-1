import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  HandPlatter,
  Utensils,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Restaurant as RestaurantType } from "@shared/schema";
import { Link } from "wouter";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
  });

  const { data: restaurants, isLoading } = useQuery<RestaurantType[]>({
    queryKey: ["/api/restaurants"],
  });

  useEffect(() => {
    if (restaurants) {
      const active = restaurants.filter(r => r.status === 'active').length;
      const pending = restaurants.filter(r => r.status === 'pending').length;
      setStats({
        total: restaurants.length,
        active,
        pending,
      });
    }
  }, [restaurants]);

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">לוח מחוונים</h1>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? "..." : stats.total}
                  </p>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? "..." : stats.active}
                  </p>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? "..." : stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Added Restaurants */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="flex items-center justify-between mb-4">
                <span>מסעדות שנוספו לאחרונה</span>
                <Link href="/restaurants" className="text-sm text-primary-600 flex items-center hover:underline">
                  <span>כל המסעדות</span>
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </CardTitle>
              
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">טוען...</div>
              ) : restaurants && restaurants.length > 0 ? (
                <div className="space-y-4">
                  {restaurants.slice(0, 5).map(restaurant => (
                    <div key={restaurant.id} className="flex items-center p-3 rounded-md hover:bg-gray-50">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <HandPlatter className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="mr-3">
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">נוסף ב-{new Date(restaurant.createdAt!).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          restaurant.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {restaurant.status === 'active' ? 'פעיל' : 'בהמתנה'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">אין עדיין מסעדות במערכת</p>
                  <Link href="/restaurants" className="mt-2 inline-block text-primary-600 hover:underline">
                    הוסף מסעדה ראשונה
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="mb-4">פעולות מהירות</CardTitle>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/restaurants">
                  <Card className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <Utensils className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">רשימת מסעדות</h3>
                        <p className="text-sm text-gray-500">צפה וערוך את כל המסעדות</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/profile">
                  <Card className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <HandPlatter className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">הפרופיל שלי</h3>
                        <p className="text-sm text-gray-500">ערוך את פרטי החשבון</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/settings">
                  <Card className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <HandPlatter className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">הגדרות</h3>
                        <p className="text-sm text-gray-500">הגדר את העדפות המערכת</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
