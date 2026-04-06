import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
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

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden glass-card shadow-lg">
          <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2 capitalize glass">{product.category}</Badge>
            <h1 className="font-display text-3xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-gradient-gold mt-2">{formatPrice(product.price)}</p>
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
            <Button size="lg" onClick={handleAddToCart} className="gap-2 gradient-gold text-primary-foreground shadow-lg shadow-gold/20 hover:opacity-90 w-full">
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
          )}
          {product.shipping && <p className="text-sm text-muted-foreground">Free shipping on orders above ₦50,000</p>}
          <p className="text-xs text-muted-foreground italic">You can negotiate your price at checkout</p>
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map(r => (
              <div key={r.id} className="glass-card rounded-2xl p-4 space-y-2">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
