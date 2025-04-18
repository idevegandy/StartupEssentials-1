import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { SuperAdminLayout } from "@/components/layouts/super-admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface ActivityLog {
  id: number;
  userId: number;
  activityType: string;
  description: string;
  metadata: Record<string, any> | null;
  restaurantId: number | null;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'restaurant_admin';
}

interface Restaurant {
  id: number;
  name: string;
  slug: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: PaginationData;
}

function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [userFilter, setUserFilter] = useState<number | undefined>(undefined);
  const [restaurantFilter, setRestaurantFilter] = useState<number | undefined>(undefined);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string | undefined>(undefined);

  const offset = (page - 1) * limit;

  // Construct the API URL with filters
  const constructUrl = () => {
    const baseUrl = "/api/activities";
    const params = new URLSearchParams();
    
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    
    if (userFilter) params.append("userId", userFilter.toString());
    if (restaurantFilter) params.append("restaurantId", restaurantFilter.toString());
    
    return \`\${baseUrl}?\${params.toString()}\`;
  };
  
  // Fetch activity logs
  const { data, isLoading, isError } = useQuery<ActivityLogsResponse>({
    queryKey: ["activityLogs", limit, offset, userFilter, restaurantFilter, activityTypeFilter],
    queryFn: async () => {
      const response = await fetch(constructUrl());
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }
      
      return response.json();
    }
  });

  // Helper to format activity type for display
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get badge color based on activity type
  const getActivityBadgeColor = (type: string) => {
    switch(type) {
      case 'user_login':
      case 'user_created':
        return 'bg-green-100 text-green-800';
      case 'user_logout':
      case 'user_deleted':
        return 'bg-red-100 text-red-800';
      case 'restaurant_created':
      case 'restaurant_updated':
        return 'bg-blue-100 text-blue-800';
      case 'restaurant_deleted':
        return 'bg-orange-100 text-orange-800';
      case 'menu_updated':
      case 'category_created':
      case 'item_created':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <SuperAdminLayout>
      <Helmet>
        <title>Activity Logs | Super Admin</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Activity Logs</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Activity History</CardTitle>
            <CardDescription>
              View all system activities including user logins, restaurant creations, and menu changes.
            </CardDescription>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Input 
                  placeholder="Search logs..."
                  className="pl-10" 
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Select 
                onValueChange={(value) => setActivityTypeFilter(value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="user_logout">User Logout</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="restaurant_created">Restaurant Created</SelectItem>
                  <SelectItem value="restaurant_updated">Restaurant Updated</SelectItem>
                  <SelectItem value="menu_updated">Menu Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="loader">Loading...</div>
              </div>
            ) : isError ? (
              <div className="text-red-500 p-4 text-center">
                Error loading activity logs. Please try again.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data && data.logs.length > 0 ? (
                        data.logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline" className={getActivityBadgeColor(log.activityType)}>
                                {formatActivityType(log.activityType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                            <TableCell>{log.userId}</TableCell>
                            <TableCell>{log.restaurantId || '-'}</TableCell>
                            <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {data && data.pagination.total > 0 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {offset + 1}-{Math.min(offset + data.logs.length, data.pagination.total)} of {data.pagination.total} logs
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage((p) => Math.max(1, p - 1))} 
                            disabled={page === 1}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPage((p) => p + 1)} 
                            disabled={!data.pagination.hasMore}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <Select 
                      defaultValue={limit.toString()} 
                      onValueChange={(value) => {
                        setLimit(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Rows" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 rows</SelectItem>
                        <SelectItem value="20">20 rows</SelectItem>
                        <SelectItem value="50">50 rows</SelectItem>
                        <SelectItem value="100">100 rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

export default ActivityLogsPage;