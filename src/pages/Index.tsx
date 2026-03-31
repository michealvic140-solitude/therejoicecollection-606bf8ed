import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Product = Tables<"products">;
type Announcement = Tables<"announcements">;

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).limit(8).then(({ data }) => {
      if (data) setProducts(data);
    });
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data);
    });
  }, []);

  const handleAddToCart = async (id: string) => {
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  const featured = announcements.find(a => a.featured);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-gold/5 py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Luxury Collection 2026
              </Badge>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Elegance <span className="text-gold">Redefined</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Discover our curated collection of premium watches, bags, jewelry, and accessories. Luxury made accessible.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/shop"><Button size="lg" className="gap-2">Shop Now <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {featured && (
        <section className="container px-4 -mt-8 relative z-10">
          <Card className="overflow-hidden border-gold/20 shadow-lg">
            <div className="md:flex">
              {featured.image_url && (
                <div className="md:w-1/3">
                  <img src={featured.image_url} alt={featured.title} className="w-full h-48 md:h-full object-cover" />
                </div>
              )}
              <CardContent className="p-6 flex flex-col justify-center">
                <Badge className="w-fit mb-2 bg-gold text-accent-foreground">{featured.tag}</Badge>
                <h3 className="font-display text-xl font-semibold mb-2">{featured.title}</h3>
                <p className="text-muted-foreground">{featured.content}</p>
              </CardContent>
            </div>
          </Card>
        </section>
      )}

      {/* Categories */}
      <section className="container px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["watches", "bags", "jewelry", "accessories"].map(cat => (
            <Link key={cat} to={`/shop?category=${cat}`}>
              <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Crown className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-semibold capitalize text-lg">{cat}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold">Featured Products</h2>
          <Link to="/shop"><Button variant="outline" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
        </div>
      </section>
    </div>
  );
}
