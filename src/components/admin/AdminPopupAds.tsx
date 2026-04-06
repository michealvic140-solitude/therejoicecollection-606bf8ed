import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface PopupAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_type: string;
  link_id: string;
  discount_percent: number;
  active: boolean;
}

export function AdminPopupAds() {
  const [ads, setAds] = useState<PopupAd[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", link_type: "product", link_id: "", discount_percent: "0" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchAds = async () => {
    const { data } = await supabase.from("popup_ads").select("*").order("created_at", { ascending: false });
    if (data) setAds(data as PopupAd[]);
  };

  useEffect(() => { fetchAds(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = form.image_url;
    if (imageFile) {
      const fileName = `ads/${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(fileName, imageFile);
      if (upErr) { toast.error("Image upload failed"); return; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from("popup_ads").insert({
      title: form.title,
      description: form.description,
      image_url: imageUrl,
      link_type: form.link_type,
      link_id: form.link_id,
      discount_percent: parseFloat(form.discount_percent) || 0,
      active: true,
    } as any);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Ad created!");
    setOpen(false);
    setForm({ title: "", description: "", image_url: "", link_type: "product", link_id: "", discount_percent: "0" });
    setImageFile(null);
    fetchAds();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("popup_ads").update({ active: !active } as any).eq("id", id);
    fetchAds();
  };

  const remove = async (id: string) => {
    await supabase.from("popup_ads").delete().eq("id", id);
    toast.success("Deleted");
    fetchAds();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Popup Ads ({ads.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Create Ad</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display">New Popup Ad</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="Or paste image URL" />
              </div>
              <div className="space-y-2">
                <Label>Link To</Label>
                <Select value={form.link_type} onValueChange={v => setForm({...form, link_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Specific Product</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="shop">Shop Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.link_type !== "shop" && (
                <div className="space-y-2">
                  <Label>{form.link_type === "product" ? "Product ID" : "Category Name"}</Label>
                  <Input value={form.link_id} onChange={e => setForm({...form, link_id: e.target.value})} placeholder={form.link_type === "product" ? "Paste product UUID" : "e.g. watches"} />
                </div>
              )}
              <div className="space-y-2"><Label>Discount % (0 for none)</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} /></div>
              <Button type="submit" className="w-full">Create Ad</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {ads.map(ad => (
        <Card key={ad.id}>
          <CardContent className="flex items-center gap-4 p-4">
            {ad.image_url && <img src={ad.image_url} alt={ad.title} className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{ad.title}</h3>
                {ad.discount_percent > 0 && <Badge className="gradient-gold text-primary-foreground">{ad.discount_percent}% OFF</Badge>}
                <Badge variant={ad.active ? "default" : "destructive"}>{ad.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
              <p className="text-xs text-muted-foreground">Links to: {ad.link_type} {ad.link_id && `→ ${ad.link_id}`}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggle(ad.id, ad.active)}>{ad.active ? "Hide" : "Show"}</Button>
              <Button variant="ghost" size="icon" onClick={() => remove(ad.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
