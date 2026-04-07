import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { MapPin, Plus, Search, Filter } from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

interface TrackingEntry {
  id: string;
  order_id: string;
  status: string;
  description: string;
  created_at: string;
}

const trackingStatuses = [
  "Order Received",
  "Orders Being Sorted",
  "Package Being Prepared",
  "Package Out for Delivery",
  "In Transit",
  "Arrived at Local Hub",
  "Out for Final Delivery",
  "Delivered Successfully",
  "Refund: Verifying Payment",
  "Refund: Payment Received",
  "Refund: Approved",
  "Refund: Refund in Progress",
  "Refund: Refunded",
];

export function AdminTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data);
      applyFilters(data, searchQuery, statusFilter);
    }
  };

  const applyFilters = (data: Order[], search: string, status: string) => {
    let filtered = data;
    if (status !== "all") {
      filtered = filtered.filter(o => o.status === status);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(q) || o.user_name.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(filtered);
  };

  useEffect(() => { applyFilters(orders, searchQuery, statusFilter); }, [searchQuery, statusFilter]);

  const fetchTracking = async (orderId: string) => {
    const { data } = await supabase.from("order_tracking").select("*")
      .eq("order_id", orderId).order("created_at", { ascending: true });
    if (data) setTracking(data as TrackingEntry[]);
  };

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { if (selectedOrder) fetchTracking(selectedOrder); }, [selectedOrder]);

  const addUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    await supabase.from("order_tracking").insert({
      order_id: selectedOrder,
      status: newStatus,
      description: newDesc,
    } as any);

    // Update order status
    if (newStatus === "Delivered Successfully") {
      await supabase.from("orders").update({ status: "Delivered" }).eq("id", selectedOrder);
    } else if (newStatus.includes("Out for") || newStatus.includes("Transit")) {
      await supabase.from("orders").update({ status: "Shipped" }).eq("id", selectedOrder);
    } else if (newStatus.startsWith("Refund:")) {
      const refundStatus = newStatus.replace("Refund: ", "");
      await supabase.from("orders").update({ refund_status: refundStatus }).eq("id", selectedOrder);
    } else {
      await supabase.from("orders").update({ status: "Processing" }).eq("id", selectedOrder);
    }

    const order = orders.find(o => o.id === selectedOrder);
    if (order) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: "Order Update",
        message: `Order ${selectedOrder}: ${newStatus}. ${newDesc}`,
        type: "info",
        link: "/orders",
      } as any);
    }

    toast.success("Tracking updated");
    setNewStatus("");
    setNewDesc("");
    fetchTracking(selectedOrder);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gold" /> Order Tracking
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by order ID or customer..." className="glass pl-9" />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 glass">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Payment">Pending Payment</SelectItem>
            <SelectItem value="Payment Confirmed">Payment Confirmed</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order selector */}
      <div className="space-y-2">
        <Label>Select Order ({filteredOrders.length} orders)</Label>
        <Select value={selectedOrder} onValueChange={setSelectedOrder}>
          <SelectTrigger className="glass"><SelectValue placeholder="Choose an order..." /></SelectTrigger>
          <SelectContent>
            {filteredOrders.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.id} — {o.user_name} — {formatPrice(o.total)} [{o.status}]
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedOrder && (
        <Card className="glass-card border-0">
          <CardHeader><CardTitle className="text-base font-display">Tracking History</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {tracking.map((t, i) => (
                <div key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${i === tracking.length - 1 ? "bg-gold" : "bg-muted-foreground/30"}`} />
                    {i < tracking.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-sm">{t.status}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {tracking.length === 0 && <p className="text-sm text-muted-foreground">No tracking updates yet.</p>}
            </div>

            <div className="border-t border-border/30 pt-4 space-y-3">
              <Label className="font-semibold">Add Tracking Update</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>
                  {trackingStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Additional details (optional)" className="glass" />
              <Button onClick={addUpdate} disabled={!newStatus} className="gap-1 gradient-gold text-primary-foreground">
                <Plus className="h-4 w-4" /> Add Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
