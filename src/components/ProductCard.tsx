import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/product/${product.id}`}>
              <h3 className="font-display font-semibold text-lg leading-tight hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
          </div>
          {product.out_of_stock && <Badge variant="destructive">Out of Stock</Badge>}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
          {onAddToCart && !product.out_of_stock && (
            <Button size="sm" onClick={() => onAddToCart(product.id)} className="gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Add
            </Button>
          )}
        </div>
        {product.shipping && (
          <p className="text-xs text-muted-foreground">Free shipping on orders above ₦50,000</p>
        )}
      </CardContent>
    </Card>
  );
}
