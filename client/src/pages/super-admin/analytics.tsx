import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";

// Sample data for the analytics dashboard
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Restaurant {
  id: number;
  name: string;
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("restaurants");

  // Query to fetch all restaurants for analytics
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data as Restaurant[];
    },
  });

  // Sample analytics data - in a real app, this would come from the backend
  const restaurantData = restaurants?.map((restaurant, index) => ({
    name: restaurant.name,
    value: Math.floor(Math.random() * 100) + 20, // Random value between 20-120 for demo
    color: COLORS[index % COLORS.length]
  })) || [];

  const monthlyUsersData = [
    { name: 'ינואר', users: 40 },
    { name: 'פברואר', users: 30 },
    { name: 'מרץ', users: 20 },
    { name: 'אפריל', users: 27 },
    { name: 'מאי', users: 18 },
    { name: 'יוני', users: 23 },
    { name: 'יולי', users: 34 },
    { name: 'אוגוסט', users: 45 },
    { name: 'ספטמבר', users: 65 },
    { name: 'אוקטובר', users: 78 },
    { name: 'נובמבר', users: 82 },
    { name: 'דצמבר', users: 91 },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <p className="text-lg">טוען נתונים...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">סטטיסטיקות</h1>
          <p className="text-muted-foreground">מידע סטטיסטי על השימוש במערכת</p>
        </div>

        <Tabs defaultValue="restaurants" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="restaurants">מסעדות</TabsTrigger>
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="traffic">תנועה באתר</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurants" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">סך הכל מסעדות</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurants?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    מסעדות רשומות במערכת
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">פריטי תפריט</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">184</div>
                  <p className="text-xs text-muted-foreground">
                    סך הכל פריטים בכל המסעדות
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">סריקות QR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    סריקות QR בחודש האחרון
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>פעילות מסעדות</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={restaurantData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {restaurantData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} צפיות`, name]}
                      labelFormatter={() => 'מידע'} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">סך הכל משתמשים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">מנהלי מערכת</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">מנהלי מסעדות</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">משתמשים פעילים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">10</div>
                  <p className="text-xs text-muted-foreground">
                    בשבוע האחרון
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>משתמשים לפי חודש</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyUsersData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} משתמשים`, 'משתמשים']} />
                    <Legend />
                    <Bar dataKey="users" fill="#8884d8" name="משתמשים" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>תנועת גולשים באתר</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">נתוני תנועה יהיו זמינים בקרוב</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}