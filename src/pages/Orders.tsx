import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Package } from "lucide-react";

type Order = Tables<"orders">;

const statusColors: Record<string, string> = {
  "Pending Payment": "bg-yellow-100 text-yellow-800",
  "Payment Confirmed": "bg-blue-100 text-blue-800",
  "Processing": "bg-purple-100 text-purple-800",
  "Shipped": "bg-indigo-100 text-indigo-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, [user]);

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "Cancelled" }).eq("id", orderId);
    if (error) { toast.error("Failed to cancel"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
    toast.success("Order cancelled");
  };

  if (orders.length === 0) {
    return (
      <div className="container px-4 py-20 text-center animate-fade-in">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground">Your orders will appear here</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => {
          const items = Array.isArray(order.items) ? order.items : [];
          return (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-mono">{order.id}</CardTitle>
                <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </div>
                <div className="space-y-1">
                  {(items as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
                {order.status === "Pending Payment" && (
                  <Button variant="destructive" size="sm" onClick={() => cancelOrder(order.id)}>
                    Cancel Order
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
