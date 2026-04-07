import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PopupAdData {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_type: string;
  link_id: string;
  discount_percent: number;
}

export function PopupAd() {
  const [ad, setAd] = useState<PopupAdData | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("popup_ads").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setAd(data[0] as PopupAdData);
        setTimeout(() => setOpen(true), 5000);
      }
    });
  }, []);

  const handleClick = () => {
    if (!ad) return;
    setOpen(false);
    // Use setTimeout to ensure dialog closes before navigation
    setTimeout(() => {
      if (ad.link_type === "product" && ad.link_id) {
        navigate(`/product/${ad.link_id}`);
      } else if (ad.link_type === "category" && ad.link_id) {
        navigate(`/shop?category=${ad.link_id}`);
      } else {
        navigate("/shop");
      }
    }, 100);
  };

  if (!ad) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden">
        <div className="glass-strong rounded-2xl overflow-hidden border border-gold/20 relative">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-10 p-2 rounded-full glass hover:bg-white/10 text-white/70 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
          {ad.image_url && (
            <div className="relative cursor-pointer group" onClick={handleClick}>
              <img src={ad.image_url} alt={ad.title} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {ad.discount_percent > 0 && (
                <div className="absolute top-3 left-3">
                  <Badge className="gradient-gold text-primary-foreground text-lg px-3 py-1 shadow-lg gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> {ad.discount_percent}% OFF
                  </Badge>
                </div>
              )}
            </div>
          )}
          <div className="p-5 space-y-3 text-center">
            <h3 className="font-display text-xl font-bold text-gradient-gold">{ad.title}</h3>
            <p className="text-sm text-muted-foreground">{ad.description}</p>
            <Button onClick={handleClick} className="gradient-gold text-primary-foreground w-full gap-2 hover:opacity-90">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
