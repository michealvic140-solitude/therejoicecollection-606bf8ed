import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Package, Users, DollarSign, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0,
    inStockProducts: 0, outOfStockProducts: 0, pendingOrders: 0, deliveredOrders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("id"),
        supabase.from("products").select("id, out_of_stock"),
      ]);

      const orders = ordersRes.data || [];
      const approvedOrders = orders.filter(o => ["Payment Confirmed", "Processing", "Shipped", "Delivered"].includes(o.status));
      const totalRevenue = approvedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const products = productsRes.data || [];

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: usersRes.data?.length || 0,
        totalProducts: products.length,
        inStockProducts: products.filter(p => !p.out_of_stock).length,
        outOfStockProducts: products.filter(p => p.out_of_stock).length,
        pendingOrders: orders.filter(o => o.status === "Pending Payment").length,
        deliveredOrders: orders.filter(o => o.status === "Delivered").length,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, desc: "Approved payments only", color: "text-green-600" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, desc: `${stats.pendingOrders} pending · ${stats.deliveredOrders} delivered`, color: "text-blue-600" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, desc: "Registered customers", color: "text-purple-600" },
    { title: "Products", value: stats.totalProducts, icon: Package, desc: `${stats.inStockProducts} in stock · ${stats.outOfStockProducts} out`, color: "text-gold" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" /> Dashboard Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
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
    </div>
  );
}
