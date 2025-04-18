import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import MainLayout from "@/components/layout/main-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Lock, Mail, CheckCircle } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, values);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], {
        ...user,
        ...updatedUser,
      });
      toast({
        title: "פרופיל עודכן",
        description: "פרטי הפרופיל שלך עודכנו בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון הפרופיל",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "סיסמה עודכנה",
        description: "הסיסמה שלך עודכנה בהצלחה",
      });
      passwordForm.reset();
      setIsPasswordChanged(true);
      setTimeout(() => setIsPasswordChanged(false), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון הסיסמה",
        variant: "destructive",
      });
    },
  });

  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  function onPasswordSubmit(data: PasswordFormValues) {
    updatePasswordMutation.mutate(data);
  }

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">פרופיל</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="ml-2 h-5 w-5" />
                <span>פרטי פרופיל</span>
              </CardTitle>
              <CardDescription>
                עדכן את הפרטים האישיים שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="הזן את שמך" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>דוא&quot;ל</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Mail className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                            <Input {...field} type="email" placeholder="הזן את הדוא&quot;ל שלך" className="pr-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    עדכן פרופיל
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="ml-2 h-5 w-5" />
                <span>שינוי סיסמה</span>
              </CardTitle>
              <CardDescription>
                עדכן את הסיסמה שלך כדי לשמור על אבטחת החשבון
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPasswordChanged ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-green-600 font-medium text-center">הסיסמה עודכנה בהצלחה!</p>
                </div>
              ) : (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סיסמה נוכחית</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Lock className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                              <Input {...field} type="password" placeholder="הזן את הסיסמה הנוכחית" className="pr-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סיסמה חדשה</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Lock className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                              <Input {...field} type="password" placeholder="הזן סיסמה חדשה" className="pr-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימות סיסמה</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Lock className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                              <Input {...field} type="password" placeholder="הזן שוב את הסיסמה החדשה" className="pr-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <p className="text-xs text-gray-500">
                      הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה אחת, מספר אחד ותו מיוחד אחד.
                    </p>
                    
                    <Button 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending}
                      className="w-full"
                    >
                      {updatePasswordMutation.isPending && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                      עדכן סיסמה
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
