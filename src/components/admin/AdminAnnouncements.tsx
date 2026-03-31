import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Announcement = Tables<"announcements">;

export function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tag: "ANNOUNCEMENT", image_url: "", featured: false, active: true });

  const fetch = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("announcements").insert(form);
    toast.success("Announcement added");
    setOpen(false);
    setForm({ title: "", content: "", tag: "ANNOUNCEMENT", image_url: "", featured: false, active: true });
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">Announcements ({items.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
              <div className="space-y-2"><Label>Tag</Label><Input value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></div>
              <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={form.featured} onCheckedChange={v => setForm({...form, featured: v})} /></div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} /></div>
              <Button type="submit" className="w-full">Add Announcement</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {items.map(a => (
        <Card key={a.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{a.title}</h3>
                <Badge>{a.tag}</Badge>
                {a.featured && <Badge variant="secondary">Featured</Badge>}
                {!a.active && <Badge variant="destructive">Inactive</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
