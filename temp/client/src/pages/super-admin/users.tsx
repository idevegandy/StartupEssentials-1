import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit2, Trash } from "lucide-react";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  restaurantId?: number;
}

interface Restaurant {
  id: number;
  name: string;
}

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  // Query to fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users');
      const data = await res.json();
      return data as User[];
    },
  });

  // Query to fetch all restaurants
  const { data: restaurants } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data as Restaurant[];
    },
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
          <Button>
            <UserPlus className="ml-2 h-4 w-4" />
            משתמש חדש
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>משתמשי המערכת</CardTitle>
            <CardDescription>ניהול כל המשתמשים במערכת</CardDescription>
            <div className="mt-4">
              <Input
                placeholder="חיפוש לפי שם או אימייל..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <p>טוען נתונים...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>תפקיד</TableHead>
                    <TableHead>מסעדה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role === "super_admin" ? "מנהל מערכת" : "מנהל מסעדה"}
                        </TableCell>
                        <TableCell>
                          {user.restaurantId ? (
                            restaurants?.find(r => r.id === user.restaurantId)?.name || "-"
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">לא נמצאו משתמשים</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center mt-8">
          הערה: פונקציונליות מלאה לעריכת והוספת משתמשים תתווסף בקרוב
        </p>
      </div>
    </AdminLayout>
  );
}