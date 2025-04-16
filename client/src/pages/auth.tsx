import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginCredentials } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, Lock, User, Mail } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - Auth forms */}
        <div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">כניסה</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>התחברות למערכת</CardTitle>
                  <CardDescription>
                    הזן את פרטי ההתחברות שלך להמשך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם משתמש</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <User className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="שם משתמש" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Lock className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} type="password" placeholder="סיסמה" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                        כניסה
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    אין לך חשבון?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => document.querySelector('[data-value="register"]')?.click()}
                    >
                      הירשם עכשיו
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>הרשמה למערכת</CardTitle>
                  <CardDescription>
                    צור חשבון חדש במערכת
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם מלא</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <User className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="שם מלא" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>דוא"ל</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Mail className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} type="email" placeholder="your@email.com" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם משתמש</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <User className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} placeholder="שם משתמש" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Lock className="w-4 h-4 text-gray-500 absolute mt-2.5 mr-3" />
                                <Input {...field} type="password" placeholder="סיסמה" className="pr-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה אחת, מספר אחד ותו מיוחד אחד.
                      </p>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                        הרשמה
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    כבר יש לך חשבון?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => document.querySelector('[data-value="login"]')?.click()}
                    >
                      התחבר כאן
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side - Branding/Information */}
        <div className="hidden md:block">
          <div className="h-full rounded-lg bg-gradient-to-b from-primary-600 to-primary-800 p-8 text-white flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-3">מערכת ניהול מסעדות</h1>
              <p className="opacity-90">
                ברוכים הבאים למערכת המתקדמת לניהול תפריטים דיגיטליים למסעדות.
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="mt-1 bg-white/20 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">תפריט דיגיטלי</h3>
                  <p className="opacity-75 text-sm">צור ונהל תפריט דיגיטלי מדהים, נגיש בקלות באמצעות קוד QR.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="mt-1 bg-white/20 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">קטגוריות ופריטים</h3>
                  <p className="opacity-75 text-sm">נהל קטגוריות ופריטי תפריט בקלות בעזרת ממשק נוח.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="mt-1 bg-white/20 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">התאמה אישית</h3>
                  <p className="opacity-75 text-sm">התאם אישית את המראה של התפריט שלך עם צבעים, לוגו וקישורים לרשתות חברתיות.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
