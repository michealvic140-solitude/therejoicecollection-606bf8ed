import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag, Upload, MapPin, Store, HandshakeIcon, Ticket, Clock, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
}

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [pickupLocation, setPickupLocation] = useState("");
  const [address, setAddress] = useState({ state: "", city: "", lga: "", landmark: "", full_address: "" });

  // Negotiation
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [negotiateMsg, setNegotiateMsg] = useState("");

  // Promo code (legacy)
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Coupons
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const totalItemCount = items.reduce((s, i) => s + i.quantity, 0);

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

  // Fetch user coupons
  useEffect(() => {
    if (!user) return;
    supabase.from("coupons").select("*").eq("active", true).then(({ data }) => {
      if (data) {
        const valid = (data as Coupon[]).filter(c => {
          if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
          if (c.max_uses && c.used_count >= c.max_uses) return false;
          return true;
        });
        setUserCoupons(valid);
      }
    });
  }, [user]);

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

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    const { data } = await supabase.from("promo_codes").select("*").eq("code", promoCode.toUpperCase().trim()).eq("active", true).maybeSingle();
    if (!data) { toast.error("Invalid or expired promo code"); return; }
    const promo = data as any;
    if (promo.max_uses && promo.used_count >= promo.max_uses) { toast.error("Promo code usage limit reached"); return; }
    if (totalItemCount < promo.min_quantity) { toast.error(`You need at least ${promo.min_quantity} items in cart to use this code`); return; }
    setPromoDiscount(promo.discount_percent);
    setPromoApplied(true);
    setSelectedCoupon(null);
    toast.success(`Promo applied! ${promo.discount_percent}% off`);
  };

  const applyCoupon = (coupon: Coupon) => {
    if (totalItemCount < coupon.min_quantity) {
      toast.error(`You need at least ${coupon.min_quantity} items to use this coupon`);
      return;
    }
    setSelectedCoupon(coupon);
    setPromoApplied(false);
    setPromoDiscount(0);
    toast.success(`Coupon ${coupon.code} applied!`);
  };

  const getCouponDiscount = () => {
    if (!selectedCoupon) return 0;
    if (selectedCoupon.discount_percent > 0) return total * (selectedCoupon.discount_percent / 100);
    if (selectedCoupon.discount_amount > 0) return Math.min(selectedCoupon.discount_amount, total);
    return 0;
  };

  const discountedTotal = selectedCoupon
    ? total - getCouponDiscount()
    : promoApplied ? total * (1 - promoDiscount / 100) : total;

  const handleNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) { toast.error("Please sign in first"); return; }
    if (!offeredPrice) return;
    const itemNames = items.map(i => i.product?.name).filter(Boolean).join(", ");
    const { error } = await supabase.from("negotiations").insert({
      user_id: user.id,
      user_name: profile.full_name,
      product_id: items[0]?.product_id || "00000000-0000-0000-0000-000000000000",
      product_name: itemNames || "Cart items",
      original_price: total,
      offered_price: parseFloat(offeredPrice),
      message: negotiateMsg,
    });
    if (error) { toast.error("Failed to submit negotiation"); return; }
    toast.success("Price negotiation submitted! You'll be notified when admin responds.");
    setShowNegotiate(false);
    setOfferedPrice("");
    setNegotiateMsg("");
  };

  const handleCheckout = async () => {
    if (!user || !profile) return;

    if (deliveryMethod === "delivery") {
      if (!address.state || !address.city || !address.full_address) {
        toast.error("Please fill in your delivery address");
        return;
      }
    } else {
      if (!pickupLocation.trim()) {
        toast.error("Please enter your preferred pickup location");
        return;
      }
    }

    setUploading(true);

    let screenshotUrl = "";
    if (screenshotFile) {
      const fileName = `${user.id}/${Date.now()}-${screenshotFile.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, screenshotFile);
      if (uploadError) { toast.error("Failed to upload payment proof"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      screenshotUrl = urlData.publicUrl;
    }

    if (deliveryMethod === "delivery") {
      await supabase.from("profiles").update({
        address: address.full_address, state: address.state, city: address.city,
        lga: address.lga, landmark: address.landmark,
      } as any).eq("user_id", user.id);
    }

    const orderItems = items.map(item => ({
      productId: item.product_id, name: item.product?.name || "",
      price: item.product?.price || 0, quantity: item.quantity,
    }));

    const { error } = await supabase.from("orders").insert({
      user_id: user.id, user_name: profile.full_name,
      items: orderItems, total: discountedTotal,
      status: "Pending Payment", screenshot_url: screenshotUrl,
      delivery_method: deliveryMethod,
      pickup_location: deliveryMethod === "pickup" ? pickupLocation : "",
      delivery_address: deliveryMethod === "delivery" ? address.full_address : "",
      delivery_state: deliveryMethod === "delivery" ? address.state : "",
      delivery_city: deliveryMethod === "delivery" ? address.city : "",
    } as any);

    // Increment coupon/promo usage
    if (selectedCoupon) {
      await supabase.from("coupons").update({ used_count: selectedCoupon.used_count + 1 } as any).eq("id", selectedCoupon.id);
    }
    if (promoApplied && promoCode) {
      const { data: pc } = await supabase.from("promo_codes").select("used_count").eq("code", promoCode.toUpperCase()).single();
      if (pc) await supabase.from("promo_codes").update({ used_count: (pc.used_count || 0) + 1 } as any).eq("code", promoCode.toUpperCase());
    }

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
        <Button onClick={() => navigate("/shop")} className="gradient-gold text-primary-foreground">Browse Products</Button>
      </div>
    );
  }

  const sourceLabel = (s: string) => {
    const labels: Record<string, string> = { admin: "Gift", spin: "Spin Win", event: "Event", promo: "Promo" };
    return labels[s] || s;
  };

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-[0_8px_24px_hsla(40,70%,50%,0.08)] transition-all">
              <img src={item.product?.image_url || "/placeholder.svg"} alt={item.product?.name} className="w-20 h-20 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.product?.name}</h3>
                <p className="text-gold font-bold">{formatPrice(item.product?.price || 0)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 glass" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8 glass" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-bold w-24 text-right hidden sm:block">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
              <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product_id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div>
          <div className="glass-card rounded-2xl p-6 space-y-4 sticky top-24">
            <h3 className="font-display text-xl font-bold">Order Summary</h3>
            <div className="flex justify-between">
              <span>Subtotal ({totalItemCount} items)</span>
              <span className="font-bold">{formatPrice(total)}</span>
            </div>
            {(promoApplied || selectedCoupon) && (
              <div className="flex justify-between text-gold">
                <span>Discount</span>
                <span>-{formatPrice(total - discountedTotal)}</span>
              </div>
            )}
            {total >= 50000 && <p className="text-sm text-emerald-400 font-medium">✓ Free shipping included</p>}
            <hr className="border-border/50" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-gradient-gold">{formatPrice(discountedTotal)}</span>
            </div>

            {/* Coupons Section */}
            {user && userCoupons.length > 0 && !promoApplied && (
              <div className="space-y-2 border-t border-border/30 pt-3">
                <Label className="flex items-center gap-1 text-sm font-semibold"><Gift className="h-4 w-4 text-gold" /> Your Coupons</Label>
                <Select value={selectedCoupon?.id || ""} onValueChange={v => {
                  const c = userCoupons.find(c => c.id === v);
                  if (c) applyCoupon(c);
                }}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Select a coupon..." /></SelectTrigger>
                  <SelectContent>
                    {userCoupons.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.discount_percent > 0 ? `${c.discount_percent}% OFF` : `₦${c.discount_amount} OFF`}
                        {" "}({sourceLabel(c.source)})
                        {c.expires_at && ` · Exp ${new Date(c.expires_at).toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCoupon && (
                  <div className="flex items-center gap-2">
                    <Badge className="gradient-gold text-primary-foreground gap-1">
                      <Ticket className="h-3 w-3" /> {selectedCoupon.code}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedCoupon(null)}>Remove</Button>
                  </div>
                )}
              </div>
            )}

            {/* Promo Code (manual entry) */}
            {!selectedCoupon && !promoApplied && (
              <div className="flex gap-2">
                <Input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Promo code" className="glass" />
                <Button variant="outline" onClick={applyPromo} className="gap-1 glass"><Ticket className="h-4 w-4" /> Apply</Button>
              </div>
            )}
            {promoApplied && (
              <div className="flex items-center gap-2">
                <Badge className="gradient-gold text-primary-foreground gap-1"><Ticket className="h-3 w-3" /> {promoCode.toUpperCase()} — {promoDiscount}% off</Badge>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setPromoApplied(false); setPromoDiscount(0); setPromoCode(""); }}>Remove</Button>
              </div>
            )}

            {/* Negotiate button */}
            {user && (
              <Button variant="outline" className="w-full gap-2 glass border-gold/20" onClick={() => setShowNegotiate(!showNegotiate)}>
                <HandshakeIcon className="h-4 w-4" /> Negotiate Total Price
              </Button>
            )}

            {showNegotiate && (
              <form onSubmit={handleNegotiate} className="space-y-3 border-t border-border/50 pt-4">
                <h4 className="font-semibold text-sm">Propose a price for your entire cart</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Your Offered Price (₦)</Label>
                  <Input type="number" value={offeredPrice} onChange={e => setOfferedPrice(e.target.value)} placeholder="Enter your offer" required className="glass" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message (optional)</Label>
                  <Textarea value={negotiateMsg} onChange={e => setNegotiateMsg(e.target.value)} placeholder="Why this price?" className="glass" />
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground">Submit Offer</Button>
              </form>
            )}

            {!showCheckout ? (
              <Button className="w-full gradient-gold text-primary-foreground" size="lg" onClick={() => setConfirmAddress(true)}>
                Proceed to Checkout
              </Button>
            ) : (
              <div className="space-y-4 border-t border-border/50 pt-4">
                <div className="glass rounded-lg p-4 text-sm space-y-1">
                  <p className="font-semibold">Bank Transfer Details:</p>
                  <p>Bank: {bankInfo.bank || "—"}</p>
                  <p>Account: {bankInfo.account_name || "—"}</p>
                  <p>Number: {bankInfo.account_number || "—"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Upload className="h-4 w-4" /> Payment Proof (screenshot)</Label>
                  <Input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} className="glass" />
                  <p className="text-xs text-muted-foreground">Upload a screenshot of your payment for faster verification</p>
                </div>
                <Button className="w-full gradient-gold text-primary-foreground" size="lg" onClick={handleCheckout} disabled={uploading}>
                  {uploading ? "Placing Order..." : "I've Made Payment - Place Order"}
                </Button>
              </div>
            )}

            {/* Address / Pickup Confirmation */}
            {confirmAddress && (
              <div className="space-y-4 border-t border-border/50 pt-4">
                <h4 className="font-semibold">How would you like to receive your order?</h4>
                <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "delivery" | "pickup")} className="space-y-3">
                  <div className="flex items-center space-x-2 glass rounded-lg p-3">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                      <MapPin className="h-4 w-4" /> Delivery to my address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 glass rounded-lg p-3">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Store className="h-4 w-4" /> I'll pick up
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryMethod === "delivery" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" /> Delivery Address</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">State *</Label><Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} placeholder="Lagos" className="glass" /></div>
                      <div className="space-y-1"><Label className="text-xs">City *</Label><Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Ikeja" className="glass" /></div>
                      <div className="space-y-1"><Label className="text-xs">LGA</Label><Input value={address.lga} onChange={e => setAddress({ ...address, lga: e.target.value })} placeholder="Ikeja" className="glass" /></div>
                      <div className="space-y-1"><Label className="text-xs">Nearest Landmark</Label><Input value={address.landmark} onChange={e => setAddress({ ...address, landmark: e.target.value })} placeholder="Near..." className="glass" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Full Address *</Label><Input value={address.full_address} onChange={e => setAddress({ ...address, full_address: e.target.value })} placeholder="Full home address" className="glass" /></div>
                  </div>
                )}

                {deliveryMethod === "pickup" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-1 text-sm"><Store className="h-4 w-4" /> Pickup Location</h4>
                    <div className="space-y-1">
                      <Label className="text-xs">Your preferred pickup location *</Label>
                      <Input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="Enter area or location" className="glass" />
                    </div>
                    <p className="text-xs text-muted-foreground">We'll confirm the exact pickup point after your order is placed.</p>
                  </div>
                )}

                <Button className="w-full gradient-gold text-primary-foreground" onClick={() => { setConfirmAddress(false); setShowCheckout(true); }}>
                  Confirm & Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
