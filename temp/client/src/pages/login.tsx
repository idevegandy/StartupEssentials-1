import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const success = await login(data.username, data.password);
    setIsLoading(false);
    
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
              <Utensils className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t("menu_management")}</CardTitle>
          <CardDescription>
            {t("login_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("username")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("username")} {...field} />
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
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("logging_in") : t("login")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-sm text-neutral-500 text-center px-8">
            {t("login_help_text")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
