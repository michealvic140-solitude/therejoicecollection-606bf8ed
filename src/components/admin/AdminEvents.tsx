import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CalendarClock, Upload } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string;
  promo_code: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
}

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", image_url: "", promo_code: "",
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "", active: true,
  });

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (data) setEvents(data as Event[]);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ends_at) { toast.error("End date is required"); return; }
    setUploading(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const fileName = `events/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, imageFile);
      if (uploadError) { toast.error("Image upload failed: " + uploadError.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("events").insert({
      title: form.title, description: form.description,
      image_url: imageUrl, promo_code: form.promo_code,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      active: form.active,
    });
    setUploading(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Event created");
    setOpen(false);
    setForm({ title: "", description: "", image_url: "", promo_code: "", starts_at: new Date().toISOString().slice(0, 16), ends_at: "", active: true });
    setImageFile(null);
    fetchEvents();
  };

  const toggleActive = async (ev: Event) => {
    await supabase.from("events").update({ active: !ev.active } as any).eq("id", ev.id);
    fetchEvents();
  };

  const remove = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Deleted");
    fetchEvents();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <CalendarClock className="h-5 w-5" /> Events & Giveaways ({events.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Create Event</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">New Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Event Image</Label>
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
              <div className="space-y-2"><Label>Promo Code</Label><Input value={form.promo_code} onChange={e => setForm({...form, promo_code: e.target.value})} placeholder="e.g. SALE20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} required /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} /></div>
              <Button type="submit" className="w-full" disabled={uploading}>{uploading ? "Creating..." : "Create Event"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {events.map(ev => (
        <Card key={ev.id}>
          <CardContent className="flex items-center justify-between p-4 gap-4">
            {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{ev.title}</h3>
                {ev.promo_code && <Badge variant="secondary">{ev.promo_code}</Badge>}
                <Badge variant={ev.active ? "default" : "destructive"}>{ev.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">{ev.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(ev.starts_at).toLocaleDateString()} → {new Date(ev.ends_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggleActive(ev)}>{ev.active ? "Deactivate" : "Activate"}</Button>
              <Button variant="ghost" size="icon" onClick={() => remove(ev.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
