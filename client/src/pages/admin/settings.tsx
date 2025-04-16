import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const settingsFormSchema = z.object({
  notificationsEnabled: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  language: z.string().default("he"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const defaultValues: SettingsFormValues = {
  notificationsEnabled: true,
  emailNotifications: true,
  language: "he",
};

export default function Settings() {
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return values;
    },
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו",
        description: "ההגדרות שלך נשמרו בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת ההגדרות",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: SettingsFormValues) {
    saveSettingsMutation.mutate(data);
  }

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">הגדרות</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות כלליות</CardTitle>
                <CardDescription>
                  הגדר את העדפות המערכת שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="notificationsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>התראות</FormLabel>
                            <FormDescription>
                              אפשר התראות מערכת
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>התראות דוא"ל</FormLabel>
                            <FormDescription>
                              קבל התראות באמצעות דוא"ל
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch("notificationsEnabled")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שפה</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="he">עברית</option>
                              <option value="en">English</option>
                              <option value="ar">العربية</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            שפת הממשק של המערכת
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                      שמור הגדרות
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>עזרה ותמיכה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  אם נתקלת בבעיות או שיש לך שאלות לגבי המערכת, צור קשר עם צוות התמיכה שלנו.
                </p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="mr-2 text-sm">support@restaurants-management.com</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="mr-2 text-sm">+972-123-4567</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-medium mb-2">מסמכים ומדריכים</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-primary-600 hover:underline">מדריך למשתמש</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary-600 hover:underline">שאלות נפוצות</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary-600 hover:underline">מדריך התקנה</a>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
