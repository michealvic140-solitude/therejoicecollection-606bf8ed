import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type Product = Tables<"products">;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
  onBuyNow?: (id: string) => void;
  categoryDiscount?: number;
}

export function ProductCard({ product, onAddToCart, onBuyNow, categoryDiscount }: ProductCardProps) {
  const productDiscount = (product as any).discount_percent || 0;
  const discountEndsAt = (product as any).discount_ends_at;
  const productDiscountActive = productDiscount > 0 && (!discountEndsAt || new Date(discountEndsAt) > new Date());
  const effectiveDiscount = productDiscountActive ? productDiscount : (categoryDiscount || 0);
  const hasDiscount = effectiveDiscount > 0;
  const discountedPrice = hasDiscount ? product.price * (1 - effectiveDiscount / 100) : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group glass-card rounded-2xl overflow-hidden hover:shadow-[0_16px_48px_hsla(40,70%,50%,0.15)] transition-shadow duration-500"
    >
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden relative">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {product.out_of_stock && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive" className="shadow-lg">Out of Stock</Badge>
            </div>
          )}
          {hasDiscount && !product.out_of_stock && (
            <div className="absolute top-3 left-3">
              <Badge className="gradient-gold text-primary-foreground shadow-lg text-sm px-2">-{effectiveDiscount}%</Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 space-y-3">
        <div>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display font-semibold text-lg leading-tight hover:text-gold transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{product.category}</p>
        </div>
        <div>
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gradient-gold">{formatPrice(discountedPrice)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-gradient-gold">{formatPrice(product.price)}</span>
          )}
        </div>
        {!product.out_of_stock && (
          <div className="flex gap-2">
            {onAddToCart && (
              <Button size="sm" onClick={() => onAddToCart(product.id)} className="flex-1 gap-1.5 gradient-gold text-primary-foreground hover:opacity-90 border-0 shadow-lg shadow-gold/20">
                <ShoppingCart className="h-4 w-4" /> Add
              </Button>
            )}
            {onBuyNow && (
              <Button size="sm" variant="outline" onClick={() => onBuyNow(product.id)} className="gap-1 glass border-gold/30 hover:bg-gold/10">
                <Zap className="h-3.5 w-3.5" /> Buy Now
              </Button>
            )}
          </div>
        )}
        {product.shipping && (
          <p className="text-xs text-muted-foreground">Free shipping on orders above ₦50,000</p>
        )}
      </div>
    </motion.div>
  );
}
