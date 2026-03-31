import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

type Negotiation = Tables<"negotiations">;

export function AdminNegotiations() {
  const [items, setItems] = useState<Negotiation[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from("negotiations").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetch(); }, []);

  const updateNeg = async (id: string, status: string, counterOffer?: string) => {
    const update: any = { status };
    if (counterOffer) update.counter_offer = parseFloat(counterOffer);
    await supabase.from("negotiations").update(update).eq("id", id);
    toast.success("Updated");
    fetch();
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
                <Button size="sm" onClick={() => updateNeg(n.id, "Accepted")}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => updateNeg(n.id, "Rejected")}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const offer = prompt("Enter counter offer:");
                  if (offer) updateNeg(n.id, "Counter Offered", offer);
                }}>Counter</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
