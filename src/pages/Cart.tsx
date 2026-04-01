import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag, Upload, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [address, setAddress] = useState({
    state: "", city: "", lga: "", landmark: "", full_address: ""
  });

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const info: Record<string, string> = {};
        data.forEach(s => { info[s.key] = s.value; });
        setBankInfo(info);
      }
    });
  }, []);

  useEffect(() => {
    if (profile) {
      setAddress({
        state: (profile as any).state || "",
        city: (profile as any).city || "",
        lga: (profile as any).lga || "",
        landmark: (profile as any).landmark || "",
        full_address: profile.address || "",
      });
    }
  }, [profile]);

  // Check if user is restricted
  if ((profile as any)?.restricted) {
    return (
      <div className="container px-4 py-20 text-center animate-fade-in">
        <ShoppingBag className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Account Restricted</h2>
        <p className="text-muted-foreground mb-6">Your account has been restricted from making purchases. Please contact support.</p>
        <Button onClick={() => navigate("/chat")}>Contact Support</Button>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user || !profile) return;

    // Validate address
    if (!address.state || !address.city || !address.full_address) {
      toast.error("Please fill in your delivery address");
      return;
    }

    setUploading(true);

    // Upload screenshot if provided
    let screenshotUrl = "";
    if (screenshotFile) {
      const fileName = `${user.id}/${Date.now()}-${screenshotFile.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, screenshotFile);
      if (uploadError) {
        toast.error("Failed to upload payment proof");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      screenshotUrl = urlData.publicUrl;
    }

    // Save address to profile
    await supabase.from("profiles").update({
      address: address.full_address,
      state: address.state,
      city: address.city,
      lga: address.lga,
      landmark: address.landmark,
    } as any).eq("user_id", user.id);

    const orderItems = items.map(item => ({
      productId: item.product_id,
      name: item.product?.name || "",
      price: item.product?.price || 0,
      quantity: item.quantity,
    }));

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      user_name: profile.full_name,
      items: orderItems,
      total,
      status: screenshotUrl ? "Pending Payment" : "Pending Payment",
      screenshot_url: screenshotUrl,
    });

    setUploading(false);
    if (error) { toast.error("Failed to place order"); return; }
    await clearCart();
    toast.success(screenshotUrl ? "Order placed with payment proof! Awaiting verification." : "Order placed! Please make payment to complete your order.");
    navigate("/orders");
  };

  if (items.length === 0) {
    return (
      <div className="container px-4 py-20 text-center animate-fade-in">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Start shopping to add items</p>
        <Button onClick={() => navigate("/shop")}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <img src={item.product?.image_url || "/placeholder.svg"} alt={item.product?.name} className="w-20 h-20 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.product?.name}</h3>
                  <p className="text-primary font-bold">{formatPrice(item.product?.price || 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-bold w-24 text-right hidden sm:block">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product_id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader><CardTitle className="font-display">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              {total >= 50000 && <p className="text-sm text-green-600 font-medium">✓ Free shipping included</p>}
              <hr />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              {!showCheckout ? (
                <Button className="w-full" size="lg" onClick={() => setConfirmAddress(true)}>
                  Proceed to Checkout
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-secondary p-4 rounded-lg text-sm space-y-1">
                    <p className="font-semibold">Bank Transfer Details:</p>
                    <p>Bank: {bankInfo.bank || "—"}</p>
                    <p>Account: {bankInfo.account_name || "—"}</p>
                    <p>Number: {bankInfo.account_number || "—"}</p>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Upload className="h-4 w-4" /> Payment Proof (screenshot)</Label>
                    <Input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground">Upload a screenshot of your payment for faster verification</p>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCheckout} disabled={uploading}>
                    {uploading ? "Placing Order..." : "I've Made Payment - Place Order"}
                  </Button>
                </div>
              )}

              {/* Address Confirmation Dialog */}
              {confirmAddress && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-1"><MapPin className="h-4 w-4" /> Delivery Address</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">State *</Label><Input value={address.state} onChange={e => setAddress({...address, state: e.target.value})} placeholder="Lagos" /></div>
                    <div className="space-y-1"><Label className="text-xs">City *</Label><Input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} placeholder="Ikeja" /></div>
                    <div className="space-y-1"><Label className="text-xs">LGA</Label><Input value={address.lga} onChange={e => setAddress({...address, lga: e.target.value})} placeholder="Ikeja" /></div>
                    <div className="space-y-1"><Label className="text-xs">Nearest Landmark</Label><Input value={address.landmark} onChange={e => setAddress({...address, landmark: e.target.value})} placeholder="Near..." /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Full Address *</Label><Input value={address.full_address} onChange={e => setAddress({...address, full_address: e.target.value})} placeholder="Full home address" /></div>
                  <Button className="w-full" onClick={() => { setConfirmAddress(false); setShowCheckout(true); }}>
                    Confirm Address & Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
