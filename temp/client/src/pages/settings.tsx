import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell, User, Shield, Globe, Moon, Sun, Palette } from "lucide-react";

export default function Settings() {
  const { t, language, setLanguage } = useLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const handleSaveGeneralSettings = () => {
    toast({
      title: t("settings_updated"),
      description: t("general_settings_saved"),
    });
  };
  
  const handleSaveAccountSettings = () => {
    toast({
      title: t("settings_updated"),
      description: t("account_settings_saved"),
    });
  };
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: t("settings_updated"),
      description: t("notification_settings_saved"),
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 font-heading">{t("settings")}</h1>
      
      <Tabs defaultValue="general" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            {t("general")}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {t("account")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            {t("notifications")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("general_settings")}</CardTitle>
              <CardDescription>{t("manage_general_preferences")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">{t("language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder={t("select_language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">{t("theme")}</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder={t("select_theme")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="flex items-center">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        {t("light")}
                      </div>
                    </SelectItem>
                    <SelectItem value="dark" className="flex items-center">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        {t("dark")}
                      </div>
                    </SelectItem>
                    <SelectItem value="system" className="flex items-center">
                      <div className="flex items-center">
                        <Palette className="mr-2 h-4 w-4" />
                        {t("system")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveGeneralSettings}>{t("save_changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("account_settings")}</CardTitle>
              <CardDescription>{t("manage_account_information")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current-password">{t("current_password")}</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("new_password")}</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <Button onClick={handleSaveAccountSettings}>{t("save_changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notification_settings")}</CardTitle>
              <CardDescription>{t("manage_notification_preferences")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">{t("enable_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("notification_description")}</p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">{t("email_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("email_notification_description")}</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">{t("marketing_emails")}</Label>
                  <p className="text-sm text-muted-foreground">{t("marketing_email_description")}</p>
                </div>
                <Switch id="marketing" />
              </div>
              
              <Button onClick={handleSaveNotificationSettings}>{t("save_changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            {t("security_settings")}
          </CardTitle>
          <CardDescription>{t("security_settings_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("two_factor_authentication")}</Label>
              <p className="text-sm text-muted-foreground">{t("two_factor_description")}</p>
            </div>
            <Button variant="outline">{t("setup_2fa")}</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("session_management")}</Label>
              <p className="text-sm text-muted-foreground">{t("session_management_description")}</p>
            </div>
            <Button variant="outline">{t("manage_sessions")}</Button>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Button variant="destructive">{t("deactivate_account")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}