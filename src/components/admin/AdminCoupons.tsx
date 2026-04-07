import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Ticket, Clock, Users, User } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  discount_amount: number;
  min_quantity: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  user_id: string | null;
  for_all_users: boolean;
  source: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_percent: "10", discount_amount: "0", min_quantity: "1",
    max_uses: "", expires_at: "", for_all_users: true, user_id: "", source: "admin",
  });

  const fetchData = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (c) setCoupons(c as Coupon[]);
    if (p) setProfiles(p as Profile[]);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase().trim(),
      discount_percent: parseFloat(form.discount_percent) || 0,
      discount_amount: parseFloat(form.discount_amount) || 0,
      min_quantity: parseInt(form.min_quantity) || 1,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      for_all_users: form.for_all_users,
      user_id: form.for_all_users ? null : (form.user_id || null),
      source: form.source,
      active: true,
    } as any);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Coupon created!");
    setOpen(false);
    setForm({ code: "", discount_percent: "10", discount_amount: "0", min_quantity: "1", max_uses: "", expires_at: "", for_all_users: true, user_id: "", source: "admin" });
    fetchData();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active } as any).eq("id", id);
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-gold" /> Coupons ({coupons.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 gradient-gold text-primary-foreground"><Plus className="h-4 w-4" /> Create Coupon</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto glass-strong">
            <DialogHeader><DialogTitle className="font-display">New Coupon</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. SAVE20" required className="glass" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} min="0" max="100" className="glass" /></div>
                <div className="space-y-2"><Label>Discount ₦</Label><Input type="number" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: e.target.value })} min="0" className="glass" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Min Items</Label><Input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} min="1" className="glass" /></div>
                <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="∞" className="glass" /></div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expiration Date</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="glass" />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin Gift</SelectItem>
                    <SelectItem value="spin">Spin Reward</SelectItem>
                    <SelectItem value="event">Event Reward</SelectItem>
                    <SelectItem value="promo">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> For All Users</Label>
                <Switch checked={form.for_all_users} onCheckedChange={v => setForm({ ...form, for_all_users: v })} />
              </div>
              {!form.for_all_users && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><User className="h-3 w-3" /> Specific User</Label>
                  <Select value={form.user_id} onValueChange={v => setForm({ ...form, user_id: v })}>
                    <SelectTrigger className="glass"><SelectValue placeholder="Select user..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full gradient-gold text-primary-foreground">Create Coupon</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.map(c => (
        <Card key={c.id} className="glass-card border-0">
          <CardContent className="flex items-center justify-between p-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-lg text-gold">{c.code}</span>
                {c.discount_percent > 0 && <Badge className="gradient-gold text-primary-foreground">{c.discount_percent}% OFF</Badge>}
                {c.discount_amount > 0 && <Badge className="gradient-gold text-primary-foreground">₦{c.discount_amount} OFF</Badge>}
                <Badge variant={c.active && !isExpired(c) ? "default" : "destructive"}>
                  {isExpired(c) ? "Expired" : c.active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary" className="text-xs">{c.source}</Badge>
                {!c.for_all_users && <Badge variant="outline" className="text-xs gap-1"><User className="h-3 w-3" /> Specific User</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Min {c.min_quantity} items • Used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""} times
                {c.expires_at && ` • Expires ${new Date(c.expires_at).toLocaleDateString()}`}
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
