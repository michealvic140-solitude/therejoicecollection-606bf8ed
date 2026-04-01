import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

export function AdminRefunds() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminNote, setAdminNote] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*")
      .not("refund_status", "is", null)
      .neq("refund_status", "")
      .order("refund_request_date", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const respond = async (orderId: string, userId: string, approve: boolean) => {
    const status = approve ? "Approved" : "Declined";
    await supabase.from("orders").update({
      refund_status: status,
      refund_admin_note: adminNote,
      refund_responded_at: new Date().toISOString(),
    }).eq("id", orderId);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: `Refund ${status}`,
      message: `Your refund request for order ${orderId} has been ${status.toLowerCase()}. ${adminNote ? `Note: ${adminNote}` : ""}`,
      type: approve ? "success" : "error",
      link: "/orders",
    } as any);

    toast.success(`Refund ${status.toLowerCase()}`);
    setRespondingId(null);
    setAdminNote("");
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <RotateCcw className="h-5 w-5" /> Refund Requests ({orders.length})
      </h2>

      {orders.length === 0 && <p className="text-sm text-muted-foreground">No refund requests.</p>}

      {orders.map(order => (
        <Card key={order.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono font-bold">{order.id}</span>
                <span className="text-sm text-muted-foreground ml-2">{order.user_name}</span>
              </div>
              <Badge variant={order.refund_status === "Approved" ? "default" : order.refund_status === "Declined" ? "destructive" : "secondary"}>
                {order.refund_status}
              </Badge>
            </div>
            <p className="text-sm"><strong>Reason:</strong> {order.refund_reason}</p>
            <p className="text-sm font-bold text-primary">Total: {formatPrice(order.total)}</p>
            {order.refund_photo && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setViewPhoto(order.refund_photo)}>
                <Eye className="h-4 w-4" /> View Photo
              </Button>
            )}
            {order.refund_admin_note && <p className="text-sm text-muted-foreground italic">Admin note: {order.refund_admin_note}</p>}
            {order.refund_status === "Requested" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => setRespondingId(order.id)}>Respond</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!respondingId} onOpenChange={() => setRespondingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Respond to Refund</DialogTitle></DialogHeader>
          <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note..." />
          <div className="flex gap-2">
            <Button onClick={() => {
              const order = orders.find(o => o.id === respondingId);
              if (order && respondingId) respond(respondingId, order.user_id, true);
            }}>Approve</Button>
            <Button variant="destructive" onClick={() => {
              const order = orders.find(o => o.id === respondingId);
              if (order && respondingId) respond(respondingId, order.user_id, false);
            }}>Decline</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Refund Photo</DialogTitle></DialogHeader>
          {viewPhoto && <img src={viewPhoto} alt="Refund" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
