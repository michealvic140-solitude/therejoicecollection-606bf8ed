import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { ShoppingCart, ArrowLeft, HandshakeIcon, Star } from "lucide-react";
import { toast } from "sonner";

type Product = Tables<"products">;

interface Review {
  id: string;
  rating: number;
  comment: string;
  image_url: string;
  delivery_rating: number | null;
  delivery_comment: string;
  created_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [negotiateMsg, setNegotiateMsg] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("*").eq("id", id).single().then(({ data }) => setProduct(data));
    supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setReviews(data as Review[]);
    });
  }, [id]);

  if (!product) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  const handleAddToCart = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if ((profile as any)?.restricted) { toast.error("Your account is restricted from purchases"); return; }
    await addToCart(product.id);
    toast.success("Added to cart!");
  };

  const handleNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) { toast.error("Please sign in first"); return; }
    const { error } = await supabase.from("negotiations").insert({
      user_id: user.id, user_name: profile.full_name, product_id: product.id,
      product_name: product.name, original_price: product.price,
      offered_price: parseFloat(offeredPrice), message: negotiateMsg,
    });
    if (error) { toast.error("Failed to submit"); return; }
    toast.success("Price negotiation submitted!");
    setShowNegotiate(false);
    setOfferedPrice("");
    setNegotiateMsg("");
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
          <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2 capitalize">{product.category}</Badge>
            <h1 className="font-display text-3xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mt-2">{formatPrice(product.price)}</p>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}
                <span className="text-sm text-muted-foreground ml-1">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          {product.out_of_stock ? (
            <Badge variant="destructive" className="text-base py-2 px-4">Out of Stock</Badge>
          ) : (
            <div className="flex gap-3">
              <Button size="lg" onClick={handleAddToCart} className="gap-2 flex-1"><ShoppingCart className="h-5 w-5" /> Add to Cart</Button>
              {user && <Button size="lg" variant="outline" onClick={() => setShowNegotiate(!showNegotiate)} className="gap-2"><HandshakeIcon className="h-5 w-5" /> Negotiate</Button>}
            </div>
          )}
          {product.shipping && <p className="text-sm text-muted-foreground">🚚 Free shipping on orders above ₦50,000</p>}
          {showNegotiate && (
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Negotiate Price</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleNegotiate} className="space-y-4">
                  <div className="space-y-2"><Label>Your Offered Price (₦)</Label><Input type="number" value={offeredPrice} onChange={e => setOfferedPrice(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Message (optional)</Label><Textarea value={negotiateMsg} onChange={e => setNegotiateMsg(e.target.value)} /></div>
                  <Button type="submit">Submit Offer</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  {r.image_url && <img src={r.image_url} alt="Review" className="w-32 h-32 object-cover rounded-lg" />}
                  {r.delivery_rating && (
                    <div className="text-xs text-muted-foreground">
                      Delivery: {r.delivery_rating}/5 {r.delivery_comment && `— ${r.delivery_comment}`}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
