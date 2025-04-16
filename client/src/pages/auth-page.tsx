import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "יש להזין כתובת אימייל תקינה" }),
  password: z.string().min(1, { message: "יש להזין סיסמה" }),
});

// Registration form schema - not used here since registration is handled by super admin
const registerSchema = z.object({
  email: z.string().email({ message: "יש להזין כתובת אימייל תקינה" }),
  password: z.string().min(6, { message: "הסיסמה חייבת להכיל לפחות 6 תווים" }),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [_, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        navigate('/');
      } else {
        navigate('/restaurant-admin/dashboard');
      }
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitLogin = (values: z.infer<typeof loginSchema>) => {
    console.log("Attempting login with:", values);
    loginMutation.mutate(values);
  };

  // Register form (not functional in this context since registration is handled by super admin)
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitRegister = (values: z.infer<typeof registerSchema>) => {
    // This would typically call a registration mutation
    // But since registration is handled by super admin, this is disabled
    alert('הרשמה אינה זמינה ישירות. מנהלי מסעדות נוצרים על ידי מנהל מערכת ראשי.');
  };

  // Add helper functions for dev login
  const loginAsSuperAdmin = () => {
    loginForm.setValue("email", "superadmin@example.com");
    loginForm.setValue("password", "SuperSecure123");
    loginForm.handleSubmit(onSubmitLogin)();
  };

  const loginAsRestaurantAdmin = () => {
    loginForm.setValue("email", "admin+falafel-express@example.com");
    loginForm.setValue("password", "Admin1234");
    loginForm.handleSubmit(onSubmitLogin)();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">RestaurantOS</h1>
            <p className="text-slate-500 dark:text-slate-400">התחבר למערכת ניהול המסעדות</p>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                        <FormControl>
                          <Input type="password" {...field} dir="ltr" className="text-left" />
                        </FormControl>
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

                  {/* Quick login buttons without heading */}
                  <div className="pt-4 border-t mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loginAsSuperAdmin}
                        className="text-xs"
                      >
                        מנהל מערכת
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loginAsRestaurantAdmin}
                        className="text-xs"
                      >
                        מנהל מסעדה
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-right">סיסמה</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} dir="ltr" className="text-left" />
                        </FormControl>
                        <FormMessage className="text-right" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-2"
                    disabled
                  >
                    הרשמה
                  </Button>
                  
                  <p className="text-center text-xs text-red-500 mt-2">
                    הרשמה אינה זמינה ישירות. מנהלי מסעדות נוצרים על ידי מנהל מערכת ראשי.
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right: Background Image & Info */}
        <div 
          className="w-full md:w-1/2 bg-primary-600 text-white p-8 flex flex-col justify-center"
          style={{ 
            background: 'linear-gradient(to right, #0f766e, #14b8a6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' 
          }}
        >
          <div>
            <h2 className="text-2xl font-bold mb-4">ברוכים הבאים למערכת RestaurantOS</h2>
            <p className="mb-6">
              מערכת ניהול מסעדות מתקדמת המאפשרת לך ליצור ולנהל תפריטים דיגיטליים בקלות.
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center ml-4">
                  <i className="fas fa-utensils text-white"></i>
                </div>
                <div>
                  <h3 className="font-medium">ניהול תפריטים דיגיטליים</h3>
                  <p className="text-sm text-white/70">צור וערוך תפריטים דיגיטליים בקלות</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center ml-4">
                  <i className="fas fa-qrcode text-white"></i>
                </div>
                <div>
                  <h3 className="font-medium">קוד QR לשיתוף</h3>
                  <p className="text-sm text-white/70">שתף את התפריט שלך בקלות עם לקוחות</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center ml-4">
                  <i className="fas fa-mobile-alt text-white"></i>
                </div>
                <div>
                  <h3 className="font-medium">מותאם למובייל</h3>
                  <p className="text-sm text-white/70">התפריט שלך נראה מעולה בכל גודל מסך</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
