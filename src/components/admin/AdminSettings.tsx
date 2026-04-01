import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const s: Record<string, string> = {};
        data.forEach(r => { s[r.key] = r.value; });
        setSettings(s);
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    for (const [key, value] of Object.entries(settings)) {
      const { data: existing } = await supabase.from("settings").select("id").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("settings").insert({ key, value });
      }
    }
    toast.success("Settings saved");
    setLoading(false);
  };

  const isMaintenance = settings.maintenance_mode === "true";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="font-display">Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Bank Name</Label><Input value={settings.bank || ""} onChange={e => setSettings({...settings, bank: e.target.value})} /></div>
          <div className="space-y-2"><Label>Account Name</Label><Input value={settings.account_name || ""} onChange={e => setSettings({...settings, account_name: e.target.value})} /></div>
          <div className="space-y-2"><Label>Account Number</Label><Input value={settings.account_number || ""} onChange={e => setSettings({...settings, account_number: e.target.value})} /></div>
          <div className="space-y-2"><Label>Banner Text</Label><Input value={settings.banner || ""} onChange={e => setSettings({...settings, banner: e.target.value})} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">These will display in the footer of the website.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={settings.whatsapp || ""} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="+234..." /></div>
            <div className="space-y-2"><Label>Facebook URL</Label><Input value={settings.facebook || ""} onChange={e => setSettings({...settings, facebook: e.target.value})} placeholder="https://facebook.com/..." /></div>
            <div className="space-y-2"><Label>TikTok URL</Label><Input value={settings.tiktok || ""} onChange={e => setSettings({...settings, tiktok: e.target.value})} placeholder="https://tiktok.com/@..." /></div>
            <div className="space-y-2"><Label>Instagram URL</Label><Input value={settings.instagram || ""} onChange={e => setSettings({...settings, instagram: e.target.value})} placeholder="https://instagram.com/..." /></div>
            <div className="space-y-2"><Label>Phone Number</Label><Input value={settings.contact_phone || ""} onChange={e => setSettings({...settings, contact_phone: e.target.value})} placeholder="+234..." /></div>
            <div className="space-y-2"><Label>SMS Number</Label><Input value={settings.contact_sms || ""} onChange={e => setSettings({...settings, contact_sms: e.target.value})} placeholder="+234..." /></div>
            <div className="space-y-2 md:col-span-2"><Label>Email Address</Label><Input value={settings.contact_email || ""} onChange={e => setSettings({...settings, contact_email: e.target.value})} placeholder="support@..." /></div>
          </div>
        </CardContent>
      </Card>

      <Card className={isMaintenance ? "border-destructive" : ""}>
        <CardHeader><CardTitle className="font-display">Maintenance Mode</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">When enabled, all users will see a maintenance message and cannot access the platform.</p>
          <div className="flex items-center justify-between">
            <Label className={isMaintenance ? "text-destructive font-bold" : ""}>
              {isMaintenance ? "⚠️ Maintenance Mode is ON" : "Maintenance Mode is OFF"}
            </Label>
            <Switch
              checked={isMaintenance}
              onCheckedChange={v => setSettings({...settings, maintenance_mode: v ? "true" : "false"})}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} size="lg" className="w-full">
        {loading ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
