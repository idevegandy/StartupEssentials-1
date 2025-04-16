import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  UserCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function Users() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  
  const isSuperAdmin = user?.role === "super_admin";

  // Redirect if not a super admin
  if (!isSuperAdmin) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("access_denied")}</h2>
              <p className="text-neutral-600">{t("super_admin_required")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && isSuperAdmin,
  });

  const { data: currentUserData } = useQuery<User>({
    queryKey: ["/api/users", currentUserId],
    enabled: !!currentUserId,
  });

  // Form validation schema
  const formSchema = z.object({
    username: z.string().min(1, { message: t("username_required") }),
    name: z.string().min(1, { message: t("name_required") }),
    password: isEditing ? z.string().optional() : z.string().min(6, { message: t("password_min_length") }),
    email: z.string().email({ message: t("email_invalid") }),
    role: z.string().default("restaurant_admin"),
  });

  // Get filtered users
  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // User form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      name: "",
      password: "",
      email: "",
      role: "restaurant_admin",
    },
  });

  // Open dialog for adding a user
  const handleAddUser = () => {
    setIsEditing(false);
    setCurrentUserId(undefined);
    form.reset({
      username: "",
      name: "",
      password: "",
      email: "",
      role: "restaurant_admin",
    });
    setShowDialog(true);
  };

  // Open dialog for editing a user
  const handleEditUser = (id: number) => {
    setIsEditing(true);
    setCurrentUserId(id);
    const userToEdit = users?.find(u => u.id === id);
    
    if (userToEdit) {
      form.reset({
        username: userToEdit.username,
        name: userToEdit.name,
        password: "",
        email: userToEdit.email,
        role: userToEdit.role,
      });
      setShowDialog(true);
    }
  };
  
  // Function to view user password (for super admin only)
  const viewUserPassword = async (id: number) => {
    try {
      // In a real application, this should use a secure API endpoint
      // For now, we'll simulate this by showing a toast notification
      toast({
        title: t("user_password"),
        description: t("contact_administrator_for_password"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error viewing password:", error);
      toast({
        title: t("error"),
        description: t("password_view_error"),
        variant: "destructive",
      });
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id: number) => {
    setCurrentUserId(id);
    setShowDeleteDialog(true);
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (isEditing && currentUserId) {
        // If password is empty and we're editing, remove it from the data
        if (!data.password) {
          const { password, ...dataWithoutPassword } = data;
          await apiRequest("PUT", `/api/users/${currentUserId}`, dataWithoutPassword);
        } else {
          await apiRequest("PUT", `/api/users/${currentUserId}`, data);
        }
        
        toast({
          title: t("success"),
          description: t("user_updated"),
        });
      } else {
        // Create new user
        await apiRequest("POST", "/api/users", data);
        toast({
          title: t("success"),
          description: t("user_created"),
        });
      }
      
      // Refresh users data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: t("error"),
        description: t("user_save_error"),
        variant: "destructive",
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!currentUserId) return;
    
    try {
      await apiRequest("DELETE", `/api/users/${currentUserId}`, undefined);
      toast({
        title: t("success"),
        description: t("user_deleted"),
      });
      
      // Refresh users data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: t("error"),
        description: t("user_delete_error"),
        variant: "destructive",
      });
    }
  };

  // Function to get role badge element
  const getRoleBadge = (role: string) => {
    if (role === "super_admin") {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{t("super_admin")}</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{t("restaurant_admin")}</Badge>;
    }
  };

  if (isLoadingUsers) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("users")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <Input
              type="text"
              placeholder={t("search")}
              className="py-2 px-4 pr-10 rounded-lg border border-neutral-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-neutral-400 h-4 w-4" />
          </div>
          <Button onClick={handleAddUser}>
            <PlusCircle className="ml-2 h-4 w-4" />
            {t("add_user")}
          </Button>
        </div>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("users")}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("name")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("username")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("email")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("role")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("created_at")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((userData) => {
                  const createdDate = new Date(userData.createdAt).toLocaleDateString();
                  
                  return (
                    <tr key={userData.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 rounded-full">
                            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-neutral-900">{userData.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {userData.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {userData.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userData.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {createdDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("view_password")}
                            onClick={() => viewUserPassword(userData.id)}
                            disabled={userData.id === user?.id} // Prevent viewing own password
                          >
                            <UserCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("edit_user")}
                            onClick={() => handleEditUser(userData.id)}
                            disabled={userData.id === user?.id} // Prevent editing own account
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            title={t("delete_user")}
                            onClick={() => handleDeleteClick(userData.id)}
                            disabled={userData.id === user?.id || userData.role === "super_admin"} // Prevent deleting own account or other super admin
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                    {searchTerm ? t("no_results") : t("no_users")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between">
          <Button variant="ghost" size="sm" disabled>
            {t("previous")}
          </Button>
          <span className="text-sm text-neutral-500">{t("page", { current: 1, total: 1 })}</span>
          <Button variant="ghost" size="sm" disabled>
            {t("next")}
          </Button>
        </CardFooter>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("edit_user_title") : t("add_user_title")}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? t("edit_user_description") 
                : t("add_user_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("username")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>{isEditing ? t("new_password") : t("password")}</FormLabel>
                      {isEditing && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="h-6 text-xs text-primary" 
                          onClick={() => {
                            const inputElem = document.querySelector('input[name="password"]') as HTMLInputElement;
                            if (inputElem) {
                              inputElem.type = inputElem.type === 'password' ? 'text' : 'password';
                            }
                          }}
                        >
                          {t("toggle_visibility") || "הצג/הסתר"}
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder={isEditing ? t("leave_empty_to_keep") : "••••••••"} 
                        />
                      </div>
                    </FormControl>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("password_help_text") || "מנהלי מסעדות חייבים לדווח על פרטי ההתחברות שלהם. עריכת הסיסמה כאן תשנה את סיסמתם."}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_role")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurant_admin">{t("restaurant_admin")}</SelectItem>
                        <SelectItem value="super_admin">{t("super_admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {isEditing ? t("save_changes") : t("add_user")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              {t("confirm_delete")}
            </DialogTitle>
            <DialogDescription>
              {t("delete_user_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
