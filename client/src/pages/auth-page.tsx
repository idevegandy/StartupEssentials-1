import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "כתובת אימייל לא תקינה" }),
  password: z.string().min(6, { message: "סיסמה חייבת להכיל לפחות 6 תווים" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, isLoading, loginMutation } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // If the user is already logged in, redirect to the appropriate dashboard
  if (!isLoading && user) {
    if (user.role === "super_admin") {
      navigate("/super-admin/dashboard");
    } else if (user.role === "restaurant_admin") {
      navigate("/restaurant-admin/dashboard");
    }
    return null;
  }

  // Setup login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle login form submission
  const onSubmitLogin = async (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (user) => {
        if (user.role === "super_admin") {
          navigate("/super-admin/dashboard");
        } else if (user.role === "restaurant_admin") {
          navigate("/restaurant-admin/dashboard");
        }
      },
      onError: (error) => {
        toast({
          title: "שגיאת התחברות",
          description: "אימייל או סיסמה לא נכונים",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-2 gap-8 shadow-lg rounded-xl overflow-hidden">
        {/* Login Form */}
        <Card className="border-0 shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">התחברות למערכת</CardTitle>
            <CardDescription>
              הזן את פרטי ההתחברות שלך כדי להמשיך
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-right">דוא"ל</FormLabel>
                      <FormControl>
                        <Input placeholder="mail@example.com" {...field} dir="ltr" className="text-left" />
                      </FormControl>
                      <FormMessage className="text-right" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-right">סיסמה</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                            dir="ltr" 
                            className="text-left" 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormMessage className="text-right" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      מתחבר...
                    </>
                  ) : (
                    "התחברות"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-sm text-center text-muted-foreground">
              <span>* אין אפשרות להירשם למערכת באופן עצמאי</span>
            </div>
          </CardFooter>
        </Card>

        {/* Hero Section */}
        <div className="relative hidden md:block bg-gradient-to-br from-primary to-primary-dark">
          <div className="absolute inset-0 bg-opacity-50 bg-black"></div>
          <div className="relative flex flex-col h-full p-8 text-white justify-center space-y-6">
            <h1 className="text-3xl font-bold">ברוכים הבאים למערכת ניהול התפריטים</h1>
            <p className="text-lg opacity-80">
              מערכת ניהול תפריטים דיגיטליים מתקדמת עם תמיכה מלאה בעברית ובשפות RTL נוספות.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <p className="text-sm">ניהול קטגוריות ופריטים בצורה פשוטה ויעילה</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <p className="text-sm">יצירת תפריטים דיגיטליים אינטראקטיביים</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <p className="text-sm">יצירת קודי QR לשיתוף התפריט עם לקוחות</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <p className="text-sm">תמיכה מלאה בעברית ושפות מימין לשמאל</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}