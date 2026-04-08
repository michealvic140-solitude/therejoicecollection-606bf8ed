import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

type Negotiation = Tables<"negotiations">;

export function AdminNegotiations() {
  const [items, setItems] = useState<Negotiation[]>([]);

  const fetchAll = async () => {
    const { data } = await supabase.from("negotiations").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateNeg = async (neg: Negotiation, status: string, counterOffer?: string) => {
    const update: any = { status };
    if (counterOffer) update.counter_offer = parseFloat(counterOffer);
    await supabase.from("negotiations").update(update).eq("id", neg.id);

    const messages: Record<string, string> = {
      Accepted: `Your negotiation for ${neg.product_name} at ${formatPrice(neg.offered_price)} has been accepted! Check your coupons.`,
      Rejected: `Your negotiation for ${neg.product_name} was rejected.`,
      "Counter Offered": `You received a counter offer for ${neg.product_name}: ${counterOffer ? formatPrice(parseFloat(counterOffer)) : ""}`,
    };

    await supabase.from("notifications").insert({
      user_id: neg.user_id,
      title: `Negotiation ${status}`,
      message: messages[status] || `Negotiation status updated to ${status}`,
      type: status === "Accepted" ? "success" : status === "Rejected" ? "error" : "info",
      link: "/profile",
    } as any);

    // Auto-generate single-use coupon when accepted
    if (status === "Accepted") {
      const discountAmount = neg.original_price - neg.offered_price;
      const code = `NEG-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("coupons").insert({
        code,
        discount_amount: discountAmount,
        discount_percent: 0,
        user_id: neg.user_id,
        for_all_users: false,
        source: "negotiation",
        active: true,
        max_uses: 1,
        min_quantity: 1,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      } as any);

      await supabase.from("notifications").insert({
        user_id: neg.user_id,
        title: "Discount Coupon Generated!",
        message: `Use code ${code} for ₦${discountAmount.toLocaleString()} off. Valid for 30 minutes only!`,
        type: "success",
        link: "/profile",
      } as any);
    }

    // Counter offer also generates a coupon
    if (status === "Counter Offered" && counterOffer) {
      const discountAmount = neg.original_price - parseFloat(counterOffer);
      if (discountAmount > 0) {
        const code = `CTR-${Date.now().toString(36).toUpperCase()}`;
        await supabase.from("coupons").insert({
          code,
          discount_amount: discountAmount,
          discount_percent: 0,
          user_id: neg.user_id,
          for_all_users: false,
          source: "negotiation",
          active: true,
          max_uses: 1,
          min_quantity: 1,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        } as any);

        await supabase.from("notifications").insert({
          user_id: neg.user_id,
          title: "Counter Offer Coupon",
          message: `Use code ${code} for ₦${discountAmount.toLocaleString()} off. Valid for 30 minutes!`,
          type: "info",
          link: "/profile",
        } as any);
      }
    }

    toast.success("Updated");
    fetchAll();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Negotiations ({items.length})</h2>
      {items.map(n => (
        <Card key={n.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{n.product_name}</p>
                <p className="text-sm text-muted-foreground">by {n.user_name}</p>
              </div>
              <Badge>{n.status}</Badge>
            </div>
            <div className="text-sm">
              <p>Original: {formatPrice(n.original_price)} → Offered: {formatPrice(n.offered_price)}</p>
              {n.message && <p className="text-muted-foreground italic">"{n.message}"</p>}
              {n.counter_offer && <p className="text-primary font-medium">Counter: {formatPrice(n.counter_offer)}</p>}
            </div>
            {n.status === "Pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateNeg(n, "Accepted")}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => updateNeg(n, "Rejected")}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const offer = prompt("Enter counter offer:");
                  if (offer) updateNeg(n, "Counter Offered", offer);
                }}>Counter</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
