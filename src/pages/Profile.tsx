import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [lga, setLga] = useState("");
  const [landmark, setLandmark] = useState("");
  const [fullAddress, setFullAddress] = useState(profile?.address || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setUsername(profile.username || "");
      setFullAddress(profile.address || "");
      setDob(profile.dob || "");
      setState((profile as any).state || "");
      setCity((profile as any).city || "");
      setLga((profile as any).lga || "");
      setLandmark((profile as any).landmark || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: name,
      phone,
      username: username || null,
      address: fullAddress,
      dob: dob || null,
      state,
      city,
      lga,
      landmark,
    } as any).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile updated!");
  };

  const badge = (profile as any)?.badge || "Regular";
  const badgeColors: Record<string, string> = {
    VIP: "bg-gold text-accent-foreground",
    Verified: "bg-blue-100 text-blue-800",
    Regular: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="container px-4 py-8 max-w-lg animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">My Profile</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Personal Information</CardTitle>
            <Badge className={badgeColors[badge]}>{badge}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Optional" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." /></div>
              <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={e => setDob(e.target.value)} /></div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Delivery Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="Lagos" /></div>
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ikeja" /></div>
                <div className="space-y-2"><Label>LGA</Label><Input value={lga} onChange={e => setLga(e.target.value)} placeholder="Local Gov. Area" /></div>
                <div className="space-y-2"><Label>Nearest Landmark</Label><Input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Near..." /></div>
              </div>
              <div className="space-y-2 mt-3"><Label>Full Home Address</Label><Input value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="Full delivery address" /></div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
