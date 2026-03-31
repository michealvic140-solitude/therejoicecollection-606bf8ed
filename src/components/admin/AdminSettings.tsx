import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      await supabase.from("settings").update({ value }).eq("key", key);
    }
    toast.success("Settings saved");
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="font-display">Store Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Bank Name</Label>
          <Input value={settings.bank || ""} onChange={e => setSettings({...settings, bank: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input value={settings.account_name || ""} onChange={e => setSettings({...settings, account_name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Account Number</Label>
          <Input value={settings.account_number || ""} onChange={e => setSettings({...settings, account_number: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Banner Text</Label>
          <Input value={settings.banner || ""} onChange={e => setSettings({...settings, banner: e.target.value})} />
        </div>
        <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Settings"}</Button>
      </CardContent>
    </Card>
  );
}
