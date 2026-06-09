import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Image, 
  TrendingUp,
  Loader2,
  Layers
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  totalGalleryImages: number;
  totalDomains: number;
}

interface RegistrationTrend {
  date: string;
  count: number;
}

interface EventRegistrationCount {
  title: string;
  count: number;
}

export default function AnalyticsDashboard() {
  // Fetch overall stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, eventsRes, registrationsRes, galleryRes, domainsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id, is_active", { count: "exact" }),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("domains").select("id", { count: "exact", head: true }),
      ]);

      const activeEvents = eventsRes.data?.filter((e) => e.is_active).length || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        activeEvents,
        totalRegistrations: registrationsRes.count || 0,
        totalGalleryImages: galleryRes.count || 0,
        totalDomains: domainsRes.count || 0,
      } as Stats;
    },
  });

  // Fetch registration trends (last 30 days)
  const { data: registrationTrends } = useQuery({
    queryKey: ["admin-registration-trends"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("event_registrations")
        .select("registered_at")
        .gte("registered_at", thirtyDaysAgo.toISOString())
        .order("registered_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped: Record<string, number> = {};
      data?.forEach((reg) => {
        const date = new Date(reg.registered_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Fill in missing dates
      const result: RegistrationTrend[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        result.push({
          date: dateStr,
          count: grouped[dateStr] || 0,
        });
      }

      return result;
    },
  });

  // Fetch top events by registration
  const { data: topEvents } = useQuery({
    queryKey: ["admin-top-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id, event:events(title)");

      if (error) throw error;

      // Count registrations per event
      const counts: Record<string, { title: string; count: number }> = {};
      data?.forEach((reg) => {
        const eventId = reg.event_id;
        const title = reg.event?.title || "Unknown";
        if (!counts[eventId]) {
          counts[eventId] = { title, count: 0 };
        }
        counts[eventId].count++;
      });

      // Sort and take top 5
      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) as EventRegistrationCount[];
    },
  });

  if (statsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Total Events",
      value: stats?.totalEvents || 0,
      subtitle: `${stats?.activeEvents || 0} active`,
      icon: Calendar,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Registrations",
      value: stats?.totalRegistrations || 0,
      icon: UserCheck,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Gallery Images",
      value: stats?.totalGalleryImages || 0,
      icon: Image,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Domains",
      value: stats?.totalDomains || 0,
      icon: Layers,
      color: "bg-pink-500/10 text-pink-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Registration Trends
            </CardTitle>
            <CardDescription>Last 30 days of event registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {registrationTrends && registrationTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No registration data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Top Events by Registration
            </CardTitle>
            <CardDescription>Events with most registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {topEvents && topEvents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEvents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="title" 
                      width={120}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--accent))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No event data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
