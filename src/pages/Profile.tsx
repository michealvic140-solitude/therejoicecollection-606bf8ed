import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { User, Pencil, Ticket, Package, CreditCard, Star, Truck, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  discount_amount: number;
  min_quantity: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  source: string;
  active: boolean;
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
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

  // Data
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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

  useEffect(() => {
    if (!user) return;
    supabase.from("coupons").select("*").eq("active", true).then(({ data }) => {
      if (data) setCoupons(data as Coupon[]);
    });
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: name, phone, username: username || null,
      address: fullAddress, dob: dob || null, state, city, lga, landmark,
    } as any).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile updated!");
  };

  const badge = (profile as any)?.badge || "Regular";
  const badgeColors: Record<string, string> = {
    VIP: "gradient-gold text-primary-foreground",
    Verified: "bg-blue-500/20 text-blue-400",
    Regular: "bg-secondary text-secondary-foreground",
  };

  const now = new Date();
  const availableCoupons = coupons.filter(c => (!c.expires_at || new Date(c.expires_at) > now) && (!c.max_uses || c.used_count < c.max_uses));
  const expiredCoupons = coupons.filter(c => (c.expires_at && new Date(c.expires_at) <= now) || (c.max_uses && c.used_count >= c.max_uses));

  return (
    <div className="container px-4 py-8 max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6 text-gradient-gold">My Account</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 glass p-1.5">
          <TabsTrigger value="profile" className="gap-1"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1"><Ticket className="h-3.5 w-3.5" /> Coupons</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1"><Package className="h-3.5 w-3.5" /> Orders</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card border-0">
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
                  <Input value={user?.email || ""} disabled className="bg-muted/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="glass" /></div>
                  <div className="space-y-2"><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Optional" className="glass" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." className="glass" /></div>
                  <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="glass" /></div>
                </div>
                <div className="border-t border-border/30 pt-4">
                  <h3 className="font-semibold mb-3">Delivery Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="Lagos" className="glass" /></div>
                    <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ikeja" className="glass" /></div>
                    <div className="space-y-2"><Label>LGA</Label><Input value={lga} onChange={e => setLga(e.target.value)} className="glass" /></div>
                    <div className="space-y-2"><Label>Nearest Landmark</Label><Input value={landmark} onChange={e => setLandmark(e.target.value)} className="glass" /></div>
                  </div>
                  <div className="space-y-2 mt-3"><Label>Full Home Address</Label><Input value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="Full delivery address" className="glass" /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground">{loading ? "Saving..." : "Save Changes"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><Ticket className="h-5 w-5 text-gold" /> Available Coupons ({availableCoupons.length})</h3>
          {availableCoupons.length === 0 && <p className="text-muted-foreground text-sm">No active coupons available.</p>}
          {availableCoupons.map(c => (
            <Card key={c.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gold text-lg">{c.code}</span>
                    <Badge className="gradient-gold text-primary-foreground">{c.discount_percent > 0 ? `${c.discount_percent}% OFF` : `₦${c.discount_amount} OFF`}</Badge>
                    <Badge variant="secondary">{c.source}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min {c.min_quantity} items • Used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""} times
                    {c.expires_at && ` • Expires ${new Date(c.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate("/cart")} className="gradient-gold text-primary-foreground">Use Now</Button>
              </CardContent>
            </Card>
          ))}

          {expiredCoupons.length > 0 && (
            <>
              <h3 className="font-display text-lg font-bold text-muted-foreground mt-6">Expired / Used ({expiredCoupons.length})</h3>
              {expiredCoupons.map(c => (
                <Card key={c.id} className="glass-card border-0 opacity-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold line-through">{c.code}</span>
                      <Badge variant="destructive">Expired</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><Package className="h-5 w-5 text-gold" /> Order History</h3>
          {orders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet.</p>}
          {orders.slice(0, 10).map(o => (
            <Card key={o.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-gold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} • {o.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(o.total)}</p>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/orders")}>View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-gold" /> Payment History</h3>
          {orders.filter(o => o.screenshot_url || o.status !== "Pending Payment").length === 0 && <p className="text-muted-foreground text-sm">No payment records.</p>}
          {orders.filter(o => o.screenshot_url || o.status !== "Pending Payment").map(o => (
            <Card key={o.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-gold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={o.status === "Payment Confirmed" ? "default" : "secondary"}>{o.status}</Badge>
                <span className="font-bold">{formatPrice(o.total)}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Floating Support Icon */}
      <Link to="/chat" className="fixed bottom-6 right-6 z-50 gradient-gold text-primary-foreground p-4 rounded-full shadow-lg shadow-gold/30 hover:scale-110 transition-transform animate-glow">
        <MessageCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}
