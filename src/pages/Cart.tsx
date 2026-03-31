import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const info: Record<string, string> = {};
        data.forEach(s => { info[s.key] = s.value; });
        setBankInfo(info);
      }
    });
  }, []);

  const handleCheckout = async () => {
    if (!user || !profile) return;
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
      status: "Pending Payment",
    });

    if (error) { toast.error("Failed to place order"); return; }
    await clearCart();
    toast.success("Order placed! Please make payment to complete your order.");
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
                <img
                  src={item.product?.image_url || "/placeholder.svg"}
                  alt={item.product?.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
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
                <p className="font-bold w-24 text-right">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
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
              {total >= 50000 && (
                <p className="text-sm text-green-600 font-medium">✓ Free shipping included</p>
              )}
              <hr />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              {!showCheckout ? (
                <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
                  Proceed to Checkout
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-secondary p-4 rounded-lg text-sm space-y-1">
                    <p className="font-semibold">Bank Transfer Details:</p>
                    <p>Bank: {bankInfo.bank || "First Bank of Nigeria"}</p>
                    <p>Account: {bankInfo.account_name || "THE REJOICE COLLECTION LTD"}</p>
                    <p>Number: {bankInfo.account_number || "0123456789"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Make your payment and place the order. An admin will verify your payment.
                  </p>
                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    Place Order
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
