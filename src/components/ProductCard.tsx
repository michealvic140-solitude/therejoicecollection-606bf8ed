import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Link } from "react-router-dom";

type Product = Tables<"products">;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_16px_48px_hsla(40,70%,50%,0.15)]">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden relative">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {product.out_of_stock && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive" className="shadow-lg">Out of Stock</Badge>
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
        <div className="flex items-center justify-between pt-1">
          <span className="text-xl font-bold text-gradient-gold">{formatPrice(product.price)}</span>
          {onAddToCart && !product.out_of_stock && (
            <Button size="sm" onClick={() => onAddToCart(product.id)} className="gap-1.5 gradient-gold text-primary-foreground hover:opacity-90 border-0 shadow-lg shadow-gold/20">
              <ShoppingCart className="h-4 w-4" /> Add
            </Button>
          )}
        </div>
        {product.shipping && (
          <p className="text-xs text-muted-foreground">Free shipping on orders above ₦50,000</p>
        )}
      </div>
    </div>
  );
}
