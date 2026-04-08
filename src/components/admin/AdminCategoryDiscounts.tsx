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
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

const categories = [
  "watches", "bags", "jewelry", "accessories", "footwear", "clothes",
  "nightwear", "undies", "trousers", "shirts", "polo", "slippers",
  "shoes", "glasses", "others",
];

interface CategoryDiscount {
  id: string;
  category: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
}

export function AdminCategoryDiscounts() {
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "watches", discount_percent: "10", starts_at: new Date().toISOString().slice(0, 16), ends_at: "", active: true });

  const fetch = async () => {
    const { data } = await supabase.from("category_discounts").select("*").order("created_at", { ascending: false });
    if (data) setDiscounts(data as CategoryDiscount[]);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ends_at) { toast.error("End date required"); return; }
    const { error } = await supabase.from("category_discounts").insert({
      category: form.category,
      discount_percent: parseFloat(form.discount_percent),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      active: form.active,
    } as any);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Category discount created");
    setOpen(false);
    setForm({ category: "watches", discount_percent: "10", starts_at: new Date().toISOString().slice(0, 16), ends_at: "", active: true });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("category_discounts").update({ active: !active } as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("category_discounts").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Tag className="h-5 w-5" /> Category Discounts ({discounts.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Discount</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display">New Category Discount</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} min="1" max="100" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} required /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} /></div>
              <Button type="submit" className="w-full">Create Discount</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {discounts.map(d => {
        const isExpired = new Date(d.ends_at) < new Date();
        return (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{d.category}</span>
                  <Badge className="gradient-gold text-primary-foreground">{d.discount_percent}% OFF</Badge>
                  <Badge variant={d.active && !isExpired ? "default" : "destructive"}>{isExpired ? "Expired" : d.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(d.starts_at).toLocaleDateString()} → {new Date(d.ends_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggle(d.id, d.active)}>{d.active ? "Deactivate" : "Activate"}</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(d.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
