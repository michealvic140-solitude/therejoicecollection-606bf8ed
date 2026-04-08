import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";

type Product = Tables<"products">;

const productCategories = [
  "watches", "bags", "jewelry", "accessories", "footwear", "clothes",
  "nightwear", "undies", "trousers", "shirts", "polo", "slippers",
  "shoes", "glasses", "others",
];

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "watches", image_url: "", shipping: true, visible: true, discount_percent: "0", discount_ends_at: "" });
  const [customTag, setCustomTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "watches", image_url: "", shipping: true, visible: true, discount_percent: "0", discount_ends_at: "" });
    setEditing(null);
    setCustomTag("");
    setImageFile(null);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", price: String(p.price), category: p.category,
      image_url: p.image_url || "", shipping: p.shipping, visible: p.visible,
      discount_percent: String((p as any).discount_percent || 0),
      discount_ends_at: (p as any).discount_ends_at ? new Date((p as any).discount_ends_at).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const fileName = `products/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, imageFile);
      if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const category = customTag.trim() || form.category;
    const data: any = {
      name: form.name, description: form.description, category, price: parseFloat(form.price),
      image_url: imageUrl, shipping: form.shipping, visible: form.visible,
      discount_percent: parseFloat(form.discount_percent) || 0,
      discount_ends_at: form.discount_ends_at ? new Date(form.discount_ends_at).toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(data).eq("id", editing.id);
      if (error) { toast.error("Failed: " + error.message); setUploading(false); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) { toast.error("Failed: " + error.message); setUploading(false); return; }
      toast.success("Product added");
    }
    setUploading(false);
    setOpen(false);
    resetForm();
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Deleted");
    fetchProducts();
  };

  const toggleVisibility = async (p: Product) => {
    await supabase.from("products").update({ visible: !p.visible }).eq("id", p.id);
    fetchProducts();
  };

  const toggleStock = async (p: Product) => {
    await supabase.from("products").update({ out_of_stock: !p.out_of_stock }).eq("id", p.id);
    fetchProducts();
  };

  const markAllOutOfStock = async () => {
    for (const p of products) await supabase.from("products").update({ out_of_stock: true }).eq("id", p.id);
    toast.success("All marked out of stock");
    fetchProducts();
  };

  const restockAll = async () => {
    for (const p of products) await supabase.from("products").update({ out_of_stock: false }).eq("id", p.id);
    toast.success("All restocked");
    fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="font-display text-xl font-bold">Products ({products.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllOutOfStock}>All Out of Stock</Button>
          <Button variant="outline" size="sm" onClick={restockAll}>Restock All</Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Product</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="space-y-2"><Label>Price (₦)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {productCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Custom Tag (overrides category)</Label><Input value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Or type a custom category..." /></div>

                {/* Image */}
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <Input value={form.image_url} onChange={e => { setForm({...form, image_url: e.target.value}); setImageFile(null); }} placeholder="Paste image URL..." />
                  <div className="text-xs text-muted-foreground text-center">— or —</div>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                      if (file) setForm({...form, image_url: ""});
                    }} />
                    {imageFile && <Badge variant="secondary" className="gap-1 whitespace-nowrap"><Upload className="h-3 w-3" /> {imageFile.name.slice(0, 20)}</Badge>}
                  </div>
                </div>

                {/* Discount */}
                <div className="border-t border-border/30 pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Product Discount</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} min="0" max="100" /></div>
                    <div className="space-y-2"><Label>Discount Ends</Label><Input type="datetime-local" value={form.discount_ends_at} onChange={e => setForm({...form, discount_ends_at: e.target.value})} /></div>
                  </div>
                </div>

                <div className="flex items-center justify-between"><Label>Free Shipping</Label><Switch checked={form.shipping} onCheckedChange={v => setForm({...form, shipping: v})} /></div>
                <div className="flex items-center justify-between"><Label>Visible</Label><Switch checked={form.visible} onCheckedChange={v => setForm({...form, visible: v})} /></div>
                <Button type="submit" className="w-full" disabled={uploading}>{uploading ? "Saving..." : editing ? "Update" : "Add"} Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3">
        {products.map(p => {
          const disc = (p as any).discount_percent || 0;
          const discActive = disc > 0 && (!(p as any).discount_ends_at || new Date((p as any).discount_ends_at) > new Date());
          return (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-16 h-16 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {p.category} · {discActive ? (
                      <><span className="line-through">{formatPrice(p.price)}</span> <span className="text-gold font-bold">{formatPrice(p.price * (1 - disc / 100))}</span> <span className="text-destructive text-xs">-{disc}%</span></>
                    ) : formatPrice(p.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!p.visible && <Badge variant="secondary">Hidden</Badge>}
                  {p.out_of_stock && <Badge variant="destructive">OOS</Badge>}
                  {discActive && <Badge className="gradient-gold text-primary-foreground text-xs">{disc}% OFF</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => toggleVisibility(p)}>
                    {p.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleStock(p)}>
                    <Badge variant={p.out_of_stock ? "destructive" : "default"} className="text-[10px]">{p.out_of_stock ? "OOS" : "In"}</Badge>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
