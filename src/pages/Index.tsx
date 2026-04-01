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
import { Crown, ArrowRight, Sparkles, ShieldCheck, Truck, HeadphonesIcon, Gift } from "lucide-react";
import { toast } from "sonner";

type Product = Tables<"products">;
type Announcement = Tables<"announcements">;

interface CountdownEvent {
  id: string;
  title: string;
  description: string;
  image_url: string;
  promo_code: string;
  ends_at: string;
  active: boolean;
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { clearInterval(interval); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const blocks = [
    { label: "DAYS", value: time.days },
    { label: "HRS", value: time.hours },
    { label: "MIN", value: time.minutes },
    { label: "SEC", value: time.seconds },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {blocks.map(b => (
        <div key={b.label} className="bg-background/20 backdrop-blur-md rounded-xl px-4 py-3 text-center min-w-[70px] border border-white/10">
          <div className="font-display text-3xl md:text-4xl font-bold text-white">
            {String(b.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-semibold tracking-widest text-white/70 mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

const tagColors: Record<string, string> = {
  ANNOUNCEMENT: "bg-blue-500",
  "NEW ARRIVAL": "bg-green-500",
  SALE: "bg-red-500",
  UPDATE: "bg-purple-500",
  PROMO: "bg-gold",
};

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [event, setEvent] = useState<CountdownEvent | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).eq("out_of_stock", false).limit(8).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setProducts(data);
    });
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data);
    });
    supabase.from("events").select("*").eq("active", true).order("ends_at", { ascending: true }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const ev = data[0] as CountdownEvent;
        if (new Date(ev.ends_at) > new Date()) setEvent(ev);
      }
    });
  }, []);

  const handleAddToCart = async (id: string) => {
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  const categories = [
    { name: "watches", icon: "⌚" },
    { name: "bags", icon: "👜" },
    { name: "jewelry", icon: "💎" },
    { name: "accessories", icon: "✨" },
    { name: "footwear", icon: "👟" },
    { name: "clothes", icon: "👔" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Countdown Event Banner */}
      {event && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-gold animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
          <div className="relative container px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="flex justify-center">
                <Badge className="bg-white/20 text-white border-white/30 gap-1 px-4 py-1.5">
                  <Gift className="h-3.5 w-3.5" /> Special Event
                </Badge>
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-white">{event.title}</h2>
              <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto">{event.description}</p>
              {event.promo_code && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-6 py-2 border border-white/20">
                  <span className="text-white/70 text-sm">Promo Code:</span>
                  <span className="font-mono font-bold text-white text-lg tracking-wider">{event.promo_code}</span>
                </div>
              )}
              <CountdownTimer endsAt={event.ends_at} />
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="mx-auto max-h-40 rounded-xl shadow-2xl mt-4" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-gold/5 py-20 md:py-32">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container px-4 relative">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-sm border border-gold/20">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Luxury Collection 2026
              </Badge>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Elegance <span className="text-gold">Redefined</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Discover our curated collection of premium watches, bags, jewelry, and accessories. Luxury made accessible, quality guaranteed.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/shop"><Button size="lg" className="gap-2 shadow-lg">Shop Now <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/shop"><Button size="lg" variant="outline" className="gap-2">View Collection</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-card/50">
        <div className="container px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, text: "100% Authentic", sub: "Guaranteed genuine" },
              { icon: Truck, text: "Fast Delivery", sub: "Nationwide shipping" },
              { icon: HeadphonesIcon, text: "24/7 Support", sub: "Always here for you" },
              { icon: Crown, text: "Premium Quality", sub: "Only the finest" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-3 justify-center">
                <b.icon className="h-8 w-8 text-gold shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{b.text}</p>
                  <p className="text-xs text-muted-foreground">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="container px-4 py-10">
          <h2 className="font-display text-2xl font-bold mb-6">Latest Announcements</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {announcements.slice(0, 4).map(a => (
              <Card key={a.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                <div className={a.image_url ? "md:flex" : ""}>
                  {a.image_url && (
                    <div className="md:w-1/3 shrink-0">
                      <img src={a.image_url} alt={a.title} className="w-full h-40 md:h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <Badge className={`${tagColors[a.tag] || "bg-primary"} text-white mb-2`}>{a.tag}</Badge>
                    <h3 className="font-display text-lg font-semibold mb-1">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container px-4 py-12">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link key={cat.name} to={`/shop?category=${cat.name}`}>
              <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all overflow-hidden hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="font-display font-semibold capitalize">{cat.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/30 py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">Featured Products</h2>
            <Link to="/shop"><Button variant="outline" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">About Us</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">The Rejoice Collection</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to <strong className="text-foreground">The Rejoice Collection</strong> — Nigeria's premier destination for luxury fashion and accessories. We believe that everyone deserves to experience the finest quality products at accessible prices.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our carefully curated collection features authentic watches, designer bags, exquisite jewelry, premium footwear, and stylish accessories sourced from trusted global suppliers. Every product undergoes rigorous quality checks to ensure you receive nothing but the best.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With nationwide delivery, secure payment processing, and dedicated customer support, we're committed to making your shopping experience seamless and enjoyable. Join thousands of satisfied customers who trust The Rejoice Collection for their luxury needs.
              </p>
              <div className="flex gap-4 pt-2">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-gold">1000+</div>
                  <div className="text-xs text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-gold">100%</div>
                  <div className="text-xs text-muted-foreground">Authentic Products</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-gold">24/7</div>
                  <div className="text-xs text-muted-foreground">Customer Support</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-gold/10 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display text-3xl font-bold text-gold">TRC</span>
                </div>
                <h3 className="font-display text-xl font-bold">The Rejoice Collection</h3>
                <p className="text-sm text-muted-foreground italic">"Luxury Redefined, Quality Assured"</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
