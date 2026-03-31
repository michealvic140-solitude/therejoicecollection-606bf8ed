import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

type Order = Tables<"orders">;

const statuses = ["Pending Payment", "Payment Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    toast.success(`Order updated to ${status}`);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Orders ({orders.length})</h2>
      {orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        return (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono font-bold">{order.id}</span>
                  <span className="text-sm text-muted-foreground ml-2">{order.user_name}</span>
                </div>
                <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm space-y-1">
                {(items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-primary">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
