import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

function ActivityLogsPage() {
  // Sample data - would normally be fetched from API
  const activityLogs = [
    { 
      id: 1, 
      activityType: 'user_login',
      description: 'User logged in',
      userId: 1,
      timestamp: new Date().toISOString(),
      restaurantId: null
    },
    { 
      id: 2, 
      activityType: 'restaurant_created',
      description: 'Restaurant "Test Restaurant" created',
      userId: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      restaurantId: 1
    }
  ];

  // Helper to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Restaurant ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.activityType}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{log.restaurantId || '-'}</TableCell>
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityLogsPage;