import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

const refundStatuses = [
  "Requested", "Verifying Payment", "Payment Received",
  "Approved", "Refund in Progress", "Refunded", "Declined",
];

export function AdminRefunds() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminNote, setAdminNote] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("Approved");
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*")
      .not("refund_status", "is", null)
      .neq("refund_status", "")
      .order("refund_request_date", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const respond = async (orderId: string, userId: string) => {
    await supabase.from("orders").update({
      refund_status: selectedStatus,
      refund_admin_note: adminNote,
      refund_responded_at: new Date().toISOString(),
    }).eq("id", orderId);

    // Add tracking entry for refund progress
    await supabase.from("order_tracking").insert({
      order_id: orderId,
      status: `Refund: ${selectedStatus}`,
      description: adminNote || `Refund status updated to ${selectedStatus}`,
    } as any);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: `Refund ${selectedStatus}`,
      message: `Your refund request for order ${orderId} has been updated to: ${selectedStatus}. ${adminNote ? `Note: ${adminNote}` : ""}`,
      type: selectedStatus === "Declined" ? "error" : "success",
      link: "/orders",
    } as any);

    toast.success(`Refund updated to ${selectedStatus}`);
    setRespondingId(null);
    setAdminNote("");
    setSelectedStatus("Approved");
    fetchOrders();
  };

  const statusColor = (s: string) => {
    if (["Approved", "Refunded"].includes(s)) return "bg-emerald-500/20 text-emerald-400";
    if (s === "Declined") return "bg-red-500/20 text-red-400";
    return "bg-amber-500/20 text-amber-400";
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-gold" /> Refund Requests ({orders.length})
      </h2>

      {orders.length === 0 && <p className="text-sm text-muted-foreground">No refund requests.</p>}

      {orders.map(order => (
        <Card key={order.id} className="glass-card border-0">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono font-bold text-gold">{order.id}</span>
                <span className="text-sm text-muted-foreground ml-2">{order.user_name}</span>
              </div>
              <Badge className={statusColor(order.refund_status || "")}>
                {order.refund_status}
              </Badge>
            </div>
            <p className="text-sm"><strong>Reason:</strong> {order.refund_reason}</p>
            <p className="text-sm font-bold text-gold">Total: {formatPrice(order.total)}</p>
            {order.refund_photo && (
              <Button variant="outline" size="sm" className="gap-1 glass" onClick={() => setViewPhoto(order.refund_photo)}>
                <Eye className="h-4 w-4" /> View Photo
              </Button>
            )}
            {order.refund_admin_note && <p className="text-sm text-muted-foreground italic">Admin note: {order.refund_admin_note}</p>}
            {!["Refunded", "Declined"].includes(order.refund_status || "") && (
              <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => { setRespondingId(order.id); setSelectedStatus(order.refund_status || "Approved"); }}>
                Update Status
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!respondingId} onOpenChange={() => setRespondingId(null)}>
        <DialogContent className="glass-strong">
          <DialogHeader><DialogTitle className="font-display">Update Refund Status</DialogTitle></DialogHeader>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
            <SelectContent>
              {refundStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note..." className="glass" />
          <Button className="gradient-gold text-primary-foreground" onClick={() => {
            const order = orders.find(o => o.id === respondingId);
            if (order && respondingId) respond(respondingId, order.user_id);
          }}>Update</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-lg glass-strong">
          <DialogHeader><DialogTitle>Refund Photo</DialogTitle></DialogHeader>
          {viewPhoto && <img src={viewPhoto} alt="Refund" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
