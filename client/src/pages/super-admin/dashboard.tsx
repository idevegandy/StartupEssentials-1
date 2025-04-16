import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Restaurant, User } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Loading from "@/components/ui/loading";

export default function SuperAdminDashboard() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      navigate('/restaurant-admin/dashboard');
    }
  }, [user, navigate]);

  // Fetch restaurants for dashboard stats
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  if (isLoading) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }

  // Dashboard stats
  const totalRestaurants = restaurants?.length || 0;
  const recentRestaurants = restaurants?.slice(0, 5) || [];
  
  // Sample data for charts - in a real app this would come from API
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  // Calculate category counts per restaurant for the pie chart
  const pieData = [
    { name: 'מסעדות', value: totalRestaurants },
    { name: 'קטגוריות', value: totalRestaurants * 3 }, // Approximation
    { name: 'פריטי תפריט', value: totalRestaurants * 12 }, // Approximation
  ];

  return (
    <AppLayout title="לוח בקרה">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכל מסעדות</CardTitle>
            <i className="fas fa-utensils h-4 w-4 text-primary-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">
              מסעדות פעילות במערכת
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכל קטגוריות</CardTitle>
            <i className="fas fa-list h-4 w-4 text-primary-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestaurants * 3}</div>
            <p className="text-xs text-muted-foreground">
              קטגוריות בכל המסעדות
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכל פריטי תפריט</CardTitle>
            <i className="fas fa-hamburger h-4 w-4 text-primary-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestaurants * 12}</div>
            <p className="text-xs text-muted-foreground">
              פריטים בכל המסעדות
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>סטטיסטיקות מערכת</CardTitle>
            <CardDescription>
              התפלגות של מסעדות, קטגוריות ופריטים במערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Recent Restaurants */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>מסעדות אחרונות</CardTitle>
            <CardDescription>
              המסעדות האחרונות שנוספו למערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRestaurants.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  לא קיימות מסעדות במערכת
                </div>
              ) : (
                recentRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                      {restaurant.logo ? (
                        <img src={restaurant.logo} alt={restaurant.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <i className="fas fa-utensils text-primary-600"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{restaurant.name}</h4>
                      <p className="text-xs text-slate-500">{restaurant.slug}</p>
                    </div>
                    <div>
                      <a 
                        href={`/menus/${restaurant.slug}`} 
                        target="_blank" 
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        צפה בתפריט
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentRestaurants.length > 0 && (
              <div className="mt-4 text-center">
                <a 
                  href="/restaurants" 
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  צפה בכל המסעדות
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
          <CardDescription>
            פעולות נפוצות במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/restaurants" 
              className="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-2">
                <i className="fas fa-utensils text-primary-600 text-lg"></i>
              </div>
              <h4 className="font-medium">ניהול מסעדות</h4>
              <p className="text-xs text-slate-500 text-center mt-1">
                צפה, ערוך והוסף מסעדות חדשות
              </p>
            </a>
            
            <div className="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg opacity-50">
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-2">
                <i className="fas fa-users text-primary-600 text-lg"></i>
              </div>
              <h4 className="font-medium">ניהול משתמשים</h4>
              <p className="text-xs text-slate-500 text-center mt-1">
                נהל חשבונות משתמשים במערכת
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg opacity-50">
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-2">
                <i className="fas fa-cog text-primary-600 text-lg"></i>
              </div>
              <h4 className="font-medium">הגדרות מערכת</h4>
              <p className="text-xs text-slate-500 text-center mt-1">
                עדכן הגדרות כלליות של המערכת
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
