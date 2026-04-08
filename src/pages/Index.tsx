import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { SpinWheel } from "@/components/SpinWheel";
import { PopupAd } from "@/components/PopupAd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowRight, ShieldCheck, Truck, HeadphonesIcon, Gift, Watch, ShoppingBag, Gem, Sparkles, Footprints, Shirt } from "lucide-react";
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

interface CategoryDiscount {
  category: string;
  discount_percent: number;
  ends_at: string;
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

  return (
    <div className="flex gap-3 justify-center">
      {[
        { label: "DAYS", value: time.days },
        { label: "HRS", value: time.hours },
        { label: "MIN", value: time.minutes },
        { label: "SEC", value: time.seconds },
      ].map(b => (
        <div key={b.label} className="glass rounded-xl px-4 py-3 text-center min-w-[70px]">
          <div className="font-display text-3xl md:text-4xl font-bold text-gold">
            {String(b.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

const tagColors: Record<string, string> = {
  ANNOUNCEMENT: "bg-blue-500/80",
  "NEW ARRIVAL": "bg-emerald-500/80",
  SALE: "bg-red-500/80",
  UPDATE: "bg-purple-500/80",
  PROMO: "bg-gold",
};

const categoryIcons: Record<string, typeof Watch> = {
  watches: Watch, bags: ShoppingBag, jewelry: Gem,
  accessories: Sparkles, footwear: Footprints, clothes: Shirt,
};

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [event, setEvent] = useState<CountdownEvent | null>(null);
  const [categoryDiscounts, setCategoryDiscounts] = useState<CategoryDiscount[]>([]);
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
    supabase.from("category_discounts").select("*").eq("active", true).then(({ data }) => {
      if (data) {
        const active = (data as CategoryDiscount[]).filter(d => new Date(d.ends_at) > new Date());
        setCategoryDiscounts(active);
      }
    });
  }, []);

  const handleAddToCart = async (id: string) => {
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  const getCategoryDiscount = (category: string) => {
    const d = categoryDiscounts.find(cd => cd.category === category);
    return d?.discount_percent || 0;
  };

  const categories = [
    { name: "watches", icon: Watch }, { name: "bags", icon: ShoppingBag },
    { name: "jewelry", icon: Gem }, { name: "accessories", icon: Sparkles },
    { name: "footwear", icon: Footprints }, { name: "clothes", icon: Shirt },
  ];

  return (
    <div className="animate-fade-in">
      <SpinWheel />
      <PopupAd />

      {/* Countdown Event Banner */}
      {event && (
        <section className="relative overflow-hidden">
          {event.image_url ? (
            <div className="absolute inset-0">
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent" />
              <div className="absolute inset-0 glass" />
            </>
          )}
          <div className="relative container px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="flex justify-center">
                <Badge className="gradient-gold text-primary-foreground gap-1 px-4 py-1.5">
                  <Gift className="h-3.5 w-3.5" /> Special Event
                </Badge>
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold">{event.title}</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{event.description}</p>
              {event.promo_code && (
                <div className="inline-flex items-center gap-2 glass rounded-lg px-6 py-2">
                  <span className="text-muted-foreground text-sm">Promo Code:</span>
                  <span className="font-mono font-bold text-gold text-lg tracking-wider">{event.promo_code}</span>
                </div>
              )}
              <CountdownTimer endsAt={event.ends_at} />
              <Link to={event.promo_code ? `/shop` : "/shop"}>
                <Button className="gradient-gold text-primary-foreground gap-2 mt-4">Shop Now <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gold/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="container px-4 relative">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-sm glass border-gold/20">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Luxury Collection 2026
              </Badge>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Elegance <span className="text-gradient-gold">Redefined</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Discover our curated collection of premium watches, bags, jewelry, and accessories. Luxury made accessible, quality guaranteed.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/shop"><Button size="lg" className="gap-2 gradient-gold text-primary-foreground shadow-lg shadow-gold/20 hover:opacity-90">Shop Now <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/shop"><Button size="lg" variant="outline" className="gap-2 glass border-gold/20 hover:bg-gold/10">View Collection</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border/50">
        <div className="container px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, text: "100% Authentic", sub: "Guaranteed genuine" },
              { icon: Truck, text: "Fast Delivery", sub: "Nationwide shipping" },
              { icon: HeadphonesIcon, text: "24/7 Support", sub: "Always here for you" },
              { icon: Crown, text: "Premium Quality", sub: "Only the finest" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-3 justify-center glass-card rounded-xl p-3">
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
              <div key={a.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-[0_16px_48px_hsla(40,70%,50%,0.1)] transition-all duration-300">
                <div className={a.image_url ? "md:flex" : ""}>
                  {a.image_url && (
                    <div className="md:w-1/3 shrink-0">
                      <img src={a.image_url} alt={a.title} className="w-full h-40 md:h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <Badge className={`${tagColors[a.tag] || "bg-primary"} text-white mb-2`}>{a.tag}</Badge>
                    <h3 className="font-display text-lg font-semibold mb-1">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container px-4 py-12">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => {
            const IconComp = cat.icon;
            const discount = getCategoryDiscount(cat.name);
            return (
              <Link key={cat.name} to={`/shop?category=${cat.name}`}>
                <div className="group glass-card rounded-2xl p-6 text-center cursor-pointer hover:scale-105 hover:shadow-[0_16px_48px_hsla(40,70%,50%,0.15)] transition-all duration-500 relative">
                  {discount > 0 && (
                    <Badge className="absolute top-2 right-2 gradient-gold text-primary-foreground text-[10px]">-{discount}%</Badge>
                  )}
                  <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                    <IconComp className="h-7 w-7 text-gold" />
                  </div>
                  <h3 className="font-display font-semibold capitalize">{cat.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">Featured Products</h2>
            <Link to="/shop"><Button variant="outline" className="gap-1 glass border-gold/20 hover:bg-gold/10">View All <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} categoryDiscount={getCategoryDiscount(p.category)} />
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 glass">About Us</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">The Rejoice Collection</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to <strong className="text-foreground">The Rejoice Collection</strong> — Nigeria's premier destination for luxury fashion and accessories.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our carefully curated collection features authentic watches, designer bags, exquisite jewelry, premium footwear, and stylish accessories sourced from trusted global suppliers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With nationwide delivery, secure payment processing, and dedicated customer support, we're committed to making your shopping experience seamless and enjoyable.
              </p>
              <div className="flex gap-6 pt-4">
                {[
                  { val: "1000+", label: "Happy Customers" },
                  { val: "100%", label: "Authentic Products" },
                  { val: "24/7", label: "Customer Support" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-2xl font-bold text-gradient-gold">{s.val}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-8 flex items-center justify-center animate-float">
              <div className="text-center space-y-3">
                <div className="w-24 h-24 mx-auto rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-gold/30 animate-glow">
                  <span className="font-display text-3xl font-bold text-primary-foreground">TRC</span>
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
