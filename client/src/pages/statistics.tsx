import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";

export default function Statistics() {
  const { t } = useLocale();
  const { user } = useAuth();

  // Sample data - in a real app, this would come from the API
  const visitData = [
    { name: "Jan", visits: 400 },
    { name: "Feb", visits: 300 },
    { name: "Mar", visits: 600 },
    { name: "Apr", visits: 800 },
    { name: "May", visits: 700 },
    { name: "Jun", visits: 900 },
  ];

  const pieData = [
    { name: t("menu_views"), value: 540 },
    { name: t("qr_scans"), value: 320 },
    { name: t("social_clicks"), value: 280 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 font-heading">{t("statistics")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-primary" />
              {t("monthly_visits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visits" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
              {t("engagement_distribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{t("usage_summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded border">
              <span className="font-medium">{t("total_menu_views")}</span>
              <span className="font-bold text-primary">1,245</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded border">
              <span className="font-medium">{t("total_qr_scans")}</span>
              <span className="font-bold text-primary">876</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded border">
              <span className="font-medium">{t("total_social_clicks")}</span>
              <span className="font-bold text-primary">623</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center mt-6">
        {t("statistics_note")}
      </p>
    </div>
  );
}