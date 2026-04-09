import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Product = Tables<"products">;

export default function Vault() {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isVVIP = profile?.badge === "VVIP";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (profile && !isVVIP) {
      navigate("/");
      toast.error("Access denied. VVIP members only.");
      return;
    }
  }, [user, profile]);

  useEffect(() => {
    if (!isVVIP) return;
    supabase
      .from("products")
      .select("*")
      .eq("category", "vault")
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, [isVVIP]);

  const handleAddToCart = async (id: string) => {
    await addToCart(id);
    toast.success("Added to cart!");
  };

  if (!isVVIP) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 glass-card rounded-2xl p-12"
        >
          <Lock className="h-16 w-16 mx-auto text-gold" />
          <h1 className="font-display text-3xl font-bold">The Vault</h1>
          <p className="text-muted-foreground">This exclusive section is for VVIP members only.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container px-4 py-8"
    >
      {/* Vault Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center shadow-[0_0_40px_hsla(40,70%,50%,0.3)] animate-glow">
            <Crown className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <Badge className="gradient-gold text-primary-foreground gap-1 px-4 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> VVIP Exclusive
        </Badge>
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          The <span className="text-gradient-gold">Vault</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Welcome to your exclusive collection. These items are available only to our most valued members.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading exclusive collection...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Crown className="h-12 w-12 mx-auto text-gold mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">New exclusive items are being curated for you.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <ProductCard product={p} onAddToCart={handleAddToCart} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
