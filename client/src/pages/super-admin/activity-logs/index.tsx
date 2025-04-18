import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ActivityLog } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

// Pagination component for activity logs
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void 
}) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      <div className="text-sm">
        Page {currentPage} of {totalPages || 1}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}

// Activity log display formatting utility
const formatActivityType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function ActivityLogsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filtering state
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [restaurantIdFilter, setRestaurantIdFilter] = useState<string>('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');
  
  // Debounce filters to prevent too many API calls
  const debouncedUserIdFilter = useDebounce(userIdFilter, 500);
  const debouncedRestaurantIdFilter = useDebounce(restaurantIdFilter, 500);
  
  // Helper to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return timestamp;
    }
  };

  // Fetch activity logs with pagination and filtering
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      '/api/activity-logs', 
      page, 
      limit, 
      debouncedUserIdFilter, 
      debouncedRestaurantIdFilter, 
      activityTypeFilter
    ],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', ((page - 1) * limit).toString());
      
      if (debouncedUserIdFilter) {
        params.append('userId', debouncedUserIdFilter);
      }
      
      if (debouncedRestaurantIdFilter) {
        params.append('restaurantId', debouncedRestaurantIdFilter);
      }
      
      if (activityTypeFilter && activityTypeFilter !== 'all') {
        params.append('activityType', activityTypeFilter);
      }
      
      const response = await apiRequest('GET', `/api/activity-logs?${params.toString()}`);
      return response.json();
    }
  });

  // Calculate total pages
  const totalPages = data?.pagination 
    ? Math.ceil(data.pagination.total / limit) 
    : 0;

  // Handler for page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">היסטוריית פעילות</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>סינון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">מזהה משתמש</label>
                <Input 
                  placeholder="סנן לפי מזהה משתמש"
                  value={userIdFilter}
                  onChange={e => setUserIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">מזהה מסעדה</label>
                <Input
                  placeholder="סנן לפי מזהה מסעדה"
                  value={restaurantIdFilter}
                  onChange={e => setRestaurantIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">סוג פעילות</label>
                <Select
                  value={activityTypeFilter}
                  onValueChange={setActivityTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל סוגי הפעילות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל סוגי הפעילות</SelectItem>
                    <SelectItem value="login">כניסה למערכת</SelectItem>
                    <SelectItem value="logout">יציאה מהמערכת</SelectItem>
                    <SelectItem value="create_restaurant">יצירת מסעדה</SelectItem>
                    <SelectItem value="update_restaurant">עדכון מסעדה</SelectItem>
                    <SelectItem value="delete_restaurant">מחיקת מסעדה</SelectItem>
                    <SelectItem value="create_category">יצירת קטגוריה</SelectItem>
                    <SelectItem value="update_category">עדכון קטגוריה</SelectItem>
                    <SelectItem value="delete_category">מחיקת קטגוריה</SelectItem>
                    <SelectItem value="create_item">יצירת פריט</SelectItem>
                    <SelectItem value="update_item">עדכון פריט</SelectItem>
                    <SelectItem value="delete_item">מחיקת פריט</SelectItem>
                    <SelectItem value="update_settings">עדכון הגדרות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>היסטוריית פעילות מערכת</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500">
                אירעה שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.
              </div>
            ) : data?.logs?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                לא נמצאו רשומות פעילות.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>סוג פעילות</TableHead>
                        <TableHead>תיאור</TableHead>
                        <TableHead>מזהה משתמש</TableHead>
                        <TableHead>מזהה מסעדה</TableHead>
                        <TableHead>חותמת זמן</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.logs?.map((log: ActivityLog) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatActivityType(log.activityType)}</TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>{log.userId}</TableCell>
                          <TableCell>{log.restaurantId || '-'}</TableCell>
                          <TableCell>{formatTimestamp(log.timestamp.toString())}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <PaginationControls 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default ActivityLogsPage;