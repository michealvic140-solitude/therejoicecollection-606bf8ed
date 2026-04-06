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
import { Plus, Trash2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

interface Prize { name: string; type: string; value: string; }

interface SpinWheel {
  id: string;
  title: string;
  active: boolean;
  prizes: Prize[];
  created_at: string;
}

export function AdminSpinWheels() {
  const [wheels, setWheels] = useState<SpinWheel[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prizes, setPrizes] = useState<Prize[]>([{ name: "", type: "product", value: "" }]);

  const fetch = async () => {
    const { data } = await supabase.from("spin_wheels").select("*").order("created_at", { ascending: false });
    if (data) setWheels(data.map(w => ({ ...w, prizes: (w.prizes as any[] || []) })) as SpinWheel[]);
  };

  useEffect(() => { fetch(); }, []);

  const addPrize = () => setPrizes([...prizes, { name: "", type: "product", value: "" }]);
  const removePrize = (i: number) => setPrizes(prizes.filter((_, idx) => idx !== i));
  const updatePrize = (i: number, field: string, val: string) => {
    const updated = [...prizes];
    (updated[i] as any)[field] = val;
    setPrizes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPrizes = prizes.filter(p => p.name.trim());
    if (validPrizes.length < 2) { toast.error("Add at least 2 prizes"); return; }
    const { error } = await supabase.from("spin_wheels").insert({ title, prizes: validPrizes, active: true } as any);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Spin wheel created!");
    setOpen(false);
    setTitle("");
    setPrizes([{ name: "", type: "product", value: "" }]);
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("spin_wheels").update({ active: !active } as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("spin_wheels").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <RotateCcw className="h-5 w-5" /> Spin to Win ({wheels.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Create Spin Wheel</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">New Spin Wheel</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lucky Spin!" required /></div>
              <div className="space-y-3">
                <Label>Prizes (min 2)</Label>
                {prizes.map((p, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input value={p.name} onChange={e => updatePrize(i, "name", e.target.value)} placeholder="Prize name" />
                    </div>
                    <Select value={p.type} onValueChange={v => updatePrize(i, "type", v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="voucher">Voucher</SelectItem>
                        <SelectItem value="free_gift">Free Gift</SelectItem>
                        <SelectItem value="nothing">Nothing</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={p.value} onChange={e => updatePrize(i, "value", e.target.value)} placeholder="Value" className="w-24" />
                    {prizes.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePrize(i)}><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPrize} className="gap-1"><Plus className="h-3 w-3" /> Add Prize</Button>
              </div>
              <Button type="submit" className="w-full">Create Spin Wheel</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {wheels.map(w => (
        <Card key={w.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{w.title}</h3>
                <Badge variant={w.active ? "default" : "destructive"}>{w.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggle(w.id, w.active)}>{w.active ? "Deactivate" : "Activate"}</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(w.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {w.prizes.map((p, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{p.name} ({p.type})</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
