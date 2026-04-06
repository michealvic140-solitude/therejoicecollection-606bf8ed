import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  min_quantity: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
}

export function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discount_percent: "10", min_quantity: "1", max_uses: "", active: true });

  const fetch = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (data) setCodes(data as PromoCode[]);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.toUpperCase().trim(),
      discount_percent: parseFloat(form.discount_percent),
      min_quantity: parseInt(form.min_quantity),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      active: form.active,
    } as any);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Promo code created");
    setOpen(false);
    setForm({ code: "", discount_percent: "10", min_quantity: "1", max_uses: "", active: true });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_codes").update({ active: !active } as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Ticket className="h-5 w-5" /> Promo Codes ({codes.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Create Promo</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display">New Promo Code</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. SAVE20" required /></div>
              <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} min="1" max="100" required /></div>
              <div className="space-y-2"><Label>Min Items in Cart</Label><Input type="number" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: e.target.value})} min="1" required /></div>
              <div className="space-y-2"><Label>Max Uses (leave blank for unlimited)</Label><Input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} /></div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} /></div>
              <Button type="submit" className="w-full">Create Promo Code</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {codes.map(c => (
        <Card key={c.id}>
          <CardContent className="flex items-center justify-between p-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-lg">{c.code}</span>
                <Badge className="gradient-gold text-primary-foreground">{c.discount_percent}% OFF</Badge>
                <Badge variant={c.active ? "default" : "destructive"}>{c.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Min {c.min_quantity} items • Used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""} times
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggle(c.id, c.active)}>{c.active ? "Deactivate" : "Activate"}</Button>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
