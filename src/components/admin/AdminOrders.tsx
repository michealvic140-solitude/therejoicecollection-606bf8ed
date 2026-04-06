import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { Eye, MapPin, Store } from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

const statuses = ["Pending Payment", "Payment Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string, userId?: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    if (userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Order Status Updated",
        message: `Your order ${orderId} status has been updated to: ${status}`,
        type: "info",
        link: "/orders",
      } as any);
    }
    toast.success(`Order updated to ${status}`);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Orders ({orders.length})</h2>
      {orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const o = order as any;
        return (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono font-bold">{order.id}</span>
                  <span className="text-sm text-muted-foreground ml-2">{order.user_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.screenshot_url && (
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setViewImage(order.screenshot_url)}>
                      <Eye className="h-4 w-4" /> Proof
                    </Button>
                  )}
                  <Select value={order.status} onValueChange={v => updateStatus(order.id, v, order.user_id)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery / Pickup Info */}
              <div className="glass rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center gap-1 font-semibold text-gold">
                  {order.delivery_method === "pickup" ? <Store className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  {order.delivery_method === "pickup" ? "Pickup" : "Delivery"}
                </div>
                {order.delivery_method === "pickup" ? (
                  <p className="text-muted-foreground">
                    Location: {order.pickup_location || "Not specified"}
                  </p>
                ) : (
                  <div className="text-muted-foreground">
                    {o.delivery_address && <p>Address: {o.delivery_address}</p>}
                    {(o.delivery_city || o.delivery_state) && (
                      <p>{[o.delivery_city, o.delivery_state].filter(Boolean).join(", ")}</p>
                    )}
                    {!o.delivery_address && !o.delivery_city && !o.delivery_state && (
                      <p className="italic">No address provided</p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-sm space-y-1">
                {(items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-gold">
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

      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {viewImage && <img src={viewImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
