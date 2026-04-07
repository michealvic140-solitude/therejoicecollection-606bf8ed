import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Package, Star, Upload, Clock, Truck, CheckCircle2 } from "lucide-react";

type Order = Tables<"orders">;

interface TrackingEntry {
  id: string;
  order_id: string;
  status: string;
  description: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  "Pending Payment": "bg-amber-500/20 text-amber-400",
  "Payment Confirmed": "bg-blue-500/20 text-blue-400",
  "Processing": "bg-purple-500/20 text-purple-400",
  "Shipped": "bg-indigo-500/20 text-indigo-400",
  "Delivered": "bg-emerald-500/20 text-emerald-400",
  "Cancelled": "bg-red-500/20 text-red-400",
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingDialog, setTrackingDialog] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [refundDialog, setRefundDialog] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundPhoto, setRefundPhoto] = useState<File | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ orderId: string; productId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, [user]);

  const fetchTracking = async (orderId: string) => {
    const { data } = await supabase.from("order_tracking").select("*")
      .eq("order_id", orderId).order("created_at", { ascending: true });
    if (data) setTracking(data as TrackingEntry[]);
    setTrackingDialog(orderId);
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "Cancelled" }).eq("id", orderId);
    if (error) { toast.error("Failed to cancel"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
    toast.success("Order cancelled");
  };

  const requestRefund = async () => {
    if (!refundDialog || !user || !refundReason.trim()) return;

    let photoUrl = "";
    if (refundPhoto) {
      const fileName = `refunds/${user.id}/${Date.now()}-${refundPhoto.name}`;
      await supabase.storage.from("uploads").upload(fileName, refundPhoto);
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      photoUrl = urlData.publicUrl;
    }

    await supabase.from("orders").update({
      refund_status: "Requested",
      refund_reason: refundReason,
      refund_photo: photoUrl,
      refund_request_date: new Date().toISOString(),
    }).eq("id", refundDialog);

    toast.success("Refund request submitted");
    setRefundDialog(null);
    setRefundReason("");
    setRefundPhoto(null);

    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const submitReview = async () => {
    if (!reviewDialog || !user) return;

    let imageUrl = "";
    if (reviewImage) {
      const fileName = `reviews/${user.id}/${Date.now()}-${reviewImage.name}`;
      await supabase.storage.from("uploads").upload(fileName, reviewImage);
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    await supabase.from("reviews").insert({
      user_id: user.id,
      product_id: reviewDialog.productId,
      order_id: reviewDialog.orderId,
      rating,
      comment,
      image_url: imageUrl,
      delivery_rating: deliveryRating,
      delivery_comment: deliveryComment,
    } as any);

    toast.success("Review submitted! Thank you.");
    setReviewDialog(null);
    setRating(5);
    setComment("");
    setDeliveryRating(5);
    setDeliveryComment("");
    setReviewImage(null);
  };

  const uploadPaymentProof = async (orderId: string) => {
    if (!screenshotFile || !user) return;
    setUploadingScreenshot(orderId);
    const fileName = `${user.id}/${Date.now()}-${screenshotFile.name}`;
    const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, screenshotFile);
    if (uploadError) { toast.error("Upload failed"); setUploadingScreenshot(null); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    await supabase.from("orders").update({ screenshot_url: urlData.publicUrl }).eq("id", orderId);
    toast.success("Payment proof uploaded!");
    setUploadingScreenshot(null);
    setScreenshotFile(null);
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setOrders(data);
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
      <Tabs defaultValue="orders">
        <TabsList className="glass">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 mt-4">
          {orders.map(order => {
            const items = Array.isArray(order.items) ? order.items : [];
            // Allow refund on cancelled orders too (post-cancellation refund)
            const canRefund = ["Delivered", "Shipped", "Processing", "Payment Confirmed", "Cancelled"].includes(order.status);
            return (
              <Card key={order.id} className="glass-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-mono text-gold">{order.id}</CardTitle>
                  <Badge className={statusColors[order.status] || "bg-secondary"}>{order.status}</Badge>
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
                  <div className="flex justify-between font-bold border-t border-border/30 pt-2">
                    <span>Total</span>
                    <span className="text-gold">{formatPrice(order.total)}</span>
                  </div>

                  {/* Refund status */}
                  {order.refund_status && order.refund_status !== "" && (
                    <div className="glass rounded-lg p-3 text-sm space-y-1">
                      <p><strong>Refund Status:</strong> <Badge variant="secondary">{order.refund_status}</Badge></p>
                      {order.refund_admin_note && <p className="text-muted-foreground mt-1">Admin note: {order.refund_admin_note}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1 glass" onClick={() => fetchTracking(order.id)}>
                      <Truck className="h-4 w-4" /> Track Order
                    </Button>

                    {order.status === "Pending Payment" && !order.screenshot_url && (
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" className="w-40 h-8 text-xs glass" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} />
                        <Button size="sm" disabled={!screenshotFile || uploadingScreenshot === order.id} onClick={() => uploadPaymentProof(order.id)} className="gap-1 gradient-gold text-primary-foreground">
                          <Upload className="h-4 w-4" /> {uploadingScreenshot === order.id ? "Uploading..." : "Upload Proof"}
                        </Button>
                      </div>
                    )}
                    {order.screenshot_url && (
                      <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Proof Uploaded</Badge>
                    )}

                    {order.status === "Pending Payment" && (
                      <Button variant="destructive" size="sm" onClick={() => cancelOrder(order.id)}>Cancel Order</Button>
                    )}

                    {canRefund && (!order.refund_status || order.refund_status === "") && (
                      <Button variant="outline" size="sm" className="glass" onClick={() => setRefundDialog(order.id)}>Request Refund</Button>
                    )}

                    {order.status === "Delivered" && (items as any[]).length > 0 && (
                      <Button variant="outline" size="sm" className="gap-1 glass" onClick={() => setReviewDialog({ orderId: order.id, productId: (items as any[])[0]?.productId || "" })}>
                        <Star className="h-4 w-4" /> Rate & Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {orders.filter(o => o.screenshot_url || o.status !== "Pending Payment").map(order => (
            <Card key={order.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-gold">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                <span className="font-bold text-gold">{formatPrice(order.total)}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Tracking Dialog */}
      <Dialog open={!!trackingDialog} onOpenChange={() => setTrackingDialog(null)}>
        <DialogContent className="max-w-md glass-strong">
          <DialogHeader><DialogTitle className="font-display">Order Tracking — {trackingDialog}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {tracking.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No tracking updates yet. Check back later.</p>
              </div>
            ) : (
              tracking.map((t, i) => (
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
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={() => setRefundDialog(null)}>
        <DialogContent className="glass-strong">
          <DialogHeader><DialogTitle className="font-display">Request Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Reason</Label><Textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Why do you want a refund?" required className="glass" /></div>
            <div className="space-y-2"><Label>Photo (optional)</Label><Input type="file" accept="image/*" onChange={e => setRefundPhoto(e.target.files?.[0] || null)} className="glass" /></div>
            <Button onClick={requestRefund} className="w-full gradient-gold text-primary-foreground" disabled={!refundReason.trim()}>Submit Refund Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="glass-strong">
          <DialogHeader><DialogTitle className="font-display">Rate & Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={`h-7 w-7 ${s <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Product Comment</Label><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How was the product?" className="glass" /></div>
            <div className="space-y-2">
              <Label>Delivery Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setDeliveryRating(s)}>
                    <Star className={`h-7 w-7 ${s <= deliveryRating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Delivery Comment</Label><Textarea value={deliveryComment} onChange={e => setDeliveryComment(e.target.value)} placeholder="How was the delivery?" className="glass" /></div>
            <div className="space-y-2"><Label>Image (optional)</Label><Input type="file" accept="image/*" onChange={e => setReviewImage(e.target.files?.[0] || null)} className="glass" /></div>
            <Button onClick={submitReview} className="w-full gradient-gold text-primary-foreground">Submit Review</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
