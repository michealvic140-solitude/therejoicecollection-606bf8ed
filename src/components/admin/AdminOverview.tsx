import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Package, Users, DollarSign, ShoppingBag, TrendingUp, RotateCcw, Ticket, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundRequests: number;
  activeCoupons: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const CHART_COLORS = ["hsl(40,70%,50%)", "hsl(220,70%,55%)", "hsl(150,60%,45%)", "hsl(0,70%,55%)", "hsl(280,60%,55%)", "hsl(30,80%,55%)"];

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0,
    inStockProducts: 0, outOfStockProducts: 0, pendingOrders: 0, deliveredOrders: 0,
    cancelledOrders: 0, refundRequests: 0, activeCoupons: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, usersRes, productsRes, couponsRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("id"),
        supabase.from("products").select("id, out_of_stock"),
        supabase.from("coupons").select("id").eq("active", true),
      ]);

      const orders = ordersRes.data || [];
      const approvedOrders = orders.filter(o => ["Payment Confirmed", "Processing", "Shipped", "Delivered"].includes(o.status));
      const totalRevenue = approvedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const products = productsRes.data || [];

      // Daily revenue for last 14 days
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const daily = last14.map(date => {
        const dayOrders = approvedOrders.filter(o => o.created_at.slice(0, 10) === date);
        return { date: date.slice(5), revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0), orders: dayOrders.length };
      });
      setDailyRevenue(daily);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: usersRes.data?.length || 0,
        totalProducts: products.length,
        inStockProducts: products.filter(p => !p.out_of_stock).length,
        outOfStockProducts: products.filter(p => p.out_of_stock).length,
        pendingOrders: orders.filter(o => o.status === "Pending Payment").length,
        deliveredOrders: orders.filter(o => o.status === "Delivered").length,
        cancelledOrders: orders.filter(o => o.status === "Cancelled").length,
        refundRequests: orders.filter(o => o.refund_status && o.refund_status !== "").length,
        activeCoupons: couponsRes.data?.length || 0,
      });
    };
    fetchStats();

    // Real-time updates
    const channel = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    { title: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, desc: "From approved payments", color: "text-emerald-400" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, desc: `${stats.pendingOrders} pending · ${stats.deliveredOrders} delivered`, color: "text-blue-400" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, desc: "Registered customers", color: "text-purple-400" },
    { title: "Products", value: stats.totalProducts, icon: Package, desc: `${stats.inStockProducts} in stock · ${stats.outOfStockProducts} out`, color: "text-gold" },
    { title: "Refund Requests", value: stats.refundRequests, icon: RotateCcw, desc: "All refund requests", color: "text-red-400" },
    { title: "Active Coupons", value: stats.activeCoupons, icon: Ticket, desc: "Currently active", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-gold" /> Dashboard Overview
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="glass-card border-0 hover:shadow-[0_8px_32px_hsla(40,70%,50%,0.1)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{c.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold" /> Revenue (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(40,70%,50%)" strokeWidth={2} dot={{ fill: "hsl(40,70%,50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold" /> Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Orders Bar Chart */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" /> Daily Orders (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }} />
              <Bar dataKey="orders" fill="hsl(220,70%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
