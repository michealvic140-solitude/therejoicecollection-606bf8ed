import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { Eye, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

export function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [declineMsg, setDeclineMsg] = useState("");
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const approvePayment = async (order: Order) => {
    await supabase.from("orders").update({ status: "Payment Confirmed" }).eq("id", order.id);
    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      title: "Payment Approved",
      message: `Your payment for order ${order.id} has been approved! Your order is now being processed.`,
      type: "success",
      link: "/orders",
    } as any);
    toast.success("Payment approved");
    fetchOrders();
  };

  const declinePayment = async (orderId: string, userId: string) => {
    await supabase.from("orders").update({ status: "Pending Payment", cancellation_reason: declineMsg }).eq("id", orderId);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Payment Declined",
      message: `Your payment for order ${orderId} was declined. Reason: ${declineMsg || "No reason provided"}`,
      type: "error",
      link: "/orders",
    } as any);
    toast.success("Payment declined");
    setDecliningId(null);
    setDeclineMsg("");
    fetchOrders();
  };

  const paymentOrders = orders.filter(o => o.screenshot_url);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <CreditCard className="h-5 w-5" /> Payment Verification ({paymentOrders.length})
      </h2>

      {paymentOrders.length === 0 && (
        <p className="text-muted-foreground text-sm">No payment screenshots submitted yet.</p>
      )}

      {paymentOrders.map(order => (
        <Card key={order.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono font-bold">{order.id}</span>
                <span className="text-sm text-muted-foreground ml-2">by {order.user_name}</span>
              </div>
              <Badge className={order.status === "Payment Confirmed" ? "bg-green-100 text-green-800" : order.status === "Pending Payment" ? "bg-yellow-100 text-yellow-800" : ""}>
                {order.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              <div className="flex gap-2">
                {order.screenshot_url && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setViewImage(order.screenshot_url)}>
                    <Eye className="h-4 w-4" /> View Proof
                  </Button>
                )}
                {order.status === "Pending Payment" && (
                  <>
                    <Button size="sm" className="gap-1" onClick={() => approvePayment(order)}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => setDecliningId(order.id)}>
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </>
                )}
              </div>
            </div>
            {order.cancellation_reason && (
              <p className="text-sm text-destructive">Decline reason: {order.cancellation_reason}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* View Image Dialog */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {viewImage && <img src={viewImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={!!decliningId} onOpenChange={() => setDecliningId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Decline Payment</DialogTitle></DialogHeader>
          <Textarea value={declineMsg} onChange={e => setDeclineMsg(e.target.value)} placeholder="Reason for declining..." />
          <Button variant="destructive" onClick={() => {
            const order = orders.find(o => o.id === decliningId);
            if (order && decliningId) declinePayment(decliningId, order.user_id);
          }}>Confirm Decline</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
